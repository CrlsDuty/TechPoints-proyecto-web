/**
 * tiendas-catalog.js
 * Lógica para el catálogo de tiendas con carrito de compra
 */

let carritoItems = [];
let usuarioActivo = null;
let tiendasData = [];
let productosData = [];

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Verificar autenticación
    usuarioActivo = AuthService.obtenerUsuarioActivo();
    if (!usuarioActivo || usuarioActivo.role === 'tienda') {
      window.location.href = 'login.html';
      return;
    }

    console.log('[Tiendas] Usuario activo:', usuarioActivo.email);

    // Cargar datos
    await cargarTiendasYProductos();
    
    // Mostrar datos iniciales
    mostrarTiendas(tiendasData, productosData);
    actualizarPuntosDisponibles();
    actualizarCarritoUI();

    // Configurar event listeners
    configurarEventListeners();

  } catch (err) {
    console.error('[Tiendas] Error en inicialización:', err);
    alert('Error al cargar las tiendas');
  }
});

// ============================================================================
// CARGAR DATOS DE SUPABASE
// ============================================================================

async function cargarTiendasYProductos() {
  try {
    const config = window._SUPABASE_CONFIG;
    if (!config) {
      throw new Error('Configuración de Supabase no disponible');
    }

    // Cargar tiendas
    const tiendasUrl = new URL(`${config.url}/rest/v1/stores`);
    tiendasUrl.searchParams.append('select', '*');

    const tiendasResponse = await fetch(tiendasUrl.toString(), {
      headers: {
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    });

    if (!tiendasResponse.ok) {
      throw new Error('Error cargando tiendas');
    }

    tiendasData = await tiendasResponse.json();
    console.log('[Tiendas] Tiendas cargadas:', tiendasData.length);

    // Cargar productos
    const productosUrl = new URL(`${config.url}/rest/v1/products`);
    productosUrl.searchParams.append('select', '*');
    productosUrl.searchParams.append('limit', '500');

    const productosResponse = await fetch(productosUrl.toString(), {
      headers: {
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    });

    if (!productosResponse.ok) {
      throw new Error('Error cargando productos');
    }

    productosData = await productosResponse.json();
    
    // Validar y normalizar datos de productos
    productosData = productosData.map(prod => ({
      ...prod,
      costo: parseInt(prod.costo_puntos) || 0,  // ← USAR costo_puntos EN LUGAR DE costo
      stock: parseInt(prod.stock) || 0,
      precio: parseFloat(prod.precio_dolar) || 0
    }));
    
    console.log('[Tiendas] Productos cargados:', productosData.length);
    console.log('[Tiendas] Primeros productos:', productosData.slice(0, 3));

  } catch (err) {
    console.error('[Tiendas] Error cargando datos:', err);
    throw err;
  }
}

// ============================================================================
// MOSTRAR TIENDAS Y PRODUCTOS
// ============================================================================

function mostrarTiendas(tiendas, productos) {
  const lista = document.getElementById('tiendasList');
  lista.innerHTML = '';

  if (tiendas.length === 0) {
    lista.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No hay tiendas disponibles</div>';
    return;
  }

  tiendas.forEach(tienda => {
    const productosTienda = productos.filter(p => p.tienda_id === tienda.id);
    
    if (productosTienda.length === 0) return; // No mostrar tiendas sin productos

    console.log(`[Tiendas] Tienda "${tienda.nombre}" - ${productosTienda.length} productos`);
    productosTienda.forEach(prod => {
      console.log(`  - ${prod.nombre}: ${prod.costo} pts`);
    });

    const card = document.createElement('div');
    card.className = 'tienda-card';
    
    const header = document.createElement('div');
    header.className = 'tienda-header';
    header.innerHTML = `<p class="tienda-nombre">${tienda.nombre || 'Tienda'}</p>`;
    
    const productosDiv = document.createElement('div');
    productosDiv.className = 'tienda-productos';
    
    productosDiv.innerHTML = productosTienda.map(prod => {
      const costo = parseInt(prod.costo) || 0;
      return `
      <div class="producto-item">
        <div class="producto-info">
          <p class="producto-nombre">${prod.nombre}</p>
          <p class="producto-puntos">${costo} pts</p>
          ${prod.descripcion ? `<p class="producto-descripcion">${prod.descripcion}</p>` : ''}
        </div>
        <div class="producto-actions">
          <input type="number" class="cantidad-input" min="1" value="1" data-product-id="${prod.id}" data-tienda-id="${tienda.id}" data-tienda-nombre="${tienda.nombre}">
          <button class="btn-agregar" onclick="agregarAlCarrito(${prod.id}, '${tienda.id}', '${tienda.nombre}')">
            Agregar
          </button>
        </div>
      </div>
    `;
    }).join('');
    
    card.appendChild(header);
    card.appendChild(productosDiv);
    lista.appendChild(card);
  });
}

// ============================================================================
// CARRITO DE COMPRA
// ============================================================================

function agregarAlCarrito(productoId, tiendaId, tiendaNombre) {
  const producto = productosData.find(p => p.id === productoId);
  if (!producto) {
    console.error('[Tiendas] Producto no encontrado:', productoId);
    return;
  }

  const cantidadInput = document.querySelector(`input[data-product-id="${productoId}"]`);
  const cantidad = parseInt(cantidadInput?.value || 1);
  const puntos = parseInt(producto.costo) || 0;

  console.log('[Tiendas] Agregando al carrito:', {
    productoId,
    productoNombre: producto.nombre,
    costoProducto: producto.costo,
    puntosAsignados: puntos,
    cantidad
  });

  if (puntos === 0) {
    console.warn('[Tiendas] ⚠️ ADVERTENCIA: Producto sin costo definido');
  }

  // Buscar si ya existe en el carrito
  const itemExistente = carritoItems.find(item => item.productoId === productoId);
  
  if (itemExistente) {
    itemExistente.cantidad += cantidad;
  } else {
    carritoItems.push({
      productoId: parseInt(productoId),
      productoNombre: producto.nombre,
      tiendaId: tiendaId,
      tiendaNombre: tiendaNombre,
      puntos: puntos,
      cantidad: cantidad
    });
  }

  if (Utils && typeof Utils.mostrarToast === 'function') {
    Utils.mostrarToast(`${producto.nombre} agregado al carrito`, 'success');
  }

  actualizarCarritoUI();
  console.log('[Tiendas] Carrito actualizado:', JSON.stringify(carritoItems));
}

function quitarDelCarrito(productoId) {
  carritoItems = carritoItems.filter(item => item.productoId !== productoId);
  actualizarCarritoUI();
}

function actualizarCantidadCarrito(productoId, nuevaCantidad) {
  const cantidad = parseInt(nuevaCantidad) || 1;
  if (cantidad <= 0) {
    quitarDelCarrito(productoId);
    return;
  }
  const item = carritoItems.find(item => item.productoId === productoId);
  if (item) {
    item.cantidad = cantidad;
    actualizarCarritoUI();
  }
}

function actualizarCantidadCarrito(productoId, nuevaCantidad) {
  const item = carritoItems.find(item => item.productoId === productoId);
  if (item) {
    item.cantidad = Math.max(1, parseInt(nuevaCantidad));
    actualizarCarritoUI();
  }
}

function actualizarCarritoUI() {
  // Actualizar contador en el botón
  const cartCount = document.getElementById('cartCount');
  const totalItems = carritoItems.reduce((sum, item) => sum + item.cantidad, 0);
  cartCount.textContent = totalItems;

  // Actualizar tabla del carrito
  const tbody = document.getElementById('cuerpoTablaCarrito');
  const carritoVacio = document.getElementById('carritoVacio');

  if (carritoItems.length === 0) {
    if (carritoVacio) {
      carritoVacio.style.display = '';
    }
    if (tbody) {
      tbody.innerHTML = '<tr id="carritoVacio"><td colspan="6" style="padding: 20px; text-align: center; color: #999;">El carrito está vacío</td></tr>';
    }
    document.getElementById('totalCarrito').textContent = '0';
    document.getElementById('btnRealizarCompra').disabled = true;
    return;
  }

  if (carritoVacio) {
    carritoVacio.style.display = 'none';
  }
  
  tbody.innerHTML = '';

  let totalPuntos = 0;

  carritoItems.forEach(item => {
    const puntos = parseInt(item.puntos) || 0;
    const cantidad = parseInt(item.cantidad) || 1;
    const totalItem = puntos * cantidad;
    totalPuntos += totalItem;

    console.log('[CarritoUI] Item:', {
      nombre: item.productoNombre,
      puntos,
      cantidad,
      totalItem,
      puntosPrueba: item.puntos,
      cantidadPrueba: item.cantidad
    });

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e0e0e0';
    tr.innerHTML = `
      <td style="padding: 12px;">${item.productoNombre}</td>
      <td style="padding: 12px; text-align: center; font-size: 0.9em;">${item.tiendaNombre}</td>
      <td style="padding: 12px; text-align: center;">${puntos}</td>
      <td style="padding: 12px; text-align: center;">
        <input type="number" min="1" value="${cantidad}" style="width: 50px; padding: 4px; border: 1px solid #d0d0d0; border-radius: 4px;" 
               onchange="actualizarCantidadCarrito(${item.productoId}, this.value)">
      </td>
      <td style="padding: 12px; text-align: center; font-weight: 600;">${totalItem}</td>
      <td style="padding: 12px; text-align: center;">
        <button onclick="quitarDelCarrito(${item.productoId})" class="btn-secondary" style="padding: 4px 8px; font-size: 0.85em;">
          ✕ Quitar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  console.log('[CarritoUI] Total puntos calculado:', totalPuntos);
  document.getElementById('totalCarrito').textContent = totalPuntos;
  document.getElementById('btnRealizarCompra').disabled = carritoItems.length === 0;
}

function actualizarPuntosDisponibles() {
  const puntos = usuarioActivo?.puntos || 0;
  document.getElementById('puntosMiembroValor').textContent = puntos;
  document.getElementById('puntosDisponibles').textContent = puntos;
}

// ============================================================================
// CHECKOUT
// ============================================================================

function realizarCompra() {
  if (carritoItems.length === 0) {
    if (Utils && typeof Utils.mostrarToast === 'function') {
      Utils.mostrarToast('El carrito está vacío', 'warning');
    }
    return;
  }

  const totalPuntos = carritoItems.reduce((sum, item) => {
    const puntos = parseInt(item.puntos) || 0;
    const cantidad = parseInt(item.cantidad) || 1;
    return sum + (puntos * cantidad);
  }, 0);

  console.log('[Tiendas] Total de puntos a gastar:', totalPuntos);
  console.log('[Tiendas] Puntos disponibles:', usuarioActivo.puntos);
  
  if (usuarioActivo.puntos < totalPuntos) {
    if (Utils && typeof Utils.mostrarToast === 'function') {
      Utils.mostrarToast('No tienes suficientes puntos para esta compra', 'error');
    }
    return;
  }

  // Mostrar modal de confirmación
  mostrarConfirmacion(totalPuntos);
}

function mostrarConfirmacion(totalPuntos) {
  const modalConfirm = document.getElementById('modalConfirmacion');
  document.getElementById('confirmPuntos').textContent = totalPuntos;
  
  const detalle = document.getElementById('confirmDetalle');
  detalle.innerHTML = carritoItems.map(item => {
    const puntos = parseInt(item.puntos) || 0;
    const cantidad = parseInt(item.cantidad) || 1;
    return `
    <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
      <strong>${item.productoNombre}</strong> (${item.tiendaNombre}) × ${cantidad} = ${puntos * cantidad} pts
    </li>
  `;
  }).join('');

  modalConfirm.style.display = 'flex';
  modalConfirm.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

async function confirmarCompra() {
  try {
    const totalPuntos = carritoItems.reduce((sum, item) => sum + (parseInt(item.puntos) || 0) * (parseInt(item.cantidad) || 1), 0);
    
    console.log('[ConfirmarCompra] Iniciando...');
    console.log('[ConfirmarCompra] Total puntos a descontar:', totalPuntos);
    console.log('[ConfirmarCompra] Items en carrito:', carritoItems.length);

    if (usuarioActivo.puntos < totalPuntos) {
      throw new Error('Puntos insuficientes');
    }

    const config = window._SUPABASE_CONFIG;
    const puntosNuevos = usuarioActivo.puntos - totalPuntos;
    const token = await obtenerTokenAutenticado();

    // Crear redemption para cada item (con cantidad total)
    for (const item of carritoItems) {
      const puntos = parseInt(item.puntos) || 0;
      const cantidad = parseInt(item.cantidad) || 1;

      console.log('[ConfirmarCompra] Procesando item:', {
        productoId: item.productoId,
        nombre: item.productoNombre,
        puntosUnitario: puntos,
        cantidad: cantidad,
        puntosUsados: puntos,
        puntosSinParse: item.puntos
      });

      const redemUrl = new URL(`${config.url}/rest/v1/redemptions`);

      // Crear un redemption por cada unidad comprada
      for (let i = 0; i < cantidad; i++) {
        const redemData = {
          perfil_id: usuarioActivo.id,
          producto_id: parseInt(item.productoId),
          puntos_usados: puntos,  // Puntos unitarios, no totales
          estado: 'completado'
        };

        console.log(`[ConfirmarCompra] Enviando redemption ${i + 1}/${cantidad}:`, redemData);

        const redemResponse = await fetch(redemUrl.toString(), {
          method: 'POST',
          headers: {
            'apikey': config.anonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(redemData)
        });

        if (!redemResponse.ok) {
          const error = await redemResponse.text();
          console.error('[Tiendas] Error creando redemption:', error);
          throw new Error('Error al registrar el canje');
        }
      }
      
      console.log('[ConfirmarCompra] Redemptions registrados correctamente para:', item.productoNombre);
    }

    // Actualizar puntos del usuario
    console.log('[ConfirmarCompra] Actualizando puntos del usuario. Antes:', usuarioActivo.puntos, 'Después:', puntosNuevos);
    usuarioActivo.puntos = puntosNuevos;
    
    // Recargar historial desde Supabase
    console.log('[ConfirmarCompra] Recargando historial desde Supabase...');
    if (AuthService && typeof AuthService.cargarHistorialDesdeSupabase === 'function') {
      try {
        const historialActualizado = await AuthService.cargarHistorialDesdeSupabase(usuarioActivo.id);
        usuarioActivo.historial = historialActualizado;
        console.log('[ConfirmarCompra] Historial actualizado:', historialActualizado.length, 'canjes');
      } catch (err) {
        console.error('[ConfirmarCompra] Error cargando historial:', err);
      }
    }
    
    AuthService.actualizarUsuario(usuarioActivo);

    // Limpiar carrito
    carritoItems = [];
    actualizarCarritoUI();
    actualizarPuntosDisponibles();

    // Cerrar modales
    cerrarModales();

    if (Utils && typeof Utils.mostrarToast === 'function') {
      Utils.mostrarToast('¡Compra realizada con éxito!', 'success');
    } else {
      alert('✅ ¡Compra realizada con éxito!');
    }

    console.log('[Tiendas] Compra completada. Puntos restantes:', puntosNuevos);

  } catch (err) {
    console.error('[Tiendas] Error en compra:', err);
    if (Utils && typeof Utils.mostrarToast === 'function') {
      Utils.mostrarToast('Error al procesar la compra: ' + err.message, 'error');
    } else {
      alert('Error al procesar la compra: ' + err.message);
    }
  }
}

function cerrarModales() {
  const modalCarrito = document.getElementById('modalCarrito');
  const modalConfirmacion = document.getElementById('modalConfirmacion');
  
  if (modalCarrito) {
    modalCarrito.style.display = 'none';
    modalCarrito.setAttribute('aria-hidden', 'true');
  }
  if (modalConfirmacion) {
    modalConfirmacion.style.display = 'none';
    modalConfirmacion.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

async function obtenerTokenAutenticado() {
  try {
    // Intentar obtener desde la sesión del usuario
    if (usuarioActivo?.session?.access_token) {
      return usuarioActivo.session.access_token;
    }

    // Intentar obtener desde Supabase
    const session = await Supabase.auth.getSession();
    if (session?.data?.session?.access_token) {
      return session.data.session.access_token;
    }

    // Fallback a localStorage
    const token = localStorage.getItem('sb-auth-token');
    if (token) {
      return token;
    }

    throw new Error('No se encontró token de autenticación');
  } catch (err) {
    console.error('[Tiendas] Error obteniendo token:', err);
    throw err;
  }
}

// ============================================================================
// FILTROS
// ============================================================================

function aplicarFiltros() {
  const filtroTienda = document.getElementById('filtroTienda')?.value.toLowerCase() || '';
  const filtroProducto = document.getElementById('filtroProducto')?.value.toLowerCase() || '';
  const filtroPuntos = parseInt(document.getElementById('filtroPuntos')?.value || '9999');

  let tiendasFiltradas = tiendasData;
  let productosFiltrados = productosData;

  // Filtrar tiendas por nombre
  if (filtroTienda) {
    tiendasFiltradas = tiendasData.filter(t => (t.nombre || '').toLowerCase().includes(filtroTienda));
  }

  // Filtrar productos por nombre y puntos
  if (filtroProducto || filtroPuntos < 9999) {
    productosFiltrados = productosData.filter(p => {
      const nombreMatch = !filtroProducto || (p.nombre || '').toLowerCase().includes(filtroProducto);
      const puntosMatch = (parseInt(p.costo_puntos) || 0) <= filtroPuntos;
      return nombreMatch && puntosMatch;
    });
  }

  mostrarTiendas(tiendasFiltradas, productosFiltrados);
}

function limpiarFiltros() {
  document.getElementById('filtroTienda').value = '';
  document.getElementById('filtroProducto').value = '';
  document.getElementById('filtroPuntos').value = '';
  mostrarTiendas(tiendasData, productosData);
}

// ============================================================================
// MODALES Y EVENT LISTENERS
// ============================================================================

function configurarEventListeners() {
  // Carrito
  document.getElementById('btnCarrito')?.addEventListener('click', () => {
    const modal = document.getElementById('modalCarrito');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  });

  document.getElementById('btnCancelarCarrito')?.addEventListener('click', () => {
    const modal = document.getElementById('modalCarrito');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  });

  document.getElementById('btnRealizarCompra')?.addEventListener('click', realizarCompra);

  // Confirmación
  document.getElementById('btnConfirmarCompra')?.addEventListener('click', confirmarCompra);

  document.getElementById('btnCancelarConfirm')?.addEventListener('click', () => {
    const modal = document.getElementById('modalConfirmacion');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  });

  // Cerrar modales al hacer click en X
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    });
  });

  // Cerrar modales al hacer click fuera
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  });

  // Filtros
  document.getElementById('filtroTienda')?.addEventListener('input', aplicarFiltros);
  document.getElementById('filtroProducto')?.addEventListener('input', aplicarFiltros);
  document.getElementById('filtroPuntos')?.addEventListener('change', aplicarFiltros);
  document.getElementById('btnLimpiarFiltros')?.addEventListener('click', limpiarFiltros);

  // Cerrar sesión
  document.getElementById('btnCerrarSesion')?.addEventListener('click', () => {
    AuthService.cerrarSesion();
    window.location.href = 'login.html';
  });
}

// Hacer funciones globales para uso en HTML
window.agregarAlCarrito = agregarAlCarrito;
window.quitarDelCarrito = quitarDelCarrito;
window.actualizarCantidadCarrito = actualizarCantidadCarrito;
