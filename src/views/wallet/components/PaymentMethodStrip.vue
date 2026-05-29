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
          <div class="method__label-primary">{{ m.primary }}</div>
          <div class="method__label-suffix">{{ $txt('Wallet_PaySuffix') }}</div>
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
  width: 1.75rem;
  height: 1.24rem;
  background: rgba(47, 47, 47, 0.24);
  border: 0.18px solid rgba(153, 153, 153, 0.6);
  border-radius: 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  color: #fff;
  box-sizing: border-box;
}

.method--active .method__label {
  background: rgba(255, 255, 255, 0.79);
  border: none;
  color: #009d68;
  font-weight: 600;
}

.method__label-row {
  // display: flex;
  // flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.09rem;
  line-height: 0.9;
  white-space: nowrap;
}

.method__label-primary {
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: 0.3rem;
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
