import React, { useState, useEffect } from 'react'
import { TASA_CONVERSION } from '../services/productosService'
import { CATEGORIAS } from '../constants/categorias'

const FormProducto = ({ productoEditar = null, onSubmit, onCancel, guardando }) => {
  const [nombre, setNombre] = useState('')
  const [precioDolar, setPrecioDolar] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [stock, setStock] = useState(0)
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState('')

  const costoPuntos = Math.round((parseFloat(precioDolar) || 0) * TASA_CONVERSION)

  useEffect(() => {
    if (productoEditar) {
      setNombre(productoEditar.nombre || '')
      setPrecioDolar(productoEditar.precio_dolar ?? productoEditar.precioDolar ?? '')
      setCategoria(productoEditar.categoria || '')
      setDescripcion(productoEditar.descripcion || '')
      setStock(productoEditar.stock ?? 0)
      setImagenPreview(productoEditar.imagen_url || productoEditar.imagen || '')
    }
  }, [productoEditar])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImagenFile(null)
      setImagenPreview('')
      return
    }
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    setImagenFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagenPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      nombre: nombre.trim(),
      precio_dolar: parseFloat(precioDolar) || null,
      costo_puntos: costoPuntos,
      categoria: categoria.trim() || null,
      descripcion: descripcion.trim() || null,
      stock: parseInt(stock, 10) || 0,
      imagenFile: imagenFile || null,
      imagen_url: productoEditar?.imagen_url || productoEditar?.imagen || null
    }
    if (!payload.nombre) return
    if (costoPuntos <= 0) return
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.row}>
        <label style={styles.label}>Nombre *</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={styles.input}
        />
      </div>
      <div style={styles.row}>
        <label style={styles.label}>Precio (USD) *</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={precioDolar}
          onChange={(e) => setPrecioDolar(e.target.value)}
          required
          style={styles.input}
        />
      </div>
      <div style={styles.row}>
        <label style={styles.label}>Costo en puntos (calculado)</label>
        <div style={styles.costoPreview}>{costoPuntos.toLocaleString()} puntos</div>
      </div>
      <div style={styles.row}>
        <label style={styles.label}>Stock</label>
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.row}>
        <label style={styles.label}>Categoría</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          style={styles.input}
        >
          <option value="">-- Selecciona una categoría --</option>
          {CATEGORIAS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.values.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div style={styles.row}>
        <label style={styles.label}>Imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={styles.input}
        />
        {imagenPreview && (
          <div style={styles.previewWrap}>
            <img src={imagenPreview} alt="Preview" style={styles.previewImg} />
            <button type="button" onClick={() => { setImagenFile(null); setImagenPreview('') }} style={styles.btnLimpiar}>
              Limpiar imagen
            </button>
          </div>
        )}
      </div>
      <div style={styles.row}>
        <label style={styles.label}>Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="Describe brevemente el producto..."
          style={styles.input}
        />
      </div>
      <div style={styles.actions}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={styles.btnCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={guardando} style={styles.btnSubmit}>
          {guardando ? 'Guardando...' : productoEditar ? 'Guardar cambios' : 'Agregar producto'}
        </button>
      </div>
    </form>
  )
}

const styles = {
  form: { maxWidth: '480px' },
  row: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d0d0d0', fontSize: '0.95rem' },
  costoPreview: { padding: '0.5rem', background: '#f0f0f0', borderRadius: '6px', fontWeight: 'bold', color: '#333' },
  previewWrap: { marginTop: '0.5rem' },
  previewImg: { maxWidth: '180px', maxHeight: '120px', borderRadius: '6px', display: 'block' },
  btnLimpiar: { marginTop: '0.25rem', padding: '0.25rem 0.5rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' },
  btnCancel: { padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnSubmit: { padding: '0.5rem 1rem', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }
}

export default FormProducto
