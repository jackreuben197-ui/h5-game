<script setup lang="ts">
defineProps<{ title: string }>()
const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <header class="recharge-header">
    <button class="recharge-header__back" @click="emit('back')">
      <svg
        class="back-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="7"
        height="12"
        viewBox="0 0 7 12"
        fill="none"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M6.33748 0.263649C6.68901 0.615181 6.68901 1.18513 6.33748 1.53666L2.17316 5.70098L6.33748 9.86529C6.68901 10.2168 6.68901 10.7868 6.33748 11.1383C5.98595 11.4898 5.416 11.4898 5.06447 11.1383L0.263649 6.33748C-0.087883 5.98595 -0.087883 5.416 0.263649 5.06447L5.06447 0.263649C5.416 -0.087883 5.98595 -0.087883 6.33748 0.263649Z"
          fill="currentColor"
        />
      </svg>
      <h1 class="recharge-header__title">{{ title }}</h1>
    </button>
    <div class="recharge-header__right">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<style scoped lang="scss">
.recharge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.44rem 0.2rem;
  position: relative;
}

.recharge-header__right {
  display: flex;
  align-items: center;
}

.recharge-header__back {
  min-width: 0;
  border: 0;
  color: var(--c-text);
  background: transparent;
  display: inline-flex;
  align-items: center;
  padding: 0 0.25rem;
  gap: 0.4rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.back-icon {
  height: 0.31rem;
  width: auto;
  color: var(--c-text);
  display: block;
  flex-shrink: 0;
}

.recharge-header__title {
  margin: 0;
  color: var(--c-text);
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.6501rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  white-space: nowrap;
}
</style>
