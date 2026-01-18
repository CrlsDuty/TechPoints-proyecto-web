# Plan de Migración - Roadmap Completo

## 📅 Timeline y Fases de Desarrollo

```
SEMANA 1
├── Fase 1: Setup Inicial
│   ├── Crear estructura de repos
│   ├── Configurar Vite + frameworks
│   ├── Setup Supabase
│   └── EventBus centralizado
└── Deadline: Viernes

SEMANA 2-3
├── Fase 2: Desarrollo Paralelo
│   ├── Integrante 1: Micro Historial (Vue)
│   ├── Integrante 2: Micro Productos (React)
│   └── Integrante 3: Micro Canjes (Vue)
└── Deadlines: Daily stand-ups

SEMANA 4
├── Fase 3: Integración
│   ├── Conectar EventBus
│   ├── Probar flujos completos
│   ├── Debugging y fixes
│   └── Pruebas unitarias
└── Deadline: Viernes

SEMANA 5
├── Fase 4: Optimización y Deploy
│   ├── Performance tuning
│   ├── Build y testing en staging
│   ├── Documentación final
│   └── Demo a profesores
└── Deadline: Entrega Final
```

---

## 🎯 Fase 1: Setup Inicial (Semana 1)

### Tarea 1.1: Crear Estructura Base

**Responsable:** Coordinador / Todos

**Checklist:**
- [ ] Crear carpeta `/proyecto-puntos-microfrontends`
- [ ] Crear subcarpetas: `shell-app`, `micro-historial`, `micro-productos`, `micro-canje`, `docs`
- [ ] Inicializar git con `.gitignore`
- [ ] Crear `README.md` principal (ya hecho ✅)

**Archivos:**
```bash
mkdir -p proyecto-puntos-microfrontends/{shell-app,micro-historial,micro-productos,micro-canje,docs}
cd proyecto-puntos-microfrontends
git init
```

---

### Tarea 1.2: Configurar Shell App (React + Vite)

**Responsable:** Integrante 1 o 2

**Checklist:**
- [ ] `npm create vite shell-app -- --template react`
- [ ] Instalar dependencias: `npm install react-router-dom axios @supabase/supabase-js`
- [ ] Crear `src/utils/eventBus.js` (código proporcionado)
- [ ] Crear `src/utils/supabaseClient.js`
- [ ] Crear `.env.local` con credenciales Supabase
- [ ] Crear `src/auth/AuthContext.jsx`
- [ ] Crear componentes básicos: `Header.jsx`, `Navigation.jsx`
- [ ] `npm run dev` debe funcionar en puerto 5173

**Archivos a crear:**
```
shell-app/
├── src/
│   ├── utils/
│   │   ├── eventBus.js ⭐
│   │   ├── supabaseClient.js ⭐
│   │   └── constants.js
│   ├── auth/
│   │   └── AuthContext.jsx ⭐
│   ├── components/
│   │   ├── Header.jsx ⭐
│   │   ├── Navigation.jsx ⭐
│   │   └── Footer.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── App.css
├── .env.local ⭐
├── vite.config.js ⭐
└── package.json
```

**Verificación:**
```bash
cd shell-app
npm run dev
# Debe mostrar: http://localhost:5173
```

---

### Tarea 1.3: Configurar Micro Historial (Vue + Vite)

**Responsable:** Integrante 1

**Checklist:**
- [ ] `npm create vite micro-historial -- --template vue`
- [ ] Instalar dependencias: `npm install pinia axios @supabase/supabase-js`
- [ ] Crear `.env.local` con credenciales Supabase
- [ ] Crear `src/stores/historialStore.js` (estructura Pinia)
- [ ] Crear `src/services/historialService.js` (estructura básica)
- [ ] Crear componentes stubs: `HistorialCompras.vue`, `HistorialCanjes.vue`, `EstadisticasPuntos.vue`
- [ ] Crear `src/App.vue`
- [ ] `npm run dev` debe funcionar en puerto 5174

**Archivos a crear:**
```
micro-historial/
├── src/
│   ├── stores/
│   │   └── historialStore.js ⭐
│   ├── services/
│   │   └── historialService.js ⭐
│   ├── components/
│   │   ├── HistorialCompras.vue ⭐
│   │   ├── HistorialCanjes.vue ⭐
│   │   └── EstadisticasPuntos.vue ⭐
│   ├── App.vue
│   ├── main.js
│   └── styles.css
├── .env.local ⭐
├── vite.config.js ⭐
└── package.json
```

---

### Tarea 1.4: Configurar Micro Productos (React + Vite)

**Responsable:** Integrante 2

