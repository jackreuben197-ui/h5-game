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
        <img
          :src="m.icon"
          alt=""
          class="method__coin-img"
        />
      </div>
      <div class="method__label">
        <div class="method__label-row">
          <span class="method__label-primary">{{ m.primary }}</span>
          <span class="method__label-suffix">{{ $txt('Wallet_PaySuffix') }}</span>
        </div>
        <span
          v-if="m.secondary"
          class="method__label-secondary"
        >
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
  column-gap: clamp(4px, 1.6vw, 6px);
  row-gap: clamp(6px, 2.1vw, 8px);
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
  width: clamp(48px, 15vw, 56px);
  height: clamp(48px, 15vw, 56px);
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
  margin-top: clamp(-12px, -4.5vw, -12px);
  padding: clamp(18px, 5.5vw, 21px) clamp(4px, 1.5vw, 6px) clamp(3px, 1vw, 4px);
  width: clamp(54px, 17.5vw, 65.4px);
  height: clamp(38px, 12.4vw, 46.4px);
  background: rgba(47, 47, 47, 0.24);
  border: 0.18px solid rgba(153, 153, 153, 0.6);
  border-radius: clamp(7px, 2.5vw, 9.3px);
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(2px, 0.7vw, 2.5px);
  line-height: 1.4;
  white-space: nowrap;
}

.method__label-primary {
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: clamp(9px, 3vw, 11.24px);
}

.method__label-suffix {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: clamp(7px, 2.25vw, 8.4px);
}

.method__label-secondary {
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: clamp(7px, 2.2vw, 8.2px);
  line-height: 1.4;
}
</style>
