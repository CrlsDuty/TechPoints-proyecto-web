import React, { useState } from 'react'
import { productosService } from '../services/productosService'
import eventBus from '@shared/eventBus'

const TarjetaProducto = ({ producto, rol = 'cliente', usuario, onCanjear, onEditar, onEliminar }) => {
  const costoPuntos = producto.costo_puntos ?? producto.costo ?? 0
  const precioDolar = parseFloat(producto.precio_dolar ?? producto.precioDolar) || 0
  const stock = parseInt(producto.stock, 10) || 0
  const sinStock = stock <= 0
  const puntosUsuario = usuario?.puntos ?? 0
  const puedeCanjear = !sinStock && puntosUsuario >= costoPuntos
  const tiendaNombre = producto.tienda_nombre || producto.tienda || 'Tienda desconocida'
  const [mostrarCanje, setMostrarCanje] = useState(false)

  const handleCanjear = () => {
    if (!puedeCanjear) return
    if (onCanjear) onCanjear(producto.id)
    else if (typeof window !== 'undefined' && window.__eventBus?.emit) {
      window.__eventBus.emit('add-to-cart', { producto, cantidad: 1 })
    }
    setMostrarCanje(true)
  }

  const handleCerrarCanje = () => {
    setMostrarCanje(false)
  }

  return (
    <div style={{ ...styles.card, ...(sinStock && rol === 'cliente' ? styles.cardSinStock : {}) }}>
      <div style={styles.imagen}>
        <img
          src={producto.imagen_url || 'https://via.placeholder.com/200?text=Sin+imagen'}
          alt={producto.nombre}
          style={styles.img}
        />
      </div>
      <div style={styles.contenido}>
        <h3 style={styles.nombre}>{producto.nombre}</h3>
        {rol === 'cliente' && (
          <p style={styles.tienda}>🏪 {tiendaNombre}</p>
        )}
        <p style={styles.descripcion}>{producto.descripcion || 'Producto disponible para canje'}</p>
        <div style={styles.stock}>
          {sinStock ? (
            <span style={styles.stockSin}>Sin stock</span>
          ) : (
            <span style={styles.stockOk}>✓ {stock} disponibles</span>
          )}
        </div>
        <div style={styles.precios}>
          {precioDolar > 0 && (
            <span style={styles.precioDolar}>${precioDolar.toFixed(2)}</span>
          )}
          <span style={styles.puntos}>{productosService.formatearPuntos(costoPuntos)} pts</span>
        </div>
        <div style={styles.acciones}>
          {rol === 'tienda' ? (
            <>
              <button type="button" onClick={() => onEditar?.(producto)} style={styles.btnEditar}>
                Editar
              </button>
              <button type="button" onClick={() => onEliminar?.(producto)} style={styles.btnEliminar}>
                Eliminar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCanjear}
              disabled={!puedeCanjear}
              style={{ ...styles.btnCanjear, ...(puedeCanjear ? {} : styles.btnDisabled) }}
            >
              {sinStock ? 'Sin stock' : puntosUsuario < costoPuntos ? 'Puntos insuficientes' : 'Canjear'}
            </button>
          )}
        </div>
      </div>
      {mostrarCanje && (
        <div style={styles.canjeModal}>
          {/* Web Component de micro-canje */}
          <micro-canje-producto 
            producto={JSON.stringify(producto)}
            onclose={handleCerrarCanje}
          />
          <button onClick={handleCerrarCanje} style={styles.cerrarBtn}>Cerrar</button>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease'
  },
  cardSinStock: {
    opacity: 0.7
  },
  imagen: {
    width: '100%',
    height: '180px',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden'
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  contenido: {
    padding: '1rem'
  },
  nombre: {
    margin: '0 0 0.25rem',
    fontSize: '1.1rem'
  },
  tienda: {
    margin: '0 0 0.5rem',
    fontSize: '0.85rem',
    color: '#666'
  },
  descripcion: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0.5rem 0',
    minHeight: '2.5em'
  },
  stock: {
    fontSize: '0.85rem',
    marginBottom: '0.5rem'
  },
  stockSin: {
    color: '#dc2626',
    fontWeight: '600'
  },
  stockOk: {
    color: '#059669'
  },
  precios: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  precioDolar: {
    color: '#059669',
    fontWeight: '600'
  },
  puntos: {
    fontWeight: 'bold',
    color: '#0ea5e9'
  },
  acciones: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  btnCanjear: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed'
  },
  btnEditar: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  btnEliminar: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  canjeModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  cerrarBtn: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
}

export default TarjetaProducto
