import type { TableFormFieldConfig } from '../template'
import { blindsSection, buyinSection, durationSection } from './topSlides'
import { baseSection } from './base'
import { activitySection } from './activity'
import {
  gamePlayInsuranceSection,
  gamePlaySquidGameSection,
  gamePlayCriticalHitSection,
  gamePlayMushroomModeSection,
} from './gameplay'
import { bringinSection } from './bringin'
import { limitsSection } from './limits'
import { securitySection } from './security'

export const nlhSections: TableFormFieldConfig[][] = [
  [...blindsSection], //大小盲拉杆
  [...durationSection], //时长拉杆
  [...buyinSection], //带入区间拉杆
  [...baseSection], //客户端基础+盲注部分
  [...bringinSection], //带入设置
  [...activitySection],
  [...gamePlayMushroomModeSection],
  [...gamePlaySquidGameSection],
  [...gamePlayCriticalHitSection],
  [...gamePlayInsuranceSection],
  [...securitySection],
  [...limitsSection],
]
