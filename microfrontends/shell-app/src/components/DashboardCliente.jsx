import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

const DashboardCliente = ({ usuario }) => {
  const [stats, setStats] = useState({
    totalCanjes: 0,
    puntosGastados: 0,
    categoriaFavorita: '-',
    productoMasCanjeado: '-',
    canjesUltimos30Dias: 0,
    puntosGanadosTotal: 0
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (usuario?.id) {
      cargarEstadisticas()
    }
  }, [usuario?.id])

  const cargarEstadisticas = async () => {
    try {
      setCargando(true)

      // 1. Total de canjes y puntos gastados
      const { data: canjes, error: errorCanjes } = await supabase
        .from('redemptions')
        .select(`
          id,
          puntos_usados,
          creado_at,
          products (
            nombre,
            categoria
          )
        `)
        .eq('perfil_id', usuario.id)

      if (errorCanjes) throw errorCanjes

      const totalCanjes = canjes?.length || 0
      const puntosGastados = canjes?.reduce((sum, c) => sum + (c.puntos_usados || 0), 0) || 0

      // 2. Canjes últimos 30 días
      const hace30Dias = new Date()
      hace30Dias.setDate(hace30Dias.getDate() - 30)
      const canjesRecientes = canjes?.filter(c => new Date(c.creado_at) >= hace30Dias).length || 0

      // 3. Categoría favorita (más canjeada)
      const categorias = {}
      canjes?.forEach(c => {
        const cat = c.products?.categoria
        if (cat) {
          categorias[cat] = (categorias[cat] || 0) + 1
        }
      })
      const categoriaFavorita = Object.entries(categorias).length > 0
        ? Object.entries(categorias).sort((a, b) => b[1] - a[1])[0][0]
        : '-'

      // 4. Producto más canjeado
      const productos = {}
      canjes?.forEach(c => {
        const nombre = c.products?.nombre
        if (nombre) {
          productos[nombre] = (productos[nombre] || 0) + 1
        }
      })
      const productoMasCanjeado = Object.entries(productos).length > 0
        ? Object.entries(productos).sort((a, b) => b[1] - a[1])[0][0]
        : '-'

      // 5. Puntos ganados total (transacciones positivas)
      const { data: transacciones, error: errorTrans } = await supabase
        .from('points_transactions')
        .select('cantidad')
        .eq('perfil_id', usuario.id)
        .gt('cantidad', 0)

      if (errorTrans) throw errorTrans

      const puntosGanadosTotal = transacciones?.reduce((sum, t) => sum + (t.cantidad || 0), 0) || 0

      setStats({
        totalCanjes,
        puntosGastados,
        categoriaFavorita,
        productoMasCanjeado,
        canjesUltimos30Dias: canjesRecientes,
        puntosGanadosTotal
      })
    } catch (err) {
      console.error('[DashboardCliente] Error cargando estadísticas:', err)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <div style={styles.loading}>
        <p>Cargando tu dashboard...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.titulo}>📊 Mi Dashboard Personal</h3>
      
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>🎁</div>
          <div style={styles.cardContent}>
            <div style={styles.cardValue}>{stats.totalCanjes}</div>
            <div style={styles.cardLabel}>Canjes Totales</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>💰</div>
          <div style={styles.cardContent}>
            <div style={styles.cardValue}>{stats.puntosGastados.toLocaleString()}</div>
            <div style={styles.cardLabel}>Puntos Gastados</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>⭐</div>
          <div style={styles.cardContent}>
            <div style={styles.cardValue}>{stats.puntosGanadosTotal.toLocaleString()}</div>
            <div style={styles.cardLabel}>Puntos Ganados</div>
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
            <div style={styles.cardValue}>{stats.categoriaFavorita}</div>
            <div style={styles.cardLabel}>Categoría Favorita</div>
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

      <div style={styles.resumen}>
        <h4 style={styles.resumenTitulo}>💡 Resumen de Actividad</h4>
        <p style={styles.resumenTexto}>
          Has realizado <strong>{stats.totalCanjes}</strong> canjes, gastando un total de{' '}
          <strong>{stats.puntosGastados.toLocaleString()} puntos</strong>.
          {stats.categoriaFavorita !== '-' && (
            <> Tu categoría favorita es <strong>{stats.categoriaFavorita}</strong>.</>
          )}
        </p>
        <p style={styles.resumenTexto}>
          Actualmente tienes <strong style={{ color: '#0ea5e9', fontSize: '1.1rem' }}>
            {usuario?.puntos?.toLocaleString() || 0} puntos
          </strong> disponibles para canjear.
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
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
    fontSize: '1.1rem'
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
    cursor: 'default',
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
  resumen: {
    background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
    borderRadius: '16px',
    padding: '1.75rem',
    border: '2px solid #bae6fd',
    boxShadow: '0 4px 12px rgba(56, 189, 248, 0.15)'
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

export default DashboardCliente
