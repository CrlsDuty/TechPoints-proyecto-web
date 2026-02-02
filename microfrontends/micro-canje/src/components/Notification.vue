<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="visible" :class="['notification', props.type]" :key="messageKey">
        {{ props.message }}
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'success' // 'success' | 'error'
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const visible = ref(false)
const messageKey = ref(0)
let timeoutId = null

watch(
  () => props.message,
  (newVal) => {
    // Limpiar timeout anterior si existe
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    if (newVal && newVal.trim()) {
      visible.value = true
      messageKey.value++
      timeoutId = setTimeout(() => {
        visible.value = false
      }, props.duration)
    }
  }
)
</script>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 6px;
  color: #fff;
  font-weight: bold;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.notification.success {
  background: #4caf50;
}
.notification.error {
  background: #f44336;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
