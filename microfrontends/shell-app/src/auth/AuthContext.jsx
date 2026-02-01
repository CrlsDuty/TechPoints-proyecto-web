import React, { createContext, useState, useEffect } from 'react'
import { supabase, getPerfilUsuario } from '../utils/supabase'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Función auxiliar para establecer usuario con perfil
  const establecerUsuario = async (authUser) => {
    if (!authUser) {
      setUsuario(null)
      return
    }

    try {
      const perfil = await getPerfilUsuario(authUser.id)
      setUsuario({
        id: authUser.id,
        email: authUser.email,
        nombre: perfil?.nombre || authUser.email.split('@')[0],
        puntos: perfil?.puntos || 0,
        role: perfil?.role || 'cliente'
      })
    } catch (err) {
      console.error('Error estableciendo usuario:', err)
      setError(err.message)
    }
  }

  // Verificar sesión al montar
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        console.log('Verificando sesión al montar...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error en getSession:', sessionError)
          setError(sessionError.message)
        }
        
        if (session?.user) {
          console.log('Sesión existente encontrada:', session.user.email)
          await establecerUsuario(session.user)
        } else {
          console.log('No hay sesión activa')
          setUsuario(null)
        }
      } catch (err) {
        console.error('Error verificando sesión:', err)
        setError(err.message)
      } finally {
        setLoading(false)
        setSessionChecked(true)
      }
    }

    verificarSesion()

    // Escuchar cambios de autenticación SOLO después de verificar sesión inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state cambió:', event, session?.user?.email)
        
        // Solo procesar si ya verificamos la sesión inicial
        if (sessionChecked) {
          if (session?.user) {
            await establecerUsuario(session.user)
          } else {
            setUsuario(null)
          }
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [sessionChecked])

  const login = async (email, password) => {
    try {
      console.log('Intentando login con:', email)
      setError(null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('Error en signInWithPassword:', signInError)
        throw signInError
      }

      console.log('Login exitoso:', data.user.email)
      // Establecer usuario con perfil completo
      await establecerUsuario(data.user)

      return { success: true }
    } catch (err) {
      console.error('Error en login:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const logout = async () => {
    try {
      console.log('Cerrando sesión...')
      setError(null)
      await supabase.auth.signOut()
      setUsuario(null)
      return { success: true }
    } catch (err) {
      console.error('Error en logout:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const actualizarPerfil = (nuevosDatos) => {
    setUsuario(prev => ({
      ...prev,
      ...nuevosDatos
    }))
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      loading,
      error,
      login,
      logout,
      actualizarPerfil,
      estaAutenticado: !!usuario
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
