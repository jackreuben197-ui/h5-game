<script setup lang="ts">
import icNotification from '@/assets/icons/wallet/ic_notification.svg'
</script>

<template>
  <button class="bell">
    <div class="bell__icon">
      <img
        :src="icNotification"
        alt=""
      />
    </div>
  </button>
</template>

<style scoped lang="scss">
.bell {
  position: relative;
  width: clamp(44px, 14vw, 52.5px);
  height: clamp(44px, 14vw, 52.5px);
  border-radius: 50%;
  background: linear-gradient(128deg, rgba(5, 231, 174, 0.4) 7%, rgba(2, 122, 92, 0.4) 72%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: clamp(3px, 1.1vw, 4.2px);
}

.bell__icon {
  width: clamp(26px, 8.5vw, 32px);
  height: clamp(26px, 8.5vw, 32px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell__icon img {
  width: 100%;
  height: 100%;
}
</style>
