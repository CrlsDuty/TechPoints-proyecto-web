# Proyecto Puntos - Arquitectura de Microfrontends

## 📋 Descripción General

Este proyecto migra una aplicación de gestión de puntos de JavaScript Vanilla a una **Arquitectura de Microfrontends** utilizando:
- **Shell App**: React + Vite (Contenedor principal)
- **Micro Historial**: Vue + Vite (Integrante 1)
- **Micro Productos**: React + Vite (Integrante 2)
- **Micro Canjes**: Vue + Vite (Integrante 3)

La comunicación entre microfrontends se realiza a través de:
- **Event Bus**: Para eventos entre componentes
- **Module Federation**: Para compartir código/componentes
- **Supabase**: Base de datos centralizada

---

## 📁 Estructura del Proyecto

```
/proyecto-puntos-microfrontends
│
├── /shell-app (React - Shell Contenedor)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Footer.jsx
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   ├── supabaseClient.js
│   │   │   ├── eventBus.js
│   │   │   └── constants.js
│   │   ├── styles/
│   │   │   └── App.css
│   │   └── main.jsx
│   ├── vite.config.js (con Module Federation)
│   ├── package.json
│   └── README.md
│
├── /micro-historial (Vue - Historial de Compras/Canjes)
│   ├── src/
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── HistorialCompras.vue
│   │   │   ├── HistorialCanjes.vue
│   │   │   └── EstadisticasPuntos.vue
│   │   ├── services/
│   │   │   └── historialService.js
│   │   ├── stores/
│   │   │   └── historialStore.js (Pinia)
│   │   ├── styles/
│   │   │   └── styles.css
│   │   ├── tests/
│   │   │   ├── HistorialCompras.spec.js
│   │   │   └── HistorialCanjes.spec.js
│   │   └── main.js
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
│
├── /micro-productos (React - Catálogo de Productos)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── CatalogoProductos.jsx
│   │   │   ├── DetalleProducto.jsx
│   │   │   ├── FiltrosCategoria.jsx
│   │   │   ├── BuscadorProductos.jsx
│   │   │   └── TarjetaProducto.jsx
│   │   ├── services/
│   │   │   └── productosService.js
│   │   ├── hooks/
│   │   │   ├── useProductos.js
│   │   │   └── useFiltros.js
│   │   ├── context/
│   │   │   └── ProductosContext.jsx
│   │   ├── styles/
│   │   │   └── Productos.css
│   │   ├── tests/
│   │   │   ├── CatalogoProductos.test.jsx
│   │   │   └── BuscadorProductos.test.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
│
├── /micro-canje (Vue - Sistema de Canjes)
│   ├── src/
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── TarjetaCanje.vue
│   │   │   ├── ConfirmacionCanje.vue
│   │   │   ├── ResumenPuntos.vue
│   │   │   ├── CarritoCanjes.vue
│   │   │   └── ValidadorPuntos.vue
│   │   ├── services/
│   │   │   └── canjeService.js
│   │   ├── stores/
│   │   │   ├── canjeStore.js (Pinia)
│   │   │   └── carritoStore.js
│   │   ├── styles/
│   │   │   └── styles.css
│   │   ├── tests/
│   │   │   ├── TarjetaCanje.spec.js
│   │   │   └── ConfirmacionCanje.spec.js
│   │   └── main.js
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
│
├── /docs
│   ├── MAPEO_FUNCIONALIDADES.md
│   ├── ESTRUCTURA_DATOS.md
│   ├── CONFIGURACION_SUPABASE.md
│   ├── COMUNICACION_MICROFRONTENDS.md
│   ├── GUIA_DESARROLLO.md
│   └── DEPLOYMENT.md
│
├── docker-compose.yml (opcional, para desarrollo local)
└── README.md (este archivo)
```

---

## 🎯 Responsabilidades por Integrante

