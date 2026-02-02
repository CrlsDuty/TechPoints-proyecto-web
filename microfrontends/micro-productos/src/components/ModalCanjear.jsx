import React, { useState } from 'react'
import eventBus from '@shared/eventBus'
import { productosService } from '../services/productosService'

const ModalCanjear = ({ producto, usuario, onClose }) => {
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  if (!producto) return null

  const costoPuntos = producto.costo_puntos ?? 0
  const precioDolar = parseFloat(producto.precio_dolar ?? 0) || 0
  const stock = parseInt(producto.stock, 10) || 0
  const puntosUsuario = usuario?.puntos ?? 0
  const tiendaNombre = producto.tienda_nombre || 'Tienda desconocida'
  const puedeCanjear = stock > 0 && puntosUsuario >= costoPuntos

  const handleConfirmar = async () => {
    if (!puedeCanjear || !usuario?.id) return

    setCargando(true)
    try {
      const resultado = await productosService.canjearProducto(usuario.id, producto.id)
      
      if (resultado.success) {
        setMensaje({
          text: `✓ ${resultado.message}`,
          type: 'success'
        })
        
        // Emitir evento de canje exitoso para actualizar UI
        eventBus.emit('canje-exitoso', resultado)
        
        // Emitir evento para refetch de productos
        eventBus.emit('refetch-productos', {})
        
        // Notificar al shell-app (padre) que se completó el canje
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'canje-completado',
            puntosRestantes: resultado.puntosRestantes,
            puntosUsados: resultado.puntosUsados
          }, '*')
        }
        
        // Cerrar modal después del canje exitoso
        setTimeout(onClose, 1500)
      } else {
        setMensaje({
          text: `❌ ${resultado.message || 'Error al realizar el canje'}`,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error en canje:', error)
      setMensaje({
        text: '❌ Error al realizar el canje',
        type: 'error'
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        <div style={styles.content}>
          {/* Notificación */}
          {mensaje && (
            <div style={{
              ...styles.notificacion,
              backgroundColor: mensaje.type === 'success' ? '#d4edda' : '#f8d7da',
              color: mensaje.type === 'success' ? '#155724' : '#721c24',
              borderColor: mensaje.type === 'success' ? '#c3e6cb' : '#f5c6cb'
            }}>
              {mensaje.text}
            </div>
          )}

          {/* Imagen */}
          <div style={styles.imageContainer}>
            <img
              src={producto.imagen_url || 'https://via.placeholder.com/300?text=Sin+imagen'}
              alt={producto.nombre}
              style={styles.image}
            />
          </div>

          {/* Datos del producto */}
          <div style={styles.datos}>
            <h2 style={styles.titulo}>{producto.nombre}</h2>

            {/* Tienda */}
            <div style={styles.fila}>
              <span style={styles.label}>🏪 Tienda:</span>
              <span style={styles.valor}>{tiendaNombre}</span>
            </div>

            {/* Descripción */}
            {producto.descripcion && (
              <div style={styles.descripcion}>
                <p style={styles.descripcionText}>{producto.descripcion}</p>
              </div>
            )}

            {/* Precios */}
            <div style={styles.preciosSection}>
              {precioDolar > 0 && (
                <div style={styles.fila}>
                  <span style={styles.label}>💵 Precio:</span>
                  <span style={styles.valor}>${precioDolar.toFixed(2)}</span>
                </div>
              )}
              <div style={styles.fila}>
                <span style={styles.label}>⭐ Costo en Puntos:</span>
                <span style={{ ...styles.valor, ...styles.puntos }}>
                  {costoPuntos.toLocaleString()} puntos
                </span>
              </div>
            </div>

            {/* Stock */}
            <div style={styles.fila}>
              <span style={styles.label}>📦 Stock:</span>
              <span style={{
                ...styles.valor,
                color: stock > 0 ? '#059669' : '#dc2626',
                fontWeight: 'bold'
              }}>
                {stock > 0 ? `${stock} disponibles` : 'Sin stock'}
              </span>
            </div>

            {/* Validaciones */}
            {stock <= 0 && (
              <div style={styles.alerta}>
                <span>⚠️ Este producto no tiene stock disponible</span>
              </div>
            )}

            {puntosUsuario < costoPuntos && (
              <div style={styles.alertaError}>
                <span>❌ No tienes suficientes puntos</span>
                <span style={styles.puntosNecesarios}>
                  Necesitas {(costoPuntos - puntosUsuario).toLocaleString()} puntos más
                </span>
              </div>
            )}

            {/* Puntos del usuario */}
            <div style={styles.puntosUsuarioSection}>
              <div style={styles.fila}>
                <span style={styles.label}>Tus puntos disponibles:</span>
                <span style={{ ...styles.valor, ...styles.puntos }}>
                  {puntosUsuario.toLocaleString()} ⭐
                </span>
              </div>
              {puntosUsuario >= costoPuntos && (
                <div style={styles.fila}>
                  <span style={styles.label}>Te quedarán:</span>
                  <span style={{ ...styles.valor, ...styles.puntosRestantes }}>
                    {(puntosUsuario - costoPuntos).toLocaleString()} ⭐
                  </span>
                </div>
              )}
            </div>

            {/* Botones */}
            <div style={styles.botones}>
              <button
                style={{
                  ...styles.btnConfirmar,
                  ...(puedeCanjear && !cargando ? {} : styles.btnDisabled)
                }}
                onClick={handleConfirmar}
                disabled={!puedeCanjear || cargando}
              >
                {cargando ? '⏳ Procesando...' : '✓ Confirmar Canje'}
              </button>
              <button 
                style={styles.btnCancelar}
                onClick={onClose}
                disabled={cargando}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#999',
    zIndex: 10
  },
  content: {
    padding: '2rem'
  },
  notificacion: {
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '1.5rem',
    fontWeight: '600',
    textAlign: 'center'
  },
  imageContainer: {
    marginBottom: '2rem',
    textAlign: 'center'
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '300px',
    borderRadius: '8px',
    objectFit: 'cover'
  },
  datos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  titulo: {
    margin: 0,
    fontSize: '1.8rem',
    color: '#333'
  },
  fila: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.5rem'
  },
  label: {
    fontWeight: '600',
    color: '#666',
    fontSize: '0.95rem'
  },
  valor: {
    color: '#333',
    fontWeight: '500'
  },
  puntos: {
    color: '#0ea5e9',
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  puntosRestantes: {
    color: '#059669',
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  descripcion: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    borderLeft: '4px solid #0ea5e9'
  },
  descripcionText: {
    margin: 0,
    color: '#555',
    lineHeight: '1.5'
  },
  preciosSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    backgroundColor: '#f0f7ff',
    padding: '1rem',
    borderRadius: '8px'
  },
  alerta: {
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#fffacd',
    color: '#856404',
    border: '1px solid #ffeeba',
    fontWeight: '500'
  },
  alertaError: {
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    fontWeight: '500',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  puntosNecesarios: {
    fontSize: '0.9rem',
    opacity: 0.9
  },
  puntosUsuarioSection: {
    backgroundColor: '#e8f5e9',
    padding: '1rem',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  botones: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem'
  },
  btnConfirmar: {
    flex: 1,
    padding: '1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s'
  },
  btnCancelar: {
    flex: 1,
    padding: '1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s'
  },
  btnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: 0.6
  }
}

export default ModalCanjear
