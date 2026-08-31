<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// /login 路由仅作为兼容入口：统一回到正式首页并使用全局登录弹窗。
onMounted(() => {
  void router.replace({ name: 'lobby' })
})
</script>

<template>
  <div class="login-trampoline"></div>
</template>

<style scoped lang="scss">
.login-trampoline {
  position: fixed;
  inset: 0;
  background: #000;
}
</style>
