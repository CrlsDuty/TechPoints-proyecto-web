# 🚀 Guía de Instalación Rápida - Proyectos Base Creados

## ✅ Lo que ya está listo

Se han creado **4 proyectos Vite** completamente estructurados en `/microfrontends/`:

```
✓ shell-app (React) - Puerto 5173
✓ micro-historial (Vue) - Puerto 5174
✓ micro-productos (React) - Puerto 5175
✓ micro-canje (Vue) - Puerto 5176
```

Cada proyecto contiene:
- ✅ `package.json` con dependencias
- ✅ `vite.config.js` configurado
- ✅ `index.html` listo
- ✅ Estructura de carpetas completa
- ✅ Código base funcional
- ✅ Servicios y stores configurados
- ✅ EventBus compartido en `/shared`
- ✅ Cliente de Supabase en `/shared`

---

## 🔧 Paso 1: Instalar Node.js (si no lo tienes)

```powershell
# Verificar si tienes Node instalado
node --version
npm --version
```

Si no lo tienes, descárgalo desde [nodejs.org](https://nodejs.org/)

---

## 📦 Paso 2: Instalar Dependencias

**En cada carpeta de proyecto:**

```powershell
# Terminal 1: Shell App
cd c:\Users\ASUS\Desktop\proyecto-web\microfrontends\shell-app
npm install

# Terminal 2: Micro Historial
cd c:\Users\ASUS\Desktop\proyecto-web\microfrontends\micro-historial
npm install

# Terminal 3: Micro Productos
cd c:\Users\ASUS\Desktop\proyecto-web\microfrontends\micro-productos
npm install

# Terminal 4: Micro Canjes
cd c:\Users\ASUS\Desktop\proyecto-web\microfrontends\micro-canje
npm install
```

O ejecuta este script (ahorra tiempo):

```powershell
# PowerShell - Ejecutar en la carpeta microfrontends
@(
  'shell-app',
  'micro-historial',
  'micro-productos',
  'micro-canje'
) | ForEach-Object {
  Write-Host "Instalando dependencias en $_..." -ForegroundColor Green
  Set-Location $_
  npm install
  Set-Location ..
}
```

---

## 🔑 Paso 3: Configurar Variables de Entorno

En **cada carpeta**, copia `.env.local.example` a `.env.local` y agrega tus credenciales:

```bash
# Ejemplo para shell-app/.env.local
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Obtén tus credenciales:**
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings > API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon (public)** → `VITE_SUPABASE_ANON_KEY`

**Opcional (shell-app):** para que "Ver Catálogo" abra micro-productos en producción, define la URL del microfrontend:
```bash
# shell-app/.env.local
VITE_MICRO_PRODUCTOS_URL=http://localhost:5175
# En producción: https://tu-dominio.com/micro-productos
```
Si no la defines, el shell usa por defecto `http://localhost:5175` en desarrollo.

**Sesión compartida (iframe):** el shell envía la sesión de Supabase al iframe de micro-productos por `postMessage`, para que no tengas que iniciar sesión otra vez. En **micro-productos** puedes definir el origen del shell (para aceptar solo mensajes de ese origen):
```bash
# micro-productos/.env.local (opcional)
VITE_SHELL_ORIGIN=http://localhost:5173
# En producción: https://tu-dominio.com
```
Si no la defines, se usa por defecto `http://localhost:5173` en desarrollo.

---

## 🎮 Paso 4: Ejecutar en Desarrollo

Abre **4 terminales** diferentes (una para cada proyecto):

```powershell
# Terminal 1: Shell App (http://localhost:5173)
cd c:\Users\ASUS\Desktop\proyecto-web\microfrontends\shell-app
npm run dev

# Terminal 2: Micro Historial (http://localhost:5174)
cd c:\Users\ASUS\Desktop\proyecto-web\microfrontends\micro-historial
npm run dev

# Terminal 3: Micro Productos (http://localhost:5175)
cd c:\Users\ASUS\Desktop\proyecto-web\microfrontends\micro-productos
npm run dev

# Terminal 4: Micro Canjes (http://localhost:5176)
cd c:\Users\ASUS\Desktop\proyecto-web\microfrontends\micro-canje
npm run dev
```

### O usa este PowerShell script:

```powershell
# scripts/dev-all.ps1
@(
  @{ name = 'shell-app'; port = 5173 },
  @{ name = 'micro-historial'; port = 5174 },
  @{ name = 'micro-productos'; port = 5175 },
  @{ name = 'micro-canje'; port = 5176 }
) | ForEach-Object {
  $project = $_
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$($project.name)' ; npm run dev"
  ) -WindowStyle Normal
}
```

---

## ✨ Paso 5: Acceder a la App

Una vez que todos los servidores estén ejecutándose:

- **Principal**: http://localhost:5173 (Shell App)
- **Historial**: http://localhost:5174 (disponible desde shell)
- **Productos**: http://localhost:5175 (disponible desde shell)
- **Canjes**: http://localhost:5176 (disponible desde shell)

---

## 🗂️ Estructura Creada

```
/microfrontends/
├── shared/
│   ├── eventBus.js (Comunicación entre apps)
│   └── supabaseClient.js (Cliente Supabase)
│
├── shell-app/ (React)
│   ├── src/
│   │   ├── auth/
│   │   │   ├── AuthContext.jsx
│   │   │   └── Login.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── styles/
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── micro-historial/ (Vue)
│   ├── src/
│   │   ├── components/
│   │   │   └── HistorialCanjes.vue
│   │   ├── services/
│   │   │   └── historialService.js
│   │   ├── stores/
│   │   │   └── historialStore.js
│   │   └── App.vue
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── micro-productos/ (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── CatalogoProductos.jsx
│   │   │   └── TarjetaProducto.jsx
│   │   ├── context/
│   │   │   └── ProductosContext.jsx
│   │   ├── hooks/
│   │   │   └── useProductos.js
│   │   ├── services/
│   │   │   └── productosService.js
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── micro-canje/ (Vue)
    ├── src/
    │   ├── components/
    │   │   └── CarritoCanjes.vue
    │   ├── services/
    │   │   └── canjeService.js
    │   ├── stores/
    │   │   └── canjeStore.js
    │   └── App.vue
    ├── package.json
    ├── vite.config.js
    └── index.html
```

---

## 🐛 Troubleshooting

### Error: "Puerto en uso"
```powershell
# Cambiar puerto en vite.config.js
# O matar el proceso
Get-Process node | Stop-Process -Force
```

### Error: "Supabase no definido"
- Verifica que `.env.local` exista en cada carpeta
- Verifica que tengas las variables correctas
- Reinicia el servidor (`npm run dev`)

### Error: "Module not found"
```powershell
# Elimina node_modules e instala de nuevo
rm -r node_modules
npm install
```

---

## 📝 Próximos Pasos

1. ✅ Instalar dependencias (`npm install`)
2. ✅ Configurar `.env.local` con Supabase
3. ✅ Ejecutar todos los servidores (`npm run dev`)
4. ✅ Abrir http://localhost:5173 en el navegador
5. ⬜ Completar Fase 1 del plan (Week 1)

---

## 🎯 Checklist de Setup Completo

- [ ] Node.js instalado
- [ ] Todas las dependencias instaladas (`npm install`)
- [ ] `.env.local` configurado en todas las carpetas
- [ ] Los 4 servidores ejecutándose
- [ ] Shell App abierto en navegador
- [ ] Sin errores en la consola
- [ ] EventBus funcionando
- [ ] Supabase conectado

---

**¡Listo! Los proyectos base están creados y listos para desarrollar.**

Próximo paso: [Ver PLAN_MIGRACION.md](../PLAN_MIGRACION.md) para las tareas de Fase 1.
