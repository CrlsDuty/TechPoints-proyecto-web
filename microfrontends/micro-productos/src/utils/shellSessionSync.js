/**
 * Sincroniza la sesión del shell (parent) cuando micro-productos se carga en un iframe.
 * El shell envía la sesión por postMessage; aquí la aplicamos en Supabase para que
 * el usuario no tenga que iniciar sesión de nuevo dentro del iframe.
 */

import { supabase } from './supabase'

const SHELL_ORIGIN = import.meta.env.VITE_SHELL_ORIGIN || 'http://localhost:5173'

let listenerAdded = false

export function initShellSessionSync() {
  if (listenerAdded) return
  listenerAdded = true

  window.addEventListener('message', async (event) => {
    if (event.origin !== SHELL_ORIGIN) return
    const data = event.data
    if (data?.type !== 'shell-session' || !data.access_token) return

    try {
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token || ''
      })
    } catch (e) {
      console.warn('[micro-productos] Error aplicando sesión del shell:', e)
    }
  })
}
