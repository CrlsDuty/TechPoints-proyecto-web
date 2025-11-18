// assets/js/supabase-examples.js
// EJEMPLOS DE USO - Cómo usar los servicios adaptados para Supabase
// Descomenta y adapta según tus necesidades

// ========================================================================
// EJEMPLO 1: REGISTRO DE USUARIO (en pages/registro.html)
// ========================================================================

/*
async function handleRegistro(email, password, role) {
  const resultado = await AuthService.signUp(email, password, role);
  
  if (resultado.success) {
    Utils.mostrarToast(`¡Bienvenido, ${email}!`, 'success');
    // Redirigir a login
    setTimeout(() => window.location.href = './login.html', 2000);
  } else {
    Utils.mostrarToast(`Error: ${resultado.message}`, 'error');
  }
}

// Ejemplo de uso:
// handleRegistro('nuevo@mail.com', 'password123', 'cliente');
*/

// ========================================================================
// EJEMPLO 2: LOGIN (en pages/login.html)
// ========================================================================

/*
async function handleLogin(email, password) {
  const resultado = await AuthService.signIn(email, password);
  
  if (resultado.success) {
    const usuario = resultado.usuario;
    Utils.mostrarToast(`¡Bienvenido ${usuario.nombre}!`, 'success');
    
    // Redirigir según rol
    if (usuario.role === 'cliente') {
      setTimeout(() => window.location.href = './cliente.html', 1500);
    } else if (usuario.role === 'tienda') {
      setTimeout(() => window.location.href = './tienda.html', 1500);
    }
  } else {
    Utils.mostrarToast(`Error: ${resultado.message}`, 'error');
  }
}

// Ejemplo de uso:
// handleLogin('ana@mail.com', '1234');
*/

// ========================================================================
// EJEMPLO 3: AGREGAR PUNTOS (en pages/tienda.html - dashboard tienda)
// ========================================================================

/*
async function handleAgregarPuntos() {
  const email = document.getElementById('clienteEmail').value;
  const puntos = document.getElementById('puntosValue').value;
  
  if (!email || !puntos) {
    Utils.mostrarToast('Por favor completa todos los campos', 'warning');
    return;
  }
  
  const resultado = await StoreService.agregarPuntosCliente(email, parseInt(puntos));
  
  if (resultado.success) {
    Utils.mostrarToast(resultado.message, 'success');
    console.log('Puntos nuevos del cliente:', resultado.puntosNuevos);
    
    // Limpiar formulario
    document.getElementById('clienteEmail').value = '';
    document.getElementById('puntosValue').value = '';
  } else {
    Utils.mostrarToast(`Error: ${resultado.message}`, 'error');
  }
}

// Ejemplo de uso (desde HTML):
// <button onclick="handleAgregarPuntos()">Agregar Puntos</button>
*/

// ========================================================================
// EJEMPLO 4: OBTENER PRODUCTOS (en pages/cliente.html o tienda.html)
// ========================================================================

/*
async function mostrarProductos() {
  const productos = await ProductService.obtenerProductos();
  const contenedor = document.getElementById('productosContainer');
  
  if (productos.length === 0) {
    contenedor.innerHTML = '<p>No hay productos disponibles</p>';
    return;
  }
  
  contenedor.innerHTML = productos.map(prod => `
    <div class="producto-card">
      <h3>${prod.nombre}</h3>
      <p>${prod.descripcion || 'Sin descripción'}</p>
      <p><strong>Costo: ${prod.costo_puntos || prod.costo} puntos</strong></p>
      <p>Stock: ${prod.stock || prod.stock || 'N/A'}</p>
      <button onclick="canjearProducto(${prod.id || prod.id})">Canjear</button>
    </div>
  `).join('');
}

// Llamar al cargar página
document.addEventListener('DOMContentLoaded', mostrarProductos);
*/

// ========================================================================
// EJEMPLO 5: CANJEAR PRODUCTO (en pages/cliente.html)
// ========================================================================

