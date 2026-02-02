import React, { useState } from 'react'
import { supabase } from '../utils/supabase'

const EditarPerfil = ({ usuario, onCerrar, onActualizar }) => {
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    telefono: usuario?.metadata?.telefono || '',
    avatar_url: usuario?.metadata?.avatar_url || ''
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre es requerido' })
      return false
    }

    if (!formData.email.trim()) {
      setMensaje({ tipo: 'error', texto: 'El email es requerido' })
      return false
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setMensaje({ tipo: 'error', texto: 'El formato del email no es válido' })
      return false
    }

    // Validar teléfono si está presente
    if (formData.telefono && formData.telefono.length > 0) {
      const telefonoRegex = /^[\d\s\+\-\(\)]+$/
      if (!telefonoRegex.test(formData.telefono)) {
        setMensaje({ tipo: 'error', texto: 'El formato del teléfono no es válido' })
        return false
      }
    }

    // Validar URL de avatar si está presente
    if (formData.avatar_url && formData.avatar_url.length > 0) {
      try {
        new URL(formData.avatar_url)
      } catch {
        setMensaje({ tipo: 'error', texto: 'La URL del avatar no es válida' })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)

    if (!validarFormulario()) {
      return
    }

    setGuardando(true)

    try {
      // 1. Actualizar metadata en la tabla profiles
      const metadataActualizado = {
        ...usuario?.metadata,
        telefono: formData.telefono || null,
        avatar_url: formData.avatar_url || null
      }

      const { error: errorProfile } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          metadata: metadataActualizado,
          actualizado_at: new Date().toISOString()
        })
        .eq('id', usuario.id)

      if (errorProfile) {
        throw errorProfile
      }

      // 2. Si cambió el email, actualizar también en auth (opcional, puede requerir reautenticación)
      if (formData.email !== usuario.email) {
        const { error: errorAuth } = await supabase.auth.updateUser({
          email: formData.email.trim()
        })
        
        if (errorAuth) {
          console.warn('[EditarPerfil] No se pudo actualizar email en auth:', errorAuth)
          // No lanzamos error porque el perfil ya se actualizó
        }
      }

      setMensaje({ tipo: 'success', texto: '✅ Perfil actualizado correctamente' })

      // Notificar al componente padre
      if (onActualizar) {
        onActualizar({
          ...usuario,
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          metadata: metadataActualizado
        })
      }

      // Cerrar después de 1.5 segundos
      setTimeout(() => {
        onCerrar()
      }, 1500)

    } catch (err) {
      console.error('[EditarPerfil] Error actualizando perfil:', err)
      setMensaje({ 
        tipo: 'error', 
        texto: err.message || 'Error al actualizar el perfil' 
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.titulo}>✏️ Editar Perfil</h2>
          <button
            type="button"
            onClick={onCerrar}
            style={styles.btnCerrar}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mensaje && (
            <div
              style={{
                ...styles.mensaje,
                backgroundColor: mensaje.tipo === 'success' ? '#d1fae5' : '#fee2e2',
                color: mensaje.tipo === 'success' ? '#065f46' : '#991b1b'
              }}
            >
              {mensaje.texto}
            </div>
          )}

          <div style={styles.campo}>
            <label htmlFor="nombre" style={styles.label}>
              👤 Nombre completo *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              style={styles.input}
              required
              maxLength={100}
            />
          </div>

          <div style={styles.campo}>
            <label htmlFor="email" style={styles.label}>
              📧 Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
              maxLength={100}
            />
            <small style={styles.ayuda}>
              Cambiar el email puede requerir verificación
            </small>
          </div>

          <div style={styles.campo}>
            <label htmlFor="telefono" style={styles.label}>
              📱 Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              style={styles.input}
              placeholder="+56 9 0000 0000"
              maxLength={20}
            />
          </div>

          <div style={styles.campo}>
            <label htmlFor="avatar_url" style={styles.label}>
              🖼️ URL de Avatar
            </label>
            <input
              type="url"
              id="avatar_url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleChange}
              style={styles.input}
              placeholder="https://ejemplo.com/avatar.jpg"
            />
            {formData.avatar_url && (
              <div style={styles.previewAvatar}>
                <img 
                  src={formData.avatar_url} 
                  alt="Preview avatar" 
                  style={styles.avatarImg}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>

          <div style={styles.acciones}>
            <button
              type="button"
              onClick={onCerrar}
              style={styles.btnCancelar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={styles.btnGuardar}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem',
    borderBottom: '1px solid #e2e8f0'
  },
  titulo: {
    margin: 0,
    fontSize: '1.4rem',
    color: '#1e293b'
  },
  btnCerrar: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#64748b',
    lineHeight: 1,
    padding: 0,
    width: '32px',
    height: '32px'
  },
  form: {
    padding: '1.5rem'
  },
  mensaje: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  campo: {
    marginBottom: '1.25rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#334155',
    fontSize: '0.95rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  ayuda: {
    display: 'block',
    marginTop: '0.35rem',
    fontSize: '0.8rem',
    color: '#64748b'
  },
  previewAvatar: {
    marginTop: '0.75rem',
    textAlign: 'center'
  },
  avatarImg: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e2e8f0'
  },
  acciones: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
    justifyContent: 'flex-end'
  },
  btnCancelar: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600'
  },
  btnGuardar: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600'
  }
}

export default EditarPerfil
