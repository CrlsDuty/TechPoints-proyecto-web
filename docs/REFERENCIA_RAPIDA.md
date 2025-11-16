# ⚡ REFERENCIA RÁPIDA - Comandos y Código

## 🔧 Copiar y Pegar

### 1. Agregar a HTML (Copiar en <head>)

```html
<!-- ANTES de otros scripts -->
<script defer src="../assets/js/services/StorageService.js"></script>
<script defer src="../assets/js/services/ValidationService.js"></script>
<script defer src="../assets/js/services/EventEmitter.js"></script>
<script defer src="../assets/js/services/TransactionService.js"></script>

<!-- DESPUÉS los demás scripts -->
<script defer src="../assets/js/utils.js"></script>
<script defer src="../assets/js/config.js"></script>
<script defer src="../assets/js/authservice.js"></script>
<script defer src="../assets/js/productService.js"></script>
<script defer src="../assets/js/storeService.js"></script>
<script defer src="../assets/js/app.js"></script>
```

---

### 2. Cambiar en authservice.js

**Buscar y reemplazar:**

```javascript
// ❌ ANTES (sessionStorage)
const usuarios = sessionStorage.getItem("usuarios");
return usuarios ? JSON.parse(usuarios) : [];

// ✅ DESPUÉS (StorageService)
return StorageService.get("usuarios", []);
```

---

### 3. Agregar a app.js (al DOMContentLoaded)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  AuthService.inicializarUsuarios();
  
  // ✨ NUEVO: Eventos
  EventBus.on('puntos-agregados', (usuario) => {
    actualizarInfoCliente(usuario);
  });

  EventBus.on('producto-canjeado', (data) => {
    mostrarProductosDisponibles();
    mostrarHistorial();
  });

  inicializarPagina();
});
```

---

## 🧪 Testing en Consola (F12)

// ... (contenido de referencia rápida, comandos y ejemplos)