/*
async function canjearProducto(productoIndex) {
  const usuario = AuthService.obtenerUsuarioActivo();
  
  if (!usuario) {
    Utils.mostrarToast('Por favor inicia sesión', 'error');
    return;
  }
  
  // Confirmar canje
  if (!confirm('¿Estás seguro de que deseas canjear este producto?')) {
    return;
  }
  
  const resultado = await ProductService.canjearProducto(usuario.email, productoIndex);
  
  if (resultado.success) {
    Utils.mostrarToast(resultado.message, 'success');
    console.log('Puntos restantes:', resultado.puntosRestantes);
    console.log('Stock restante del producto:', resultado.stockRestante);
    
    // Refrescar lista de productos
    setTimeout(() => mostrarProductos(), 1000);
  } else {
    Utils.mostrarToast(`Error: ${resultado.message}`, 'error');
    if (resultado.puntosActuales !== undefined) {
      console.log('Tus puntos:', resultado.puntosActuales);
    }
  }
}

// Ejemplo de uso (desde HTML):
// <button onclick="canjearProducto(0)">Canjear Producto</button>
*/

// ========================================================================
// EJEMPLO 6: AGREGAR PRODUCTO (en pages/tienda.html)
// ========================================================================

/*
async function handleAgregarProducto() {
  const nombre = document.getElementById('nombreProducto').value;
  const costo = document.getElementById('costoProducto').value;
  const descripcion = document.getElementById('descripcionProducto').value;
  const stock = document.getElementById('stockProducto').value || 0;
  
  if (!nombre || !costo) {
    Utils.mostrarToast('Por favor completa campos requeridos', 'warning');
    return;
  }
  
  const usuario = AuthService.obtenerUsuarioActivo();
  const resultado = await ProductService.agregarProducto(
    usuario.email,
    nombre,
    parseInt(costo),
    null, // precioDolar
    descripcion,
    null, // imagen
    parseInt(stock)
  );
  
  if (resultado.success) {
    Utils.mostrarToast('Producto agregado exitosamente', 'success');
    console.log('Producto creado:', resultado.producto);
    
    // Limpiar formulario
    document.getElementById('nombreProducto').value = '';
    document.getElementById('costoProducto').value = '';
    document.getElementById('descripcionProducto').value = '';
    document.getElementById('stockProducto').value = '';
    
    // Refrescar lista
    setTimeout(() => mostrarMisProductos(), 1000);
  } else {
    Utils.mostrarToast(`Error: ${resultado.message}`, 'error');
  }
}

// Ejemplo de uso (desde HTML):
// <button onclick="handleAgregarProducto()">Agregar Producto</button>
*/

// ========================================================================
// EJEMPLO 7: OBTENER ESTADÍSTICAS DE TIENDA
// ========================================================================

/*
async function mostrarEstadisticas() {
  const usuario = AuthService.obtenerUsuarioActivo();
  
  if (usuario?.role !== 'tienda') {
    console.warn('Solo tiendas pueden ver estadísticas');
    return;
  }
  
  const stats = await StoreService.obtenerEstadisticas(usuario.email);
  
  console.log('Estadísticas de tienda:');
  console.log('- Total de productos:', stats.totalProductos);
  console.log('- Total de clientes:', stats.totalClientes);
  console.log('- Total de canjes:', stats.totalCanjes);
  
  // Mostrar en UI
  document.getElementById('statsContainer').innerHTML = `
    <div class="stat">
      <h3>Productos</h3>
      <p>${stats.totalProductos}</p>
    </div>
    <div class="stat">
      <h3>Clientes</h3>
      <p>${stats.totalClientes}</p>
    </div>
    <div class="stat">
      <h3>Canjes</h3>
      <p>${stats.totalCanjes}</p>
    </div>
  `;
}

// Llamar al cargar la página
document.addEventListener('DOMContentLoaded', mostrarEstadisticas);
*/

// ========================================================================
// EJEMPLO 8: VERIFICAR SI SUPABASE ESTÁ HABILITADO
// ========================================================================