**Checklist:**
- [ ] `npm create vite micro-productos -- --template react`
- [ ] Instalar dependencias: `npm install axios @supabase/supabase-js`
- [ ] Crear `.env.local` con credenciales Supabase
- [ ] Crear `src/services/productosService.js` (estructura básica)
- [ ] Crear `src/hooks/useProductos.js` (estructura básica)
- [ ] Crear `src/hooks/useFiltros.js` (estructura básica)
- [ ] Crear componentes stubs: `CatalogoProductos.jsx`, `TarjetaProducto.jsx`, `FiltrosCategoria.jsx`, `BuscadorProductos.jsx`
- [ ] Crear `src/App.jsx`
- [ ] `npm run dev` debe funcionar en puerto 5175

**Archivos a crear:**
```
micro-productos/
├── src/
│   ├── services/
│   │   └── productosService.js ⭐
│   ├── hooks/
│   │   ├── useProductos.js ⭐
│   │   └── useFiltros.js ⭐
│   ├── components/
│   │   ├── CatalogoProductos.jsx ⭐
│   │   ├── TarjetaProducto.jsx ⭐
│   │   ├── FiltrosCategoria.jsx ⭐
│   │   ├── DetalleProducto.jsx ⭐
│   │   └── BuscadorProductos.jsx ⭐
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── .env.local ⭐
├── vite.config.js ⭐
└── package.json
```

---

### Tarea 1.5: Configurar Micro Canjes (Vue + Vite)

**Responsable:** Integrante 3

**Checklist:**
- [ ] `npm create vite micro-canje -- --template vue`
- [ ] Instalar dependencias: `npm install pinia axios @supabase/supabase-js`
- [ ] Crear `.env.local` con credenciales Supabase
- [ ] Crear `src/stores/canjeStore.js` (estructura Pinia)
- [ ] Crear `src/stores/carritoStore.js` (estructura Pinia)
- [ ] Crear `src/services/canjeService.js` (estructura básica)
- [ ] Crear componentes stubs: `CarritoCanjes.vue`, `ConfirmacionCanje.vue`, `ResumenPuntos.vue`
- [ ] Crear `src/App.vue`
- [ ] `npm run dev` debe funcionar en puerto 5176

**Archivos a crear:**
```
micro-canje/
├── src/
│   ├── stores/
│   │   ├── canjeStore.js ⭐
│   │   └── carritoStore.js ⭐
│   ├── services/
│   │   └── canjeService.js ⭐
│   ├── components/
│   │   ├── CarritoCanjes.vue ⭐
│   │   ├── ConfirmacionCanje.vue ⭐
│   │   ├── ResumenPuntos.vue ⭐
│   │   ├── TarjetaCanje.vue ⭐
│   │   └── ValidadorPuntos.vue ⭐
│   ├── App.vue
│   ├── main.js
│   └── styles.css
├── .env.local ⭐
├── vite.config.js ⭐
└── package.json
```

---

### Tarea 1.6: Documentación Inicial

**Responsable:** Coordinador (ya hecho ✅)

**Checklist:**
- [x] README.md principal
- [x] MAPEO_FUNCIONALIDADES.md
- [x] COMUNICACION_MICROFRONTENDS.md
- [x] ESTRUCTURA_DATOS.md
- [x] GUIA_DESARROLLO.md
- [x] CONFIGURACION_VITE.md
- [ ] Agregar diagrama visual en README (opcional)

---

## 🚀 Fase 2: Desarrollo Paralelo (Semanas 2-3)

### Integrante 1: Micro Historial (Vue)

**Semana 2:**

#### Tarea 2.1a: Implementar historialService.js
```javascript
// Funciones a implementar:
- obtenerHistorial(usuarioId)
- obtenerCompras(usuarioId)
- obtenerCanjes(usuarioId)
- cargarDatos()
```

**Checklist:**
- [ ] Conectar a Supabase.from('redemptions').select()
- [ ] Agregar filtros: estado, fecha, producto
- [ ] Hacer pruebas en Supabase
- [ ] Validar que retorna datos correctos

---

#### Tarea 2.1b: Implementar historialStore.js (Pinia)
```javascript
// Estado:
- historial: []
- cargando: false
- error: null

// Acciones:
- cargarHistorial(usuarioId)
- agregarAlHistorial(item)
- limpiar()
```

**Checklist:**
- [ ] Store reactivo funcionando
- [ ] Acciones completadas
- [ ] Pruebas unitarias (spec.js)

---

#### Tarea 2.1c: Implementar HistorialCompras.vue
```vue
- Mostrar lista de compras
- Filtros: fecha, producto
- Tabla responsive
- Eventos para eliminación (opcional)
```

**Checklist:**
- [ ] Componente renderiza datos
- [ ] Filtros funcionan
- [ ] Responsive design

---

**Semana 3:**

#### Tarea 2.1d: Implementar HistorialCanjes.vue
```vue
- Mostrar lista de canjes
- Estado de canje (completado/pendiente)
- Estadísticas básicas
```

