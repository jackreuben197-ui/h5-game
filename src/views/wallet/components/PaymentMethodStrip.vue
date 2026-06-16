<script setup lang="ts">
export interface PaymentMethod {
  icon: string
  primary: string
  secondary?: string
}

interface Props {
  methods: PaymentMethod[]
  activeIndex?: number
}

withDefaults(defineProps<Props>(), {
  activeIndex: 0,
})

const emit = defineEmits<{
  select: [index: number]
}>()
</script>

<template>
  <div class="strip">
    <button
      v-for="(m, i) in methods"
      :key="i"
      class="method"
      :class="{ 'method--active': activeIndex === i }"
      @click="emit('select', i)"
    >
      <div class="method__coin">
        <img :src="m.icon" alt="" class="method__coin-img" />
      </div>
      <div class="method__label">
        <div class="method__label-row">
          <span class="method__label-primary">{{ m.primary }}</span>
          <!-- <span class="method__label-suffix">{{ $txt('Wallet_PaySuffix') }}</span> -->
        </div>
        <span v-if="m.secondary" class="method__label-secondary">
          {{ m.secondary }}
        </span>
      </div>
    </button>
  </div>
</template>

<style scoped lang="scss">
.strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 0.16rem;
  row-gap: 0.21rem;
  width: 100%;
  justify-items: center;
}

.method {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.method__coin {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.method__coin-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.method__label {
  margin-top: -0.45rem;
  padding: 0.55rem 0.15rem 0.1rem;
  width: 65.367px;
  height: 46.389px;
  background: rgba(255, 255, 255, 0.2);
  border: 0.357px solid transparent;
  border-radius: 9.287px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  color: #fff;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.method__label::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.357px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(153, 153, 153, 1) 100%);
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

.method--active .method__label {
  border-radius: 10.543px;
  background: #EE3955;
  border: none;
  font-weight: 600;
}

.method--active .method__label::before {
  display: none;
}

.method__label-row {
  // display: flex;
  // flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.09rem;
  line-height: 0.9;
  white-space: normal;
  width: 100%;
}

.method__label-primary {
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: 0.3rem;
  text-align: center;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.1;
  margin-bottom: 0.1rem;
}

.method__label-suffix {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.225rem;
}

.method__label-secondary {
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: 0.22rem;
  line-height: 1.4;
}
</style>
