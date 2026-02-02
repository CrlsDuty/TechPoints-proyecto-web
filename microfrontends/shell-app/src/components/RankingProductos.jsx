import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export const RankingProductos = () => {
  const [ranking, setRanking] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarRanking()
  }, [])

  const cargarRanking = async () => {
    try {
      setCargando(true)

      // Obtener todos los canjes con productos
      const { data: canjes, error } = await supabase
        .from('redemptions')
        .select(`
          producto_id,
          products (
            id,
            nombre,
            categoria,
            costo_puntos,
            imagen_url
          )
        `)

      if (error) throw error

      // Contar canjes por producto
      const conteo = {}
      canjes.forEach(canje => {
        const producto = canje.products
        if (producto) {
          if (!conteo[producto.id]) {
            conteo[producto.id] = {
              ...producto,
              canjes: 0
            }
          }
          conteo[producto.id].canjes++
        }
      })

      // Convertir a array y ordenar
      const rankingArray = Object.values(conteo)
        .sort((a, b) => b.canjes - a.canjes)
        .slice(0, 10)

      setRanking(rankingArray)
    } catch (err) {
      console.error('[RankingProductos] Error:', err)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
        <p>Cargando ranking...</p>
      </div>
    )
  }

  if (ranking.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
        <p>No hay datos de canjes aún</p>
      </div>
    )
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '16px', 
      padding: '2rem', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
      border: '1px solid #f0f0f0',
      marginTop: '2rem'
    }}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '1.5rem', 
        fontSize: '1.5rem', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: '800',
        color: '#1e293b'
      }}>🏆 Top 10 Productos Más Canjeados</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {ranking.map((producto, index) => (
          <div 
            key={producto.id} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '12px',
              border: `2px solid ${'#f0f0f0'}`,
              background: index < 3 ? 
                'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 
                'white',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ minWidth: '50px', textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </span>
            </div>

            {producto.imagen_url && (
              <img 
                src={producto.imagen_url} 
                alt={producto.nombre}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: `2px solid ${'#f0f0f0'}`
                }}
              />
            )}

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
                {producto.nombre}
              </h4>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                {producto.categoria || 'Sin categoría'}
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#667eea', fontWeight: '600' }}>
                {producto.costo_puntos?.toLocaleString()} pts
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
              <span style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {producto.canjes}
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                canjes
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RankingProductos