#### Tarea 2.1e: Implementar EstadisticasPuntos.vue
```vue
- Total puntos gastados
- Promedio por transacción
- Gráfico simple (Chart.js o similar)
```

#### Tarea 2.1f: Integración con EventBus
```javascript
- Escuchar 'canje-completado'
- Escuchar 'usuario-sesion'
- Actualizar lista en tiempo real
```

**Checklist:**
- [ ] Listeners agregados
- [ ] Actualización en tiempo real
- [ ] Pruebas end-to-end

---

### Integrante 2: Micro Productos (React)

**Semana 2:**

#### Tarea 2.2a: Implementar productosService.js
```javascript
// Funciones:
- obtenerProductos()
- obtenerProductosPorTienda(tiendaId)
- buscarProductos(termino)
- obtenerProductoDetalle(id)
```

**Checklist:**
- [ ] Conectar a Supabase
- [ ] Mapear datos correctamente
- [ ] Validar retorno de datos

---

#### Tarea 2.2b: Implementar hooks (useProductos, useFiltros)
```javascript
// useProductos:
- cargar productos
- estado loading
- manejo de errores

// useFiltros:
- aplicar filtros localmente
- actualizar UI
```

**Checklist:**
- [ ] Hooks reutilizables
- [ ] Funcionan correctamente
- [ ] Pruebas unitarias

---

#### Tarea 2.2c: Implementar CatalogoProductos.jsx
```jsx
- Mostrar grid de productos
- Cargar datos en useEffect
- Loading state
- Error handling
```

**Checklist:**
- [ ] Datos cargan correctamente
- [ ] Grid responsivo
- [ ] Loading y error states

---

**Semana 3:**

#### Tarea 2.2d: Implementar FiltrosCategoria.jsx
```jsx
- Dropdown de categorías
- Filtro por tienda
- Filtro por precio máximo
- Aplicar filtros al grid
```

#### Tarea 2.2e: Implementar BuscadorProductos.jsx
```jsx
- Input de búsqueda
- Búsqueda en tiempo real
- Resultados dinámicos
```

#### Tarea 2.2f: Implementar DetalleProducto.jsx
```jsx
- Página detalle (puede ser modal)
- Especificaciones completas
- Botón "Agregar al carrito"
```

#### Tarea 2.2g: Emitir eventos EventBus
```javascript
- eventBus.emit('add-to-cart', {...})
- En función agregarAlCarrito()
```

**Checklist:**
- [ ] Evento emitido correctamente
- [ ] Micro Canjes lo recibe

---

### Integrante 3: Micro Canjes (Vue)

**Semana 2:**

#### Tarea 2.3a: Implementar canjeService.js
```javascript
// Funciones:
- procesarCanjeEnSupabase(datos)
- validarPuntosDisponibles(usuarioId, puntos)
- crearRedemption(redemption)
- actualizarPuntosUsuario(usuarioId, nuevosSaldo)
```

**Checklist:**
- [ ] Conectar a Supabase
- [ ] Validaciones completas
- [ ] Manejo de errores

---

#### Tarea 2.3b: Implementar stores (canjeStore, carritoStore)
```javascript
// canjeStore:
- carrito: []
- totalPuntos: computed
- agregarAlCarrito()
- quitarDelCarrito()
- limpiarCarrito()

// carritoStore:
- items: []
- cantidad: computed
- actualizarCantidad()
```

**Checklist:**
- [ ] Stores reactivos
- [ ] Computed properties funcionan
- [ ] Acciones completas

---

#### Tarea 2.3c: Implementar CarritoCanjes.vue
```vue
- Mostrar items del carrito
- Botones +/- para cantidad
- Botón eliminar
- Total de puntos
- Botón "Proceder a Canje"
```

**Checklist:**
- [ ] UI completa
- [ ] Acciones funcionan
- [ ] Cálculos correctos

---

**Semana 3:**

#### Tarea 2.3d: Implementar ResumenPuntos.vue
```vue
- Puntos disponibles del usuario
- Puntos a usar
- Indicador visual (verde/rojo)
- Mensaje si no hay puntos
```

#### Tarea 2.3e: Implementar ConfirmacionCanje.vue
```vue
- Modal de confirmación
- Resumen de items
- Botones: Confirmar / Cancelar
- Loading state durante procesamiento
- Mensaje de éxito/error
```

#### Tarea 2.3f: Integración con EventBus
```javascript
- Escuchar 'add-to-cart'
- Emitir 'canje-completado'
- Emitir 'puntosActualizados'
```

**Checklist:**
- [ ] Escucha add-to-cart
- [ ] Emite eventos correctos
- [ ] Validaciones funcionan

---

## ✅ Fase 3: Integración (Semana 4)

