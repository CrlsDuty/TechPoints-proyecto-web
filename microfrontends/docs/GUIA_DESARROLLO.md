# Guía de Desarrollo - Primeros Pasos

## 🚀 Inicio Rápido

### Paso 1: Clonar y Configurar

```bash
# Clonar el repositorio
git clone <repo-url>
cd proyecto-puntos-microfrontends

# Instalar dependencias
npm install

# En cada subcarpeta
cd shell-app && npm install
cd ../micro-historial && npm install
cd ../micro-productos && npm install
cd ../micro-canje && npm install
```

### Paso 2: Configurar Variables de Entorno

Crear `.env.local` en cada carpeta:

```bash
# .env.local (en cada microfrontend)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_PORT=5173  # Para shell-app
```

### Paso 3: Ejecutar en Desarrollo

```bash
# Terminal 1: Shell App (Puerto 5173)
cd shell-app
npm run dev

# Terminal 2: Micro Historial (Puerto 5174)
cd micro-historial
npm run dev

# Terminal 3: Micro Productos (Puerto 5175)
cd micro-productos
npm run dev

# Terminal 4: Micro Canjes (Puerto 5176)
cd micro-canje
npm run dev
```

Acceder a: `http://localhost:5173`

---

## 👨‍💻 Asignación por Integrante

### 🟦 Integrante 1: Micro Historial (Vue)

**Tareas:**
1. Crear estructura base con Vite + Vue
2. Implementar componentes:
   - `HistorialCompras.vue` - Mostrar compras realizadas
   - `HistorialCanjes.vue` - Mostrar canjes realizados
   - `EstadisticasPuntos.vue` - Gráficos y estadísticas
3. Crear servicios:
   - `historialService.js` - Consultas a Supabase
4. Implementar Pinia store:
   - `historialStore.js` - Estado reactivo
5. Escuchar eventos del EventBus:
   - `canje-completado` - Actualizar historial
   - `usuario-sesion` - Cargar historial al login
6. Escribir pruebas unitarias

**Checklist:**
- [ ] Proyecto Vite + Vue creado
- [ ] Componentes principales implementados
- [ ] Servicio de Supabase funcionando
- [ ] Pinia store configurado
- [ ] EventBus integraciones completas
- [ ] Pruebas escritas
- [ ] README.md documentado

**Archivos a crear:**
```
micro-historial/
├── src/
│   ├── components/
│   │   ├── HistorialCompras.vue
│   │   ├── HistorialCanjes.vue
│   │   └── EstadisticasPuntos.vue
│   ├── services/
│   │   └── historialService.js
│   ├── stores/
│   │   └── historialStore.js
│   ├── styles/
│   │   └── styles.css
│   ├── tests/
│   │   ├── HistorialCompras.spec.js
│   │   └── HistorialCanjes.spec.js
│   ├── App.vue
│   └── main.js
├── vite.config.js
├── package.json
└── README.md
```

---

### 🟨 Integrante 2: Micro Productos (React)

**Tareas:**
1. Crear estructura base con Vite + React
2. Implementar componentes:
   - `CatalogoProductos.jsx` - Grid de productos
   - `TarjetaProducto.jsx` - Card individual
   - `DetalleProducto.jsx` - Página de detalle
   - `FiltrosCategoria.jsx` - Sistema de filtros
   - `BuscadorProductos.jsx` - Búsqueda
3. Crear servicios:
   - `productosService.js` - Consultas a Supabase
4. Implementar Context API:
   - `ProductosContext.jsx` - Estado global
5. Crear custom hooks:
   - `useProductos.js` - Lógica de productos
   - `useFiltros.js` - Lógica de filtros
6. Emitir evento EventBus:
   - `add-to-cart` - Cuando usuario agrega producto
7. Escribir pruebas unitarias

**Checklist:**
- [ ] Proyecto Vite + React creado
- [ ] Componentes principales implementados
- [ ] Servicio de Supabase funcionando
- [ ] Context API configurado
- [ ] Custom hooks creados
- [ ] EventBus emit implementado
- [ ] Pruebas escritas
- [ ] README.md documentado

**Archivos a crear:**
```
micro-productos/
├── src/
│   ├── components/
│   │   ├── CatalogoProductos.jsx
│   │   ├── TarjetaProducto.jsx
│   │   ├── DetalleProducto.jsx
│   │   ├── FiltrosCategoria.jsx
│   │   └── BuscadorProductos.jsx
│   ├── context/
│   │   └── ProductosContext.jsx
│   ├── hooks/
│   │   ├── useProductos.js
│   │   └── useFiltros.js
│   ├── services/
│   │   └── productosService.js
│   ├── styles/
│   │   └── Productos.css
│   ├── tests/
│   │   ├── CatalogoProductos.test.jsx
│   │   └── BuscadorProductos.test.jsx
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js
├── package.json
└── README.md
```

---

