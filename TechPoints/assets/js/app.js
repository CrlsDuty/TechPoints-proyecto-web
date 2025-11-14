// app.js - Archivo principal mejorado con protección de rutas

// ========== PROTECCIÓN DE RUTAS ==========
function verificarAutenticacion() {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  const paginaActual = window.location.pathname;

  // Páginas que requieren autenticación
  const paginasProtegidas = ['cliente.html', 'tienda.html'];
  const esProtegida = paginasProtegidas.some(p => paginaActual.includes(p));

  if (esProtegida && !usuarioActivo) {
    if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Debes iniciar sesión para acceder a esta página', 'warning');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return false;
  }

  // Verificar que el usuario tenga el rol correcto
  if (paginaActual.includes('cliente.html') && usuarioActivo?.role !== 'cliente') {
    if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('No tienes permisos para acceder a esta página', 'error');
    setTimeout(() => window.location.href = 'tienda.html', 1500);
    return false;
  }

  if (paginaActual.includes('tienda.html') && usuarioActivo?.role !== 'tienda') {
    if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('No tienes permisos para acceder a esta página', 'error');
    setTimeout(() => window.location.href = 'cliente.html', 1500);
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
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
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
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Por favor selecciona un tipo de cuenta', 'warning');
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
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Registrarse';
        }
      });
    } else {
      // Fallback síncrono
      const resultado = AuthService.registrarUsuario(email, password, role);
      if (resultado.success) {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message + " Redirigiendo al login...", 'success');
        setTimeout(() => window.location.href = 'login.html', 1000);
      } else {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrarse';
      }
    }
  });
}

// ========== CLIENTE ==========
// Constante: Ratio de conversión puntos/dólar (ajustable según negocio)
const CONVERSION_RATIO = 1; // 1 punto = $1 dólar (puedes cambiar este valor)

