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
async function inicializarPagina() {
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
    await inicializarCliente(usuarioActivo);
  }

  // TIENDA
  if (usuarioActivo?.role === "tienda") {
    inicializarTienda(usuarioActivo);
  }
}

// ========== LOGIN ==========
function inicializarLogin(formLogin) {
  formLogin.addEventListener("submit", async e => {
    e.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const submitBtn = formLogin.querySelector('button[type="submit"]');

    // Deshabilitar botón durante el proceso
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando...';

    // Usar signIn (que intenta Supabase primero)
    const resultado = await AuthService.signIn(email, password);

    if (resultado.success) {
      console.log('[App] Login exitoso con usuario:', resultado.usuario);
      AuthService.guardarUsuarioActivo(resultado.usuario);
      
      // Cargar historial desde Supabase si es cliente
      if (resultado.usuario.role === 'cliente' && resultado.usuario.id) {
        console.log('[App] Cargando historial desde Supabase...');
        const historial = await AuthService.cargarHistorialDesdeSupabase(resultado.usuario.id);
        resultado.usuario.historial = historial;
        AuthService.guardarUsuarioActivo(resultado.usuario);
        console.log('[App] Historial cargado:', historial.length, 'canjes');
      }
      
      // Guardar usuario en Supabase auth para que getUser() funcione en otras páginas
      if (typeof window.supabase !== 'undefined' && window.supabase.auth && window.supabase.auth._setUser) {
        const userObj = {
          id: resultado.usuario.id || ('local-' + btoa(email).substring(0, 20)),
          email: resultado.usuario.email || email,
          role: resultado.usuario.role,
          puntos: resultado.usuario.puntos
        };
        window.supabase.auth._setUser(userObj);
        console.log('[App] Usuario guardado en Supabase auth:', userObj);
      }
      
      // Emitir evento global de login para que otros módulos reaccionen
      if (window.EventBus && typeof EventBus.emit === 'function') {
        try { EventBus.emit('usuario-login', resultado.usuario); } catch (e) { console.warn('EventBus emit failed (login)', e); }
      }
      
      // Redirigir según el rol
      const role = resultado.usuario.role;
      if (role === "cliente") {
        window.location.href = "cliente.html";
      } else if (role === "tienda") {
        window.location.href = "tienda.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      console.error('[App] Login falló:', resultado.message);
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
    }
  });
}

// ========== REGISTRO ==========
function inicializarRegistro(formRegistro) {
  const roleSelect = document.getElementById("role");
  const storeFields = document.getElementById("storeFields");
  
  if (roleSelect && storeFields) {
    roleSelect.addEventListener('change', function() {
      storeFields.style.display = this.value === 'tienda' ? 'block' : 'none';
    });
    storeFields.style.display = roleSelect.value === 'tienda' ? 'block' : 'none';
  }

  formRegistro.addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;
    const submitBtn = this.querySelector('button[type="submit"]');

    const tiendaInfo = role === 'tienda' ? {
      nombre: document.getElementById("nombreTienda")?.value.trim() || '',
      direccion: document.getElementById("direccionTienda")?.value.trim() || '',
      telefono: document.getElementById("telefonoTienda")?.value.trim() || '',
      horario: document.getElementById("horarioTienda")?.value.trim() || '',
      responsable: document.getElementById("responsableTienda")?.value.trim() || ''
    } : null;

    if (!role) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Por favor selecciona un tipo de cuenta', 'warning');
      return;
    }

    if (!AuthService.validarEmail(email)) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Email inválido', 'warning');
      return;
    }

    if (!password || password.length < 4) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('La contraseña debe tener al menos 4 caracteres', 'warning');
      return;
    }

    if (role === 'tienda') {
      if (!tiendaInfo.nombre) {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('El nombre de la tienda es requerido', 'warning');
        return;
      }
      if (!tiendaInfo.telefono) {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('El teléfono es requerido', 'warning');
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    console.log('[Registro] 🚀 Llamando AuthService.signUp con email:', email, 'role:', role);
    
    try {
      const resultado = await AuthService.signUp(email, password, role, tiendaInfo);
      console.log('[Registro] 📊 Resultado de signUp:', resultado);
      
      if (resultado.success) {
        console.log('[Registro] ✅ Usuario registrado exitosamente en Supabase');
        if (Utils && typeof Utils.mostrarToast === 'function') {
          Utils.mostrarToast('Registro exitoso. Redirigiendo...', 'success');
        }
        setTimeout(() => window.location.href = 'login.html', 1500);
      } else {
        console.error('[Registro] ❌ Error en signup:', resultado.message);
        if (Utils && typeof Utils.mostrarToast === 'function') {
          Utils.mostrarToast(resultado.message || 'Error en el registro', 'error');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrarse';
      }
    } catch (e) {
      console.error('[Registro] 💥 Exception en signUp:', e);
      if (Utils && typeof Utils.mostrarToast === 'function') {
        Utils.mostrarToast('Error inesperado: ' + e.message, 'error');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrarse';
    }
  });
}

// ========== CLIENTE ==========
// Constante: Ratio de conversión puntos/dólar (ajustable según negocio)
const CONVERSION_RATIO = 1; // 1 punto = $1 dólar (puedes cambiar este valor)

async function inicializarCliente(usuarioActivo) {
  actualizarInfoCliente(usuarioActivo);
  await mostrarProductosDisponibles();
  mostrarHistorial();
  configurarModal();
}

function actualizarInfoCliente(clienteData = null) {
  const usuario = clienteData || AuthService.obtenerUsuarioActivo();

  if (!usuario) {
    console.warn('[App] No hay usuario activo');
    return;
  }

  const resultado = document.getElementById("resultado");
  if (!resultado) return;

  // Actualizar puntos si se pasan datos nuevos
  if (clienteData && clienteData.puntos !== undefined) {
    usuario.puntos = clienteData.puntos;
    AuthService.guardarUsuarioActivo(usuario);
  }

  // Mostrar datos actualizados en la estructura del nuevo diseño
  resultado.innerHTML = `
    <div class="user-email">
      <span>📧 ${usuario.email}</span>
    </div>
    <div class="puntos-disponibles">
      <div class="label">Puntos Disponibles</div>
      <div class="valor">${(usuario.puntos || 0).toLocaleString()}</div>
    </div>
  `;
}

// Función de conversión: dólares → puntos
function convertirDolaresAPuntos(dolares) {
  return Math.ceil(dolares * CONVERSION_RATIO);
}

// Función de conversión: puntos → dólares
function convertirPuntosADolares(puntos) {
  return (puntos / CONVERSION_RATIO).toFixed(2);
}

async function mostrarProductosDisponibles() {
  const productos = await ProductService.obtenerProductos();
  const contenedor = document.getElementById("productosDisponibles");
  const contador = document.getElementById("productosCount");
  
  if (!contenedor) return;
  
  // Actualizar contador
  if (contador) {
    contador.textContent = `${productos.length} productos`;
  }
  
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
    // Mapear campos Supabase - usar ambos valores independientemente
    const precioDolar = parseFloat(producto.precio_dolar) || 0;
    const costoPuntos = parseInt(producto.costo_puntos) || 0;
    const sinStock = (parseInt(producto.stock) || 0) <= 0;
    
    const card = document.createElement("div");
    card.className = "producto-card";
    
    if (sinStock) {
      card.classList.add('producto-sin-stock');
      card.style.opacity = '0.5';
      card.style.pointerEvents = 'none';
    }
    
    card.innerHTML = `
      <div class="producto-imagen">${producto.imagen_url ? `<img src="${producto.imagen_url}" alt="${producto.nombre}" style="max-width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : 'Sin imagen'}</div>
      <div class="producto-info">
        <h3 class="producto-nombre">${producto.nombre}</h3>
        <p class="producto-tienda">🏪 ${producto.tienda_nombre || producto.tienda || 'Tienda desconocida'}</p>
        <p class="producto-descripcion">${producto.descripcion || 'Producto disponible para canje en nuestro sistema de puntos'}</p>
        <div class="producto-stock">✓ ${sinStock ? 'Sin stock' : `${parseInt(producto.stock)} disponibles`}</div>
      </div>
      <div class="producto-precios">
        <div class="precio-row">
          <span class="precio-label">Precio:</span>
          <span class="precio-valor">$${precioDolar.toFixed(2)}</span>
        </div>
        <div class="precio-row">
          <span class="precio-label">Puntos:</span>
          <span class="precio-puntos">${costoPuntos.toLocaleString()} pts</span>
        </div>
      </div>
      <button class="btn-canjear" ${sinStock ? 'disabled' : ''}>Canjear Ahora</button>
    `;
    
    if (!sinStock) {
      card.onclick = () => abrirModalProducto(producto, index, costoPuntos, precioDolar);
    }
    
    contenedor.appendChild(card);
  });
}

function abrirModalProducto(producto, index, puntos, dolares) {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  const modal = document.getElementById("modalProducto");
  const sinStock = (producto.stock || 0) <= 0;
  
  // Llenar datos del modal
  document.getElementById("modalProductoNombre").textContent = producto.nombre;
  document.getElementById("modalProductoTienda").textContent = `🏪 ${producto.tienda_nombre || producto.tienda || 'Tienda desconocida'}`;
  document.getElementById("modalProductoDescripcion").textContent = 
    producto.descripcion || "Producto disponible para canje en nuestro sistema de puntos";
  document.getElementById("modalProductoPrecioDolar").textContent = `$${dolares.toFixed(2)}`;
  document.getElementById("modalProductoPuntos").textContent = `${puntos.toLocaleString()} pts`;
  document.getElementById("modalProductosPuntosCliente").textContent = `${(usuarioActivo.puntos || 0).toLocaleString()} pts`;
  
  // Mostrar imagen (placeholder si no hay)
  const imagenContainer = document.getElementById("modalProductoImagen");
  imagenContainer.innerHTML = producto.imagen_url ? 
    `<img src="${producto.imagen_url}" alt="${producto.nombre}" style="max-width: 100%; border-radius: 6px;">` :
    `<span>Imagen no disponible</span>`;
  
  // Mostrar estado de stock
  const stockContainer = document.getElementById("modalProductoStock");
  const stock = parseInt(producto.stock) || 0;
  if (sinStock) {
    stockContainer.textContent = '⚠️ Este producto no está disponible en stock';
    stockContainer.style.color = '#ef4444';
  } else {
    stockContainer.textContent = `✓ Disponibles: ${stock} unidades`;
    stockContainer.style.color = '#059669';
  }
  
  // Configurar botón de canje
  const btnConfirmar = document.getElementById("btnConfirmarCanje");
  btnConfirmar.disabled = (usuarioActivo.puntos || 0) < puntos || sinStock;
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
        
        // Actualizar puntos del usuario activo
        usuarioActivo.puntos = resultado.cliente.puntos;
        AuthService.guardarUsuarioActivo(usuarioActivo);
        
        // Recargar historial desde Supabase para obtener el redemption recién creado
        console.log('[App] Recargando historial desde Supabase...');
        if (usuarioActivo.id) {
          const historialActualizado = await AuthService.cargarHistorialDesdeSupabase(usuarioActivo.id);
          usuarioActivo.historial = historialActualizado;
          console.log('[App] Historial actualizado en memoria:', usuarioActivo.historial.length, 'canjes');
          
          // Guardar el usuario con el historial actualizado
          AuthService.guardarUsuarioActivo(usuarioActivo);
          console.log('[App] Usuario guardado con historial actualizado');
          
          // Pequeño delay para asegurar que los datos se guardaron
          if (window.Utils && typeof Utils.delay === 'function') {
            await Utils.delay(100);
          }
          
          console.log('[App] Historial recargado desde Supabase:', historialActualizado.length, 'canjes');
        } else {
          // Fallback: si no hay ID de usuario, registrar localmente
          if (!usuarioActivo.historial) usuarioActivo.historial = [];
          const registroHistorial = {
            fecha: new Date().toLocaleString(),
            fechaHora: new Date().toISOString(),
            tipo: 'canje',
            producto: resultado.producto,
            costo: puntosRequeridos,
            puntos: puntosRequeridos,
            tienda: resultado.tienda || 'Tienda',
            descripcion: `Canjeaste ${resultado.producto} por ${puntosRequeridos} puntos`
          };
          
          console.log('[App] Agregando al historial (fallback local):', registroHistorial);
          usuarioActivo.historial.push(registroHistorial);
          AuthService.guardarUsuarioActivo(usuarioActivo);
        }
        
        // Actualizar UI - usa los datos del usuario actualizado
        console.log('[App] Actualizando UI con usuario:', usuarioActivo.email, 'historial:', usuarioActivo.historial?.length);
        
        // Actualizar solo los puntos sin sobrescribir el historial
        usuarioActivo.puntos = resultado.cliente.puntos;
        AuthService.guardarUsuarioActivo(usuarioActivo);
        
        // Actualizar la UI mostrando puntos
        const resultadoDiv = document.getElementById("resultado");
        if (resultadoDiv) {
          resultadoDiv.innerHTML = `
            <div class="user-email">
              <span>📧 ${usuarioActivo.email}</span>
            </div>
            <div class="puntos-disponibles">
              <div class="label">Puntos Disponibles</div>
              <div class="valor">${(usuarioActivo.puntos || 0).toLocaleString()}</div>
            </div>
          `;
        }
        
        mostrarProductosDisponibles();
        
        // Pasar explícitamente el usuario actualizado a mostrarHistorial
        console.log('[App] Llamando mostrarHistorial con usuario:', usuarioActivo.email, 'historial:', usuarioActivo.historial?.length);
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

// Hacer confirmarCanjeDesdeModal disponible globalmente
window.confirmarCanjeDesdeModal = confirmarCanjeDesdeModal;

function cerrarModalProducto() {
  const modal = document.getElementById("modalProducto");
  if (modal) modal.classList.remove("active");
}

// Función global para cerrar modal desde el HTML
window.cerrarModalProducto = cerrarModalProducto;

function mostrarHistorial() {
  console.log('[App] mostrarHistorial() llamado');
  
  // Obtener el usuario actual tanto de memoria como de storage
  let usuarioActivo = AuthService.obtenerUsuarioActivo();
  console.log('[App] Usuario obtenido de AuthService:', usuarioActivo?.email, 'Historial length:', usuarioActivo?.historial?.length);
  
  // Si no hay usuario en memoria, intentar desde StorageService directamente
  if (!usuarioActivo) {
    usuarioActivo = StorageService.get('usuarioActivo', null);
    console.log('[App] Usuario obtenido de StorageService:', usuarioActivo?.email, 'Historial length:', usuarioActivo?.historial?.length);
  }
  
  const historialContainer = document.getElementById("historial");
  
  if (!historialContainer) {
    console.warn('[App] Elemento historial no encontrado en el DOM');
    return;
  }
  
  historialContainer.innerHTML = "";

  // Verificar que el historial existe y tiene datos
  const historialData = usuarioActivo?.historial;
  
  if (!historialData || historialData.length === 0) {
    console.log('[App] No hay historial para mostrar. Usuario activo:', usuarioActivo?.email, 'Historial:', historialData?.length || 0);
    console.log('[App] Datos completos del usuario:', usuarioActivo);
    historialContainer.innerHTML = `
      <div style="text-align: center; color: #999; padding: 30px; background: transparent; border: none;">
        <span style="font-size: 2em;">📋</span><br>
        Aún no has realizado canjes
      </div>
    `;
    return;
  }

  console.log('[App] Mostrando historial con', historialData.length, 'canjes');

  // Mostrar en orden ascendente (más antiguo primero, más reciente al final)
  historialData.forEach((item, index) => {
    const li = document.createElement("div");
    li.className = "historial-item";
    
    if (typeof item === 'string') {
      li.textContent = item;
    } else {
      const display = item.fechaHora ? (isNaN(new Date(item.fechaHora)) ? (item.fecha || '') : new Date(item.fechaHora).toLocaleString()) : (item.fecha || '');
      li.innerHTML = `
        <strong>${item.producto}</strong>
        <div class="fecha">${display} - ${item.costo} pts</div>
      `;
    }
    historialContainer.appendChild(li);
  });
}

// ========== TIENDA ==========
function inicializarTienda(usuarioActivo) {
  mostrarInfoTienda(usuarioActivo);
  configurarEditarPerfil(usuarioActivo);
  configurarFormularioPuntos();
  configurarFormularioProductos(usuarioActivo);
  mostrarHistorialTienda(usuarioActivo.email);
  configurarHistorialEventos(usuarioActivo.email);
  inicializarReportes(usuarioActivo.email);
}

function mostrarInfoTienda(usuarioActivo) {
  // Mostrar perfil operativo de la tienda en la interfaz
  const perfil = document.getElementById('tiendaPerfil');
  const tienda = usuarioActivo?.tienda || {};

  if (perfil) {
    const nombreEl = perfil.querySelector('.tienda-nombre');
    const dirEl = perfil.querySelector('.tienda-direccion');
    const telEl = perfil.querySelector('.tienda-telefono');
    const horarioEl = perfil.querySelector('.tienda-horario');
    const respEl = perfil.querySelector('.tienda-responsable');

    nombreEl.textContent = tienda.nombre ? tienda.nombre : usuarioActivo.email;
    dirEl.textContent = tienda.direccion ? '📍 ' + tienda.direccion : '';
    telEl.textContent = tienda.telefono ? '📞 ' + tienda.telefono : '';
    horarioEl.textContent = tienda.horario ? '⏰ Horario: ' + tienda.horario : '';
    respEl.textContent = tienda.responsable ? '👤 Responsable: ' + tienda.responsable : '';
  }

  // También podemos mostrar estadísticas simples de la tienda si existen
  (async () => {
    try {
      const stats = await StoreService.obtenerEstadisticas(usuarioActivo.email);
      if (stats) {
        // por ahora solo logueamos; se puede extender la UI para mostrar estas métricas
        console.log('Estadísticas de la tienda:', stats);
      }
    } catch (err) {
      console.warn('No se pudieron obtener estadísticas de la tienda', err);
    }
  })();
}

function configurarEditarPerfil(usuarioActivo) {
  const modal = document.getElementById('modalEditarPerfil');
  const btnEditar = document.getElementById('btnEditarPerfil');
  const btnCancelar = document.getElementById('btnCancelarEdicion');
  const btnGuardar = document.getElementById('btnGuardarEdicion');
  const formEditar = document.getElementById('formEditarPerfil');

  if (!modal || !btnEditar || !formEditar) return;

  // Abrir modal
  btnEditar.addEventListener('click', () => {
    const tienda = usuarioActivo.tienda || {};
    document.getElementById('editNombreTienda').value = tienda.nombre || '';
    document.getElementById('editDireccionTienda').value = tienda.direccion || '';
    document.getElementById('editTelefonoTienda').value = tienda.telefono || '';
    document.getElementById('editHorarioTienda').value = tienda.horario || '';
    document.getElementById('editResponsableTienda').value = tienda.responsable || '';
    modal.classList.add('active');
  });

  // Cerrar modal
  const cerrarModal = () => modal.classList.remove('active');
  btnCancelar?.addEventListener('click', cerrarModal);
  document.querySelector('#modalEditarPerfil .modal-close')?.addEventListener('click', cerrarModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });

  // Guardar cambios
  btnGuardar.addEventListener('click', async () => {
    const tiendaActualizada = {
      nombre: document.getElementById('editNombreTienda').value.trim(),
      direccion: document.getElementById('editDireccionTienda').value.trim(),
      telefono: document.getElementById('editTelefonoTienda').value.trim(),
      horario: document.getElementById('editHorarioTienda').value.trim(),
      responsable: document.getElementById('editResponsableTienda').value.trim()
    };

    // Validación básica
    if (!tiendaActualizada.nombre) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('El nombre de la tienda es requerido', 'warning');
      return;
    }

    if (!tiendaActualizada.telefono) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('El teléfono es requerido', 'warning');
      return;
    }

    // Actualizar usuario con nueva información de tienda
    const usuarioActualizado = { ...usuarioActivo, tienda: tiendaActualizada };
    
    // Mostrar estado de guardado
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    // Guardar en Supabase
    const resultado = await AuthService.actualizarTiendaEnSupabase(usuarioActualizado);

    if (resultado.success) {
      // Actualizar la UI
      mostrarInfoTienda(usuarioActualizado);

      // Cerrar modal y mostrar toast
      cerrarModal();
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Perfil actualizado en Supabase correctamente', 'success');
    } else {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message || 'Error al actualizar', 'error');
    }

    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar cambios';
  });
}

function configurarFormularioPuntos() {
  // Intenta usar el formulario del sidebar primero, sino usa el original
  const formTienda = document.getElementById("formTiendaSidebar") || document.getElementById("formTienda");
  if (!formTienda) return;
  
  formTienda.addEventListener("submit", async e => {
    e.preventDefault();

    // Ajustar IDs según si es sidebar o forma original
    const isSidebar = !!document.getElementById("formTiendaSidebar");
    const clienteInput = isSidebar ? document.getElementById("clienteSidebar") : document.getElementById("cliente");
    const puntosInput = isSidebar ? document.getElementById("puntosSidebar") : document.getElementById("puntos");
    const mensajeEl = isSidebar ? document.getElementById("mensajeSidebar") : document.getElementById("mensaje");

    const clienteEmail = clienteInput.value.trim();
    const puntos = puntosInput.value.trim();
    const submitBtn = formTienda.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';

    try {
      const resultado = await StoreService.agregarPuntosCliente(clienteEmail, puntos);

      if (mensajeEl) {
        mensajeEl.textContent = resultado.success ? '✅ ' + resultado.message : '❌ ' + resultado.message;
        mensajeEl.style.color = resultado.success ? "#059669" : "#dc2626";
        if (!isSidebar) {
          mensajeEl.style.background = resultado.success ? "#d1fae5" : "#fee2e2";
        }
      }

      if (resultado.success) formTienda.reset();
    } catch (err) {
      console.error('Error agregando puntos:', err);
      if (mensajeEl) {
        mensajeEl.textContent = '❌ Error inesperado';
        mensajeEl.style.color = '#dc2626';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSidebar ? 'Agregar Puntos' : 'Agregar Puntos';
    }
  });
}

function configurarFormularioProductos(usuarioActivo) {
  const formProducto = document.getElementById("formProducto");
  if (!formProducto) return;

  // Call async function without blocking
  (async () => {
    await mostrarProductosTienda(usuarioActivo.email);
  })();

  // Imagen: Subir archivo a Supabase Storage
  const imagenProdFile = document.getElementById('imagenProdFile');
  const imagenProdPreview = document.getElementById('imagenProdPreview');
  const imagenProdClear = document.getElementById('imagenProdClear');

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB (máximo de Storage)

  function mostrarPreviewElemento(container, src) {
    if (!container) return;
    if (!src) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = `<img src="${src}" alt="Preview imagen" style="max-width: 180px; max-height: 120px; border-radius:6px; display:block;">`;
  }

  // Si selecciona archivo, crear preview y guardar archivo
  let imagenProdFileSelected = null;
  imagenProdFile?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      imagenProdFileSelected = null;
      mostrarPreviewElemento(imagenProdPreview, '');
      imagenProdClear && (imagenProdClear.style.display = 'none');
      return;
    }
    if (!file.type.startsWith('image/')) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Tipo de archivo no soportado. Selecciona una imagen.', 'warning');
      imagenProdFile.value = '';
      imagenProdFileSelected = null;
      mostrarPreviewElemento(imagenProdPreview, '');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Imagen demasiado grande (máx 5MB).', 'warning');
      imagenProdFile.value = '';
      imagenProdFileSelected = null;
      mostrarPreviewElemento(imagenProdPreview, '');
      return;
    }
    
    // Guardar el archivo para subir después
    imagenProdFileSelected = file;
    
    // Mostrar preview usando URL local
    const reader = new FileReader();
    reader.onload = function(evt) {
      mostrarPreviewElemento(imagenProdPreview, evt.target.result);
      imagenProdClear && (imagenProdClear.style.display = 'inline-block');
    };
    reader.readAsDataURL(file);
  });

  imagenProdClear?.addEventListener('click', () => {
    if (imagenProdFile) imagenProdFile.value = '';
    imagenProdFileSelected = null;
    mostrarPreviewElemento(imagenProdPreview, '');
    imagenProdClear.style.display = 'none';
  });

  // Tasa de conversión: 1 USD = 100 puntos
  const TASA_CONVERSION = 100;
  const precioDolarInput = document.getElementById('precioDolarProd');
  const costoPuntosPreview = document.getElementById('costoPuntosPreview');

  // Actualizar vista previa de puntos en tiempo real
  precioDolarInput?.addEventListener('input', () => {
    const precioDolar = parseFloat(precioDolarInput.value) || 0;
    const puntos = Math.round(precioDolar * TASA_CONVERSION);
    if (costoPuntosPreview) {
      costoPuntosPreview.textContent = puntos.toLocaleString() + ' puntos';
    }
  });

  formProducto.addEventListener("submit", e => {
    e.preventDefault();
    
    const nombre = document.getElementById("nombreProd").value.trim();
    const precioDolar = parseFloat(document.getElementById("precioDolarProd").value) || 0;
    const costo = Math.round(precioDolar * TASA_CONVERSION); // Calcular automáticamente
    const categoria = document.getElementById("categoriaProd")?.value.trim() || null;
    const descripcion = document.getElementById("descripcionProd")?.value.trim() || null;
    const imagen = imagenProdFileSelected || null; // Pasar el File, no dataURL
    const stock = document.getElementById("stockProd")?.value.trim() || "0";
    const submitBtn = formProducto.querySelector('button[type="submit"]');

    // Validar que el precio no esté vacío
    if (precioDolar <= 0) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('El precio en dólares debe ser mayor a 0', 'warning');
      return;
    }

    // Validar que la categoría esté seleccionada
    if (!categoria) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Debe seleccionar una categoría', 'warning');
      return;
    }

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
          imagen, // Ahora es File o null
          stock,
          categoria
        );

        if (resultado.success) {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Producto agregado correctamente', 'success');
          formProducto.reset();
          document.getElementById("stockProd").value = "0";
          imagenProdFileSelected = null;
          mostrarPreviewElemento(imagenProdPreview, '');
          if (imagenProdClear) imagenProdClear.style.display = 'none';
          await mostrarProductosTienda(usuarioActivo.email);
        } else {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
        }
      } catch (err) {
        console.error('Error agregando producto:', err);
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Error inesperado al agregar producto', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '➕ Agregar Producto';
      }
    })();
  });
}

async function mostrarProductosTienda(tiendaEmail) {
  const productos = await ProductService.obtenerProductosPorTienda(tiendaEmail);
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
    li.style.cursor = 'pointer';
    li.title = 'Haz clic para editar o eliminar';
    
    const sinStock = (producto.stock || 0) <= 0;
    if (sinStock) {
      li.classList.add('producto-sin-stock');
      li.style.opacity = '0.6';
    }
    
    let contenido = `<div><strong>${producto.nombre}</strong>`;
    
    if (producto.descripcion) {
      contenido += `<br><span style="font-size: 0.85em; color: #666;">${producto.descripcion}</span>`;
    }
    
    // Map Supabase field names (precio_dolar, costo_puntos) to display
    const precioDolar = producto.precio_dolar || producto.precioDolar;
    const costoPuntos = producto.costo_puntos || producto.costo;
    
    if (precioDolar) {
      contenido += `<br><span style="font-size: 0.9em; color: #059669;">$${parseFloat(precioDolar).toFixed(2)}</span>`;
    }
    
    if (costoPuntos) {
      contenido += `<br><span style="font-size: 0.85em; color: #0ea5e9; font-weight: 600;">${costoPuntos} puntos</span>`;
    }
    
    // Mostrar stock
    const stockText = sinStock ? `<span style="color: #ef4444; font-weight: 600;">Sin stock</span>` : `Stock: ${producto.stock}`;
    contenido += `<br><span style="font-size: 0.8em; color: ${sinStock ? '#ef4444' : '#888'};">${stockText}</span></div>`;
    
    li.innerHTML = contenido;
    
    // Guardar datos del producto en data attributes (map both Supabase and legacy field names)
    li.dataset.productoId = producto.id;
    li.dataset.tienda = producto.tienda || producto.tienda_id;
    li.dataset.nombre = producto.nombre;
    li.dataset.costo = costoPuntos || producto.costo || 0;
    li.dataset.precioDolar = precioDolar || '';
    li.dataset.descripcion = producto.descripcion || '';
    li.dataset.imagen = producto.imagen || producto.imagen_url || '';
    li.dataset.stock = producto.stock || 0;
    
    // Abrir modal al hacer clic
    li.addEventListener('click', () => abrirModalProductoTienda(producto));
    
    lista.appendChild(li);
  });

  // actualizar historial de canjes para esta tienda
  if (typeof mostrarHistorialTienda === 'function') mostrarHistorialTienda(tiendaEmail);
}

// Mostrar historial de canjes filtrado por tienda (carga desde Supabase)
async function mostrarHistorialTienda(tiendaEmail) {
  const lista = document.getElementById('historialCanjesTienda');
  if (!lista) return;

  lista.innerHTML = '<li style="text-align: center; color: #999;">Cargando historial...</li>';

  try {
    const config = window._SUPABASE_CONFIG;
    if (!config) {
      lista.innerHTML = '<li style="text-align: center; color: #999;">Error: Configuración no disponible</li>';
      return;
    }

    // Obtener tienda_id de la tienda actual
    const tiendaActual = AuthService.obtenerUsuarioActivo();
    if (!tiendaActual || !tiendaActual.tienda) {
      lista.innerHTML = '<li style="text-align: center; color: #999;">Error: No hay datos de tienda</li>';
      return;
    }

    const tiendaId = tiendaActual.tienda.id;
    
    // Obtener productos de la tienda
    const productsUrl = new URL(`${config.url}/rest/v1/products`);
    productsUrl.searchParams.append('tienda_id', `eq.${tiendaId}`);
    productsUrl.searchParams.append('select', 'id,nombre');

    const productsResponse = await fetch(productsUrl.toString(), {
      headers: {
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      console.warn('[App] Error cargando productos:', await productsResponse.text());
      lista.innerHTML = '<li style="text-align: center; color: #999;">Error al cargar historial</li>';
      return;
    }

    const productos = await productsResponse.json();
    
    if (!productos || productos.length === 0) {
      lista.innerHTML = '<li style="text-align: center; color: #999;">Aún no hay canjes registrados en esta tienda</li>';
      return;
    }

    const productIds = productos.map(p => p.id);
    const productMap = {};
    productos.forEach(p => {
      productMap[p.id] = p.nombre;
    });
    
    console.log('[App] Product IDs de la tienda:', productIds);
    console.log('[App] Product Map:', productMap);

    // Obtener todas las redemptions (sin filtro de producto primero)
    const redemUrl = new URL(`${config.url}/rest/v1/redemptions`);
    redemUrl.searchParams.append('select', '*');
    redemUrl.searchParams.append('order', 'creado_at.desc');
    redemUrl.searchParams.append('limit', '500');

    const redemResponse = await fetch(redemUrl.toString(), {
      headers: {
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    });

    if (!redemResponse.ok) {
      console.warn('[App] Error cargando redemptions:', await redemResponse.text());
      lista.innerHTML = '<li style="text-align: center; color: #999;">Error al cargar historial</li>';
      return;
    }

    const allRedemptions = await redemResponse.json();
    console.log('[App] Redemptions cargados:', allRedemptions.length);
    
    if (allRedemptions.length > 0) {
      console.log('[App] Primera redemption structure:', allRedemptions[0]);
      console.log('[App] Redemptions keys:', Object.keys(allRedemptions[0]));
    }

    // Obtener todos los perfiles para mapear perfil_id a email
    const profilesUrl = new URL(`${config.url}/rest/v1/profiles`);
    profilesUrl.searchParams.append('select', 'id,email');

    const profilesResponse = await fetch(profilesUrl.toString(), {
      headers: {
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    });

    const profileMap = {};
    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json();
      profiles.forEach(p => {
        profileMap[p.id] = p.email;
      });
    }

    // Filtrar redemptions por productos de esta tienda
    const itemsFromSupabase = [];
    
    for (const r of allRedemptions) {
      // Verificar si el producto_id está en la lista de productos de esta tienda
      if (productIds.includes(r.producto_id)) {
        itemsFromSupabase.push({
          producto: productMap[r.producto_id] || 'Producto desconocido',
          costo: r.puntos_usados,
          fecha: new Date(r.creado_at).toLocaleDateString(),
          fechaHora: r.creado_at,
          cliente: profileMap[r.perfil_id] || 'Cliente desconocido',
          tienda: tiendaEmail
        });
      }
    }
    
    console.log('[App] Items filtrados de Supabase:', itemsFromSupabase.length);
    console.log('[App] Redemptions producto_ids:', allRedemptions.slice(0, 5).map(r => r.producto_id));

    // Apply filters from the UI
    const filtros = {
      q: document.getElementById('filtroBusqueda')?.value.trim() || '',
      desde: document.getElementById('filtroDesde')?.value || '',
      hasta: document.getElementById('filtroHasta')?.value || ''
    };

    const itemsFiltrados = itemsFromSupabase.filter(it => {
      // Search filter (producto or cliente)
      const q = filtros.q.toLowerCase();
      if (q) {
        const matches = (it.producto || '').toLowerCase().includes(q) || (it.cliente || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Date range filter
      if (filtros.desde || filtros.hasta) {
        const entryDate = new Date(it.fechaHora);
        if (isNaN(entryDate)) return false;

        if (filtros.desde) {
          const desdeDate = new Date(filtros.desde + 'T00:00:00');
          if (entryDate < desdeDate) return false;
        }

        if (filtros.hasta) {
          const hastaDate = new Date(filtros.hasta + 'T23:59:59');
          if (entryDate > hastaDate) return false;
        }
      }

      return true;
    });

    if (itemsFiltrados.length === 0) {
      lista.innerHTML = `
        <li style='text-align: center; color: #999; padding: 20px;'>
          <span style='font-size: 1.6em;'>🕘</span><br>
          Aún no hay canjes registrados en esta tienda
        </li>
      `;
      return;
    }

    itemsFiltrados.forEach(it => {
      const li = document.createElement('li');
      const display = it.fechaHora ? (isNaN(new Date(it.fechaHora)) ? (it.fecha || '') : new Date(it.fechaHora).toLocaleString()) : (it.fecha || '');
      li.innerHTML = `
        <strong>${it.producto}</strong>
        <div class="meta">${it.costo} pts • cliente: <strong>${it.cliente}</strong> • ${display}</div>
      `;
      lista.appendChild(li);
    });

  } catch (e) {
    console.error('[App] Error en mostrarHistorialTienda:', e);
    lista.innerHTML = '<li style="text-align: center; color: #999;">Error al cargar historial</li>';
  }
}

// Return the list of historial items (unfiltered) for a tienda
function obtenerHistorialParaTienda(tiendaEmail) {
  const usuarios = AuthService.obtenerUsuarios();
  const items = [];

  usuarios.filter(u => u.role === 'cliente').forEach(cliente => {
    const hist = cliente.historial || [];
    for (let i = hist.length - 1; i >= 0; i--) {
      const entry = hist[i];
      if (entry && entry.tienda === tiendaEmail) {
        items.push({
          producto: entry.producto,
          costo: entry.costo,
          fecha: entry.fecha,
          fechaHora: entry.fechaHora || null,
          cliente: cliente.email,
          tienda: entry.tienda
        });
      }
    }
  });

  return items;
}

// Configure event listeners for the historial filters and export button
function configurarHistorialEventos(tiendaEmail) {
  const inputQ = document.getElementById('filtroBusqueda');
  const inputDesde = document.getElementById('filtroDesde');
  const inputHasta = document.getElementById('filtroHasta');
  const btnExport = document.getElementById('btnExportCSV');

  const refrescar = () => mostrarHistorialTienda(tiendaEmail);

  if (inputQ) inputQ.addEventListener('input', refrescar);
  if (inputDesde) inputDesde.addEventListener('change', refrescar);
  if (inputHasta) inputHasta.addEventListener('change', refrescar);
  if (btnExport) btnExport.addEventListener('click', () => exportHistorialCSV(tiendaEmail));
}

// Export the currently filtered historial as CSV
function exportHistorialCSV(tiendaEmail) {
  try {
    // Obtener los datos del DOM (de la lista mostrada)
    const lista = document.getElementById('historialCanjesTienda');
    if (!lista) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('No se encontró la lista de historial', 'error');
      return;
    }

    const items = [];
    const lis = lista.querySelectorAll('li:not(:has(.meta))');
    
    // Si hay un mensaje de "no hay registros", entonces items está vacío
    if (lis.length === 0 || (lis.length === 1 && lis[0].textContent.includes('Aún no hay canjes'))) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('No hay registros que exportar con los filtros actuales', 'warning');
      return;
    }

    // Extraer datos de cada <li>
    lista.querySelectorAll('li:not(:has(span))').forEach(li => {
      const strong = li.querySelector('strong');
      const meta = li.querySelector('.meta');
      
      if (strong && meta) {
        const producto = strong.textContent.trim();
        const metaText = meta.textContent;
        
        // Parsear: "1200 pts • cliente: ana@mail.com • 1/9/2026, 6:02:18 AM"
        const ptsMatch = metaText.match(/(\d+)\s*pts/);
        const clienteMatch = metaText.match(/cliente:\s*([^\s•]+)/);
        const dateMatch = metaText.match(/•\s*(.+)$/);
        
        items.push({
          producto: producto,
          costo: ptsMatch ? ptsMatch[1] : '',
          cliente: clienteMatch ? clienteMatch[1] : '',
          fecha: dateMatch ? dateMatch[1].trim() : '',
          tienda: tiendaEmail
        });
      }
    });

    if (items.length === 0) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('No hay registros que exportar con los filtros actuales', 'warning');
      return;
    }

    // Build CSV content
    const headers = ['Producto', 'Puntos', 'Cliente', 'Fecha', 'Tienda'];
    const rows = [headers.join(',')];
    items.forEach(it => {
      const safe = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      rows.push([safe(it.producto), safe(it.costo), safe(it.cliente), safe(it.fecha), safe(it.tienda)].join(','));
    });

    const csvContent = rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fechaSuffix = new Date().toISOString().slice(0,10).replace(/-/g,'');
    a.href = url;
    a.download = `historial_tienda_${tiendaEmail.replace(/[@.]/g,'_')}_${fechaSuffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('CSV exportado correctamente', 'success');
  } catch (err) {
    console.error('Error exportando CSV:', err);
    if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Error al exportar CSV', 'error');
  }
}

// ========== MODAL PRODUCTO TIENDA (EDITAR/ELIMINAR) ==========
let productoTiendaActual = null; // Variable global para guardar el producto en edición

function abrirModalProductoTienda(producto) {
  productoTiendaActual = producto;
  const modal = document.getElementById('modalProductoTienda');
  
  // Map Supabase field names to display fields (handle both old and new naming)
  const costoPuntos = producto.costo_puntos || producto.costo;
  const precioDolar = producto.precio_dolar || producto.precioDolar;
  const imagen = producto.imagen_url || producto.imagen;
  
  // Llenar formulario con datos del producto
  document.getElementById('editProductoNombre').value = producto.nombre;
  document.getElementById('editProductoDescripcion').value = producto.descripcion || '';
  document.getElementById('editProductoCosto').value = costoPuntos || 0;
  document.getElementById('editProductoStock').value = producto.stock || 0;
  document.getElementById('editProductoPrecio').value = precioDolar || '';
  
  // Mostrar preview en modal de edición
  const editImgFile = document.getElementById('editProductoImagenFile');
  const editImgPreview = document.getElementById('editProductoImagenPreview');
  const editImgClear = document.getElementById('editProductoImagenClear');
  if (editImgFile) editImgFile.value = '';
  if (imagen) {
    if (editImgPreview) editImgPreview.innerHTML = `<img src="${imagen}" alt="Preview" style="max-width:180px; max-height:120px; border-radius:6px; display:block;">`;
    if (editImgClear) editImgClear.style.display = 'inline-block';
  } else {
    if (editImgPreview) editImgPreview.innerHTML = '';
    if (editImgClear) editImgClear.style.display = 'none';
  }
  
  // Abrir modal
  if (modal) modal.classList.add('active');
  
  // Configurar listeners (solo una vez por sesión, pero lo hacemos aquí para seguridad)
  configurarModalProductoTienda();
}

function configurarModalProductoTienda() {
  const modal = document.getElementById('modalProductoTienda');
  const btnGuardar = document.getElementById('btnGuardarProducto');
  const btnEliminar = document.getElementById('btnEliminarProducto');
  const btnCancelar = document.getElementById('btnCancelarProducto');
  const btnCerrar = modal?.querySelector('.modal-close');
  
  if (!modal) return;
  
  // Cerrar modal
  const cerrarModal = () => {
    modal.classList.remove('active');
    productoTiendaActual = null;
  };
  
  btnCerrar?.addEventListener('click', cerrarModal, { once: true });
  btnCancelar?.addEventListener('click', cerrarModal, { once: true });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  }, { once: true });

  // Manejo de imagen en modal: subir a Storage
  const editImgFileInput = document.getElementById('editProductoImagenFile');
  const editImgPreviewEl = document.getElementById('editProductoImagenPreview');
  const editImgClearBtn = document.getElementById('editProductoImagenClear');
  let editImgFileSelected = null;

  // Si se selecciona archivo, mostrar preview y guardar archivo
  editImgFileInput?.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) {
      editImgFileSelected = null;
      editImgPreviewEl && (editImgPreviewEl.innerHTML = '');
      if (editImgClearBtn) editImgClearBtn.style.display = 'none';
      return;
    }
    if (!file.type.startsWith('image/')) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Tipo de archivo no soportado. Selecciona una imagen.', 'warning');
      editImgFileInput.value = '';
      editImgFileSelected = null;
      return;
    }
    if (file.size > (5 * 1024 * 1024)) { // 5MB
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Imagen demasiado grande (máx 5MB).', 'warning');
      editImgFileInput.value = '';
      editImgFileSelected = null;
      return;
    }
    
    // Guardar archivo para subir después
    editImgFileSelected = file;
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(evt) {
      editImgPreviewEl && (editImgPreviewEl.innerHTML = `<img src="${evt.target.result}" alt="Preview" style="max-width:180px; max-height:120px; border-radius:6px; display:block;">`);
      if (editImgClearBtn) editImgClearBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  });

  editImgClearBtn?.addEventListener('click', () => {
    if (editImgFileInput) editImgFileInput.value = '';
    editImgFileSelected = null;
    if (editImgPreviewEl) editImgPreviewEl.innerHTML = '';
    if (editImgClearBtn) editImgClearBtn.style.display = 'none';
  });
  
  // Guardar cambios
  if (btnGuardar) {
    btnGuardar.onclick = async () => {
      if (!productoTiendaActual) return;
      
      const nombre = document.getElementById('editProductoNombre').value.trim();
      const costo = document.getElementById('editProductoCosto').value.trim();
      const precioDolar = document.getElementById('editProductoPrecio').value.trim() || null;
      const descripcion = document.getElementById('editProductoDescripcion').value.trim() || null;
      const imagen = editImgFileSelected || productoTiendaActual.imagen_url || productoTiendaActual.imagen || null;
      const stock = document.getElementById('editProductoStock').value.trim() || 0;
      
      // Validaciones
      if (!nombre) {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('El nombre del producto es requerido', 'warning');
        return;
      }
      
      if (!costo || costo <= 0) {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('El costo debe ser mayor a 0', 'warning');
        return;
      }

      if (stock < 0) {
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('El stock no puede ser negativo', 'warning');
        return;
      }
      
      try {
        const usuarioActivo = AuthService.obtenerUsuarioActivo();
        const resultado = await ProductService.actualizarProducto(
          productoTiendaActual.id,
          usuarioActivo.email,
          nombre,
          costo,
          precioDolar,
          descripcion,
          imagen, // Ahora puede ser File o string URL
          stock
        );
        
        if (resultado.success) {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Producto actualizado correctamente', 'success');
          cerrarModal();
          await mostrarProductosTienda(usuarioActivo.email);
        } else {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
        }
      } catch (err) {
        console.error('Error actualizando producto:', err);
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Error inesperado al actualizar producto', 'error');
      }
    };
  }
  
  // Eliminar producto
  if (btnEliminar) {
    btnEliminar.onclick = async () => {
      if (!productoTiendaActual) return;
      
      if (!confirm(`¿Estás seguro de que deseas eliminar "${productoTiendaActual.nombre}"? Esta acción no se puede deshacer.`)) {
        return;
      }
      
      try {
        const usuarioActivo = AuthService.obtenerUsuarioActivo();
        const resultado = await ProductService.eliminarProducto(productoTiendaActual.id, usuarioActivo.email);
        
        if (resultado.success) {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Producto eliminado correctamente', 'success');
          cerrarModal();
          await mostrarProductosTienda(usuarioActivo.email);
        } else {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(resultado.message, 'error');
        }
      } catch (err) {
        console.error('Error eliminando producto:', err);
        if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Error inesperado al eliminar producto', 'error');
      }
    };
  }
}

