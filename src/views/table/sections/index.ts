import type { TableFormFieldConfig } from '../template'
import { blindsSection, anteSection, buyinSection, durationSection } from './topSlides'
import { baseSection } from './base'
import { activitySection } from './activity'
import {
  gamePlayInsuranceSection,
  gamePlaySquidGameSection,
  gamePlayCriticalHitSection,
  gamePlayMushroomModeSection,
  gamePlayCallTimeSection,
} from './gameplay'
import { bringinSection } from './bringin'
import { limitsSection } from './limits'
import { securitySection } from './security'

export const nlhSections: TableFormFieldConfig[][] = [
  [...blindsSection], //大小盲拉杆
  [...anteSection], //前注拉杆
  [...durationSection], //时长拉杆
  [...buyinSection], //带入区间拉杆
  [...baseSection], //客户端基础+盲注部分
  [...bringinSection], //带入设置
  [...activitySection],
  [...gamePlayCallTimeSection],
  [...gamePlayMushroomModeSection],
  [...gamePlaySquidGameSection],
  [...gamePlayCriticalHitSection],
  [...gamePlayInsuranceSection],
  [...securitySection],
  [...limitsSection],
]
