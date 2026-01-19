import React from 'react'
import eventBus from '../../../shared/eventBus'

const TarjetaProducto = ({ producto }) => {
  const handleAgregarAlCarrito = () => {
    eventBus.emit('add-to-cart', {
      producto,
      cantidad: 1
    })
  }

  return (
    <div style={styles.card}>
      <div style={styles.imagen}>
        <img 
          src={producto.imagen_url || 'https://via.placeholder.com/200'} 
          alt={producto.nombre}
        />
      </div>
      <div style={styles.contenido}>
        <h3>{producto.nombre}</h3>
        <p style={styles.descripcion}>{producto.descripcion}</p>
        <div style={styles.footer}>
          <span style={styles.puntos}>⭐ {producto.costo_puntos} pts</span>
          <button 
            onClick={handleAgregarAlCarrito}
            style={styles.button}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease'
  },
  imagen: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden'
  },
  contenido: {
    padding: '1rem'
  },
  descripcion: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0.5rem 0'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem'
  },
  puntos: {
    fontWeight: 'bold',
    color: '#007bff'
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
}

export default TarjetaProducto
