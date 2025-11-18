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
  // Mostrar/ocultar campos de tienda según el rol seleccionado
  const roleSelect = document.getElementById("role");
  const storeFields = document.getElementById("storeFields");
  if (roleSelect && storeFields) {
    const toggleStoreFields = () => {
      storeFields.style.display = roleSelect.value === 'tienda' ? 'block' : 'none';
    };
    roleSelect.addEventListener('change', toggleStoreFields);
    toggleStoreFields();
  }

  formRegistro.addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;
    const submitBtn = formRegistro.querySelector('button[type="submit"]');

    // Recopilar información adicional si es tienda
    const tiendaInfo = role === 'tienda' ? {
      nombre: document.getElementById("nombreTienda")?.value.trim() || '',
      direccion: document.getElementById("direccionTienda")?.value.trim() || '',
      telefono: document.getElementById("telefonoTienda")?.value.trim() || '',
      horario: document.getElementById("horarioTienda")?.value.trim() || '',
      responsable: document.getElementById("responsableTienda")?.value.trim() || ''
    } : null;

    // --- Validaciones ---
    const inputEmail = document.getElementById('email');
    const inputPassword = document.getElementById('password');
    const inputNombreTienda = document.getElementById('nombreTienda');
    const inputTelefonoTienda = document.getElementById('telefonoTienda');
    const errNombre = document.getElementById('err-nombreTienda');
    const errTelefono = document.getElementById('err-telefonoTienda');

    const setFieldError = (inputEl, msgEl, message) => {
      if (inputEl) inputEl.classList.add('input-error');
      if (msgEl) msgEl.textContent = message;
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast(message, 'warning');
    };

    const clearFieldError = (inputEl, msgEl) => {
      if (inputEl) inputEl.classList.remove('input-error');
      if (msgEl) msgEl.textContent = '';
    };

    // limpiar errores al escribir
    [inputEmail, inputPassword, inputNombreTienda, inputTelefonoTienda].forEach(el => {
      if (!el) return;
      el.addEventListener('input', () => clearFieldError(el, document.getElementById('err-' + el.id)));
    });

    // Validar rol
    if (!role) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Por favor selecciona un tipo de cuenta', 'warning');
      return;
    }

    // Validar email
    if (!AuthService.validarEmail(email)) {
      setFieldError(inputEmail, null, 'Email inválido');
      return;
    }

    // Verificar si email ya existe
    if (AuthService.buscarUsuarioPorEmail(email)) {
      setFieldError(inputEmail, null, 'Este correo ya está registrado');
      return;
    }

    // Validar contraseña mínima
    if (!password || password.length < 4) {
      setFieldError(inputPassword, null, 'La contraseña debe tener al menos 4 caracteres');
      return;
    }

    // Validaciones básicas para tiendas: requerir nombre y teléfono
    if (role === 'tienda') {
      if (!tiendaInfo.nombre) {
        setFieldError(inputNombreTienda, errNombre, 'El nombre de la tienda es requerido');
        (inputNombreTienda || inputEmail).focus();
        return;
      }

      if (!tiendaInfo.telefono) {
        setFieldError(inputTelefonoTienda, errTelefono, 'El teléfono o contacto es requerido');
        (inputTelefonoTienda || inputNombreTienda || inputEmail).focus();
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    // Demostración de callback (Utils.delayWithCallback)
    if (window.Utils && typeof Utils.delayWithCallback === 'function') {
      Utils.delayWithCallback(400, () => {
        const resultado = AuthService.registrarUsuario(email, password, role, tiendaInfo);

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
      const resultado = AuthService.registrarUsuario(email, password, role, tiendaInfo);
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

async function inicializarCliente(usuarioActivo) {
  actualizarInfoCliente(usuarioActivo);
  await mostrarProductosDisponibles();
  mostrarHistorial();
  configurarModal();
}

function actualizarInfoCliente(usuario) {
  const resultado = document.getElementById("resultado");
  if (resultado) {
    // Cargar puntos desde Supabase si está disponible
    if (typeof window.supabase !== 'undefined' && window.supabase) {
      // Get current user from auth session
      const authResult = window.supabase.auth && window.supabase.auth.getUser && window.supabase.auth.getUser();
      const authUser = authResult && authResult.data && authResult.data.user;
      const userId = authUser && authUser.id;
      
      console.log('[App] Current auth user:', authUser);
      console.log('[App] Current user ID:', userId);
      
      // Check if this is a local fallback user (ID starts with 'local-')
      const isLocalUser = userId && typeof userId === 'string' && userId.startsWith('local-');
      
      if (userId && !isLocalUser) {
        // Query profile by ID from Supabase (only for real Supabase users)
        window.supabase
          .from('profiles')
          .select('puntos, email')
          .eq('id', userId)
          .then((res) => {
            console.log('[App] Profiles query response:', res);
            const { data, error } = res;
            if (!error && data) {
              // data could be single object or array depending on if .single() was used
              const profileData = Array.isArray(data) ? data[0] : data;
              if (profileData) {
                const puntos = parseInt(profileData.puntos) || 0;
                console.log('[App] Puntos cargados de Supabase:', puntos, 'para usuario:', profileData.email);
                resultado.innerHTML = `
                  <strong>👤 ${usuario.email}</strong><br>
                  💰 Puntos disponibles: <strong style="font-size: 1.3em; color: #0ea5e9;">${puntos}</strong>
                `;
                // Actualizar en memoria también
                usuario.puntos = puntos;
                AuthService.guardarUsuarioActivo(usuario);
              } else {
                console.warn('[App] No profile data found');
                resultado.innerHTML = `
                  <strong>👤 ${usuario.email}</strong><br>
                  💰 Puntos disponibles: <strong style="font-size: 1.3em; color: #0ea5e9;">${usuario.puntos || 0}</strong>
                `;
              }
            } else {
              console.warn('[App] Error cargando puntos:', error?.message);
              // Fallback si hay error
              resultado.innerHTML = `
                <strong>👤 ${usuario.email}</strong><br>
                💰 Puntos disponibles: <strong style="font-size: 1.3em; color: #0ea5e9;">${usuario.puntos || 0}</strong>
              `;
            }
          })
          .catch(err => {
            console.error('[App] Error en query profiles:', err);
            // Mostrar datos del usuario local como fallback
            resultado.innerHTML = `
              <strong>👤 ${usuario.email}</strong><br>
              💰 Puntos disponibles: <strong style="font-size: 1.3em; color: #0ea5e9;">${usuario.puntos || 0}</strong>
            `;
          });
      } else {
        // Es un usuario local o no hay userId, solo mostrar desde usuario actual
        console.log('[App] Usuario local (fallback):', isLocalUser ? 'Sí' : 'No hay userId');
        resultado.innerHTML = `
          <strong>👤 ${usuario.email}</strong><br>
          💰 Puntos disponibles: <strong style="font-size: 1.3em; color: #0ea5e9;">${usuario.puntos || 0}</strong>
        `;
      }
    } else {
      resultado.innerHTML = `
        <strong>👤 ${usuario.email}</strong><br>
        💰 Puntos disponibles: <strong style="font-size: 1.3em; color: #0ea5e9;">${usuario.puntos || 0}</strong>
      `;
    }
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

async function mostrarProductosDisponibles() {
  const productos = await ProductService.obtenerProductos();
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
      <h3 class="producto-nombre">${producto.nombre}</h3>
      <p class="producto-tienda">Por ${producto.tienda_nombre || producto.tienda || 'Tienda desconocida'}</p>
      <div class="producto-precios">
        <div class="precio-dolar">
          <span class="label">Precio:</span>
          <span class="valor">$${precioDolar.toFixed(2)}</span>
        </div>
        <div class="precio-puntos">
          <span class="label">Puntos:</span>
          <span class="valor">${costoPuntos} pts</span>
        </div>
      </div>
      ${sinStock ? `<div style="color: #ef4444; font-weight: 600; text-align: center; padding: 8px; background: #fee2e2; border-radius: 4px; margin-bottom: 8px;">❌ Sin Stock</div>` : ''}
      <button class="producto-btn" ${sinStock ? 'disabled' : ''}>Ver Detalles</button>
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
  
  // Mostrar estado de stock
  const stockContainer = document.getElementById("modalProductoStock");
  if (!stockContainer) {
    // Si no existe, crear dinámicamente después del modal
    console.warn('modalProductoStock container no encontrado');
  } else {
    if (sinStock) {
      stockContainer.innerHTML = '<div style="color: #ef4444; font-weight: 600; background: #fee2e2; padding: 12px; border-radius: 6px; text-align: center; margin-bottom: 16px;">⚠️ Este producto no está disponible en stock</div>';
    } else {
      stockContainer.innerHTML = '';
    }
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
      const display = item.fechaHora ? (isNaN(new Date(item.fechaHora)) ? (item.fecha || '') : new Date(item.fechaHora).toLocaleString()) : (item.fecha || '');
      li.innerHTML = `
        <strong>${item.producto}</strong>
        <span>
          ${item.costo} puntos • ${item.tienda} • ${display}
        </span>
      `;
    }
    historial.appendChild(li);
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
    AuthService.actualizarUsuario(usuarioActualizado);

    // Actualizar la UI
    mostrarInfoTienda(usuarioActualizado);

    // Cerrar modal y mostrar toast
    cerrarModal();
    if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Perfil actualizado correctamente', 'success');
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

  // Imagen: solo subir archivo (dataURL)
  const imagenProdFile = document.getElementById('imagenProdFile');
  const imagenProdPreview = document.getElementById('imagenProdPreview');
  const imagenProdClear = document.getElementById('imagenProdClear');

  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

  function mostrarPreviewElemento(container, src) {
    if (!container) return;
    if (!src) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = `<img src="${src}" alt="Preview imagen" style="max-width: 180px; max-height: 120px; border-radius:6px; display:block;">`;
  }

  // Si selecciona archivo, leer como dataURL y poner en variable global
  let imagenProdDataUrl = null;
  imagenProdFile?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      imagenProdDataUrl = null;
      mostrarPreviewElemento(imagenProdPreview, '');
      imagenProdClear && (imagenProdClear.style.display = 'none');
      return;
    }
    if (!file.type.startsWith('image/')) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Tipo de archivo no soportado. Selecciona una imagen.', 'warning');
      imagenProdFile.value = '';
      imagenProdDataUrl = null;
      mostrarPreviewElemento(imagenProdPreview, '');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Imagen demasiado grande (máx 2MB).', 'warning');
      imagenProdFile.value = '';
      imagenProdDataUrl = null;
      mostrarPreviewElemento(imagenProdPreview, '');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
      imagenProdDataUrl = evt.target.result;
      mostrarPreviewElemento(imagenProdPreview, imagenProdDataUrl);
      imagenProdClear && (imagenProdClear.style.display = 'inline-block');
    };
    reader.readAsDataURL(file);
  });

  imagenProdClear?.addEventListener('click', () => {
    if (imagenProdFile) imagenProdFile.value = '';
    imagenProdDataUrl = null;
    mostrarPreviewElemento(imagenProdPreview, '');
    imagenProdClear.style.display = 'none';
  });

  formProducto.addEventListener("submit", e => {
    e.preventDefault();
    
    const nombre = document.getElementById("nombreProd").value.trim();
    const costo = document.getElementById("costoProd").value.trim();
    const precioDolar = document.getElementById("precioDolarProd")?.value.trim() || null;
    const descripcion = document.getElementById("descripcionProd")?.value.trim() || null;
    const imagen = imagenProdDataUrl || null;
    const stock = document.getElementById("stockProd")?.value.trim() || "0";
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
          imagen,
          stock
        );

        if (resultado.success) {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Producto agregado correctamente', 'success');
          formProducto.reset();
          document.getElementById("stockProd").value = "0";
          imagenProdDataUrl = null;
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
        submitBtn.textContent = 'Agregar Producto';
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

// Mostrar historial de canjes filtrado por tienda (agrega cliente y ordena por entrada reciente)
function mostrarHistorialTienda(tiendaEmail) {
  const lista = document.getElementById('historialCanjesTienda');
  if (!lista) return;

  lista.innerHTML = '';

  const usuarios = AuthService.obtenerUsuarios();
  const items = [];

  usuarios.filter(u => u.role === 'cliente').forEach(cliente => {
    const hist = cliente.historial || [];
    // recorrer del más reciente al más antiguo por cliente
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

  // Apply filters from the UI
  const filtros = {
    q: document.getElementById('filtroBusqueda')?.value.trim() || '',
    desde: document.getElementById('filtroDesde')?.value || '',
    hasta: document.getElementById('filtroHasta')?.value || ''
  };

  const itemsFiltrados = items.filter(it => {
    // Search filter (producto or cliente)
    const q = filtros.q.toLowerCase();
    if (q) {
      const matches = (it.producto || '').toLowerCase().includes(q) || (it.cliente || '').toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Date range filter using fechaHora (ISO) if available, otherwise fall back to fecha
    if (filtros.desde || filtros.hasta) {
      const iso = it.fechaHora || null;
      // If there's no ISO timestamp, skip date filtering for that entry (or try to parse 'fecha')
      if (!iso) return false;

      const entryDate = new Date(iso);
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
    const allItems = obtenerHistorialParaTienda(tiendaEmail);
    const q = document.getElementById('filtroBusqueda')?.value.trim().toLowerCase() || '';
    const desde = document.getElementById('filtroDesde')?.value || '';
    const hasta = document.getElementById('filtroHasta')?.value || '';

    const filtered = allItems.filter(it => {
      if (q) {
        const matches = (it.producto || '').toLowerCase().includes(q) || (it.cliente || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (desde || hasta) {
        if (!it.fechaHora) return false;
        const entryDate = new Date(it.fechaHora);
        if (isNaN(entryDate)) return false;
        if (desde) {
          const desdeDate = new Date(desde + 'T00:00:00');
          if (entryDate < desdeDate) return false;
        }
        if (hasta) {
          const hastaDate = new Date(hasta + 'T23:59:59');
          if (entryDate > hastaDate) return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('No hay registros que exportar con los filtros actuales', 'warning');
      return;
    }

    // Build CSV content
    const headers = ['fechaHora','fechaLocal','producto','costo','cliente','tienda'];
    const rows = [headers.join(',')];
    filtered.forEach(it => {
      const fechaISO = it.fechaHora || '';
      const fechaLocal = it.fechaHora ? (isNaN(new Date(it.fechaHora)) ? (it.fecha || '') : new Date(it.fechaHora).toLocaleString()) : (it.fecha || '');
      const safe = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      rows.push([safe(fechaISO), safe(fechaLocal), safe(it.producto), safe(it.costo), safe(it.cliente), safe(it.tienda)].join(','));
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

  // Manejo de imagen en modal: solo archivo
  const editImgFileInput = document.getElementById('editProductoImagenFile');
  const editImgPreviewEl = document.getElementById('editProductoImagenPreview');
  const editImgClearBtn = document.getElementById('editProductoImagenClear');
  let editImgDataUrl = null;

  // Si se selecciona archivo, leer y convertir a dataURL
  editImgFileInput?.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) {
      editImgDataUrl = null;
      editImgPreviewEl && (editImgPreviewEl.innerHTML = '');
      if (editImgClearBtn) editImgClearBtn.style.display = 'none';
      return;
    }
    if (!file.type.startsWith('image/')) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Tipo de archivo no soportado. Selecciona una imagen.', 'warning');
      editImgFileInput.value = '';
      editImgDataUrl = null;
      return;
    }
    if (file.size > (2 * 1024 * 1024)) {
      if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Imagen demasiado grande (máx 2MB).', 'warning');
      editImgFileInput.value = '';
      editImgDataUrl = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
      editImgDataUrl = evt.target.result;
      editImgPreviewEl && (editImgPreviewEl.innerHTML = `<img src="${editImgDataUrl}" alt="Preview" style="max-width:180px; max-height:120px; border-radius:6px; display:block;">`);
      if (editImgClearBtn) editImgClearBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  });

  editImgClearBtn?.addEventListener('click', () => {
    if (editImgFileInput) editImgFileInput.value = '';
    editImgDataUrl = null;
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
      const imagen = editImgDataUrl || productoTiendaActual.imagen || null;
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
          imagen,
          stock
        );
        
        if (resultado.success) {
          if (Utils && typeof Utils.mostrarToast === 'function') Utils.mostrarToast('Producto actualizado correctamente', 'success');
          cerrarModal();
          // Simplemente recargar la lista (que ahora incluye el cambio en localStorage)
          // Sin esperar a Supabase que podría tener datos viejos
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
}