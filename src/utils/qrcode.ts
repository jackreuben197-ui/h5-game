import QRCode from 'qrcode'

export interface SaveQrCodeOptions {
  fileName?: string
  size?: number
  margin?: number
}

export async function saveQrCodeImage(text: string, options: SaveQrCodeOptions = {}): Promise<void> {
  const content = text.trim()
  if (!content) {
    throw new Error('二维码内容不能为空')
  }

  const dataUrl = await QRCode.toDataURL(content, {
    width: options.size ?? 720,
    margin: options.margin ?? 2,
    errorCorrectionLevel: 'M',
  })

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = options.fileName || `qrcode-${Date.now()}.png`
  link.click()
}

export async function generateQrCodeUrl(text: string, options: SaveQrCodeOptions = {}): Promise<string> {
  const content = text.trim()
  if (!content) {
    throw new Error('二维码内容不能为空')
  }

  return QRCode.toDataURL(content, {
    width: options.size ?? 720,
    margin: options.margin ?? 2,
    errorCorrectionLevel: 'M',
  })
}
