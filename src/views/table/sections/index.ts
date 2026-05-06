import type { TableFormFieldConfig } from '../template'
import { baseSection } from './base'
import { blindsSection } from './blinds'
import { durationSection } from './duration'
import { buyinSection } from './buyin'
import { activitySection } from './activity'
import { gameplaySection } from './gameplay'
import { limitsSection } from './limits'
import { securitySection } from './security'

export const nlhSections: TableFormFieldConfig[][] = [
  [...blindsSection],
  [...durationSection],
  [...buyinSection],
  [...baseSection],
  [...activitySection],
  [...gameplaySection],
  [...limitsSection],
  [...securitySection],
]