function cerrarModalProductoTienda() {
  const modal = document.getElementById('modalProductoTienda');
  if (modal) {
    modal.classList.remove('active');
    productoTiendaActual = null;
  }
}

// ========== LOGOUT ==========
function logout() {
  // Emitir evento de logout antes de limpiar sesión
  const usuario = AuthService.obtenerUsuarioActivo();
  if (usuario && window.EventBus && typeof EventBus.emit === 'function') {
    try { EventBus.emit('usuario-logout', usuario.email); } catch (e) { console.warn('EventBus emit failed (logout)', e); }
  }

  AuthService.cerrarSesion();
  window.location.href = "login.html";
}

// Hacer la función logout disponible globalmente
window.logout = logout;

// ========== EVENTBUS LISTENERS (UI UPDATES & AUDIT) ==========
if (window.EventBus) {
  // Cuando se agregan puntos a un cliente
  EventBus.on('puntos-agregados', (cliente) => {
    try {
      if (window.location.pathname.includes('cliente.html')) {
        if (typeof actualizarInfoCliente === 'function') actualizarInfoCliente(cliente);
        if (typeof mostrarProductosDisponibles === 'function') mostrarProductosDisponibles();
        if (typeof mostrarHistorial === 'function') mostrarHistorial();
      }
      if (window.Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(`Puntos actualizados para ${cliente.email}`, 'success');
      if (window.TransactionService && typeof TransactionService.registrarTransaccion === 'function') {
        TransactionService.registrarTransaccion('compra-puntos', { cliente: cliente.email, puntos: cliente.puntos });
      }
    } catch (err) {
      console.warn('Error en listener puntos-agregados:', err);
    }
  });

  // Cuando se canjea un producto
  EventBus.on('producto-canjeado', (data) => {
    try {
      if (typeof actualizarInfoCliente === 'function') actualizarInfoCliente(data.cliente);
      if (typeof mostrarProductosDisponibles === 'function') mostrarProductosDisponibles();
      if (typeof mostrarHistorial === 'function') mostrarHistorial();

      console.log(`✅ Canje completado - Cliente: ${data.cliente.email} - Producto: ${data.producto.nombre}`);

      if (window.TransactionService && typeof TransactionService.registrarTransaccion === 'function') {
        TransactionService.registrarTransaccion('canje', {
          cliente: data.cliente.email,
          producto: data.producto.nombre,
          puntos: data.producto.costo,
          tienda: data.producto.tienda
        });
      }
    } catch (err) {
      console.warn('Error en listener producto-canjeado:', err);
    }
  });

  // Auditoría de login/logout
  EventBus.on('usuario-login', (usuario) => {
    try {
      if (window.TransactionService && typeof TransactionService.registrarTransaccion === 'function') {
        TransactionService.registrarTransaccion('login', { email: usuario.email, rol: usuario.role });
      }
    } catch (err) {
      console.warn('Error registrando transaccion login:', err);
    }
  });

  EventBus.on('usuario-logout', (email) => {
    try {
      if (window.TransactionService && typeof TransactionService.registrarTransaccion === 'function') {
        TransactionService.registrarTransaccion('logout', { email });
      }
    } catch (err) {
      console.warn('Error registrando transaccion logout:', err);
    }
  });
}

// ============================================================================
// FUNCIONES DE REPORTES Y ESTADÍSTICAS
// ============================================================================

/**
 * Inicializar dashboard de reportes
 */
async function inicializarReportes(tiendaEmail) {
  const btnActualizar = document.getElementById('btnActualizarReportes');
  if (btnActualizar) {
    btnActualizar.addEventListener('click', () => actualizarReportes(tiendaEmail));
  }
  
  // Cargar reportes por primera vez
  await actualizarReportes(tiendaEmail);
}

/**
 * Actualizar todos los reportes según período seleccionado
 */
async function actualizarReportes(tiendaEmail) {
  try {
    const periodoSelect = document.getElementById('reportePeriodo');
    const dias = parseInt(periodoSelect?.value || '7', 10);
    
    console.log('[Reportes] Actualizando con período:', dias, 'días');
    
    // Obtener tienda_id
    const usuarioActivo = AuthService.obtenerUsuarioActivo();
    if (!usuarioActivo || !usuarioActivo.tienda) {
      console.error('[Reportes] No hay datos de tienda');
      return;
    }
    
    const tiendaId = usuarioActivo.tienda.id;
    
    // Obtener todos los datos necesarios
    const config = window._SUPABASE_CONFIG;
    const datos = await obtenerDatosReportes(tiendaId, dias, config);
    
    // Calcular estadísticas
    const stats = calcularEstadisticas(datos);
    
    // Mostrar estadísticas en tarjetas
    mostrarTarjetasEstadisticas(stats);
    
    // Mostrar gráficos
    mostrarGraficos(stats);
    
    // Mostrar tabla de productos
    mostrarTablaEstadisticas(stats);
    
  } catch (err) {
    console.error('[Reportes] Error actualizando reportes:', err);
  }
}

/**
 * Obtener datos de Supabase para el período seleccionado
 */
async function obtenerDatosReportes(tiendaId, diasAtras, config) {
  try {
    const redemUrl = new URL(`${config.url}/rest/v1/redemptions`);
    redemUrl.searchParams.append('select', '*');
    redemUrl.searchParams.append('limit', '1000');
    
    const response = await fetch(redemUrl.toString(), {
      headers: {
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error cargando redemptions');
    }
    
    const allRedemptions = await response.json();
    
    // Obtener productos de la tienda
    const productsUrl = new URL(`${config.url}/rest/v1/products`);
    productsUrl.searchParams.append('tienda_id', `eq.${tiendaId}`);
    productsUrl.searchParams.append('select', 'id,nombre');
    
    const productsResponse = await fetch(productsUrl.toString(), {
      headers: {
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    });
    
    const productos = await productsResponse.json() || [];
    const productIds = productos.map(p => p.id);
    const productMap = {};
    productos.forEach(p => {
      productMap[p.id] = p.nombre;
    });
    
    // Filtrar por tienda y período
    const ahora = new Date();
    const fechaLimite = new Date(ahora.getTime() - (diasAtras * 24 * 60 * 60 * 1000));
    
    const redemptionsFiltered = allRedemptions.filter(r => {
      if (!productIds.includes(r.producto_id)) return false;
      
      if (diasAtras > 0) {
        const fecha = new Date(r.creado_at);
        return fecha >= fechaLimite;
      }
      return true;
    });
    
    return {
      redemptions: redemptionsFiltered,
      productos: productos,
      productMap: productMap
    };
    
  } catch (err) {
    console.error('[Reportes] Error obteniendo datos:', err);
    return { redemptions: [], productos: [], productMap: {} };
  }
}

/**
 * Calcular estadísticas a partir de los datos
 */
function calcularEstadisticas(datos) {
  const { redemptions, productMap } = datos;
  
  console.log('[Reportes] Total redemptions filtradas:', redemptions.length);
  
  // Estadísticas generales
  const totalCanjes = redemptions.length;
  const totalPuntosDistribuidos = redemptions.reduce((sum, r) => sum + (r.puntos_usados || 0), 0);
  const clientesUnicos = new Set(redemptions.map(r => r.perfil_id)).size;
  
  // Agrupar por producto
  const porProducto = {};
  redemptions.forEach(r => {
    if (!porProducto[r.producto_id]) {
      porProducto[r.producto_id] = {
        producto: productMap[r.producto_id] || 'Desconocido',
        canjes: 0,
        puntos: 0
      };
    }
    porProducto[r.producto_id].canjes += 1;
    porProducto[r.producto_id].puntos += r.puntos_usados || 0;
  });
  
  // Producto más vendido
  let productoMasVendido = '-';
  let maxCanjes = 0;
  Object.values(porProducto).forEach(p => {
    if (p.canjes > maxCanjes) {
      maxCanjes = p.canjes;
      productoMasVendido = p.producto;
    }
  });
  
  // Agrupar por día para tendencia
  const porDia = {};
  redemptions.forEach(r => {
    const fecha = new Date(r.creado_at).toISOString().split('T')[0];
    if (!porDia[fecha]) {
      porDia[fecha] = 0;
    }
    porDia[fecha] += 1;
  });
  
  // Convertir a arrays ordenados
  const diasOrdenados = Object.keys(porDia).sort();
  const canjePorDia = diasOrdenados.map(d => ({ fecha: d, canjes: porDia[d] }));
  
  // Convertir productos a array y ordenar
  const productosArray = Object.entries(porProducto).map(([id, data]) => ({
    id,
    ...data
  })).sort((a, b) => b.canjes - a.canjes);
  
  console.log('[Reportes] Productos con datos:', productosArray.length);
  console.log('[Reportes] Días con datos:', canjePorDia.length);
  
  return {
    totalCanjes,
    totalPuntosDistribuidos,
    clientesUnicos,
    productoMasVendido,
    porProducto: productosArray,
    canjePorDia,
    diasOrdenados
  };
}

/**
 * Mostrar tarjetas de estadísticas clave
 */
function mostrarTarjetasEstadisticas(stats) {
  document.getElementById('totalCanjes').textContent = stats.totalCanjes;
  document.getElementById('totalPuntosDistribuidos').textContent = stats.totalPuntosDistribuidos;
  document.getElementById('totalClientes').textContent = stats.clientesUnicos;
  document.getElementById('productoMasVendido').textContent = stats.productoMasVendido;
}

/**
 * Mostrar gráficos
 */
function mostrarGraficos(stats) {
  mostrarGraficoProductos(stats);
  mostrarGraficoTendencia(stats);
}

/**
 * Gráfico de barras: canjes por producto
 */
function mostrarGraficoProductos(stats) {
  const ctx = document.getElementById('chartCanjePorProducto')?.getContext('2d');
  if (!ctx) return;
  
  // Destruir gráfico anterior si existe
  if (window.chartCanjePorProducto && typeof window.chartCanjePorProducto.destroy === 'function') {
    window.chartCanjePorProducto.destroy();
  }
  
  // Validar que tenemos datos
  if (!stats.porProducto || stats.porProducto.length === 0) {
    console.log('[Reportes] No hay datos de productos para mostrar gráfico');
    return;
  }
  
  const labels = stats.porProducto.slice(0, 10).map(p => p.producto);
  const data = stats.porProducto.slice(0, 10).map(p => p.canjes);
  
  window.chartCanjePorProducto = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Canjes',
        data: data,
        backgroundColor: 'rgba(102, 126, 234, 0.7)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

/**
 * Gráfico de línea: tendencia temporal
 */
function mostrarGraficoTendencia(stats) {
  const ctx = document.getElementById('chartTendenciaCanjes')?.getContext('2d');
  if (!ctx) return;
  
  // Destruir gráfico anterior si existe
  if (window.chartTendenciaCanjes && typeof window.chartTendenciaCanjes.destroy === 'function') {
    window.chartTendenciaCanjes.destroy();
  }
  
  // Validar que tenemos datos
  if (!stats.canjePorDia || stats.canjePorDia.length === 0) {
    console.log('[Reportes] No hay datos de tendencia para mostrar gráfico');
    return;
  }
  
  const labels = stats.canjePorDia.map(d => d.fecha);
  const data = stats.canjePorDia.map(d => d.canjes);
  
  window.chartTendenciaCanjes = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Canjes por día',
        data: data,
        borderColor: 'rgba(118, 75, 162, 1)',
        backgroundColor: 'rgba(118, 75, 162, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            boxWidth: 12
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

/**
 * Mostrar tabla de estadísticas por producto
 */
function mostrarTablaEstadisticas(stats) {
  const tbody = document.getElementById('cuerpoTablaEstadisticas');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (stats.porProducto.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #999;">Sin datos de canjes en este período</td></tr>';
    return;
  }
  
  stats.porProducto.forEach(p => {
    const promedio = Math.round(p.puntos / p.canjes);
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e0e0e0';
    tr.innerHTML = `
      <td style="padding: 12px;">${p.producto}</td>
      <td style="padding: 12px; text-align: center;">${p.canjes}</td>
      <td style="padding: 12px; text-align: center;">${p.puntos}</td>
      <td style="padding: 12px; text-align: center;">${promedio}</td>
    `;
    tbody.appendChild(tr);
  });
}