/*
function verificarSupabase() {
  if (ProductService.isSupabaseEnabled()) {
    console.log('✅ Supabase está habilitado - usando BD remota');
  } else {
    console.log('⚠️ Supabase NO está habilitado - usando localStorage');
  }
}

// Llamar en el inicio de la app
verificarSupabase();
*/

// ========================================================================
// EJEMPLO 9: LOGOUT (Cerrar Sesión)
// ========================================================================

/*
async function handleLogout() {
  // Si Supabase está habilitado, también cerrar sesión en Supabase Auth
  if (AuthService.isSupabaseEnabled()) {
    await window.supabase.auth.signOut();
  }
  
  // Limpiar sesión local
  AuthService.cerrarSesion();
  
  Utils.mostrarToast('Sesión cerrada', 'success');
  
  // Redirigir a inicio
  setTimeout(() => window.location.href = '../index.html', 1500);
}

// Ejemplo de uso (desde HTML):
// <button onclick="handleLogout()">Cerrar Sesión</button>
*/

// ========================================================================
// EJEMPLO 10: LISTENER DE EVENTOS EN TIEMPO REAL (Supabase Realtime)
// ========================================================================

/*
// Escuchar cambios en productos en tiempo real
function setupRealtimeListeners() {
  if (!ProductService.isSupabaseEnabled()) {
    console.warn('Supabase no está habilitado, Realtime no disponible');
    return;
  }
  
  // Escuchar cambios en productos
  const productsSubscription = window.supabase
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        console.log('Cambio en productos:', payload);
        // Refrescar lista de productos
        mostrarProductos();
      }
    )
    .subscribe();
  
  // Escuchar cambios en perfiles (puntos)
  const profilesSubscription = window.supabase
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles' },
      (payload) => {
        console.log('Cambio en perfil:', payload);
        const usuario = AuthService.obtenerUsuarioActivo();
        if (usuario?.id === payload.new.id) {
          // Actualizar puntos del usuario actual
          usuario.puntos = payload.new.puntos;
          AuthService.guardarUsuarioActivo(usuario);
          // Actualizar UI
          document.getElementById('userPoints').textContent = usuario.puntos;
        }
      }
    )
    .subscribe();
  
  console.log('✅ Realtime listeners configurados');
}

// Llamar al cargar página si es cliente
if (AuthService.obtenerUsuarioActivo()?.role === 'cliente') {
  setupRealtimeListeners();
}
*/

// ========================================================================
// NOTAS IMPORTANTES
// ========================================================================

/*
1. ASYNC/AWAIT: Todos los servicios adaptados son async. Usa await o .then()

2. FALLBACK: Si Supabase no está disponible, los servicios usan localStorage automáticamente

3. USUARIO ACTIVO: Usa AuthService.obtenerUsuarioActivo() para acceder a datos del usuario autenticado

4. ERRORES: Siempre verifica resultado.success antes de usar los datos

5. EVENTOS: Los servicios emiten eventos vía EventBus (puntos-agregados, producto-canjeado, etc.)

6. SEGURIDAD: Las operaciones críticas (canje, agregar puntos) se ejecutan en funciones RPC 
   en el servidor (BD), no en el cliente. Esto evita fraudes.

7. REALTIME: Para actualizaciones en tiempo real, usa Supabase Realtime (ver Ejemplo 10)

8. DEBUGGING: Abre DevTools (F12) y revisa Console para logs de [ProductService], [StoreService], etc.
*/

// ========================================================================
// Exportar para uso en otros scripts
// ========================================================================
window.SupabaseExamples = {
  handleRegistro: () => console.log('Descomentar handleRegistro en supabase-examples.js'),
  handleLogin: () => console.log('Descomentar handleLogin en supabase-examples.js'),
  handleAgregarPuntos: () => console.log('Descomentar handleAgregarPuntos en supabase-examples.js'),
  canjearProducto: () => console.log('Descomentar canjearProducto en supabase-examples.js'),
  verificarSupabase: () => console.log('Descomentar verificarSupabase en supabase-examples.js'),
  setupRealtimeListeners: () => console.log('Descomentar setupRealtimeListeners en supabase-examples.js')
};
