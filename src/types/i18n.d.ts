import 'vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    $txt: (key: string, ...args: Array<string | number>) => string
  }
}

export {}
