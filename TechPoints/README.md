# TechPoints — Instrucciones de prueba

Este proyecto es una demo de un sistema de puntos para tiendas de tecnología. Está pensado para ejecutarse como páginas estáticas (sin backend) y usa un `StorageService` sobre `localStorage` para persistencia en el navegador.

Contenido de esta guía
- Requisitos mínimos
- Usuarios de demo
- Flujo de prueba (registro, login, agregar puntos, agregar productos, canje)
- Cómo verificar que se usan callbacks, Promises y async/await
- Archivos modificados recientemente
- Notas y próximos pasos

Requisitos mínimos
- Un navegador moderno (Chrome, Edge, Firefox...).
- Abrir `index.html` desde la carpeta `TechPoints` (doble clic o servir con un servidor estático si lo prefieres).

Usuarios de demo (ya inicializados)
- Cliente: `ana@mail.com` / `1234` (role: cliente, puntos iniciales: 50)
- Tienda: `tienda@mail.com` / `admin` (role: tienda, datos: nombre "Demo Store", dirección "Av. Demo 123", etc.)

Pasos para ejecutar la demo (rápido)
1. Abre `TechPoints/index.html` en el navegador.
2. Haz click en "Iniciar Sesión" y usa uno de los usuarios demo.

Flujos de prueba detallados

- Registro (demostración de callback)
	1. En la página `pages/registro.html` completa el formulario (correo, contraseña y rol).
	2. **Si seleccionas rol "Tienda"**, verás campos adicionales para:
		- Nombre de la tienda (requerido)
		- Dirección (opcional)
		- Teléfono/contacto (requerido)
		- Horario de atención (opcional)
		- Persona responsable (opcional)
	3. El proyecto valida campos obligatorios y muestra toasts de error si faltan. Al enviar, usa `Utils.delayWithCallback` (callback de demo) y redirige al login.
	4. Verifica que el usuario queda guardado usando el `StorageService` (ej: `StorageService.get('usuarios')`) con su estructura completa (incluyendo `tienda` si es tipo tienda).

- Login
	1. En `pages/login.html` inicia sesión con uno de los usuarios demo (o con el usuario que registraste).
	2. Si el login es correcto, se guarda `usuarioActivo` a través de `StorageService.set('usuarioActivo', usuario)` y se redirige según el rol (cliente → `cliente.html`, tienda → `tienda.html`).

- Agregar puntos (Promises + async/await)
	1. Inicia sesión como `tienda@mail.com` (admin).
	2. **Verás el "Perfil de la Tienda"** mostrando nombre, dirección, teléfono, horario y responsable (con un botón "✏️ Editar" que te permite actualizarlos sin re-registrarse).
	3. En el formulario "Agregar puntos a clientes" ingresa `ana@mail.com` y una cantidad (ej. `30`) y presiona "Agregar puntos".
	4. El handler usa `await StoreService.agregarPuntosCliente(...)`. Observa el mensaje de estado en la página.
	5. Verifica que el cliente (`ana@mail.com`) aumentó sus puntos en Storage.

- Agregar producto (Promises + async/await)
	1. En `pages/tienda.html`, en "Agregar producto" crea un producto (nombre, costo en puntos).
	2. El form usa `await ProductService.agregarProducto(...)` que devuelve una Promise. Tras completarse, el producto aparece en "Mis productos".
	3. Verifica que `productos` existe consultando `StorageService.get('productos')`.

- Canjear producto (Promises + async/await)
	1. Inicia sesión como `ana@mail.com` (cliente).
	2. En `pages/cliente.html` verás la lista de productos disponibles (agregados por tiendas).
	3. Pulsa "Canjear" sobre un producto. El canje llama a `await ProductService.canjearProducto(...)` y actualiza puntos e historial.
	4. Verifica que el `usuarioActivo` y `usuarios` en Storage fueron actualizados.

Cómo comprobar que se usan callbacks, Promises y async/await
- Callback: en el flujo de registro se usa `Utils.delayWithCallback(ms, cb)` (fíjate en `assets/js/app.js` en `inicializarRegistro`).
- Promises: las funciones `ProductService.agregarProducto`, `ProductService.canjearProducto` y `StoreService.agregarPuntosCliente` retornan Promises (mira `assets/js/productService.js` y `assets/js/storeService.js`).
- Async/Await: los handlers de los formularios consumen esas Promises con `await` en `assets/js/app.js`.

Archivos modificados / puntos de interés
- `assets/js/utils.js` — añadidos: `delay(ms)` y `delayWithCallback(ms, cb)`, y `mostrarToast()` para notificaciones no-bloqueantes.
- `assets/js/authservice.js` — `registrarUsuario` ahora acepta `tiendaInfo` para guardar datos operativos de tiendas.
- `assets/js/productService.js` — `agregarProducto` y `canjearProducto` ahora retornan Promises y simulan latencia.
- `assets/js/storeService.js` — `agregarPuntosCliente` ahora retorna una Promise.
- `assets/js/app.js` — handlers actualizados para callbacks/Promises/async/await; función `configurarEditarPerfil` permite editar datos de tienda en vivo.
- `pages/tienda.html` — nuevo bloque `#tiendaPerfil` muestra datos de la tienda; modal `#modalEditarPerfil` permite actualizarlos.
- `pages/registro.html` — nuevo contenedor `#storeFields` (oculto por defecto) con campos condicionales para tipo "tienda".
- `assets/css/style.css` — estilos para `.tienda-profile`, `.btn-editar-perfil`, `.input-error`, `.field-error` y toasts.

Notas y recomendaciones
- Esta es una demo cliente: las contraseñas se almacenan en texto en el Storage del navegador. Para producción, necesitarás un backend con hashing y almacenamiento seguro.
- Los datos de tienda (nombre, dirección, horario, etc.) están persistidos usando `StorageService` (basado en `localStorage`) bajo `usuarios[...].tienda` y se pueden editar en vivo desde el botón "✏️ Editar" en la zona de tienda.

Nota: El proyecto ya utiliza `StorageService` para persistencia. Si alguna documentación antigua menciona `sessionStorage`, considera que la implementación actual guarda los datos con `StorageService` (que usa `localStorage`) para mantenerlos entre sesiones.
- El proyecto ya usa toasts (notificaciones no-bloqueantes) en lugar de alerts para una mejor UX.
- Próximo paso: integrar Supabase como backend para persistencia permanente y autenticación segura.


---
Generado el: 15-Nov-2025 | Actualizado con gestión de perfil de tienda

