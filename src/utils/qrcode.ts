export interface SaveQrCodeOptions {
  fileName?: string
  size?: number
  margin?: number
}

export async function generateQrCodeDataUrl(text: string, options: { width?: number, margin?: number } = {}): Promise<string> {
  const { default: QRCode } = await import('qrcode')
  return await QRCode.toDataURL(text, {
    width: options.width ?? 200,
    margin: options.margin ?? 1,
  })
}

export async function saveQrCodeImage(text: string, options: SaveQrCodeOptions = {}): Promise<void> {
  const content = text.trim()
  if (!content) {
    throw new Error('二维码内容不能为空')
  }

  const { default: QRCode } = await import('qrcode')
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

  const { default: QRCode } = await import('qrcode')
  return QRCode.toDataURL(content, {
    width: options.size ?? 720,
    margin: options.margin ?? 2,
    errorCorrectionLevel: 'M',
  })
}
