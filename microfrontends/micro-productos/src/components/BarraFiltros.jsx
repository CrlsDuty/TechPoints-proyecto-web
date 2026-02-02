import React, { useState } from 'react'
import { CATEGORIAS } from '../constants/categorias'

const BarraFiltros = ({ filtros, onActualizarFiltros }) => {
  const [precioMinInput, setPrecioMinInput] = useState('')
  const [precioMaxInput, setPrecioMaxInput] = useState('')
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)

  const categoriasUnicas = [...new Set(CATEGORIAS.flatMap((g) => g.values))]

  const handleBusqueda = (e) => {
    onActualizarFiltros({ busqueda: e.target.value })
  }

  const handleCategoria = (e) => {
    onActualizarFiltros({ categoria: e.target.value || null })
  }

  const handleOrdenamiento = (e) => {
    onActualizarFiltros({ ordenamiento: e.target.value })
  }

  const aplicarRangoPrecio = () => {
    const min = precioMinInput ? parseInt(precioMinInput) : 0
    const max = precioMaxInput ? parseInt(precioMaxInput) : Infinity
    
    if (min > max && max !== Infinity) {
      alert('El precio mínimo no puede ser mayor al máximo')
      return
    }

    onActualizarFiltros({ 
      precioMin: min, 
      precioMax: max === Infinity ? Infinity : max 
    })
  }

  const limpiarFiltros = () => {
    setPrecioMinInput('')
    setPrecioMaxInput('')
    onActualizarFiltros({ 
      busqueda: '', 
      categoria: null, 
      precioMin: 0, 
      precioMax: Infinity,
      ordenamiento: 'reciente'
    })
  }

  const cantidadFiltrosActivos = [
    filtros.busqueda,
    filtros.categoria,
    filtros.precioMin > 0,
    filtros.precioMax !== Infinity,
    filtros.ordenamiento !== 'reciente'
  ].filter(Boolean).length

  return (
    <div style={styles.container}>
      <div style={styles.principal}>
        <div style={styles.filaBusqueda}>
          <div style={styles.inputWrapper}>
            <span style={styles.icono}>🔍</span>
            <input
              type="search"
              placeholder="Buscar productos..."
              value={filtros.busqueda || ''}
              onChange={handleBusqueda}
              style={styles.inputBusqueda}
            />
          </div>

          <select
            value={filtros.categoria || ''}
            onChange={handleCategoria}
            style={styles.select}
          >
            <option value="">📂 Todas las categorías</option>
            {categoriasUnicas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
            style={styles.btnFiltros}
          >
            ⚙️ Filtros {cantidadFiltrosActivos > 0 && `(${cantidadFiltrosActivos})`}
          </button>

          {cantidadFiltrosActivos > 0 && (
            <button
              type="button"
              onClick={limpiarFiltros}
              style={styles.btnLimpiar}
            >
              🗑️ Limpiar
            </button>
          )}
        </div>
      </div>

      {mostrarFiltrosAvanzados && (
        <div style={styles.avanzados}>
          <div style={styles.seccionFiltro}>
            <label style={styles.label}>💰 Rango de Precio (puntos)</label>
            <div style={styles.rangoPrecio}>
              <input
                type="number"
                placeholder="Mín"
                value={precioMinInput}
                onChange={(e) => setPrecioMinInput(e.target.value)}
                style={styles.inputPrecio}
                min="0"
              />
              <span style={styles.separador}>—</span>
              <input
                type="number"
                placeholder="Máx"
                value={precioMaxInput}
                onChange={(e) => setPrecioMaxInput(e.target.value)}
                style={styles.inputPrecio}
                min="0"
              />
              <button
                type="button"
                onClick={aplicarRangoPrecio}
                style={styles.btnAplicar}
              >
                Aplicar
              </button>
            </div>
          </div>

          <div style={styles.seccionFiltro}>
            <label style={styles.label}>📊 Ordenar por</label>
            <select
              value={filtros.ordenamiento || 'reciente'}
              onChange={handleOrdenamiento}
              style={styles.select}
            >
              <option value="reciente">Más recientes</option>
              <option value="precio-asc">Precio: Menor a mayor</option>
              <option value="precio-desc">Precio: Mayor a menor</option>
              <option value="nombre-asc">Nombre: A-Z</option>
              <option value="nombre-desc">Nombre: Z-A</option>
              <option value="stock-desc">Mayor stock</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  principal: {
    width: '100%'
  },
  filaBusqueda: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  inputWrapper: {
    position: 'relative',
    flex: '1 1 300px',
    minWidth: '200px'
  },
  icono: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1rem',
    pointerEvents: 'none'
  },
  inputBusqueda: {
    width: '100%',
    padding: '0.6rem 0.75rem 0.6rem 2.5rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  select: {
    padding: '0.6rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.95rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '180px'
  },
  btnFiltros: {
    padding: '0.6rem 1rem',
    backgroundColor: '#475569',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  btnLimpiar: {
    padding: '0.6rem 1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  avanzados: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem'
  },
  seccionFiltro: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#334155'
  },
  rangoPrecio: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  inputPrecio: {
    flex: 1,
    padding: '0.5rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.9rem',
    outline: 'none'
  },
  separador: {
    color: '#64748b',
    fontWeight: 'bold'
  },
  btnAplicar: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  }
}

export default BarraFiltros
