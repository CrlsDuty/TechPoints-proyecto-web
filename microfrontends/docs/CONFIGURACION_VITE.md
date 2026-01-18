# Configuración de Vite y Module Federation

## ⚙️ Vite Config para Cada Microfrontend

### Shell App (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell_app',
      filename: 'remoteEntry.js',
      exposes: {
        './eventBus': './src/utils/eventBus.js',
        './supabaseClient': './src/utils/supabaseClient.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        '@supabase/supabase-js': { singleton: true }
      }
    })
  ],
  server: {
    port: 5173,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  preview: {
    port: 4173
  }
})
```

### Micro Historial (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'micro_historial',
      filename: 'remoteEntry.js',
      exposes: {
        './HistorialCompras': './src/components/HistorialCompras.vue',
        './HistorialCanjes': './src/components/HistorialCanjes.vue',
        './EstadisticasPuntos': './src/components/EstadisticasPuntos.vue',
        './historialService': './src/services/historialService.js',
        './historialStore': './src/stores/historialStore.js'
      },
      remotes: {
        shell_app: 'http://localhost:5173/dist/remoteEntry.js',
      },
      shared: {
        vue: { singleton: true, requiredVersion: '^3.3.0' },
        pinia: { singleton: true, requiredVersion: '^2.1.0' },
        '@supabase/supabase-js': { singleton: true }
      }
    })
  ],
  server: {
    port: 5174,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  }
})
```

### Micro Productos (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'micro_productos',
      filename: 'remoteEntry.js',
      exposes: {
        './CatalogoProductos': './src/components/CatalogoProductos.jsx',
        './DetalleProducto': './src/components/DetalleProducto.jsx',
        './FiltrosCategoria': './src/components/FiltrosCategoria.jsx',
        './BuscadorProductos': './src/components/BuscadorProductos.jsx',
        './productosService': './src/services/productosService.js',
        './useProductos': './src/hooks/useProductos.js',
        './useFiltros': './src/hooks/useFiltros.js'
      },
      remotes: {
        shell_app: 'http://localhost:5173/dist/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        '@supabase/supabase-js': { singleton: true }
      }
    })
  ],
  server: {
    port: 5175,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  }
})
```

### Micro Canjes (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'micro_canje',
      filename: 'remoteEntry.js',
      exposes: {
        './CarritoCanjes': './src/components/CarritoCanjes.vue',
        './ConfirmacionCanje': './src/components/ConfirmacionCanje.vue',
        './ResumenPuntos': './src/components/ResumenPuntos.vue',
        './TarjetaCanje': './src/components/TarjetaCanje.vue',
        './canjeService': './src/services/canjeService.js',
        './canjeStore': './src/stores/canjeStore.js'
      },
      remotes: {
        shell_app: 'http://localhost:5173/dist/remoteEntry.js',
      },
      shared: {
        vue: { singleton: true, requiredVersion: '^3.3.0' },
        pinia: { singleton: true, requiredVersion: '^2.1.0' },
        '@supabase/supabase-js': { singleton: true }
      }
    })
  ],
  server: {
    port: 5176,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  }
})
```

---

## 📦 package.json Templates

### shell-app/package.json
```json
{
  "name": "shell-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .jsx",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "@originjs/vite-plugin-federation": "^0.12.0",
    "eslint": "^8.54.0",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2"
  }
}
```

### micro-historial/package.json
```json
{
  "name": "micro-historial",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "test": "vitest"
  },
  "dependencies": {
    "vue": "^3.3.11",
    "pinia": "^2.1.6",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "vite": "^5.0.8",
    "@originjs/vite-plugin-federation": "^0.12.0",
    "eslint": "^8.54.0",
    "vitest": "^1.0.4",
    "@vue/test-utils": "^2.4.1",
    "happy-dom": "^12.10.3"
  }
}
```

### micro-productos/package.json
```json
{
  "name": "micro-productos",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .jsx",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "@originjs/vite-plugin-federation": "^0.12.0",
    "eslint": "^8.54.0",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2"
  }
}
```

### micro-canje/package.json
```json
{
  "name": "micro-canje",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "test": "vitest"
  },
  "dependencies": {
    "vue": "^3.3.11",
    "pinia": "^2.1.6",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "vite": "^5.0.8",
    "@originjs/vite-plugin-federation": "^0.12.0",
    "eslint": "^8.54.0",
    "vitest": "^1.0.4",
    "@vue/test-utils": "^2.4.1",
    "happy-dom": "^12.10.3"
  }
}
```