function inicializarCliente(usuarioActivo) {
  actualizarInfoCliente(usuarioActivo);
  mostrarProductosDisponibles();
  mostrarHistorial();
  configurarModal();
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

// Función de conversión: dólares → puntos
function convertirDolaresAPuntos(dolares) {
  return Math.ceil(dolares * CONVERSION_RATIO);
}

// Función de conversión: puntos → dólares
function convertirPuntosADolares(puntos) {
  return (puntos / CONVERSION_RATIO).toFixed(2);
}

function mostrarProductosDisponibles() {
  const productos = ProductService.obtenerProductos();
  const contenedor = document.getElementById("productosDisponibles");
  
  if (!contenedor) return;
  
  contenedor.innerHTML = "";

  if (productos.length === 0) {
    contenedor.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">
        <span style="font-size: 2em;">📦</span><br>
        No hay productos disponibles para canje
      </div>
    `;
    return;
  }

  productos.forEach((producto, index) => {
    const puntosConvertidos = convertirDolaresAPuntos(producto.precioDolar || producto.costo);
    const dolares = producto.precioDolar || convertirPuntosADolares(producto.costo);
    
    const card = document.createElement("div");
    card.className = "producto-card";
    card.innerHTML = `
      <h3 class="producto-nombre">${producto.nombre}</h3>
      <p class="producto-tienda">Por ${producto.tienda}</p>
      <div class="producto-precios">
        <div class="precio-dolar">
          <span class="label">Precio:</span>
          <span class="valor">$${dolares}</span>
        </div>
        <div class="precio-puntos">
          <span class="label">Puntos:</span>
          <span class="valor">${puntosConvertidos} pts</span>
        </div>
      </div>
      <button class="producto-btn">Ver Detalles</button>
    `;
    
    card.onclick = () => abrirModalProducto(producto, index, puntosConvertidos, dolares);
    contenedor.appendChild(card);
  });
}

function abrirModalProducto(producto, index, puntos, dolares) {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  const modal = document.getElementById("modalProducto");
  
  // Llenar datos del modal
  document.getElementById("modalProductoNombre").textContent = producto.nombre;
  document.getElementById("modalProductoDescripcion").textContent = 
    producto.descripcion || "Producto disponible para canje en nuestro sistema de puntos";
  document.getElementById("modalProductoPrecioDolar").textContent = `$${dolares}`;
  document.getElementById("modalProductoPuntos").textContent = `${puntos} pts`;
  document.getElementById("modalProductosPuntosCliente").textContent = `${usuarioActivo.puntos || 0} pts`;
  
  // Mostrar imagen (placeholder si no hay)
  const imagenContainer = document.getElementById("modalProductoImagen");
  imagenContainer.innerHTML = producto.imagen ? 
    `<img src="${producto.imagen}" alt="${producto.nombre}" style="max-width: 100%; border-radius: 6px;">` :
    `<span>Imagen no disponible</span>`;
  
  // Configurar botón de canje
  const btnConfirmar = document.getElementById("btnConfirmarCanje");
  btnConfirmar.disabled = (usuarioActivo.puntos || 0) < puntos;
  btnConfirmar.onclick = () => confirmarCanjeDesdeModal(index, usuarioActivo.email, puntos);
  
  // Abrir modal
  modal.classList.add("active");
}

function confirmarCanjeDesdeModal(index, email, puntosRequeridos) {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  
  if ((usuarioActivo.puntos || 0) < puntosRequeridos) {
    if (Utils && typeof Utils.mostrarToast === 'function') {
      const faltanPuntos = puntosRequeridos - (usuarioActivo.puntos || 0);
      Utils.mostrarToast(`Puntos insuficientes. Necesitas ${faltanPuntos} puntos más`, 'error');
    }
    return;
  }

  (async () => {
    try {
      const resultado = await ProductService.canjearProducto(email, index);

      if (resultado.success) {
        cerrarModalProducto();
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'success');
        actualizarInfoCliente(resultado.cliente);
        mostrarProductosDisponibles();
        mostrarHistorial();
      } else {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
      }
    } catch (err) {
      console.error('Error en canje:', err);
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Error inesperado durante el canje', 'error');
    }
  })();
}

function configurarModal() {
  const modal = document.getElementById("modalProducto");
  const btnCerrar = document.querySelector(".modal-close");
  const btnCancelar = document.getElementById("btnCancelarCanje");
  
  if (!modal) return;
  
  btnCerrar?.addEventListener("click", cerrarModalProducto);
  btnCancelar?.addEventListener("click", cerrarModalProducto);
  
  // Cerrar modal al hacer clic fuera de él
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModalProducto();
  });
}

function cerrarModalProducto() {
  const modal = document.getElementById("modalProducto");
  if (modal) modal.classList.remove("active");
}

function mostrarHistorial() {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  const historial = document.getElementById("historial");
  
  if (!historial) return;
  
  historial.innerHTML = "";

  if (!usuarioActivo.historial || usuarioActivo.historial.length === 0) {
    historial.innerHTML = `
      <li style="text-align: center; color: #999; padding: 30px; background: transparent; border: none;">
        <span style="font-size: 2em;">📋</span><br>
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
        <strong>${item.producto}</strong>
        <span>
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
    const precioDolar = document.getElementById("precioDolarProd")?.value.trim() || null;
    const descripcion = document.getElementById("descripcionProd")?.value.trim() || null;
    const imagen = document.getElementById("imagenProd")?.value.trim() || null;
    const submitBtn = formProducto.querySelector('button[type="submit"]');

    (async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Agregando...';

      try {
        const resultado = await ProductService.agregarProducto(
          usuarioActivo.email, 
          nombre, 
          costo, 
          precioDolar, 
          descripcion, 
          imagen
        );

        if (resultado.success) {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Producto agregado correctamente', 'success');
          formProducto.reset();
          mostrarProductosTienda(usuarioActivo.email);
        } else {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
        }
      } catch (err) {
        console.error('Error agregando producto:', err);
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Error inesperado al agregar producto', 'error');
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
    let contenido = `<div><strong>${producto.nombre}</strong>`;
    
    if (producto.descripcion) {
      contenido += `<br><span style="font-size: 0.85em; color: #666;">${producto.descripcion}</span>`;
    }
    
    if (producto.precioDolar) {
      contenido += `<br><span style="font-size: 0.9em; color: #059669;">$${parseFloat(producto.precioDolar).toFixed(2)}</span>`;
    }
    
    contenido += `<br><span style="font-size: 0.85em; color: #0ea5e9; font-weight: 600;">${producto.costo} puntos</span></div>`;
    
    li.innerHTML = contenido;
    lista.appendChild(li);
  });
}

// ========== LOGOUT ==========
function logout() {
  
  AuthService.cerrarSesion();
  window.location.href = "login.html";
  
}