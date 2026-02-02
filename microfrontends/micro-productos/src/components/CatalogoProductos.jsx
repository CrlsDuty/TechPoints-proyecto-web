import React, { useState } from 'react'
import { useProductos } from '../context/ProductosContext'
import { productosService } from '../services/productosService'
import TarjetaProducto from './TarjetaProducto'
import FormProducto from './FormProducto'
import { CATEGORIAS } from '../constants/categorias'

const Modal = ({ abierto, onCerrar, titulo, children }) => {
  if (!abierto) return null
  return (
    <div
      style={modalStyles.overlay}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      role="dialog"
      aria-modal="true"
    >
      <div style={modalStyles.content}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.titulo}>{titulo}</h2>
          <button type="button" onClick={onCerrar} style={modalStyles.cerrar} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div style={modalStyles.body}>{children}</div>
      </div>
    </div>
  )
}

const modalStyles = {
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
  content: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0'
  },
  titulo: { margin: 0, fontSize: '1.25rem' },
  cerrar: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#64748b',
    lineHeight: 1
  },
  body: { padding: '1.25rem' }
}

const CatalogoProductos = () => {
  const {
    usuario,
    productosFiltrados,
    cargando,
    error,
    filtros,
    actualizarFiltros,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    canjearProducto
  } = useProductos()

  const [mostrarFormAgregar, setMostrarFormAgregar] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)
  const [productoCanjear, setProductoCanjear] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const rol = usuario?.role || 'cliente'
  const esTienda = rol === 'tienda'

  const handleAgregar = async (payload) => {
    setGuardando(true)
    setMensaje(null)
    const res = await agregarProducto(payload)
    setGuardando(false)
    if (res.success) {
      setMensaje({ tipo: 'success', texto: 'Producto agregado correctamente' })
      setMostrarFormAgregar(false)
    } else {
      setMensaje({ tipo: 'error', texto: res.message || 'Error al agregar' })
    }
  }

  const handleActualizar = async (payload) => {
    if (!productoEditar?.id) return
    setGuardando(true)
    setMensaje(null)
    const res = await actualizarProducto(productoEditar.id, payload)
    setGuardando(false)
    if (res.success) {
      setMensaje({ tipo: 'success', texto: 'Producto actualizado' })
      setProductoEditar(null)
    } else {
      setMensaje({ tipo: 'error', texto: res.message || 'Error al actualizar' })
    }
  }

  const handleEliminar = async (producto) => {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return
    setMensaje(null)
    const res = await eliminarProducto(producto.id)
    if (res.success) {
      setMensaje({ tipo: 'success', texto: 'Producto eliminado' })
    } else {
      setMensaje({ tipo: 'error', texto: res.message || 'Error al eliminar' })
    }
  }

  const handleConfirmarCanje = async () => {
    if (!productoCanjear?.id) return
    setGuardando(true)
    setMensaje(null)
    const res = await canjearProducto(productoCanjear.id)
    setGuardando(false)
    if (res.success) {
      setMensaje({ tipo: 'success', texto: res.message })
      setProductoCanjear(null)
    } else {
      setMensaje({ tipo: 'error', texto: res.message })
    }
  }

  const categoriasUnicas = [...new Set(CATEGORIAS.flatMap((g) => g.values))]

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>
        {esTienda ? '📋 Mis Productos' : '📦 Catálogo de Productos'}
      </h2>

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

      {!esTienda && (
        <div style={styles.filtros}>
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={filtros.busqueda || ''}
            onChange={(e) => actualizarFiltros({ busqueda: e.target.value })}
            style={styles.inputBusqueda}
          />
          <select
            value={filtros.categoria || ''}
            onChange={(e) => actualizarFiltros({ categoria: e.target.value || null })}
            style={styles.selectCategoria}
          >
            <option value="">Todas las categorías</option>
            {categoriasUnicas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {esTienda && (
        <div style={styles.sectionTienda}>
          <div style={styles.adminButtons}>
            {!mostrarFormAgregar && (
              <>
                <button
                  type="button"
                  onClick={() => setMostrarFormAgregar(true)}
                  style={styles.btnAgregar}
                >
                  ➕ Agregar Producto
                </button>
              </>
            )}
          </div>
          {mostrarFormAgregar && (
            <div style={styles.formSection}>
              <h3 style={styles.subtitulo}>Agregar Producto</h3>
              <FormProducto
                onSubmit={handleAgregar}
                onCancel={() => setMostrarFormAgregar(false)}
                guardando={guardando}
              />
            </div>
          )}
        </div>
      )}

      {cargando && <div style={styles.loading}>Cargando productos...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {!cargando && !error && productosFiltrados.length === 0 && (
        <p style={styles.empty}>
          {esTienda ? 'No has agregado productos aún' : 'No hay productos disponibles'}
        </p>
      )}

      {!cargando && productosFiltrados.length > 0 && (
        <div style={styles.grid}>
          {productosFiltrados.map((producto) => (
            <TarjetaProducto
              key={producto.id}
              producto={producto}
              rol={rol}
              usuario={usuario}
              onCanjear={() => setProductoCanjear(producto)}
              onEditar={esTienda ? setProductoEditar : undefined}
              onEliminar={esTienda ? handleEliminar : undefined}
            />
          ))}
        </div>
      )}

      <Modal
        abierto={!!productoCanjear}
        onCerrar={() => setProductoCanjear(null)}
        titulo="Confirmar canje"
      >
        {productoCanjear && (
          <>
            <p>
              ¿Canjear <strong>{productoCanjear.nombre}</strong> por{' '}
              <strong>{productosService.formatearPuntos(productoCanjear.costo_puntos || 0)} pts</strong>?
            </p>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Tus puntos: {productosService.formatearPuntos(usuario?.puntos ?? 0)} pts
            </p>
            <div style={modalStyles.actions}>
              <button type="button" onClick={() => setProductoCanjear(null)} style={styles.btnCancel}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCanje}
                disabled={guardando || (usuario?.puntos ?? 0) < (productoCanjear.costo_puntos || 0)}
                style={styles.btnConfirmar}
              >
                {guardando ? 'Procesando...' : 'Confirmar canje'}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        abierto={!!productoEditar}
        onCerrar={() => setProductoEditar(null)}
        titulo="Editar producto"
      >
        {productoEditar && (
          <FormProducto
            productoEditar={productoEditar}
            onSubmit={handleActualizar}
            onCancel={() => setProductoEditar(null)}
            guardando={guardando}
          />
        )}
      </Modal>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 1rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  titulo: {
    marginBottom: '1.5rem',
    fontSize: '1.5rem'
  },
  mensaje: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem'
  },
  filtros: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem'
  },
  inputBusqueda: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d0d0d0',
    minWidth: '200px'
  },
  selectCategoria: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d0d0d0'
  },
  sectionTienda: {
    marginBottom: '1.5rem'
  },
  adminButtons: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  btnAgregar: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem'
  },
  btnUsuarios: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem'
  },
  formSection: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  subtitulo: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.1rem'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#64748b'
  },
  error: {
    textAlign: 'center',
    padding: '1rem',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    borderRadius: '8px'
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    padding: '2rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1.5rem'
  },
  btnCancel: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  btnConfirmar: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  }
}

// Reutilizar para modal actions
modalStyles.actions = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '1rem'
}

export default CatalogoProductos
