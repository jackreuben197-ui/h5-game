import type { FormSection, FieldValue } from '../template'
import { baseSection } from './base'
import { blindsSection } from './blinds'
import { buyinSection } from './buyin'
import { activitySection } from './activity'
import { gameplaySection } from './gameplay'
import { limitsSection } from './limits'
import { securitySection } from './security'

export const nlhSections: FormSection[] = [
  baseSection,
  blindsSection,
  buyinSection,
  activitySection,
  gameplaySection,
  limitsSection,
  securitySection,
]

export function buildDefaultState(sections: FormSection[]): Record<string, FieldValue> {
  const state: Record<string, FieldValue> = {}
  for (const section of sections) {
    for (const field of section.fields) {
      state[field.modelValue] = field.defaultValue
    }
  }
  return state
}
