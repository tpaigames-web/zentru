import { Construction } from 'lucide-react'

interface PlaceholderProps {
  title: string
  description?: string
  comingSoon?: string[]
}

export function AdminPlaceholder({ title, description, comingSoon }: PlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Construction className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Coming Soon</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          This feature is planned but not yet implemented. The infrastructure is in place,
          UI will be added in a future release.
        </p>
        {comingSoon && comingSoon.length > 0 && (
          <div className="mt-6 inline-block text-left rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Planned features</p>
            <ul className="text-sm space-y-1">
              {comingSoon.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
