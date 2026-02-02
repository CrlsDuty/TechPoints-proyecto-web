import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from './Header'

describe('Header', () => {
  it('debe renderizar el logo y nombre de la app', () => {
    const usuarioMock = {
      email: 'test@mail.com',
      nombre: 'Test User',
      puntos: 1000
    }

    render(<Header usuario={usuarioMock} />)
    
    expect(screen.getByText(/TechPoints/i)).toBeDefined()
  })

  it('debe mostrar información del usuario cuando está logueado', () => {
    const usuarioMock = {
      email: 'ana@mail.com',
      nombre: 'Ana',
      puntos: 27078
    }

    render(<Header usuario={usuarioMock} />)
    
    expect(screen.getByText(/Ana/i)).toBeDefined()
  })

  it('debe mostrar el botón de cerrar sesión', () => {
    const usuarioMock = {
      email: 'test@mail.com',
      nombre: 'Test',
      puntos: 500
    }

    render(<Header usuario={usuarioMock} />)
    
    const logoutButton = screen.getByText(/Cerrar Sesión/i)
    expect(logoutButton).toBeDefined()
  })
})
