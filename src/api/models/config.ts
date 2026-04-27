// 多语言模板项：用于把房间名 key 映射为不同语种文案。
export interface MultiLanguageTemplateRecord {
  template_id: string
  cn_name?: string
  us_name?: string
  br_name?: string
  ar_name?: string
  [key: string]: unknown
}

