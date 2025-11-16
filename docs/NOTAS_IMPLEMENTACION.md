```markdown
NOTAS DE IMPLEMENTACIÓN - Integración de servicios

Resumen corto
- Se añadieron 4 servicios: `StorageService`, `ValidationService`, `EventEmitter` (EventBus), `TransactionService`.
- Se actualizaron las páginas para cargar los servicios antes de `authservice.js`.
- `authservice.js` y `productService.js` usan ahora `StorageService` en lugar de `sessionStorage`.
- Se integró `EventBus` y registros de transacciones en puntos clave.

Cómo probar rápidamente (manual)
1. Abrir una de las páginas en un navegador (por ejemplo `TechPoints/pages/login.html`).
2. Abrir la consola (F12) y ejecutar:
   - `StorageService.getInfo()` → Ver información del storage.
   - `StorageService.get('usuarios', [])` → Ver usuarios guardados.
   - `StorageService.get('productos', [])` → Ver productos.

3. Probar login:
   - Completar el formulario en `login.html` con un usuario existente (ej: `ana@mail.com`, contraseña `1234`).
   - Ver en consola que no hay errores y que se redirige a `cliente.html` o `tienda.html`.
   - Ver en `StorageService.get('usuarioActivo')` que el usuario está guardado (24h por defecto).

4. Probar agregar puntos (desde `tienda.html`):
   - Usar el formulario de la tienda para agregar puntos a un cliente.
   - Ver en consola que `EventBus` emite `puntos-agregados` y que `TransactionService` registró la transacción.
   - Ver que la UI del cliente (si está abierta) se actualiza automáticamente.

5. Probar canje de producto (desde `cliente.html`):
   - Canjear un producto con puntos suficientes.
   - Ver que `TransactionService` registró la transacción (`canje`) y que `producto-canjeado` fue emitido.
   - Confirmar que el stock y los puntos se actualizan y persisten.

6. Logout
   - Al cerrar sesión, `EventBus` emite `usuario-logout` y se registra la transacción `logout`.

Notas importantes
- Documentación original puede contener referencias a `sessionStorage` (archivos README y guías). Es intencional: el código ya fue migrado a `StorageService`.
- Si deseas cambiar la expiración de `usuarioActivo`, ajusta `AuthService.guardarUsuarioActivo`.

Siguientes pasos recomendados
- Ejecutar pruebas manuales en Chrome/Edge (F12) y verificar los logs.
- Hacer commit de los cambios y ejecutar pruebas oportunas.

```
