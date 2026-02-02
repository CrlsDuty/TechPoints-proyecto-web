import React from 'react'

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null

  const typeStyles = {
    warning: {
      icon: '⚠️',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    danger: {
      icon: '🚨',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    info: {
      icon: 'ℹ️',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    }
  }

  const currentType = typeStyles[type]

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.iconContainer}>
          <span style={styles.icon}>{currentType.icon}</span>
        </div>
        
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        
        <div style={styles.actions}>
          <button
            onClick={onClose}
            style={styles.cancelButton}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            style={{
              ...styles.confirmButton,
              background: currentType.gradient
            }}
          >
            {confirmText}
          </button>
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'slideIn 0.3s ease-out'
  },
  iconContainer: {
    textAlign: 'center',
    marginBottom: '1rem'
  },
  icon: {
    fontSize: '3rem',
    lineHeight: 1
  },
  title: {
    margin: '0 0 1rem 0',
    fontSize: '1.5rem',
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b'
  },
  message: {
    margin: '0 0 2rem 0',
    fontSize: '1rem',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: '1.6'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    background: 'white',
    color: '#64748b',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  confirmButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  }
}

export default ConfirmModal
