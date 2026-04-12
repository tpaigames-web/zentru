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
          {isZh ? '最后更新：2026年4月' : 'Last updated: April 2026'}
        </p>

        <section>
          <h3 className="font-semibold mb-1">{isZh ? '1. 简介' : '1. Introduction'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? 'Zentru（"我们"、"本应用"）是一款个人财务与信用卡管理应用。我们致力于保护您的隐私，确保您获得良好的使用体验。'
              : 'Zentru ("we", "our", "the app") is a personal finance and credit card management application. We are committed to protecting your privacy.'}
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">{isZh ? '2. 数据收集' : '2. Data Collection'}</h3>
          <p className="text-muted-foreground font-medium">
            {isZh
              ? 'Zentru 不会收集、传输或分享任何个人数据。'
              : 'Zentru does NOT collect, transmit, or share any personal data.'}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? '我们没有接收数据的服务器' : 'We do not have servers that receive your data'}</li>
            <li>{isZh ? '我们不使用分析或跟踪服务' : 'We do not use analytics or tracking services'}</li>
            <li>{isZh ? '我们不访问您的通讯录、位置或其他设备数据' : 'We do not access your contacts, location, or other device data'}</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold mb-1">{isZh ? '3. 数据存储' : '3. Data Storage'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '所有数据（包括信用卡信息、交易记录、预算和设置）均存储在您的设备本地。除非您主动使用备份功能导出，数据不会离开您的设备。'
              : 'All data including credit card information, transactions, budgets, and settings are stored locally on your device. This data never leaves your device unless you explicitly export it.'}
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">{isZh ? '4. 相机权限' : '4. Camera Permission'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '本应用可能请求相机权限用于扫卡和收据扫描功能。拍摄的照片完全在设备本地通过 OCR 技术处理，不会上传到任何地方。'
              : 'The app may request camera permission for card scanning and receipt scanning. Photos are processed entirely on your device using local OCR and are never uploaded.'}
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">{isZh ? '5. PDF 账单处理' : '5. PDF Statement Processing'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '当您导入银行 PDF 账单时：'
              : 'When you import a bank PDF statement:'}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
            <li>{isZh ? 'PDF 完全在您的设备上处理，不会上传到任何服务器' : 'The PDF is processed entirely on your device and is never uploaded to any server'}</li>
            <li>{isZh ? '解析完成后，原始 PDF 文件数据立即从设备内存中清除' : 'After parsing, the original PDF file data is immediately wiped from device memory'}</li>
            <li>{isZh ? '仅保留结构化交易数据（金额、日期、商户描述）' : 'Only structured transaction data (amount, date, merchant) is retained'}</li>
            <li>{isZh ? '完整卡号等敏感信息自动脱敏（仅保留末四位）' : 'Full card numbers are automatically masked (only last 4 digits kept)'}</li>
            <li>{isZh ? '未来如开启云同步，所有数据将在设备端加密后才传输，服务器无法解密' : 'If cloud sync is enabled in the future, all data will be encrypted on-device before transmission — the server cannot decrypt it'}</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold mb-1">{isZh ? '6. 通知' : '6. Notifications'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '本应用可能请求通知权限用于还款日提醒。这些通知在设备本地生成和发送。'
              : 'The app may request notification permission for payment reminders. These notifications are generated and delivered locally.'}
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">{isZh ? '7. 第三方服务' : '7. Third-Party Services'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? 'Zentru 不集成任何第三方服务、广告网络或分析平台。'
              : 'Zentru does not integrate with any third-party services, advertising networks, or analytics platforms.'}
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">{isZh ? '8. 联系我们' : '8. Contact'}</h3>
          <p className="text-muted-foreground">
            {isZh
              ? '如有隐私相关问题，请联系：tpaigames@gmail.com'
              : 'For privacy questions, contact: tpaigames@gmail.com'}
          </p>
        </section>
      </div>
    </div>
  )
}
