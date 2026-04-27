import mainBgUrl from '@/assets/images/main_bg.webp'

export function useMainBackground(): Record<string, string> {
  return {
    backgroundImage: `url(${mainBgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}