### Tarea 3.1: Conectar EventBus

**Checklist:**
- [ ] Shell App comparte eventBus
- [ ] Todos los microfrontends lo importan
- [ ] Eventos se reciben correctamente

**Prueba:**
```bash
# En consola de browser
localStorage.setItem('test', 'value')
# Debe verse en todos los microfrontends
```

---

### Tarea 3.2: Test del Flujo Completo

**Escenario 1: Login**
- [ ] Usuario se loguea en Shell App
- [ ] `usuario-sesion` event emitido
- [ ] Micro Historial carga datos
- [ ] Micro Canjes limpia carrito

**Escenario 2: Ver Productos**
- [ ] Micro Productos carga catálogo
- [ ] Filtros funcionan
- [ ] Búsqueda funciona

**Escenario 3: Agregar al Carrito**
- [ ] Click en "Agregar al Carrito"
- [ ] `add-to-cart` event emitido
- [ ] Micro Canjes recibe y agrega
- [ ] Carrito se actualiza

**Escenario 4: Procesar Canje**
- [ ] Click en "Confirmar Canje"
- [ ] Validación de puntos
- [ ] POST a Supabase
- [ ] `canje-completado` event emitido
- [ ] Micro Historial se actualiza
- [ ] Puntos se restan

---

### Tarea 3.3: Debugging y Fixes

**Herramientas:**
```javascript
// En console del browser
import eventBus from './eventBus'
eventBus.getHistory() // Ver eventos recientes
```

**Checklist:**
- [ ] No hay errores en console
- [ ] Eventos se emiten correctamente
- [ ] No hay memory leaks
- [ ] Performance aceptable

---

### Tarea 3.4: Pruebas Unitarias

**Micro Historial:**
- [ ] Tests para historialService
- [ ] Tests para historialStore
- [ ] Tests para componentes

**Micro Productos:**
- [ ] Tests para productosService
- [ ] Tests para hooks
- [ ] Tests para componentes

**Micro Canjes:**
- [ ] Tests para canjeService
- [ ] Tests para stores
- [ ] Tests para componentes

---

## 🎯 Fase 4: Optimización y Deploy (Semana 5)

### Tarea 4.1: Performance Tuning

**Checklist:**
- [ ] Lazy loading en componentes
- [ ] Code splitting en Vite
- [ ] Optimizar queries de Supabase
- [ ] Caché de datos local
- [ ] Debounce en búsqueda

---

### Tarea 4.2: Build para Producción

```bash
# En cada carpeta
npm run build

# Verificar que no hay errores
npm run preview
```

**Checklist:**
- [ ] Shell App: npm run build ✅
- [ ] Micro Historial: npm run build ✅
- [ ] Micro Productos: npm run build ✅
- [ ] Micro Canjes: npm run build ✅

---

### Tarea 4.3: Testing en Staging

**Checklist:**
- [ ] Todos los componentes funcionan
- [ ] EventBus en producción
- [ ] Supabase RLS está activo
- [ ] Errores manejados correctamente

---

### Tarea 4.4: Documentación Final

**Checklist:**
- [ ] README.md actualizado
- [ ] Instrucciones de instalación claras
- [ ] Documentación de API completa
- [ ] Diagrama de arquitectura
- [ ] Guía de troubleshooting

---

### Tarea 4.5: Demo Final

**Presentación:**
- [ ] Mostrar interfaz funcionando
- [ ] Demostrar flujo completo
- [ ] Explicar arquitectura
- [ ] Responder preguntas

---

## 📊 Matriz de Responsabilidades

| Tarea | Integrante 1 | Integrante 2 | Integrante 3 | Coordinador |
|-------|-------------|-------------|-------------|-----------|
| Setup Shell App | - | ✅ | - | ✅ |
| Setup Micro Historial | ✅ | - | - | ✅ |
| Setup Micro Productos | - | ✅ | - | ✅ |
| Setup Micro Canjes | - | - | ✅ | ✅ |
| Implementar Historial | ✅ | - | - | - |
| Implementar Productos | - | ✅ | - | - |
| Implementar Canjes | - | - | ✅ | - |
| Integrar EventBus | ✅ | ✅ | ✅ | ✅ |
| Testing E2E | ✅ | ✅ | ✅ | ✅ |
| Documentación | ✅ | ✅ | ✅ | ✅ |

---

## 🎓 Evaluación Esperada

**Criterios:**
- Funcionalidad completa ✅
- Código limpio y documentado ✅
- Testing mínimo (50% cobertura) ✅
- Comunicación entre equipos ✅
- Presentación y explicación ✅

**Puntuación máxima:**
- Implementación correcta: 60%
- Testing y calidad: 20%
- Documentación: 10%
- Presentación: 10%

---

**Última actualización**: Enero 2026
