import { getLocale, type LocaleCode } from '@/i18n'

const platformInfoLabels: Record<LocaleCode, string> = {
  cn: '平台资讯',
  zh: '平台資訊',
  en: 'Platform Info',
  pt: 'Informações da plataforma',
  de: 'Plattforminformationen',
  es: 'Información de la plataforma',
  fr: 'Infos de la plateforme',
  hi: 'प्लेटफ़ॉर्म जानकारी',
  it: 'Informazioni sulla piattaforma',
  ja: 'プラットフォーム情報',
  ko: '플랫폼 정보',
  ru: 'Информация о платформе',
  th: 'ข้อมูลแพลตฟอร์ม',
  vi: 'Thông tin nền tảng',
}

export function getPlatformInfoLabel(): string {
  return platformInfoLabels[getLocale()] || platformInfoLabels.en
}