### 🟩 Integrante 3: Micro Canjes (Vue)

**Tareas:**
1. Crear estructura base con Vite + Vue
2. Implementar componentes:
   - `CarritoCanjes.vue` - Mostrar items del carrito
   - `ResumenPuntos.vue` - Resumen de puntos
   - `ConfirmacionCanje.vue` - Modal de confirmación
   - `TarjetaCanje.vue` - Card de producto en carrito
   - `ValidadorPuntos.vue` - Validación visual
3. Crear servicios:
   - `canjeService.js` - Enviar canjes a Supabase
4. Implementar Pinia stores:
   - `canjeStore.js` - Estado del canje
   - `carritoStore.js` - Estado del carrito
5. Escuchar eventos del EventBus:
   - `add-to-cart` - Agregar producto al carrito
   - `usuario-sesion` - Limpiar carrito si logout
6. Emitir eventos EventBus:
   - `canje-completado` - Notificar completación
   - `puntosActualizados` - Notificar cambio de puntos
7. Escribir pruebas unitarias

**Checklist:**
- [ ] Proyecto Vite + Vue creado
- [ ] Componentes principales implementados
- [ ] Servicio de Supabase funcionando
- [ ] Pinia stores configurados
- [ ] EventBus listeners implementados
- [ ] EventBus emits implementados
- [ ] Validaciones completas
- [ ] Pruebas escritas
- [ ] README.md documentado

**Archivos a crear:**
```
micro-canje/
├── src/
│   ├── components/
│   │   ├── CarritoCanjes.vue
│   │   ├── ResumenPuntos.vue
│   │   ├── ConfirmacionCanje.vue
│   │   ├── TarjetaCanje.vue
│   │   └── ValidadorPuntos.vue
│   ├── services/
│   │   └── canjeService.js
│   ├── stores/
│   │   ├── canjeStore.js
│   │   └── carritoStore.js
│   ├── styles/
│   │   └── styles.css
│   ├── tests/
│   │   ├── TarjetaCanje.spec.js
│   │   └── ConfirmacionCanje.spec.js
│   ├── App.vue
│   └── main.js
├── vite.config.js
├── package.json
└── README.md
```

---

## 🛠️ Shell App (Coordinador)

**Responsabilidad general:**
- Contener a todos los microfrontends
- Manejar autenticación global
- Enrutamiento central
- Contexto de usuario

**Estructura:**
```
shell-app/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Navigation.jsx
│   │   ├── Dashboard.jsx
│   │   └── Footer.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── AuthContext.jsx
│   ├── utils/
│   │   ├── supabaseClient.js
│   │   ├── eventBus.js  ⭐ IMPORTANTE
│   │   └── constants.js
│   ├── styles/
│   │   └── App.css
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js
├── package.json
└── README.md
```

---

## 📦 Dependencias Comunes

### Shell App
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.0.0"
  }
}
```

### Micro Historial
```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "pinia": "^2.1.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### Micro Productos
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

### Micro Canjes
```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "pinia": "^2.1.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 🧪 Testing

### Vue (Micro Historial y Canjes)
```bash
npm install -D vitest @vue/test-utils happy-dom
npm run test
```

### React (Micro Productos)
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm run test
```

---

## 📝 Commits y Ramas

### Estructura de ramas
```
main
├── develop
│   ├── feature/integrante-1-historial
│   ├── feature/integrante-2-productos
│   └── feature/integrante-3-canjes
```

### Commit messages
```
feat(historial): Agregar componente HistorialCompras
fix(productos): Corregir carga de productos
docs(canjes): Documentar validación de puntos
test(historial): Agregar pruebas de HistorialCompras
```

---

## 🚨 Troubleshooting Común

### Error: "EventBus no definido"
```javascript
// ✅ Solución: Asegúrate de importar correctamente
import eventBus from '../../../shell-app/src/utils/eventBus'
```

### Error: "Supabase no autenticado"
```javascript
// ✅ Solución: Revisar que AuthContext esté disponible
// En shell-app/src/App.jsx envuelve con <AuthProvider>
```

### Error: "Puerto en uso"
```bash
# Cambiar puerto en vite.config.js
export default {
  server: {
    port: 5177  // Cambiar a puerto disponible
  }
}
```

---

## 📞 Preguntas Frecuentes

**P: ¿Debo usar TypeScript?**
R: Opcional, pero recomendado para proyectos grandes. Puedes empezar con JS.

**P: ¿Cómo compartir código entre React y Vue?**
R: A través de servicios (no componentes). Ejemplo: `productosService.js`

**P: ¿El EventBus es seguro en producción?**
R: Es suficiente para este proyecto. En producción podrías usar Redux/Pinia + RxJS.

**P: ¿Cuándo debo usar Supabase vs localStorage?**
R: Siempre Supabase. LocalStorage solo para cache temporal.

---

**Última actualización**: Enero 2026
