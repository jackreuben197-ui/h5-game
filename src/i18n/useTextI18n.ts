import { computed } from 'vue'
import { textI18n } from './index'

export function useTextI18n() {
  return {
    locale: computed(() => textI18n.locale.value),
    supportedLocales: textI18n.supportedLocales,
    setLocale: textI18n.setLocale,
    t: textI18n.t,
  }
}
