# 🚀 Guía de Deploy en Vercel

## 📋 Prerequisitos

- Cuenta en [Vercel](https://vercel.com) (gratis)
- Instalar Vercel CLI: `npm install -g vercel`

---

## ⚡ Deploy Rápido (10 minutos)

### 1. Login en Vercel

```powershell
vercel login
```

### 2. Deploy Shell-App (Aplicación Principal)

```powershell
cd microfrontends/shell-app
vercel --prod
```

Cuando pregunte:
- **Set up and deploy?** → Yes
- **Which scope?** → Tu cuenta
- **Link to existing project?** → No
- **Project name?** → `techpoints-shell`
- **Directory?** → `.` (enter)
- **Override settings?** → No

Guarda la URL que te da (ej: `https://techpoints-shell.vercel.app`)

### 3. Deploy Micro-Productos

```powershell
cd ../micro-productos
vercel --prod
```

- **Project name?** → `techpoints-productos`
- Guarda la URL

### 4. Deploy Micro-Historial

```powershell
cd ../micro-historial
vercel --prod
```

- **Project name?** → `techpoints-historial`
- Guarda la URL

### 5. Deploy Micro-Canje

```powershell
cd ../micro-canje
vercel --prod
```

- **Project name?** → `techpoints-canje`
- Guarda la URL

---

## 🔧 Configurar Variables de Entorno

### Para cada proyecto en Vercel Dashboard:

1. Ve a **Settings** → **Environment Variables**
2. Agrega estas variables:

```
VITE_SUPABASE_URL = https://nfetcnyhwgimusluxdfj.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZXRjbnlod2dpbXVzbHV4ZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNTM1NTEsImV4cCI6MjA3ODkyOTU1MX0._v9KKrBNyzog40YfY-jwiHy3r9eEEwvqR90IxSz6vYQ
```

### Solo para shell-app, agregar también:

```
VITE_MICRO_PRODUCTOS_URL = https://techpoints-productos.vercel.app
VITE_MICRO_HISTORIAL_URL = https://techpoints-historial.vercel.app
```

(Reemplaza con tus URLs reales de Vercel)

---

## 🔄 Redeploy después de configurar variables

```powershell
# En cada directorio
vercel --prod
```

---

## ✅ Verificar

Abre `https://techpoints-shell.vercel.app` y prueba:
- Login con `ana@mail.com` / `1234`
- Ver catálogo de productos
- Ver historial

---

## 📦 Alternativa: Deploy desde GitHub

1. Conecta tu repositorio a Vercel
2. Configura 4 proyectos separados
3. En cada proyecto, configura:
   - **Root Directory**: `microfrontends/shell-app` (o el que corresponda)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## 🆘 Troubleshooting

**Error: "Module not found"**
→ Verifica que `package.json` tenga todas las dependencias

**Error: "Environment variables not defined"**
→ Redeploy después de configurar variables

**Productos no se muestran**
→ Verifica que ejecutaste el SQL de productos demo en Supabase

---

## 🎯 URLs Finales

Después del deploy, tendrás:

- **Shell App**: https://techpoints-shell.vercel.app
- **Productos**: https://techpoints-productos.vercel.app
- **Historial**: https://techpoints-historial.vercel.app
- **Canje**: https://techpoints-canje.vercel.app

¡Listo para la presentación! 🎉
