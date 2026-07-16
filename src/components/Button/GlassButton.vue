<script setup lang="ts">
interface Props {
  label: string
}

defineProps<Props>()
</script>

<template>
  <button class="gb">
    <span class="gb__label">{{ label }}</span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.gb {
  // display: inline-flex;
  // align-items: center;
  // justify-content: center;
  // padding: 0.18rem 0.41rem;
  // background: rgba(255, 255, 255, 0.31);
  // border: 0.445px solid rgba(242, 242, 242, 0.4);
  // border-radius: 0.45rem;
  // box-shadow: 0.9px 1.1px 1.8px rgba(0, 0, 0, 0.25);
  // cursor: pointer;
  // white-space: nowrap;
  // min-width: 1.87rem;
 position: relative;
  display: inline-flex;
  padding: 0.1821rem 0.4075rem;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.1658rem;
  width: 100%;
  border-radius: 0.4483rem;
  border: none;
  background: rgba(255, 255, 255, 0.31);
  box-shadow: 0.0237rem 0.0297rem 0.0475rem 0 rgba(0, 0, 0, 0.25);
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.3586rem;
  font-style: normal;
  font-weight: 500;
  line-height: 94.56%;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
  -webkit-tap-highlight-color: transparent;

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
    color: #000;
    box-shadow: none;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.0119rem;
    background: linear-gradient(
      to bottom,
      hsla(0, 0%, 95%, 0.4),
      hsla(0, 0%, 100%, 0),
      hsla(0, 0%, 100%, 0.5)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:active {
    opacity: 0.8;
  }
}

.gb__label {
 color: #FFF;
font-family: "HONOR Sans CN";
font-size: 13.448px;
font-style: normal;
font-weight: 500;
line-height: 94.56%;

  @include theme-light {
    color: #000;
  }
}
</style>