### 🟦 Integrante 1: Micro Historial (Vue)
**Responsable de:**
- Mostrar historial de compras realizadas
- Mostrar historial de canjes realizados
- Estadísticas y gráficos de puntos
- Exportar/descargar reportes

**Funciones a migrar:**
- `mostrarHistorial()` → HistorialCompras.vue
- `cargarHistorialDesdeSupabase()` → historialService.js
- `calcularEstadisticas()` → EstadisticasPuntos.vue
- `filtrarPorFecha()` → HistorialCompras.vue

---

### 🟨 Integrante 2: Micro Productos (React)
**Responsable de:**
- Catálogo de productos
- Búsqueda y filtros
- Detalle del producto
- Carrito de compras

**Funciones a migrar:**
- `cargarTiendasYProductos()` → CatalogoProductos.jsx
- `filtrarPorCategoria()` → FiltrosCategoria.jsx
- `buscarProductos()` → BuscadorProductos.jsx
- `agregarAlCarrito()` → CatalogoProductos.jsx
- `mostrarDetalle()` → DetalleProducto.jsx
- `aplicarFiltros()` → FiltrosCategoria.jsx

---

### 🟩 Integrante 3: Micro Canjes (Vue)
**Responsable de:**
- Procesar canjes de puntos
- Validar puntos disponibles
- Carrito de canjes
- Confirmación de transacción

**Funciones a migrar:**
- `validarPuntos()` → ResumenPuntos.vue
- `procesarCanje()` → ConfirmacionCanje.vue
- `confirmarCompra()` → ConfirmacionCanje.vue
- `actualizarCarritoUI()` → CarritoCanjes.vue
- `realizarCompra()` → ConfirmacionCanje.vue

---

## 🔄 Flujo de Datos

```
Shell App (React)
├── Autenticación (Login/Register)
├── Enrutamiento Central
└── Container para Microfrontends
    │
    ├─→ Micro Productos (React)
    │   └─→ Carrito de Compras
    │        │
    │        └─→ Envía evento "add-to-cart" al EventBus
    │            │
    │            ↓
    ├─→ Micro Canjes (Vue)
    │   ├─→ Recibe evento "add-to-cart"
    │   ├─→ Valida puntos disponibles
    │   └─→ Procesa el canje
    │        │
    │        └─→ Envía evento "canje-completado" al EventBus
    │            │
    │            ↓
    └─→ Micro Historial (Vue)
        └─→ Recibe evento "canje-completado"
            └─→ Actualiza historial en tiempo real
```

---

## 📡 Comunicación entre Microfrontends

### Event Bus (EventEmitter)
Todos los microfrontends se comunican a través de un EventBus centralizado:

```javascript
// shell-app/src/utils/eventBus.js
class EventBus {
  on(event, callback) { }
  emit(event, data) { }
  off(event, callback) { }
}

// Eventos disponibles:
- "add-to-cart": Producto agregado al carrito
- "canje-completado": Canje procesado exitosamente
- "puntosActualizados": Puntos del usuario cambiaron
- "historialActualizado": Historial necesita actualizarse
- "usuario-sesion": Cambios en sesión del usuario
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Bundler** | Vite | ^4.0.0 |
| **Shell App** | React | ^18.0.0 |
| **Micro Historial** | Vue | ^3.0.0 |
| **Micro Productos** | React | ^18.0.0 |
| **Micro Canjes** | Vue | ^3.0.0 |
| **State Management** | Pinia (Vue) / Context (React) | - |
| **HTTP Client** | Axios | ^1.0.0 |
| **Backend** | Supabase | API REST |
| **Testing** | Vitest + Testing Library | ^1.0.0 |
| **Module Federation** | @originjs/vite-plugin-federation | ^0.12.0 |

---

## 🚀 Instalación y Configuración

### Prerequisitos
- Node.js v16+
- npm o yarn
- Cuenta Supabase configurada

### Pasos de Instalación

1. **Clonar/crear el repositorio**
   ```bash
   git clone <repo-url>
   cd proyecto-puntos-microfrontends
   ```

2. **Instalar dependencias de Shell App**
   ```bash
   cd shell-app
   npm install
   ```

3. **Instalar dependencias de Micro Historial**
   ```bash
   cd ../micro-historial
   npm install
   ```

4. **Instalar dependencias de Micro Productos**
   ```bash
   cd ../micro-productos
   npm install
   ```

5. **Instalar dependencias de Micro Canjes**
   ```bash
   cd ../micro-canje
   npm install
   ```

### Variables de Entorno

Crear archivo `.env.local` en cada carpeta:

```bash
# Shell App
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Micro Historial
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# (Repetir para otros microfrontends)
```

---

## 📝 Desarrollo Local

### Ejecutar todos los servicios (simultáneamente en diferentes terminales)

```bash
# Terminal 1: Shell App
cd shell-app
npm run dev

