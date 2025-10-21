// app.js - Archivo principal mejorado con protección de rutas

// ========== PROTECCIÓN DE RUTAS ==========
function verificarAutenticacion() {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  const paginaActual = window.location.pathname;

  // Páginas que requieren autenticación
  const paginasProtegidas = ['cliente.html', 'tienda.html'];
  const esProtegida = paginasProtegidas.some(p => paginaActual.includes(p));

  if (esProtegida && !usuarioActivo) {
    alert('Debes iniciar sesión para acceder a esta página');
    window.location.href = 'login.html';
    return false;
  }

  // Verificar que el usuario tenga el rol correcto
  if (paginaActual.includes('cliente.html') && usuarioActivo?.role !== 'cliente') {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'tienda.html';
    return false;
  }

  if (paginaActual.includes('tienda.html') && usuarioActivo?.role !== 'tienda') {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'cliente.html';
    return false;
  }

  return true;
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
  AuthService.inicializarUsuarios();
  
  // Verificar autenticación antes de inicializar
  if (!verificarAutenticacion()) {
    return;
  }

  inicializarPagina();
});

// ========== INICIALIZAR SEGÚN LA PÁGINA ==========
function inicializarPagina() {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();

  // LOGIN
  const formLogin = document.getElementById("formLogin");
  if (formLogin) {
    inicializarLogin(formLogin);
  }

  // REGISTRO
  const formRegistro = document.getElementById("formRegistro");
  if (formRegistro) {
    inicializarRegistro(formRegistro);
  }

  // CLIENTE
  if (usuarioActivo?.role === "cliente") {
    inicializarCliente(usuarioActivo);
  }

  // TIENDA
  if (usuarioActivo?.role === "tienda") {
    inicializarTienda(usuarioActivo);
  }
}

// ========== LOGIN ==========
function inicializarLogin(formLogin) {
  formLogin.addEventListener("submit", e => {
    e.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const submitBtn = formLogin.querySelector('button[type="submit"]');

    // Deshabilitar botón durante el proceso
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando...';

    const resultado = AuthService.validarLogin(email, password);

    if (resultado.success) {
      AuthService.guardarUsuarioActivo(resultado.usuario);
      
      // Redirigir según el rol
      if (resultado.usuario.role === "cliente") {
        window.location.href = "cliente.html";
      } else {
        window.location.href = "tienda.html";
      }
    } else {
      alert(resultado.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
    }
  });
}

// ========== REGISTRO ==========
function inicializarRegistro(formRegistro) {
  formRegistro.addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;
    const submitBtn = formRegistro.querySelector('button[type="submit"]');

    // Validación del rol
    if (!role) {
      alert('Por favor selecciona un tipo de cuenta');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    // Demostración de callback (Utils.delayWithCallback)
    if (window.Utils && typeof Utils.delayWithCallback === 'function') {
      Utils.delayWithCallback(400, () => {
        const resultado = AuthService.registrarUsuario(email, password, role);

        if (resultado.success) {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message + ' Redirigiendo...', 'success');
          setTimeout(() => window.location.href = 'login.html', 600);
        } else {
          alert(resultado.message);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Registrarse';
        }
      });
    } else {
      // Fallback síncrono
      const resultado = AuthService.registrarUsuario(email, password, role);
      if (resultado.success) {
        alert(resultado.message + " Redirigiendo al login...");
        window.location.href = "login.html";
      } else {
        alert(resultado.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrarse';
      }
    }
  });
}

// ========== CLIENTE ==========
function inicializarCliente(usuarioActivo) {
  actualizarInfoCliente(usuarioActivo);
  mostrarProductosDisponibles();
  mostrarHistorial();
}

function actualizarInfoCliente(usuario) {
  const resultado = document.getElementById("resultado");
  if (resultado) {
    resultado.innerHTML = `
      <strong>👤 ${usuario.email}</strong><br>
      💰 Puntos disponibles: <strong style="font-size: 1.3em; color: #0ea5e9;">${usuario.puntos || 0}</strong>
    `;
  }
}

function mostrarProductosDisponibles() {
  const productos = ProductService.obtenerProductos();
  const lista = document.getElementById("productosDisponibles");
  
  if (!lista) return;
  
  lista.innerHTML = "";

  if (productos.length === 0) {
    lista.innerHTML = `
      <li style='grid-column: 1/-1; text-align: center; color: #999; padding: 40px;'>
        <span style='font-size: 2em;'>📦</span><br>
        No hay productos disponibles para canje
      </li>
    `;
    return;
  }

  productos.forEach((producto, index) => {
    const li = document.createElement("li");
    
    const info = document.createElement("div");
    info.innerHTML = `
      <strong>${producto.nombre}</strong><br>
      <span style="font-size: 0.85em; color: #666;">Por ${producto.tienda}</span><br>
      <span style="font-size: 0.9em; color: #0ea5e9; font-weight: 600;">${producto.costo} puntos</span>
    `;
    
    const btn = document.createElement("button");
    btn.textContent = "Canjear";
    btn.onclick = () => canjearProducto(index);

    li.appendChild(info);
    li.appendChild(btn);
    lista.appendChild(li);
  });
}

