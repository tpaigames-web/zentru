import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isZh = i18n.language.startsWith('zh')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/about')} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold">{t('about.privacyPolicy')}</h2>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5 text-sm leading-relaxed">
        <p className="text-xs text-muted-foreground">
          {isZh ? '最后更新：2026年4月16日' : 'Last updated: April 16, 2026'}
        </p>

        {/* 1. Introduction */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '1. 简介' : '1. Introduction'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? 'Zentru（"我们"、"本应用"）是一款个人消费记录与信用卡记账工具。本应用仅帮助用户手动记录和分析消费数据，不提供任何金融服务（如支付、转账、借贷、投资建议等）。我们致力于保护您的隐私和数据安全。'
              : 'Zentru ("we", "our", "the app") is a personal expense tracking and credit card bookkeeping tool. This app only helps users manually record and analyze spending data. We do NOT provide any financial services such as payments, transfers, lending, or investment advice. We are committed to protecting your privacy and data security.'}
          </p>
        </section>

        {/* 2. What we are NOT */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '2. 服务范围声明' : '2. Service Scope Disclaimer'}</h3>
          <p className="text-muted-foreground font-medium">
            {isZh ? 'Zentru 不是金融机构，不提供以下服务：' : 'Zentru is NOT a financial institution. We do NOT provide:'}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? '支付、转账或任何资金操作' : 'Payments, transfers, or any fund operations'}</li>
            <li>{isZh ? '银行账户连接或自动读取银行数据' : 'Bank account linking or automatic bank data reading'}</li>
            <li>{isZh ? '投资建议、理财推荐或信用评估' : 'Investment advice, financial recommendations, or credit assessments'}</li>
            <li>{isZh ? '贷款、借贷或任何金融中介服务' : 'Loans, lending, or any financial intermediary services'}</li>
            <li>{isZh ? '代扣款或自动付费' : 'Auto-debit or automatic payments'}</li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            {isZh
              ? '本应用中的所有数据均由用户自行手动输入，仅供个人参考，不构成任何财务建议。'
              : 'All data in this app is manually entered by users, for personal reference only, and does not constitute any financial advice.'}
          </p>
        </section>

        {/* 3. Data Collection */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '3. 数据收集' : '3. Data Collection'}</h3>
          <p className="text-muted-foreground">{isZh ? '我们收集的数据仅限于：' : 'We only collect:'}</p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? '注册信息：邮箱地址（用于登录和账户识别）' : 'Registration info: email address (for login and account identification)'}</li>
            <li>{isZh ? '用户手动输入的记账数据：卡片名称、交易金额、商户、类别等' : 'User-entered bookkeeping data: card names, transaction amounts, merchants, categories, etc.'}</li>
            <li>{isZh ? '应用设置偏好（语言、货币、主题等）' : 'App preference settings (language, currency, theme, etc.)'}</li>
          </ul>
          <p className="mt-2 text-muted-foreground font-medium">
            {isZh ? '我们不收集：' : 'We do NOT collect:'}
          </p>
          <ul className="mt-1 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? '真实银行卡号、CVV、密码或任何银行凭证' : 'Real bank card numbers, CVV, passwords, or any banking credentials'}</li>
            <li>{isZh ? '位置信息、通讯录、短信或通话记录' : 'Location, contacts, SMS, or call logs'}</li>
            <li>{isZh ? '设备唯一标识符（用于广告追踪）' : 'Device identifiers (for ad tracking)'}</li>
            <li>{isZh ? '我们不使用任何广告 SDK 或第三方追踪服务' : 'We do not use any advertising SDK or third-party tracking services'}</li>
          </ul>
        </section>

        {/* 4. Data Storage */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '4. 数据存储' : '4. Data Storage'}</h3>
          <p className="text-muted-foreground">
            {isZh ? 'Zentru 采用"本地优先"架构：' : 'Zentru uses a "local-first" architecture:'}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>
              <span className="font-medium text-foreground">{isZh ? '本地存储（默认）' : 'Local storage (default)'}</span>
              {isZh
                ? ' — 所有记账数据存储在您设备本地的 IndexedDB 中。不登录也可以完整使用所有记账功能。'
                : ' — All bookkeeping data is stored in IndexedDB on your device. You can use all features without logging in.'}
            </li>
            <li>
              <span className="font-medium text-foreground">{isZh ? '云同步（可选）' : 'Cloud sync (optional)'}</span>
              {isZh
                ? ' — 登录后可选择将数据同步到 Supabase 云端（托管于 AWS），用于跨设备同步。同步由用户手动触发，不会自动上传。'
                : ' — After logging in, you can optionally sync data to Supabase cloud (hosted on AWS) for cross-device sync. Sync is manually triggered and never automatic.'}
            </li>
          </ul>
        </section>

        {/* 5. Cloud Service */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '5. 云服务与安全' : '5. Cloud Service & Security'}</h3>
          <p className="text-muted-foreground">
            {isZh ? '当您选择使用云同步功能时：' : 'When you choose to use cloud sync:'}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? '数据通过 HTTPS/TLS 加密传输' : 'Data is transmitted via HTTPS/TLS encryption'}</li>
            <li>{isZh ? '数据存储在 Supabase（PostgreSQL 数据库），受行级安全策略（RLS）保护' : 'Data is stored in Supabase (PostgreSQL), protected by Row Level Security (RLS)'}</li>
            <li>{isZh ? '每个用户只能访问自己的数据，无法查看或修改其他用户的数据' : 'Each user can only access their own data and cannot view or modify other users\' data'}</li>
            <li>{isZh ? '我们不会将您的数据出售、共享或提供给任何第三方' : 'We will never sell, share, or provide your data to any third party'}</li>
            <li>{isZh ? '您可以随时删除账户和所有云端数据' : 'You can delete your account and all cloud data at any time'}</li>
          </ul>
        </section>

        {/* 6. Subscription */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '6. 订阅与付费' : '6. Subscription & Payment'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? 'Zentru 提供免费版和 Premium 订阅版。关于付费：'
              : 'Zentru offers a free tier and a Premium subscription. Regarding payments:'}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? '付费通过 Google Play / App Store / Stripe 等第三方支付平台处理' : 'Payments are processed through third-party platforms (Google Play / App Store / Stripe)'}</li>
            <li>{isZh ? '我们不直接处理、存储或接触您的支付信息（如信用卡号）' : 'We do NOT directly handle, store, or access your payment info (e.g., credit card numbers)'}</li>
            <li>{isZh ? '订阅可随时取消，取消后当期仍有效直到到期' : 'Subscriptions can be cancelled anytime; access continues until the end of the billing period'}</li>
            <li>{isZh ? '免费版功能完整可用，Premium 仅解锁额外便捷功能' : 'Free tier is fully functional; Premium only unlocks additional convenience features'}</li>
          </ul>
        </section>

        {/* 7. Camera */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '7. 相机权限' : '7. Camera Permission'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '本应用可能请求相机权限用于扫卡和收据扫描功能。拍摄的照片完全在设备本地通过 OCR 技术处理，不会上传到任何服务器。'
              : 'The app may request camera permission for card scanning and receipt scanning. Photos are processed entirely on your device using local OCR and are never uploaded.'}
          </p>
        </section>

        {/* 8. PDF */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '8. PDF 账单处理' : '8. PDF Statement Processing'}</h3>
          <p className="text-muted-foreground">
            {isZh ? '当您导入银行 PDF 账单时：' : 'When you import a bank PDF statement:'}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? 'PDF 完全在您的设备上处理，不会上传到任何服务器' : 'The PDF is processed entirely on your device and is never uploaded'}</li>
            <li>{isZh ? '解析完成后，原始 PDF 数据立即从内存中清除' : 'After parsing, the original PDF data is immediately cleared from memory'}</li>
            <li>{isZh ? '仅保留结构化交易数据（金额、日期、商户描述）' : 'Only structured transaction data (amount, date, merchant) is retained'}</li>
            <li>{isZh ? '完整卡号等敏感信息自动脱敏（仅保留末四位）' : 'Full card numbers are automatically masked (only last 4 digits kept)'}</li>
          </ul>
        </section>

        {/* 9. Notifications */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '9. 通知' : '9. Notifications'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '本应用可能请求通知权限用于还款日提醒和记账提醒。这些通知在设备本地生成和发送，不经过任何外部服务器。'
              : 'The app may request notification permission for payment reminders and bookkeeping reminders. These are generated and delivered locally, without any external server.'}
          </p>
        </section>

        {/* 10. Children */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '10. 儿童隐私' : '10. Children\'s Privacy'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '本应用不面向 13 岁以下儿童。我们不会故意收集 13 岁以下儿童的个人信息。'
              : 'This app is not intended for children under 13. We do not knowingly collect personal information from children under 13.'}
          </p>
        </section>

        {/* 11. Data Deletion */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '11. 数据删除' : '11. Data Deletion'}</h3>
          <p className="text-muted-foreground">
            {isZh ? '您可以随时删除您的数据：' : 'You can delete your data at any time:'}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? '本地数据：清除应用缓存或卸载应用即可完全删除' : 'Local data: Clear app cache or uninstall the app to completely remove'}</li>
            <li>{isZh ? '云端数据：在设置中退出登录，或联系我们删除账户及所有关联数据' : 'Cloud data: Log out in settings, or contact us to delete your account and all associated data'}</li>
          </ul>
        </section>

        {/* 12. Changes */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '12. 隐私政策变更' : '12. Changes to This Policy'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '我们可能会不时更新本隐私政策。更新后的政策将在应用内公布，重大变更会通过应用内通知告知用户。'
              : 'We may update this privacy policy from time to time. Updated policies will be posted in the app, and significant changes will be communicated via in-app notifications.'}
          </p>
        </section>

        {/* 13. Contact */}
        <section>
          <h3 className="font-semibold mb-1">{isZh ? '13. 联系我们' : '13. Contact Us'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '如有隐私相关问题或数据删除请求，请联系：'
              : 'For privacy questions or data deletion requests, contact:'}
          </p>
          <p className="mt-1 text-primary font-medium">tpaigames@gmail.com</p>
        </section>
      </div>
    </div>
  )
}
