import { computed } from 'vue'
import {
  resolvedThemeRef,
  setThemeMode,
  themeModeRef,
  type ThemeMode,
  type ThemeName,
} from '@/utils/theme'

// 组件内读取/切换主题：模板条件渲染、图表配色、动态图片等 JS 侧场景使用。
// 纯样式差异优先走 var(--c-*) 或 theme-light/theme-dark mixin，不要在 JS 里分支写颜色。
export function useTheme() {
  const isDark = computed(() => resolvedThemeRef.value === 'dark')

  return {
    // 用户选择的模式：light / dark / system。
    mode: themeModeRef,
    // 实际生效的主题：light / dark（system 已按系统偏好归一）。
    theme: resolvedThemeRef,
    isDark,
    isLight: computed(() => !isDark.value),
    // 设置页切换入口：setMode('system' | 'light' | 'dark')。
    setMode: setThemeMode,
  }
}

export type { ThemeMode, ThemeName }
