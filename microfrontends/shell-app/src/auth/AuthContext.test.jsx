import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, AuthContext } from './AuthContext'
import { useContext } from 'react'

// Mock de Supabase
vi.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  },
  getPerfilUsuario: vi.fn()
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe proporcionar el contexto de autenticación', () => {
    const TestComponent = () => {
      const context = useContext(AuthContext)
      return <div>{context ? 'Context disponible' : 'No context'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Context disponible')).toBeDefined()
  })

  it('debe iniciar con loading=true', () => {
    const TestComponent = () => {
      const { loading } = useContext(AuthContext)
      return <div>{loading ? 'Cargando...' : 'Cargado'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Cargando...')).toBeDefined()
  })

  it('debe establecer usuario como null cuando no hay sesión', async () => {
    const { supabase } = await import('../utils/supabase')
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const TestComponent = () => {
      const { usuario, loading } = useContext(AuthContext)
      if (loading) return <div>Cargando...</div>
      return <div>{usuario ? 'Usuario existe' : 'Sin usuario'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Sin usuario')).toBeDefined()
    })
  })
})
