<script setup lang="ts">
const { notifications, dismiss } = useNotifications();
</script>

<template>
  <div class="notifications-root" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast" tag="ul" class="notifications-list">
      <li
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-card', `notification-card--${notification.type}`]"
      >
        <div class="notification-card__content">
          <strong>{{ notification.title }}</strong>
          <span>{{ notification.message }}</span>
        </div>
        <button
          class="notification-card__close"
          type="button"
          aria-label="Fechar notificação"
          @click="dismiss(notification.id)"
        >
          ×
        </button>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notifications-root {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1200;
  pointer-events: none;
}

.notifications-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}

.notification-card {
  width: min(24rem, calc(100vw - 2rem));
  padding: 0.75rem 0.85rem 0.75rem 0.95rem;
  border-radius: 0.9rem;
  border: 1px solid transparent;
  box-shadow: 0 12px 28px rgb(15 34 51 / 18%);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  pointer-events: auto;
}

.notification-card__content {
  display: grid;
  gap: 0.15rem;
}

.notification-card__content strong {
  font: 700 0.92rem/1.25 'REM', sans-serif;
}

.notification-card__content span {
  font: 500 0.83rem/1.35 'Work Sans', sans-serif;
}

.notification-card__close {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0.1rem 0.2rem;
}

.notification-card--success {
  background: linear-gradient(125deg, rgb(116 184 181 / 23%), rgb(233 234 232 / 95%));
  border-color: rgb(116 184 181 / 45%);
  color: #0f2233;
}

.notification-card--error {
  background: linear-gradient(125deg, rgb(242 122 46 / 18%), rgb(255 244 235 / 95%));
  border-color: rgb(242 122 46 / 45%);
  color: #8d3800;
}

.notification-card--info {
  background: linear-gradient(125deg, rgb(28 95 148 / 18%), rgb(238 245 250 / 97%));
  border-color: rgb(28 95 148 / 35%);
  color: #0f2233;
}

.notification-card--warning {
  background: linear-gradient(125deg, rgb(245 181 46 / 22%), rgb(255 251 240 / 97%));
  border-color: rgb(245 181 46 / 50%);
  color: #6f4a00;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.24s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px) translateX(8px);
}

@media (max-width: 768px) {
  .notifications-root {
    top: 0.75rem;
    right: 0.75rem;
    left: 0.75rem;
  }

  .notification-card {
    width: 100%;
  }
}
</style>

