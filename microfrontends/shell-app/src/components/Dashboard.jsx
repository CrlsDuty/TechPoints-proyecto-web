import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import Header from '../components/Header'
import Login from '../auth/Login'
import Registro from '../auth/Registro'
import GestionUsuarios from '../components/GestionUsuarios'
import DashboardTienda from '../components/DashboardTienda'
import DashboardCliente from '../components/DashboardCliente'
import EditarPerfil from '../components/EditarPerfil'
import { supabase } from '../utils/supabase'

const MICRO_PRODUCTOS_URL = import.meta.env.VITE_MICRO_PRODUCTOS_URL || 'http://localhost:5175'
const MICRO_PRODUCTOS_ORIGIN = new URL(MICRO_PRODUCTOS_URL).origin
const MICRO_HISTORIAL_URL = import.meta.env.VITE_MICRO_HISTORIAL_URL || 'http://localhost:5174'
const MICRO_HISTORIAL_ORIGIN = new URL(MICRO_HISTORIAL_URL).origin

export const Dashboard = () => {
  const { usuario, estaAutenticado, loading } = useAuth()
  const [vista, setVista] = useState('inicio') // 'inicio' | 'productos' | 'canje' | 'historial'
  const [mostrarGestionUsuarios, setMostrarGestionUsuarios] = useState(false)
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false)
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const iframeRef = useRef(null)
  const esTienda = usuario?.role === 'tienda'

  const enviarSesionAlIframe = useCallback(async () => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const mensaje = {
          type: 'shell-session',
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          usuario: usuario ? {
            id: usuario.id,
            email: usuario.email,
            puntos: usuario.puntos,
            role: usuario.role,
            nombre: usuario.nombre
          } : null
        }
        
        // Enviar a todos los orígenes posibles
        win.postMessage(mensaje, MICRO_PRODUCTOS_ORIGIN)
        win.postMessage(mensaje, MICRO_HISTORIAL_ORIGIN)
      }
    } catch (e) {
      console.warn('[Shell] Error enviando sesión al iframe:', e)
    }
  }, [usuario])

  // Enviar sesión actualizada cada vez que cambia el usuario
  useEffect(() => {
    if (iframeRef.current && usuario) {
      enviarSesionAlIframe()
    }
  }, [usuario, enviarSesionAlIframe])

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Cargando...</h2>
      </div>
    )
  }

  if (!estaAutenticado) {
    if (mostrarRegistro) {
      return <Registro onVolverLogin={() => setMostrarRegistro(false)} />
    }
    return <Login onIrRegistro={() => setMostrarRegistro(true)} />
  }

  if (vista === 'productos') {
    return (
      <div style={styles.wrapper}>
        <Header usuario={usuario} />
        <main style={styles.main}>
          <div style={styles.container}>
            <div style={styles.iframeHeader}>
              <button
                type="button"
                onClick={() => setVista('inicio')}
                style={styles.btnVolver}
              >
                ← Volver al inicio
              </button>
              <h2 style={styles.iframeTitle}>
                {esTienda ? '📦 Administrar Productos' : '📦 Catálogo de Productos'}
              </h2>
            </div>
            <iframe
              ref={iframeRef}
              title="Catálogo de Productos"
              src={MICRO_PRODUCTOS_URL}
              style={styles.iframe}
              onLoad={enviarSesionAlIframe}
            />
          </div>
        </main>
      </div>
    )
  }

  if (vista === 'historial') {
    return (
      <div style={styles.wrapper}>
        <Header usuario={usuario} />
        <main style={styles.main}>
          <div style={styles.container}>
            <div style={styles.iframeHeader}>
              <button
                type="button"
                onClick={() => setVista('inicio')}
                style={styles.btnVolver}
              >
                ← Volver al inicio
              </button>
              <h2 style={styles.iframeTitle}>📊 Historial de Canjes</h2>
            </div>
            <iframe
              ref={iframeRef}
              title="Historial de Canjes"
              src={MICRO_HISTORIAL_URL}
              style={styles.iframe}
              onLoad={enviarSesionAlIframe}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <Header usuario={usuario} />
      <main style={styles.main}>
        <div style={styles.container}>
          <h1>¡Bienvenido a TechPoints!</h1>
          <p style={styles.subtitle}>
            {esTienda ? 'Panel de administración de tienda' : 'Sistema de puntos y canjes para tecnología'}
          </p>
          
          {usuario && (
            <div style={styles.userCard}>
              <div style={styles.userCardHeader}>
                <h3 style={{ margin: 0 }}>👤 Mi Perfil</h3>
                <button
                  type="button"
                  onClick={() => setMostrarEditarPerfil(true)}
                  style={styles.btnEditarPerfil}
                >
                  ✏️ Editar
                </button>
              </div>
              <p><strong>Email:</strong> {usuario.email}</p>
              <p><strong>Nombre:</strong> {usuario.nombre}</p>
              {usuario.metadata?.telefono && (
                <p><strong>📱 Teléfono:</strong> {usuario.metadata.telefono}</p>
              )}
              {esTienda ? (
                <p><strong>Rol:</strong> Tienda / Administrador</p>
              ) : (
                <p><strong>⭐ Puntos:</strong> {usuario.puntos}</p>
              )}
            </div>
          )}
          
          {esTienda && <DashboardTienda />}
          {!esTienda && <DashboardCliente usuario={usuario} />}
          
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>{esTienda ? '📦 Mis Productos' : '📦 Productos'}</h3>
              <p>{esTienda ? 'Administra tu inventario de productos' : 'Explora nuestro catálogo de tecnología'}</p>
              <button
                type="button"
                style={styles.cardButton}
                onClick={() => setVista('productos')}
              >
                {esTienda ? 'Administrar Productos' : 'Ver Catálogo'}
              </button>
            </div>
            {esTienda && (
              <div style={styles.card}>
                <h3>👥 Gestión de Usuarios</h3>
                <p>Administra usuarios y sus puntos</p>
                <button
                  type="button"
                  style={styles.cardButton}
                  onClick={() => setMostrarGestionUsuarios(true)}
                >
                  Gestionar Usuarios
                </button>
              </div>
            )}
            {!esTienda && (
              <div style={styles.card}>
                <h3>📊 Historial</h3>
                <p>Ve tus canjes realizados</p>
                <button 
                  type="button"
                  style={styles.cardButton}
                  onClick={() => setVista('historial')}
                >
                  Ver Historial
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {mostrarGestionUsuarios && (
        <GestionUsuarios onCerrar={() => setMostrarGestionUsuarios(false)} />
      )}

      {mostrarEditarPerfil && (
        <EditarPerfil 
          usuario={usuario} 
          onCerrar={() => setMostrarEditarPerfil(false)}
          onActualizar={(usuarioActualizado) => {
            // Actualizar usuario en el contexto si es necesario
            console.log('[Dashboard] Perfil actualizado:', usuarioActualizado)
            // El AuthContext debería recargar automáticamente
          }}
        />
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.5rem'
  },
  main: {
    padding: '2rem 1rem',
    minHeight: 'calc(100vh - 80px)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '2rem'
  },
  userCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  userCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  btnEditarPerfil: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  cardButton: {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  iframeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap'
  },
  btnVolver: {
    padding: '0.5rem 1rem',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  iframeTitle: {
    margin: 0,
    fontSize: '1.25rem'
  },
  iframe: {
    width: '100%',
    minHeight: 'calc(100vh - 200px)',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
  }
}

export default Dashboard
