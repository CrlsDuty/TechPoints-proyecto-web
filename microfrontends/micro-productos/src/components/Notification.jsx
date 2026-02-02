import React, { useState, useEffect } from 'react'
import eventBus from '@shared/eventBus'

const Notification = () => {
  const [mensaje, setMensaje] = useState(null)
  const [visible, setVisible] = useState(false)
  const [animacionSalida, setAnimacionSalida] = useState(false)

  useEffect(() => {
    // Escuchar evento de canje exitoso
    const handleCanjeExitoso = (data) => {
      setAnimacionSalida(false)
      setMensaje({
        text: '✓ Producto canjeado exitosamente',
        type: 'success'
      })
      setVisible(true)
      
      // Auto-hide después de 3 segundos
      setTimeout(() => {
        setAnimacionSalida(true)
        setTimeout(() => {
          setVisible(false)
        }, 300)
      }, 3000)
    }

    const unsubscribe = eventBus.on('canje-exitoso', handleCanjeExitoso)
    return unsubscribe
  }, [])

  if (!visible || !mensaje) return null

  return (
    <div
      style={{
        ...styles.notification,
        backgroundColor: mensaje.type === 'success' ? '#4caf50' : '#f44336',
        animation: animacionSalida ? 'slideOut 0.3s ease-in forwards' : 'slideIn 0.3s ease-out forwards'
      }}
    >
      {mensaje.text}
    </div>
  )
}

const styles = {
  notification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: 'bold',
    zIndex: 9999,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  }
}

export default Notification
