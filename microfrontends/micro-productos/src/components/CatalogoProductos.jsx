import React from 'react'
import { useProductos } from '../context/ProductosContext'
import TarjetaProducto from './TarjetaProducto'

const CatalogoProductos = () => {
  const { productosFiltrados, cargando } = useProductos()

  if (cargando) {
    return <div style={styles.loading}>Cargando productos...</div>
  }

  return (
    <div style={styles.container}>
      <h2>📦 Catálogo de Productos</h2>
      
      {productosFiltrados.length === 0 ? (
        <p style={styles.empty}>No hay productos disponibles</p>
      ) : (
        <div style={styles.grid}>
          {productosFiltrados.map(producto => (
            <TarjetaProducto key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 1rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem'
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: '2rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '2rem',
    marginTop: '2rem'
  }
}

export default CatalogoProductos
