import { supabase } from '@/lib/supabase'

export interface AdminStats {
  total_users: number
  users_in_trial: number
  premium_users: number
  new_users_7d: number
  new_users_30d: number
  total_samples: number
  samples_7d: number
  dau_7d: number
  mau_30d: number
}

export interface AdminUser {
  id: string
  email: string
  display_name: string
  plan: 'free' | 'premium'
  role: string
  trial_ends_at: string | null
  created_at: string
}

export interface AuditLogEntry {
  id: string
  admin_id: string
  admin_email: string
  action: string
  target_type: string
  target_id: string
  old_value: unknown
  new_value: unknown
  created_at: string
}

/** Fetch admin dashboard stats */
export async function getAdminStats(): Promise<AdminStats | null> {
  const { data, error } = await supabase
    .from('admin_stats')
    .select('*')
    .single()
  if (error) {
    console.error('Failed to fetch admin stats:', error)
    return null
  }
  return data as AdminStats
}

/** Search users (admin+) */
export async function searchUsers(query: string, limit = 50): Promise<AdminUser[]> {
  let q = supabase
    .from('profiles')
    .select('id, email, display_name, plan, role, trial_ends_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (query) {
    q = q.or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
  }

  const { data, error } = await q
  if (error) {
    console.error('Failed to search users:', error)
    return []
  }
  return (data || []) as AdminUser[]
}

/** Get single user by ID */
export async function getUserById(id: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as AdminUser
}

/** Extend user's trial (admin action) */
export async function extendUserTrial(userId: string, days: number): Promise<boolean> {
  try {
    // Fetch current trial_ends_at for logging
    const { data: oldData } = await supabase
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', userId)
      .single()

    const { data, error } = await supabase.rpc('extend_trial', {
      p_user_id: userId,
      p_days: days,
    })

    if (error) {
      console.error('Failed to extend trial:', error)
      return false
    }

    // Log the action
    await supabase.rpc('log_admin_action', {
      p_action: 'user.extend_trial',
      p_target_type: 'user',
      p_target_id: userId,
      p_old_value: { trial_ends_at: oldData?.trial_ends_at, days_added: 0 },
      p_new_value: { trial_ends_at: data, days_added: days },
    })

    return true
  } catch (e) {
    console.error('extendUserTrial error:', e)
    return false
  }
}

/** Set user's premium plan with optional expiration (null = permanent) */
export async function setUserPremium(
  userId: string,
  plan: 'free' | 'premium',
  expiresAt: string | null
): Promise<boolean> {
  try {
    const { data: oldData } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .single()

    const { error } = await supabase
      .from('profiles')
      .update({
        plan,
        plan_expires_at: expiresAt,
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to set premium:', error)
      return false
    }

    await supabase.rpc('log_admin_action', {
      p_action: 'user.set_premium',
      p_target_type: 'user',
      p_target_id: userId,
      p_old_value: oldData,
      p_new_value: { plan, plan_expires_at: expiresAt },
    })

    return true
  } catch (e) {
    console.error('setUserPremium error:', e)
    return false
  }
}

/** Change user role (super_admin only) */
export async function changeUserRole(userId: string, newRole: string): Promise<boolean> {
  try {
    const { data: oldData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      console.error('Failed to change role:', error)
      return false
    }

    await supabase.rpc('log_admin_action', {
      p_action: 'user.change_role',
      p_target_type: 'user',
      p_target_id: userId,
      p_old_value: { role: oldData?.role },
      p_new_value: { role: newRole },
    })

    return true
  } catch (e) {
    console.error('changeUserRole error:', e)
    return false
  }
}

/** Toggle module enabled (admin+) */
export async function toggleModule(moduleKey: string, enabled: boolean): Promise<boolean> {
  try {
    const { data: oldData } = await supabase
      .from('modules')
      .select('enabled')
      .eq('key', moduleKey)
      .single()

    const { error } = await supabase
      .from('modules')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', moduleKey)

    if (error) {
      console.error('Failed to toggle module:', error)
      return false
    }

    await supabase.rpc('log_admin_action', {
      p_action: 'module.toggle',
      p_target_type: 'module',
      p_target_id: moduleKey,
      p_old_value: { enabled: oldData?.enabled },
      p_new_value: { enabled },
    })

    return true
  } catch (e) {
    console.error('toggleModule error:', e)
    return false
  }
}

/** Update module min_plan */
export async function updateModulePlan(moduleKey: string, minPlan: 'free' | 'premium'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('modules')
      .update({ min_plan: minPlan })
      .eq('key', moduleKey)

    if (error) return false

    await supabase.rpc('log_admin_action', {
      p_action: 'module.update_plan',
      p_target_type: 'module',
      p_target_id: moduleKey,
      p_new_value: { min_plan: minPlan },
    })

    return true
  } catch {
    return false
  }
}

/** Fetch audit log (super_admin only) */
export async function getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch audit log:', error)
    return []
  }
  return (data || []) as AuditLogEntry[]
}
