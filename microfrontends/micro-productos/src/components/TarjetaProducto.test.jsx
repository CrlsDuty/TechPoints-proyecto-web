import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TarjetaProducto from './TarjetaProducto'

describe('TarjetaProducto', () => {
  const productoMock = {
    id: 1,
    nombre: 'Laptop Gaming',
    descripcion: 'Laptop de alto rendimiento',
    categoria: 'Electrónica',
    costo_puntos: 50000,
    precio_dolar: 1299.99,
    stock: 5,
    imagen_url: 'https://example.com/laptop.jpg'
  }

  it('debe renderizar el nombre del producto', () => {
    render(<TarjetaProducto producto={productoMock} />)
    expect(screen.getByText('Laptop Gaming')).toBeDefined()
  })

  it('debe mostrar el costo en puntos', () => {
    render(<TarjetaProducto producto={productoMock} />)
    expect(screen.getByText(/50.000/i)).toBeDefined()
  })

  it('debe mostrar la categoría', () => {
    render(<TarjetaProducto producto={productoMock} />)
    expect(screen.getByText(/Electrónica/i)).toBeDefined()
  })

  it('debe mostrar stock disponible', () => {
    render(<TarjetaProducto producto={productoMock} />)
    expect(screen.getByText(/Stock: 5/i)).toBeDefined()
  })

  it('debe llamar a onCanjear cuando se hace click en canjear', () => {
    const onCanjear = vi.fn()
    render(<TarjetaProducto producto={productoMock} onCanjear={onCanjear} />)
    
    const botonCanjear = screen.getByText(/Canjear/i)
    fireEvent.click(botonCanjear)
    
    expect(onCanjear).toHaveBeenCalledWith(productoMock)
  })

  it('debe deshabilitar botón canjear cuando no hay stock', () => {
    const productoSinStock = { ...productoMock, stock: 0 }
    render(<TarjetaProducto producto={productoSinStock} />)
    
    const botonCanjear = screen.getByText(/Sin stock/i)
    expect(botonCanjear).toBeDefined()
  })
})
