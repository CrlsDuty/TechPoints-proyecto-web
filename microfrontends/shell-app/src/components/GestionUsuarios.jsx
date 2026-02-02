import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import './GestionUsuarios.css'

const GestionUsuarios = ({ onCerrar }) => {
  const [usuarios, setUsuarios] = useState([])
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  
  // Estados para filtros y búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [filtroRole, setFiltroRole] = useState('todos')
  const [ordenPuntos, setOrdenPuntos] = useState('ninguno')

  useEffect(() => {
    cargarUsuarios()
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros()
  }, [usuarios, busqueda, filtroRole, ordenPuntos])

  const aplicarFiltros = () => {
    let resultado = [...usuarios]

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      resultado = resultado.filter(user => 
        user.email?.toLowerCase().includes(termino) ||
        user.nombre?.toLowerCase().includes(termino)
      )
    }

    // Filtrar por rol
    if (filtroRole !== 'todos') {
      resultado = resultado.filter(user => user.role === filtroRole)
    }

    // Ordenar por puntos
    if (ordenPuntos === 'mayor') {
      resultado.sort((a, b) => (b.puntos || 0) - (a.puntos || 0))
    } else if (ordenPuntos === 'menor') {
      resultado.sort((a, b) => (a.puntos || 0) - (b.puntos || 0))
    }

    setUsuariosFiltrados(resultado)
  }

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
              {/* Barra de búsqueda y filtros */}
              <div style={styles.filtrosContainer}>
                <div style={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="🔍 Buscar por email o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <div style={styles.filtersRow}>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Rol:</label>
                    <select
                      value={filtroRole}
                      onChange={(e) => setFiltroRole(e.target.value)}
                      style={styles.selectFilter}
                    >
                      <option value="todos">Todos</option>
                      <option value="cliente">Clientes</option>
                      <option value="tienda">Tiendas</option>
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Ordenar por puntos:</label>
                    <select
                      value={ordenPuntos}
                      onChange={(e) => setOrdenPuntos(e.target.value)}
                      style={styles.selectFilter}
                    >
                      <option value="ninguno">Sin orden</option>
                      <option value="mayor">Mayor a menor</option>
                      <option value="menor">Menor a mayor</option>
                    </select>
                  </div>
                </div>
                <div style={styles.resultadosInfo}>
                  Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
                </div>
              </div>

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
                    {usuariosFiltrados.map((user) => (
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

                {usuariosFiltrados.length === 0 && (
                  <div style={styles.noResultados}>
                    No se encontraron usuarios con los filtros aplicados
                  </div>
                )}
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
  filtrosContainer: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  searchBox: {
    marginBottom: '1rem'
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box'
  },
  filtersRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: '1',
    minWidth: '200px'
  },
  filterLabel: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#4a5568',
    whiteSpace: 'nowrap'
  },
  selectFilter: {
    flex: '1',
    padding: '0.5rem',
    fontSize: '0.9rem',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none'
  },
  resultadosInfo: {
    fontSize: '0.85rem',
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'right'
  },
  noResultados: {
    textAlign: 'center',
    padding: '2rem',
    color: '#999',
    fontSize: '0.95rem',
    fontStyle: 'italic'
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
