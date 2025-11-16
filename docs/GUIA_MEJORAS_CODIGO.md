````markdown
# 💻 Guía de Mejoras Técnicas - Código Implementable

## Fase 1: localStorage vs sessionStorage

### Problema Actual
```javascript
// Código actual (MALO - se pierde al cerrar pestaña)
sessionStorage.getItem("usuarios")
sessionStorage.setItem("usuarios", JSON.stringify(data))
```

### Solución: Crear StorageService
```javascript
// assets/js/services/StorageService.js

const StorageService = {
  // Usa localStorage por defecto (persiste entre sesiones)
  storage: localStorage, // Cambiar a: sessionStorage si necesita

  set(key, value, expirationMs = null) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiration: expirationMs ? Date.now() + expirationMs : null
      };
      this.storage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error guardando en storage:', error);
      return false;
    }
  }
};

window.StorageService = StorageService;
```

---

## Fase 3: EventEmitter para Reactividad

```javascript
// assets/js/services/EventEmitter.js

class EventEmitter {
  constructor() {
    this.eventos = {};
  }

  on(evento, callback) {
    if (!this.eventos[evento]) {
      this.eventos[evento] = [];
    }
    this.eventos[evento].push(callback);
    return () => this.off(evento, callback);
  }
}

const EventBus = new EventEmitter();
window.EventBus = EventBus;
```

---

## Fase 4: TransactionService Mejorado

```javascript
// assets/js/services/TransactionService.js

const TransactionService = {
  registrarTransaccion(tipo, datos) {
    const transaccion = {
      id: Utils?.generarId?.() || Date.now().toString(),
      tipo,
      datos,
      usuario: AuthService?.obtenerUsuarioActivo?.()?.email || null,
      timestamp: new Date().toISOString(),
      estado: 'completado'
    };

    const transacciones = StorageService.get('transacciones', []);
    transacciones.push(transaccion);
    StorageService.set('transacciones', transacciones);
    EventBus.emit('transaccion-registrada', transaccion);
    return transaccion;
  }
};

window.TransactionService = TransactionService;
```

---

## Fase 5: Usar en app.js

```javascript
document.addEventListener('DOMContentLoaded', () => {
  AuthService.inicializarUsuarios();
  EventBus.on('puntos-agregados', (usuario) => {
    actualizarInfoCliente(usuario);
  });
});
```

````
