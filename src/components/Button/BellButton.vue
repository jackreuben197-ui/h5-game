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
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: linear-gradient(128deg, rgba(5, 231, 174, 0.4) 7%, rgba(2, 122, 92, 0.4) 72%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0.11rem;
}

.bell__icon {
  width: 0.85rem;
  height: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell__icon img {
  width: 100%;
  height: 100%;
}
</style>
