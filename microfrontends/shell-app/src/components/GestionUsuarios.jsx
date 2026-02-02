import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import './GestionUsuarios.css'

const GestionUsuarios = ({ onCerrar }) => {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, nombre, puntos, role, creado_at')
        .order('creado_at', { ascending: false })

      if (error) throw error
      setUsuarios(data || [])
    } catch (err) {
      console.error('Error cargando usuarios:', err)
      setMensaje({ tipo: 'error', texto: 'Error al cargar usuarios' })
    } finally {
      setCargando(false)
    }
  }

  const handleAgregarPuntos = async () => {
    if (!usuarioSeleccionado || puntos === 0) return

    setProcesando(true)
    setMensaje(null)

    try {
      const nuevosPuntos = (usuarioSeleccionado.puntos || 0) + parseInt(puntos)
      
      const { error } = await supabase
        .from('profiles')
        .update({ puntos: nuevosPuntos })
        .eq('id', usuarioSeleccionado.id)

      if (error) throw error

      // Registrar transacción
      await supabase.from('points_transactions').insert({
        perfil_id: usuarioSeleccionado.id,
        tipo: puntos > 0 ? 'credito' : 'debito',
        cantidad: Math.abs(puntos),
        source: { motivo: 'Ajuste manual por admin', admin: true }
      })

      setMensaje({ tipo: 'success', texto: `Puntos ${puntos > 0 ? 'agregados' : 'restados'} correctamente` })
      setPuntos(0)
      setUsuarioSeleccionado(null)
      await cargarUsuarios()
    } catch (err) {
      console.error('Error al modificar puntos:', err)
      setMensaje({ tipo: 'error', texto: 'Error al modificar puntos' })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onCerrar}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2>👥 Gestión de Usuarios</h2>
          <button onClick={onCerrar} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.content}>
          {mensaje && (
            <div style={{
              ...styles.mensaje,
              backgroundColor: mensaje.tipo === 'success' ? '#d4edda' : '#f8d7da',
              color: mensaje.tipo === 'success' ? '#155724' : '#721c24'
            }}>
              {mensaje.texto}
            </div>
          )}

          {cargando ? (
            <div style={styles.loading}>Cargando usuarios...</div>
          ) : (
            <>
              <div style={styles.tabla}>
                <table className="gestion-usuarios-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>Puntos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.nombre || '-'}</td>
                        <td>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: user.role === 'tienda' ? '#ffc107' : '#007bff'
                          }}>
                            {user.role === 'tienda' ? 'TIENDA' : 'CLIENTE'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold' }}>
                          {new Intl.NumberFormat('es-ES').format(user.puntos || 0)} pts
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setUsuarioSeleccionado(user)
                              setPuntos(0)
                            }}
                            style={styles.btnAccion}
                          >
                            Gestionar Puntos
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {usuarioSeleccionado && (
                <div style={styles.formPuntos}>
                  <h3>Modificar puntos de {usuarioSeleccionado.email}</h3>
                  <p style={{ fontSize: '0.9em', color: '#666' }}>
                    Puntos actuales: <strong>{new Intl.NumberFormat('es-ES').format(usuarioSeleccionado.puntos || 0)}</strong>
                  </p>
                  <div style={styles.inputGroup}>
                    <label>Cantidad (positivo para agregar, negativo para quitar):</label>
                    <input
                      type="number"
                      value={puntos}
                      onChange={(e) => setPuntos(parseInt(e.target.value) || 0)}
                      style={styles.input}
                      placeholder="Ej: 1000 o -500"
                    />
                  </div>
                  <div style={styles.actions}>
                    <button
                      onClick={() => setUsuarioSeleccionado(null)}
                      style={styles.btnCancel}
                      disabled={procesando}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAgregarPuntos}
                      style={styles.btnGuardar}
                      disabled={procesando || puntos === 0}
                    >
                      {procesando ? 'Procesando...' : 'Aplicar'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    zIndex: 1
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#999',
    lineHeight: 1
  },
  content: {
    padding: '1.5rem'
  },
  mensaje: {
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666'
  },
  tabla: {
    overflowX: 'auto'
  },
  badge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  btnAccion: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'background-color 0.2s'
  },
  formPuntos: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  inputGroup: {
    marginBottom: '1rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    marginTop: '0.5rem'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  },
  btnCancel: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  btnGuardar: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
}

export default GestionUsuarios
