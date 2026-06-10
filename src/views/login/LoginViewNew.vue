<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// /login 路由现在仅作为兼容入口：守卫已会拦截到 guest-home，这里再兜底一次。
onMounted(() => {
  void router.replace({ name: 'guest-home' })
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
