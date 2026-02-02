import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

const DashboardTienda = () => {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalCanjes: 0,
    puntosCanjeados: 0,
    categoriaPopular: '-',
    productoMasCanjeado: '-',
    canjesUltimos30Dias: 0
  })
  const [topProductos, setTopProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setCargando(true)

      // 1. Total de productos
      const { count: totalProductos, error: errorProductos } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (errorProductos) throw errorProductos

      // 2. Todos los canjes
      const { data: canjes, error: errorCanjes } = await supabase
        .from('redemptions')
        .select(`
          id,
          puntos_usados,
          creado_at,
          products (
            id,
            nombre,
            categoria,
            costo_puntos
          )
        `)

      if (errorCanjes) throw errorCanjes

      const totalCanjes = canjes?.length || 0
      const puntosCanjeados = canjes?.reduce((sum, c) => sum + (c.puntos_usados || 0), 0) || 0

      // 3. Canjes últimos 30 días
      const hace30Dias = new Date()
      hace30Dias.setDate(hace30Dias.getDate() - 30)
      const canjesRecientes = canjes?.filter(c => new Date(c.creado_at) >= hace30Dias).length || 0

      // 4. Categoría más popular
      const categorias = {}
      canjes?.forEach(c => {
        const cat = c.products?.categoria
        if (cat) {
          categorias[cat] = (categorias[cat] || 0) + 1
        }
      })
      const categoriaPopular = Object.entries(categorias).length > 0
        ? Object.entries(categorias).sort((a, b) => b[1] - a[1])[0][0]
        : '-'

      // 5. Producto más canjeado
      const productos = {}
      canjes?.forEach(c => {
        const id = c.products?.id
        const nombre = c.products?.nombre
        if (id && nombre) {
          if (!productos[id]) {
            productos[id] = { nombre, canjes: 0, puntos: c.products?.costo_puntos || 0 }
          }
          productos[id].canjes++
        }
      })

      const productosArray = Object.values(productos)
        .sort((a, b) => b.canjes - a.canjes)

      const productoMasCanjeado = productosArray.length > 0
        ? productosArray[0].nombre
        : '-'

      // Top 5 productos
      setTopProductos(productosArray.slice(0, 5))

      setStats({
        totalProductos: totalProductos || 0,
        totalCanjes,
        puntosCanjeados,
        categoriaPopular,
        productoMasCanjeado,
        canjesUltimos30Dias: canjesRecientes
      })
    } catch (err) {
      console.error('[DashboardTienda] Error cargando estadísticas:', err)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.titulo}>📊 Panel de Estadísticas de la Tienda</h3>
      
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>📦</div>
          <div style={styles.cardContent}>
            <div style={styles.cardValue}>{stats.totalProductos}</div>
            <div style={styles.cardLabel}>Productos en Catálogo</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>🎁</div>
          <div style={styles.cardContent}>
            <div style={styles.cardValue}>{stats.totalCanjes}</div>
            <div style={styles.cardLabel}>Total de Canjes</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>💰</div>
          <div style={styles.cardContent}>
            <div style={styles.cardValue}>{stats.puntosCanjeados.toLocaleString()}</div>
            <div style={styles.cardLabel}>Puntos Canjeados</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>⏱️</div>
          <div style={styles.cardContent}>
            <div style={styles.cardValue}>{stats.canjesUltimos30Dias}</div>
            <div style={styles.cardLabel}>Canjes (últimos 30 días)</div>
          </div>
        </div>

        <div style={styles.cardWide}>
          <div style={styles.cardIcon}>📂</div>
          <div style={styles.cardContent}>
            <div style={styles.cardValue}>{stats.categoriaPopular}</div>
            <div style={styles.cardLabel}>Categoría Más Popular</div>
          </div>
        </div>

        <div style={styles.cardWide}>
          <div style={styles.cardIcon}>🏆</div>
          <div style={styles.cardContent}>
            <div style={{ ...styles.cardValue, fontSize: '0.95rem' }}>
              {stats.productoMasCanjeado}
            </div>
            <div style={styles.cardLabel}>Producto Más Canjeado</div>
          </div>
        </div>
      </div>

      {/* Top 5 Productos */}
      {topProductos.length > 0 && (
        <div style={styles.topProductos}>
          <h4 style={styles.subtitulo}>🔥 Top 5 Productos Más Canjeados</h4>
          <div style={styles.listaProductos}>
            {topProductos.map((producto, index) => (
              <div key={index} style={styles.productoItem}>
                <div style={styles.posicion}>
                  <span style={styles.numeroPos}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </span>
                </div>
                <div style={styles.productoInfo}>
                  <div style={styles.productoNombre}>{producto.nombre}</div>
                  <div style={styles.productoPuntos}>{producto.puntos?.toLocaleString()} pts</div>
                </div>
                <div style={styles.productoCanjes}>
                  <span style={styles.canjesNum}>{producto.canjes}</span>
                  <span style={styles.canjesLabel}>canjes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.resumen}>
        <h4 style={styles.resumenTitulo}>💡 Resumen General</h4>
        <p style={styles.resumenTexto}>
          Tienes <strong>{stats.totalProductos}</strong> productos en tu catálogo.
          Se han realizado <strong>{stats.totalCanjes}</strong> canjes totales, 
          canjeando <strong>{stats.puntosCanjeados.toLocaleString()} puntos</strong> en total.
        </p>
        <p style={styles.resumenTexto}>
          {stats.categoriaPopular !== '-' && (
            <>La categoría más popular es <strong>{stats.categoriaPopular}</strong>. </>
          )}
          En los últimos 30 días se realizaron <strong>{stats.canjesUltimos30Dias}</strong> canjes.
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0'
  },
  titulo: {
    marginTop: 0,
    marginBottom: '2rem',
    fontSize: '1.75rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '800'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem'
  },
  card: {
    background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '2px solid #f0f0f0',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  cardWide: {
    background: 'linear-gradient(135deg, #fff8f0 0%, #ffffff 100%)',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '2px solid #ffeaa7',
    gridColumn: 'span 2',
    boxShadow: '0 2px 8px rgba(255,234,167,0.3)'
  },
  cardIcon: {
    fontSize: '2.5rem',
    lineHeight: 1,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
  },
  cardContent: {
    flex: 1
  },
  cardValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.25rem'
  },
  cardLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  topProductos: {
    marginTop: '2rem',
    marginBottom: '2rem'
  },
  subtitulo: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1rem'
  },
  listaProductos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  productoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)',
    border: '2px solid #f0f0f0',
    transition: 'all 0.2s ease'
  },
  posicion: {
    minWidth: '40px',
    textAlign: 'center'
  },
  numeroPos: {
    fontSize: '1.5rem',
    fontWeight: '800'
  },
  productoInfo: {
    flex: 1
  },
  productoNombre: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.25rem'
  },
  productoPuntos: {
    fontSize: '0.85rem',
    color: '#667eea',
    fontWeight: '600'
  },
  productoCanjes: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '60px'
  },
  canjesNum: {
    fontSize: '1.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  canjesLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  resumen: {
    background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
    borderRadius: '16px',
    padding: '1.75rem',
    border: '2px solid #bae6fd',
    boxShadow: '0 4px 12px rgba(56, 189, 248, 0.15)',
    marginTop: '2rem'
  },
  resumenTitulo: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.15rem',
    color: '#0369a1',
    fontWeight: '700'
  },
  resumenTexto: {
    margin: '0.75rem 0',
    color: '#334155',
    fontSize: '1rem',
    lineHeight: '1.7',
    fontWeight: '500'
  }
}

export default DashboardTienda
