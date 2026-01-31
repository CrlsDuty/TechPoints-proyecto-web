<template>
  <div v-if="visible" :class="['notification', type]">
    {{ message }}
  </div>
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

watch(
  () => props.message,
  (newVal) => {
    if (newVal) {
      visible.value = true
      setTimeout(() => {
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
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: opacity 0.3s;
}
.notification.success {
  background: #4caf50;
}
.notification.error {
  background: #f44336;
}
</style>