# Terminal 2: Micro Historial
cd micro-historial
npm run dev

# Terminal 3: Micro Productos
cd micro-productos
npm run dev

# Terminal 4: Micro Canjes
cd micro-canje
npm run dev
```

El Shell App estará disponible en `http://localhost:5173`

---

## 📚 Documentación Adicional

- [MAPEO_FUNCIONALIDADES.md](docs/MAPEO_FUNCIONALIDADES.md) - Mapeo detallado de funciones
- [ESTRUCTURA_DATOS.md](docs/ESTRUCTURA_DATOS.md) - Esquema de datos
- [COMUNICACION_MICROFRONTENDS.md](docs/COMUNICACION_MICROFRONTENDS.md) - Patrones de comunicación
- [GUIA_DESARROLLO.md](docs/GUIA_DESARROLLO.md) - Guía paso a paso
- [CONFIGURACION_SUPABASE.md](docs/CONFIGURACION_SUPABASE.md) - Setup de Supabase

---

## ✅ Checklist de Desarrollo

### Fase 1: Setup Inicial (Semana 1)
- [ ] Crear estructura base en Vite
- [ ] Configurar Module Federation
- [ ] Setup Supabase en cada app
- [ ] Crear EventBus centralizado
- [ ] Autenticación en Shell App

### Fase 2: Microfrontend Historial (Integrante 1)
- [ ] Crear componentes Vue
- [ ] Migrar lógica de historial
- [ ] Implementar Pinia store
- [ ] Pruebas unitarias
- [ ] Integración con EventBus

### Fase 3: Microfrontend Productos (Integrante 2)
- [ ] Crear componentes React
- [ ] Migrar lógica de productos
- [ ] Implementar Context API
- [ ] Carrito de compras
- [ ] Pruebas unitarias
- [ ] Integración con EventBus

### Fase 4: Microfrontend Canjes (Integrante 3)
- [ ] Crear componentes Vue
- [ ] Migrar lógica de canjes
- [ ] Implementar Pinia store
- [ ] Validación de puntos
- [ ] Confirmación de transacción
- [ ] Pruebas unitarias
- [ ] Integración con EventBus

### Fase 5: Integración Total
- [ ] Comunicación entre microfrontends
- [ ] Pruebas end-to-end
- [ ] Optimización de rendimiento
- [ ] Deployment

---

## 🤝 Contribución

Cada integrante debe:
1. Trabajar en su rama: `feature/integrante-1-historial`
2. Hacer commits descriptivos
3. Crear Pull Requests con descripción detallada
4. Revisar código de compañeros

---

## 📞 Soporte

Para dudas o problemas:
1. Revisar [GUIA_DESARROLLO.md](docs/GUIA_DESARROLLO.md)
2. Consultar [COMUNICACION_MICROFRONTENDS.md](docs/COMUNICACION_MICROFRONTENDS.md)
3. Abrir issue en el repositorio

---

**Última actualización**: Enero 2026