---

## 🔌 EventBus Centralizado

### shell-app/src/utils/eventBus.js
```javascript
/**
 * EventBus para comunicación entre microfrontends
 * Todos los microfrontends importan esta instancia
 */

class EventBus {
  constructor() {
    this.events = {}
    this.history = [] // Para debugging
  }
  
  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} Función para desuscribirse
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    
    this.events[event].push(callback)
    
    console.debug(`[EventBus] Listener agregado: ${event}`)
    
    // Retornar función para desuscribirse
    return () => {
      this.off(event, callback)
    }
  }
  
  /**
   * Suscribirse a un evento una sola vez
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data)
      unsubscribe()
    })
  }
  
  /**
   * Emitir un evento
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos a pasar
   */
  emit(event, data) {
    console.debug(`[EventBus] Emitido: ${event}`, data)
    
    // Guardar en historial para debugging
    this.history.push({ event, data, timestamp: Date.now() })
    
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error en callback de ${event}:`, error)
        }
      })
    }
  }
  
  /**
   * Desuscribirse de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a remover
   */
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
      console.debug(`[EventBus] Listener removido: ${event}`)
    }
  }
  
  /**
   * Limpiar todos los eventos
   */
  clear() {
    this.events = {}
    console.debug('[EventBus] Eventos limpiados')
  }
  
  /**
   * Obtener historial de eventos (debug)
   */
  getHistory(limit = 50) {
    return this.history.slice(-limit)
  }
}

// Exportar instancia singleton
export default new EventBus()
```

### shell-app/src/utils/supabaseClient.js
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Falta configuración de Supabase en .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
```

---

## 🎯 App.jsx (Shell App)

```javascript
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Login from './auth/Login'
import Dashboard from './components/Dashboard'
import eventBus from './utils/eventBus'
import './App.css'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  
  useEffect(() => {
    // Escuchar cambios de sesión
    eventBus.on('usuario-sesion', (datos) => {
      if (datos.tipo === 'login') {
        setUsuario(datos.usuario)
      } else {
        setUsuario(null)
      }
    })
  }, [])
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Header usuario={usuario} />
          <Navigation />
          
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={usuario ? <Dashboard /> : <Navigate to="/login" />}
              />
              <Route path="/" element={<Navigate to={usuario ? "/dashboard" : "/login"} />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
```

---

## 🎨 Estructura Base de Componentes Vue

### micro-historial/src/App.vue
```vue
<template>
  <div class="historial-app">
    <h1>Historial de Transacciones</h1>
    
    <div class="tabs">
      <button 
        v-for="tab in ['compras', 'canjes']"
        :key="tab"
        @click="activeTab = tab"
        :class="{ active: activeTab === tab }"
      >
        {{ tab === 'compras' ? 'Compras' : 'Canjes' }}
      </button>
    </div>
    
    <div class="tab-content">
      <HistorialCompras v-if="activeTab === 'compras'" />
      <HistorialCanjes v-if="activeTab === 'canjes'" />
      <EstadisticasPuntos />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHistorialStore } from './stores/historialStore'
import HistorialCompras from './components/HistorialCompras.vue'
import HistorialCanjes from './components/HistorialCanjes.vue'
import EstadisticasPuntos from './components/EstadisticasPuntos.vue'
import eventBus from '../../../shell-app/src/utils/eventBus'

const store = useHistorialStore()
const activeTab = ref('compras')

onMounted(async () => {
  // Escuchar evento de canje completado
  eventBus.on('canje-completado', async (datos) => {
    console.log('Canje completado recibido:', datos)
    await store.cargarHistorial(datos.usuario_id)
  })
  
  // Escuchar evento de login
  eventBus.on('usuario-sesion', (datos) => {
    if (datos.tipo === 'login') {
      store.cargarHistorial(datos.usuario.id)
    } else {
      store.limpiar()
    }
  })
})
</script>

<style scoped>
.historial-app {
  padding: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: #f0f0f0;
  cursor: pointer;
  border-radius: 4px;
}

.tabs button.active {
  background: #007bff;
  color: white;
}
</style>
```

---

**Última actualización**: Enero 2026
