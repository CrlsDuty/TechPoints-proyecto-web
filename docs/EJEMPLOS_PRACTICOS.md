````markdown
# 💻 Ejemplos Prácticos - Usando los Servicios

## 🎯 Ejemplos Reales de Uso

Aquí tienes ejemplos listos para copiar y pegar en tu código.

---

## 1. StorageService - Ejemplos

### Guardar datos del usuario

```javascript
// Cuando el usuario inicia sesión
function handleLogin(usuarioData) {
  // Guardar datos que expiran en 24 horas
  StorageService.set('usuarioActivo', usuarioData, 24 * 60 * 60 * 1000);
  
  // Guardar lista de usuarios permanentemente
  StorageService.set('usuarios', obtenerTodosLosUsuarios());
  
  console.log('Datos guardados. Storage usado:', StorageService.getSize());
}
```

### Obtener datos con default

```javascript
// En tu app.js
const usuarioActivo = StorageService.get('usuarioActivo', null);

if (!usuarioActivo) {
  // No hay usuario, redirigir a login
  window.location.href = 'login.html';
} else {
  // Usuario existe, inicializar
  inicializarApp(usuarioActivo);
}
```

---

## 2. ValidationService - Ejemplos

### Validar email en tiempo real

```html
<!-- HTML -->
<input type="email" id="email" placeholder="tu@email.com">
<span id="emailError" style="color: red;"></span>
```

```javascript
// JavaScript
document.getElementById('email').addEventListener('blur', (e) => {
  const email = e.target.value;
  const errorEl = document.getElementById('emailError');
  
  if (ValidationService.validarEmail(email)) {
    errorEl.textContent = '✅ Email válido';
    errorEl.style.color = 'green';
  } else {
    errorEl.textContent = '❌ Email inválido';
    errorEl.style.color = 'red';
  }
});
```

---

## 3. EventBus - Ejemplos

### Comunicación entre módulos

```javascript
// Módulo A: Cuando se agregan puntos
function agregarPuntosACliente(email, cantidad) {
  const cliente = AuthService.buscarUsuarioPorEmail(email);
  cliente.puntos += cantidad;
  AuthService.actualizarUsuario(cliente);

  // Emitir evento para que otros módulos se enteres
  EventBus.emit('puntos-agregados', cliente);
}
```

---

## 4. TransactionService - Ejemplos

### Registrar diferentes tipos de transacciones

```javascript
// Cuando se hace login
EventBus.on('usuario-login', (usuario) => {
  TransactionService.registrarTransaccion('login', {
    email: usuario.email,
    rol: usuario.role
  });
});
```

---

¡Listo para usar! 🚀

````
