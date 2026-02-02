import React, { useState, useEffect } from 'react'
import { ProductosProvider } from './context/ProductosContext'
import CatalogoProductos from './components/CatalogoProductos'
import Notification from './components/Notification'
import { supabase } from './utils/supabase'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [usuarioDelPostMessage, setUsuarioDelPostMessage] = useState(null)

  // Escuchar postMessage de shell-app y de micro-canje
  useEffect(() => {
    const handleMessage = (event) => {
      // Recibir sesión de shell-app
      if (event.data?.type === 'shell-session' && event.data?.usuario) {
        setUsuarioDelPostMessage(event.data.usuario)
      }
      
      // Recibir evento de canje completado y reenviarlo a shell-app
      if (event.data?.type === 'canje-completado') {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(event.data, '*')
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Obtener usuario de los eventos de autenticación
  useEffect(() => {
    let timeoutId = null

    // Timeout para considerar que no hay sesión después de 5 segundos
    timeoutId = setTimeout(() => {
      setCargando(false)
    }, 5000)

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (timeoutId) clearTimeout(timeoutId)

      if (session?.user) {
        // Usar puntos del postMessage si existen, sino usar 0
        const puntos = usuarioDelPostMessage?.puntos ?? 0
        const usuarioData = {
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.email?.split('@')[0] || 'Usuario',
          puntos: puntos,
          role: usuarioDelPostMessage?.role || 'cliente'
        }
        setUsuario(usuarioData)
      } else {
        setUsuario(null)
      }

      setCargando(false)
    })
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription?.unsubscribe()
    }
  }, [usuarioDelPostMessage])

  if (cargando) {
    return <div style={styles.loading}>Cargando...</div>
  }

  return (
    <ProductosProvider usuarioExterno={usuario}>
      <Notification />
      <div style={styles.app}>
        <CatalogoProductos />
      </div>
    </ProductosProvider>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '1.2rem'
  }
}

export default App
