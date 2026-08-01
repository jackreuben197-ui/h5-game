<script setup lang="ts">
import icInfo from '@/assets/icons/ic_info.svg'
import cardBg2 from '@/assets/images/card_bg2.png'

const props = defineProps<{
  avatar: string
  nickname: string
  userId: string
  editable?: boolean
  bgImage?: string
}>()

defineEmits<{
  'avatar-click': []
}>()
</script>

<template>
  <div class="profile-card">
    <div class="profile-card__outer" :style="{ backgroundImage: `url(${props.bgImage ?? cardBg2})` }">
      <div class="profile-card__inner">
        <div class="card-line1">
          <button class="avatar-wrap" type="button" @click="$emit('avatar-click')">
            <img :src="avatar" alt="avatar" />
            <span v-if="editable" class="edit-chip">Edit</span>
          </button>
          <div class="user-box">
            <div class="user-name">{{ nickname }}</div>
            <div class="user-id-row">
              <span class="id-tag">ID</span>
              <span class="id-value">{{ userId }}</span>
              <img class="id-info-icon" :src="icInfo" alt="" />
            </div>
          </div>
        </div>
        <div v-if="$slots.bottom" class="card-line2">
          <slot name="bottom" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-card {
  border-radius: 1.4rem;
  overflow: hidden;
  width: 100%;
  margin-top: 1.1rem;
  padding: 1px;
  background: linear-gradient(
    159deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(255, 255, 255, 1) 100%
  );
}

.profile-card__outer {
  position: relative;
  width: 100%;
  border-radius: 1.42rem;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 0.2rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('@/assets/images/card_border2.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
  }
}

.profile-card__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  border-radius: 1.2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0;
  gap: 0.5rem;
}

.card-line1 {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0 0.8rem 0 0.45rem;
}

.card-line2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.25rem 0 0.45rem;
}

.avatar-wrap {
  border: 0;
  background: transparent;
  padding: 0;
  position: relative;
  flex-shrink: 0;
  width: 2.32rem;
  height: 2.32rem;

  img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.edit-chip {
  position: absolute;
  left: 50%;
  bottom: -0.16rem;
  transform: translateX(-50%);
  min-width: 0.96rem;
  height: 0.4664rem;
  border-radius: 0.533rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  color: #fbfbfb;
  font-size: 0.2664rem;
  line-height: 0.4664rem;
  text-align: center;
  background: #fa2b4b;
  white-space: nowrap;
}

.user-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  margin-top: 0.2rem;
}

.user-name {
  color: #fff;
  font-size: 0.6rem;
  line-height: 1;
  font-weight: bold;
}

.user-id-row {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}

.id-tag {
  font-size: 0.2159rem;
  font-weight: 600;
  line-height: 1.2;
  background-color: rgba(255, 255, 255, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.0216rem 0.1311rem;
  border-radius: 0.1123rem;
}

.id-value {
  font-size: 0.3rem;
  line-height: 120%;
  font-weight: 500;
  color: #fff;
}

.id-info-icon {
  width: 0.267rem;
  height: 0.267rem;
  flex-shrink: 0;
  opacity: 0.8;
}

:root[data-theme='light'] {
  .profile-card {
    background: rgba(0, 0, 0, 0.08);
  }

  .profile-card__outer {
    background-color: rgba(255, 255, 255, 1);
    background-image: none !important;

    &::before {
      background-image: none;
    }
  }

  .user-name {
    color: rgba(0, 0, 0, 1);
  }

  .id-tag {
    background-color: rgba(0, 0, 0, 0.4);
    color: #fff;
  }

  .id-value {
    color: rgba(0, 0, 0, 0.64);
  }

  .id-info-icon {
    filter: invert(1);
  }
}
</style>
