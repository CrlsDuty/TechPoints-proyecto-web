````markdown
# 🚀 Guía de Inicio - Nuevos Servicios

## 📦 Servicios Creados

He creado 4 nuevos servicios en `/assets/js/services/` que mejoran significativamente la arquitectura:

### 1. **StorageService.js** 
Gestión centralizada de almacenamiento (localStorage con expiración y backup)

### 2. **ValidationService.js**
Validaciones robustas para email, contraseñas, teléfono, URLs, etc.

### 3. **EventEmitter.js**
Sistema de eventos global para comunicación entre módulos (EventBus)

### 4. **TransactionService.js**
Auditoría completa de todas las transacciones del sistema

---

## 📝 Paso 1: Actualizar HTML

Edita tus archivos HTML (login.html, cliente.html, tienda.html, registro.html) para incluir los nuevos servicios:

**Orden correcto de carga:**

```html
<head>
  <meta charset="UTF-8">
  <title>Tu Página</title>
  <link rel="stylesheet" href="../assets/css/style.css">
  
  <!-- Scripts en este ORDEN específico -->
  <script defer src="../assets/js/services/StorageService.js"></script>
  <script defer src="../assets/js/services/ValidationService.js"></script>
  <script defer src="../assets/js/services/EventEmitter.js"></script>
  <script defer src="../assets/js/services/TransactionService.js"></script>
  
  <!-- Luego los servicios originales -->
  <script defer src="../assets/js/utils.js"></script>
  <script defer src="../assets/js/config.js"></script>
  <script defer src="../assets/js/authservice.js"></script>
  <script defer src="../assets/js/productService.js"></script>
  <script defer src="../assets/js/storeService.js"></script>
  
  <!-- Finalmente app.js -->
  <script defer src="../assets/js/app.js"></script>
</head>
```

---

## 🔧 Paso 2: Cambiar sessionStorage → StorageService

### Antes (MALO - se pierde al cerrar)
```javascript
sessionStorage.getItem("usuarios")
sessionStorage.setItem("usuarios", JSON.stringify(data))
```

### Después (BUENO - persiste entre sesiones)
```javascript
StorageService.get("usuarios", [])
StorageService.set("usuarios", data)
```

---

## ✅ Paso 4: Usar ValidationService

### En formularios:

```javascript
function inicializarRegistro(formRegistro) {
  formRegistro.addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // ✨ NUEVO: Validaciones mejoradas
    if (!ValidationService.validarEmail(email)) {
      Utils.mostrarToast('Email inválido', 'error');
      return;
    }

    const validPassword = ValidationService.validarPasswordFuerte(password);
    if (!validPassword.valido) {
      Utils.mostrarToast(
        `Contraseña débil. Fuerza: ${validPassword.fuerza}%`, 
        'warning'
      );
      return;
    }

    // ... resto del código ...
  });
}
```

---

## 🧪 Testing en Consola (F12)

Prueba los nuevos servicios en la consola del navegador:

```javascript
// ========== StorageService ==========

// Guardar datos
StorageService.set('test', {nombre: 'Juan', puntos: 100})

// Obtener datos
StorageService.get('test') // {nombre: 'Juan', puntos: 100}

// Ver tamaño
StorageService.getSize() // "0.05 KB"

// Ver info
StorageService.getInfo()

// Limpiar
StorageService.clear()
```

---

## 📋 Checklist de Implementación

- [ ] 1. Crear archivos en `/assets/js/services/`
- [ ] 2. Actualizar HTML (order de scripts)
- [ ] 3. Cambiar sessionStorage → StorageService en authservice.js
- [ ] 4. Cambiar sessionStorage → StorageService en productService.js
- [ ] 5. Agregar EventBus listeners en app.js
- [ ] 6. Integrar TransactionService en productService.js
- [ ] 7. Integrar ValidationService en formularios
- [ ] 8. Probar en consola
- [ ] 9. Verificar que no haya errores

---

¡Eso es! 🎉 Ahora tienes una base sólida para escalar tu app.

````
