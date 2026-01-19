import React, { createContext, useState, useEffect } from 'react'
import { supabase, getPerfilUsuario } from '../../../shared/supabaseClient'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verificar sesión al montar
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const perfil = await getPerfilUsuario(session.user.id)
          setUsuario({
            id: session.user.id,
            email: session.user.email,
            ...perfil
          })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    verificarSesion()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const perfil = await getPerfilUsuario(session.user.id)
          setUsuario({
            id: session.user.id,
            email: session.user.email,
            ...perfil
          })
        } else {
          setUsuario(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      const perfil = await getPerfilUsuario(data.user.id)
      setUsuario({
        id: data.user.id,
        email: data.user.email,
        ...perfil
      })

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await supabase.auth.signOut()
      setUsuario(null)
      return { success: true }
    } catch (err) {
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