function canjearProducto(index) {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  
  if (!confirm('¿Estás seguro de que quieres canjear este producto?')) {
    return;
  }

  (async () => {
    try {
      const resultado = await ProductService.canjearProducto(usuarioActivo.email, index);

      if (resultado.success) {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'success');
        actualizarInfoCliente(resultado.cliente);
        mostrarProductosDisponibles();
        mostrarHistorial();
      } else {
        if (resultado.puntosNecesarios) {
          alert(`❌ ${resultado.message}\n\nNecesitas: ${resultado.puntosNecesarios} puntos\nTienes: ${resultado.puntosActuales} puntos\nFaltan: ${resultado.puntosNecesarios - resultado.puntosActuales} puntos`);
        } else {
          alert('❌ ' + resultado.message);
        }
      }
    } catch (err) {
      console.error('Error en canje:', err);
      alert('❌ Error inesperado durante el canje');
    }
  })();
}

function mostrarHistorial() {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  const historial = document.getElementById("historial");
  
  if (!historial) return;
  
  historial.innerHTML = "";

  if (!usuarioActivo.historial || usuarioActivo.historial.length === 0) {
    historial.innerHTML = `
      <li style='text-align: center; color: #999; padding: 30px;'>
        <span style='font-size: 2em;'>📋</span><br>
        Aún no has realizado canjes
      </li>
    `;
    return;
  }

  // Mostrar en orden inverso (más reciente primero)
  [...usuarioActivo.historial].reverse().forEach(item => {
    const li = document.createElement("li");
    if (typeof item === 'string') {
      li.textContent = item;
    } else {
      li.innerHTML = `
        <strong>${item.producto}</strong><br>
        <span style="font-size: 0.85em; color: #666;">
          ${item.costo} puntos • ${item.tienda} • ${item.fecha}
        </span>
      `;
    }
    historial.appendChild(li);
  });
}

// ========== TIENDA ==========
function inicializarTienda(usuarioActivo) {
  mostrarInfoTienda(usuarioActivo);
  configurarFormularioPuntos();
  configurarFormularioProductos(usuarioActivo);
}

function mostrarInfoTienda(usuarioActivo) {
  const stats = StoreService.obtenerEstadisticas(usuarioActivo.email);
  console.log('Estadísticas de la tienda:', stats);
}

function configurarFormularioPuntos() {
  const formTienda = document.getElementById("formTienda");
  if (!formTienda) return;
  formTienda.addEventListener("submit", async e => {
    e.preventDefault();

    const clienteEmail = document.getElementById("cliente").value.trim();
    const puntos = document.getElementById("puntos").value.trim();
    const submitBtn = formTienda.querySelector('button[type="submit"]');
    const mensaje = document.getElementById("mensaje");

    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';

    try {
      const resultado = await StoreService.agregarPuntosCliente(clienteEmail, puntos);

      if (mensaje) {
        mensaje.textContent = resultado.success ? '✅ ' + resultado.message : '❌ ' + resultado.message;
        mensaje.style.color = resultado.success ? "#059669" : "#dc2626";
        mensaje.style.background = resultado.success ? "#d1fae5" : "#fee2e2";
      }

      if (resultado.success) formTienda.reset();
    } catch (err) {
      console.error('Error agregando puntos:', err);
      if (mensaje) {
        mensaje.textContent = '❌ Error inesperado';
        mensaje.style.color = '#dc2626';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Agregar Puntos';
    }
  });
}

function configurarFormularioProductos(usuarioActivo) {
  const formProducto = document.getElementById("formProducto");
  if (!formProducto) return;

  mostrarProductosTienda(usuarioActivo.email);

  formProducto.addEventListener("submit", e => {
    e.preventDefault();
    
    const nombre = document.getElementById("nombreProd").value.trim();
    const costo = document.getElementById("costoProd").value.trim();
    const submitBtn = formProducto.querySelector('button[type="submit"]');

    (async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Agregando...';

      try {
        const resultado = await ProductService.agregarProducto(usuarioActivo.email, nombre, costo);

        if (resultado.success) {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Producto agregado correctamente', 'success');
          formProducto.reset();
          mostrarProductosTienda(usuarioActivo.email);
        } else {
          alert('❌ ' + resultado.message);
        }
      } catch (err) {
        console.error('Error agregando producto:', err);
        alert('❌ Error inesperado');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Agregar Producto';
      }
    })();
  });
}

function mostrarProductosTienda(tiendaEmail) {
  const productos = ProductService.obtenerProductosPorTienda(tiendaEmail);
  const lista = document.getElementById("listaProductos");
  
  if (!lista) return;
  
  lista.innerHTML = "";

  if (productos.length === 0) {
    lista.innerHTML = `
      <li style='grid-column: 1/-1; text-align: center; color: #999; padding: 30px;'>
        <span style='font-size: 2em;'>📦</span><br>
        No has agregado productos aún
      </li>
    `;
    return;
  }

  productos.forEach(producto => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${producto.nombre}</strong><br>
        <span style="font-size: 0.85em; color: #0ea5e9; font-weight: 600;">${producto.costo} puntos</span>
      </div>
    `;
    lista.appendChild(li);
  });
}

// ========== LOGOUT ==========
function logout() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    AuthService.cerrarSesion();
    window.location.href = "login.html";
  }
}