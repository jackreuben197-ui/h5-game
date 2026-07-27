<script setup lang="ts">
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import GlassCard from '@/components/wallet/GlassCard.vue'
import TagPill from '@/components/wallet/TagPill.vue'

type Kind = 'in' | 'out'

interface Props {
  kind: Kind
  type: string
  gameName?: string
  userId?: string | number
  amount: string | number
  positive?: boolean
  time: string
  chipAmount: string | number
}

withDefaults(defineProps<Props>(), {
  gameName: '',
  userId: '',
  positive: true,
})
</script>

<template>
  <GlassCard class="tx">
    <div class="tx__head">
      <AppSvgIcon
        name="wallet-flow"
        :class="['tx__kind-icon', positive ? 'tx__kind-icon--in' : 'tx__kind-icon--out']"
      />
      <div class="tx__info">
        <TagPill
          :label="type"
          variant="light"
        />
        <div
          v-if="gameName"
          class="tx__game"
        >
          {{ gameName }}
        </div>
        <div
          v-if="userId"
          class="tx__id"
        >
          <TagPill
            label="ID"
            variant="id"
          />
          <span class="tx__id-value">{{ userId }}</span>
        </div>
      </div>
      <div
        class="tx__amount"
        :class="positive ? 'tx__amount--pos' : 'tx__amount--neg'"
      >
        {{ positive ? '+' : '-' }}{{ amount }}
      </div>
    </div>
    <div class="tx__divider"></div>
    <div class="tx__foot">
      <div class="tx__time">
        <AppSvgIcon name="clock" class="tx__time-icon" />
        <span>{{ time }}</span>
      </div>
      <div class="tx__chip">
        <span class="tx__chip-value">{{ chipAmount }}</span>
        <img
          :src="icCoins"
          alt=""
          class="tx__chip-icon"
        />
      </div>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.tx {
  display: flex;
  flex-direction: column;
  gap: 0.27rem;
  background: rgba(0, 0, 0, 0.14);
  box-shadow: none;

  // Локально переопределяем семантические переменные: дочерние узлы читают их через var().
  @include theme-light-own {
    --c-text: var(--wallet-l-text);
    --c-divider: var(--wallet-l-divider);

    background: var(--wallet-l-surface);
  }
}

.tx__head {
  display: flex;
  align-items: center;
  gap: 0.24rem;
}

.tx__kind-icon {
  width: 0.675rem;
  height: 0.675rem;
  flex-shrink: 0;
}

.tx__kind-icon--in {
  color: var(--c-brand);
}

.tx__kind-icon--out {
  color: var(--wallet-color-danger);
  transform: rotate(180deg);
}

.tx__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.08rem;
  min-width: 0;
}

.tx__game {
  font-family: var(--wallet-font-cn);
  font-weight: 600;
  font-size: 0.33rem;
  color: var(--c-text);
  line-height: 1.4;
}

.tx__id {
  display: flex;
  align-items: center;
  gap: 0.065rem;
}

.tx__id-value {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.25rem;
  color: var(--c-text);
}

.tx__amount {
  font-family: var(--wallet-font-num);
  font-weight: 800;
  font-size: 0.43rem;
  line-height: 1.4;
  white-space: nowrap;
}

.tx__amount--pos {
  color: var(--wallet-color-primary);
}

.tx__amount--neg {
  color: var(--wallet-color-danger);
}

.tx__divider {
  width: 100%;
  height: 0;
  border-top: 1px dashed var(--c-divider);
}

.tx__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tx__time {
  display: flex;
  align-items: center;
  gap: 0.16rem;
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.32rem;
  color: var(--c-text);
  letter-spacing: 0.24px;
  line-height: 0.78;
}

.tx__time-icon {
  width: 0.53rem;
  height: 0.53rem;
}

.tx__chip {
  display: flex;
  align-items: center;
  gap: 0.115rem;
}

.tx__chip-value {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.36rem;
  color: var(--c-text);
  line-height: 1.4;
}

.tx__chip-icon {
  width: 0.8rem;
  height: 0.8rem;
}
</style>
