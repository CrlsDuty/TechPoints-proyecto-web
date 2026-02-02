import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { supabase } from '@shared/supabaseClient'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

// Listener para recibir sesión del shell
window.addEventListener('message', async (event) => {
  // Verificar origen permitido
  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
  if (!allowedOrigins.includes(event.origin)) return

  if (event.data?.type === 'shell-session') {
    console.log('[Micro-Historial] Sesión recibida desde shell:', event.data.usuario?.email)
    
    if (event.data.access_token) {
      try {
        await supabase.auth.setSession({
          access_token: event.data.access_token,
          refresh_token: event.data.refresh_token
        })
        console.log('[Micro-Historial] Sesión establecida correctamente')
      } catch (error) {
        console.error('[Micro-Historial] Error estableciendo sesión:', error)
      }
    }
  }
})

console.log('[Micro-Historial] Listo para recibir sesión del shell')
