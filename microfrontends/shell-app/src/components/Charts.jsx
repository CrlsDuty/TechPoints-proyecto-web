import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler
)

// Gráfico de barras para canjes por categoría
export const CanjesPorCategoriaChart = ({ userId }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data: canjes, error } = await supabase
          .from('redemptions')
          .select(`
            id,
            products (
              categoria
            )
          `)
          .eq('perfil_id', userId)

        if (error) throw error

        // Contar canjes por categoría
        const categorias = {}
        canjes?.forEach(c => {
          const cat = c.products?.categoria
          if (cat) {
            categorias[cat] = (categorias[cat] || 0) + 1
          }
        })

        const resultado = Object.entries(categorias).map(([categoria, cantidad]) => ({
          categoria,
          cantidad
        }))

        setData(resultado)
      } catch (err) {
        console.error('Error cargando canjes por categoría:', err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      cargarDatos()
    }
  }, [userId])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
  }

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
      No hay datos de canjes aún
    </div>
  }

  const chartData = {
    labels: data.map(item => item.categoria),
    datasets: [
      {
        label: 'Canjes',
        data: data.map(item => item.cantidad),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(118, 75, 162, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(102, 126, 234, 1)',
          'rgba(118, 75, 162, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Canjes por Categoría',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

// Gráfico circular para distribución de puntos
export const DistribucionPuntosChart = ({ puntosActuales, puntosGastados, puntosGanados }) => {
  if (!puntosActuales && !puntosGastados && !puntosGanados) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
      No hay datos de puntos
    </div>
  }

  const chartData = {
    labels: ['Puntos Actuales', 'Puntos Gastados', 'Puntos Ganados'],
    datasets: [
      {
        data: [puntosActuales || 0, puntosGastados || 0, puntosGanados || 0],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(102, 126, 234, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(102, 126, 234, 1)'
        ],
        borderWidth: 2
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Distribución de Puntos',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  }

  return (
    <div style={{ height: '300px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

// Gráfico de línea para evolución de canjes
export const EvolucionCanjesChart = ({ userId }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data: canjes, error } = await supabase
          .from('redemptions')
          .select('creado_at')
          .eq('perfil_id', userId)
          .order('creado_at', { ascending: true })

        if (error) throw error

        // Agrupar por mes (últimos 6 meses)
        const ahora = new Date()
        const meses = []
        
        for (let i = 5; i >= 0; i--) {
          const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
          const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
          meses.push({
            mes: mesNombre,
            cantidad: 0,
            fechaInicio: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
            fechaFin: new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59)
          })
        }

        // Contar canjes por mes
        canjes?.forEach(c => {
          const fechaCanje = new Date(c.creado_at)
          const mes = meses.find(m => 
            fechaCanje >= m.fechaInicio && fechaCanje <= m.fechaFin
          )
          if (mes) {
            mes.cantidad++
          }
        })

        setData(meses)
      } catch (err) {
        console.error('Error cargando evolución de canjes:', err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      cargarDatos()
    }
  }, [userId])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
  }

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
      No hay datos disponibles
    </div>
  }

  const chartData = {
    labels: data.map(item => item.mes),
    datasets: [
      {
        label: 'Canjes',
        data: data.map(item => item.cantidad),
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Evolución de Canjes (Últimos 6 meses)',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

export default { CanjesPorCategoriaChart, DistribucionPuntosChart, EvolucionCanjesChart }
