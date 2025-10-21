# TechPoints — Instrucciones de prueba

Este proyecto es una demo de un sistema de puntos para tiendas de tecnología. Está pensado para ejecutarse como páginas estáticas (sin backend) y usa Web Storage (sessionStorage) para persistencia temporal.

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
- Tienda: `tienda@mail.com` / `admin` (role: tienda)

Pasos para ejecutar la demo (rápido)
1. Abre `TechPoints/index.html` en el navegador.
2. Haz click en "Iniciar Sesión" y usa uno de los usuarios demo.

Flujos de prueba detallados

- Registro (demostración de callback)
	1. En la página `pages/registro.html` completa el formulario (correo, contraseña y rol).
	2. Al enviar, el proyecto usa `Utils.delayWithCallback` para simular un callback (retardo). Observa que muestra una notificación (toast) si está disponible y luego redirige al login.
	3. Verifica que el usuario queda guardado en `sessionStorage` (abre DevTools → Application → Session Storage → busca la clave `usuarios`).

- Login
	1. En `pages/login.html` inicia sesión con uno de los usuarios demo (o con el usuario que registraste).
	2. Si el login es correcto, se guarda `usuarioActivo` en `sessionStorage` y se redirige según el rol (cliente → `cliente.html`, tienda → `tienda.html`).

- Agregar puntos (Promises + async/await)
	1. Inicia sesión como `tienda@mail.com` (admin).
	2. En `pages/tienda.html` ve al formulario "Agregar puntos a clientes".
	3. Ingresa `ana@mail.com` y una cantidad (ej. `30`) y presiona "Agregar puntos".
	4. El handler usa `await StoreService.agregarPuntosCliente(...)` (operación que devuelve una Promise y simula delay). Observa el mensaje de estado en la página.
	5. Verifica que el cliente (`ana@mail.com`) aumentó su campo `puntos` en Storage.

- Agregar producto (Promises + async/await)
	1. En `pages/tienda.html`, en "Agregar producto" crea un producto (nombre, costo en puntos).
	2. El form usa `await ProductService.agregarProducto(...)` que devuelve una Promise. Tras completarse, el producto aparece en "Mis productos".
	3. Verifica que `productos` existe en `sessionStorage`.

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
- `assets/js/utils.js` — añadidos: `delay(ms)` y `delayWithCallback(ms, cb)`.
- `assets/js/productService.js` — `agregarProducto` y `canjearProducto` ahora retornan Promises y simulan latencia con `Utils.delay`.
- `assets/js/storeService.js` — `agregarPuntosCliente` ahora retorna una Promise.
- `assets/js/app.js` — handlers actualizados para usar callbacks, Promises y async/await; normalización de event listeners.
- `pages/*.html` — se normalizaron las referencias a scripts para cargar `utils.js` antes de servicios y `app.js` al final.

Notas y recomendaciones
- Esta es una demo cliente: las contraseñas se almacenan en texto en el Storage del navegador. Para producción, necesitarás un backend con hashing y almacenamiento seguro.
- Si quieres persistencia permanente entre sesiones del navegador, puedo migrar de `sessionStorage` a `localStorage` (opción disponible).
- Puedo también reemplazar alerts por toasts y agregar estilos CSS para un mejor UX.



---
Generado el: 21-Oct-2025

