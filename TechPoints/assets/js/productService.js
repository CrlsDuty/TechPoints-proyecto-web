// services/productService.js
// Servicio de productos - maneja toda la lógica de productos
// Adaptado para usar Supabase cuando está disponible, con fallback a localStorage

const ProductService = {
  // Devuelve true si Supabase está habilitado
  isSupabaseEnabled() {
    return typeof window.supabase !== 'undefined' && window.supabase !== null;
  },

  // Obtener todos los productos desde Supabase o localStorage
  async obtenerProductos() {
    if (this.isSupabaseEnabled()) {
      try {
        console.log('[ProductService] Obteniendo productos de Supabase...');
        // Simplificar query: sin joins que causen HTTP 400
        const { data, error } = await window.supabase
          .from('products')
          .select('*')
          .order('creado_at', { ascending: false });
        
        if (error) {
          console.error('[ProductService] Error de Supabase:', error.message);
          // Mostrar toast al usuario
          if (window.Utils && typeof Utils.mostrarToast === 'function') {
            Utils.mostrarToast('⚠️ Usando datos locales (Supabase no disponible)', 'warning');
          }
          throw error;
        }
        
        console.log('[ProductService] Productos obtenidos de Supabase:', data?.length || 0);
        
        // Mapear datos - ya no necesitamos joins
        return (data || []).map(p => {
          return {
            ...p,
            tienda: 'Supabase',  // Marca que viene de Supabase
            tienda_id: p.tienda_id
          };
        });
      } catch (e) {
        console.error('[ProductService] Error obteniendo productos de Supabase:', e.message);
        console.log('[ProductService] Revirtiendo a localStorage');
        const fallback = StorageService.get('productos', []) || [];
        console.log('[ProductService] Productos en fallback (localStorage):', fallback.length);
        return fallback;
      }
    }
    console.log('[ProductService] Supabase no disponible, usando localStorage');
    return StorageService.get('productos', []) || [];
  },

  // Guardar productos en localStorage (fallback)
  guardarProductos(productos) {
    StorageService.set('productos', productos);
  },

  // Agregar nuevo producto
  async agregarProducto(tiendaEmail, nombre, costo, precioDolar = null, descripcion = null, imagen = null, stock = 0) {
    if (this.isSupabaseEnabled()) {
      try {
        console.log('[ProductService] Intentando agregar producto a Supabase...');
        
        // Obtener usuario actual
        const usuario = (await window.supabase.auth.getUser()).data?.user;
        
        // Si es usuario local (fallback), usar localStorage
        if (!usuario || usuario.id?.startsWith('local-')) {
          console.log('[ProductService] Usuario local detected, usando fallback localStorage');
          // Delegar a fallback
          throw new Error('Usuario local - usar fallback');
        }

        // Obtener tienda del propietario autenticado
        const { data: stores, error: storeError } = await window.supabase
          .from('stores')
          .select('id')
          .eq('owner_id', usuario.id)
          .single();

        if (storeError || !stores) {
          console.warn('[ProductService] Store not found for user, using fallback');
          throw new Error('No tienda registrada - usar fallback');
        }

        const nuevoProducto = {
          tienda_id: stores.id,
          nombre: nombre.trim(),
          descripcion: descripcion ? descripcion.trim() : null,
          costo_puntos: parseInt(costo),
          precio_dolar: precioDolar ? parseFloat(precioDolar) : null,
          imagen_url: imagen ? imagen.trim() : null,
          stock: parseInt(stock) || 0
        };

        // Usar fetch directo a PostgREST REST API para INSERT
        const url = `${window.supabase.url}/rest/v1/products`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': window.supabase._anonKey,
          'Prefer': 'return=representation'
        };

        console.log('[ProductService] Fetch directo INSERT a:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(nuevoProducto)
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[ProductService] ✅ Producto agregado a Supabase:', data);
          return { success: true, producto: Array.isArray(data) ? data[0] : data };
        } else {
          const errorText = await response.text();
          console.warn('[ProductService] ⚠️ Error HTTP ' + response.status + ':', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (e) {
        console.error('[ProductService] Error agregando producto a Supabase:', e);
        console.log('[ProductService] Cayendo a fallback localStorage');
        // Caer a fallback si hay error
      }
    }

    // Fallback: localStorage
    return new Promise(async (resolve) => {
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(300);

      if (!nombre || !costo) {
        return resolve({ success: false, message: 'Nombre y costo son requeridos' });
      }

      if (costo <= 0) {
        return resolve({ success: false, message: 'El costo debe ser mayor a 0' });
      }

      const productos = await this.obtenerProductos();
      const nuevoProducto = {
        id: Date.now(),
        tienda: tiendaEmail,
        nombre: nombre.trim(),
        costo: parseInt(costo),
        precioDolar: precioDolar ? parseFloat(precioDolar) : null,
        descripcion: descripcion ? descripcion.trim() : null,
        imagen: imagen ? imagen.trim() : null,
        stock: parseInt(stock) || 0
      };

      productos.push(nuevoProducto);
      this.guardarProductos(productos);
      return resolve({ success: true, producto: nuevoProducto });
    });
  },

  // Obtener productos de una tienda específica
  async obtenerProductosPorTienda(tiendaEmail) {
    // Siempre traer de Supabase para mantener sincronización (la fuente de verdad)
    if (this.isSupabaseEnabled()) {
      try {
        console.log('[ProductService] Obteniendo productos de tienda desde Supabase...');
        
        // Obtener tienda del usuario autenticado
        const usuario = (await window.supabase.auth.getUser()).data?.user;
        
        if (!usuario) {
          console.warn('[ProductService] No usuario autenticado, usando localStorage');
          return StorageService.get('productos', []).filter(p => p.tienda === tiendaEmail);
        }

        // En Supabase buscamos por owner_id
        const { data: stores, error: storesError } = await window.supabase
          .from('stores')
          .select('id')
          .eq('owner_id', usuario.id);
        
        if (storesError || !stores || stores.length === 0) {
          console.warn('[ProductService] No stores found for user:', storesError);
          // Fallback to localStorage
          return StorageService.get('productos', []).filter(p => p.tienda === tiendaEmail);
        }

        const tiendaId = stores[0].id;
        // Query products by tienda_id
        const { data: productos, error } = await window.supabase
          .from('products')
          .select('*')
          .eq('tienda_id', tiendaId)
          .order('creado_at', { ascending: false });
        
        if (error) {
          console.warn('[ProductService] Error fetching products by tienda:', error);
          // Fallback to localStorage
          return StorageService.get('productos', []).filter(p => p.tienda === tiendaEmail);
        }
        
        console.log('[ProductService] Productos de Supabase para tienda:', productos?.length || 0);
        
        // Mapear datos de Supabase
        return (productos || []).map(p => ({
          ...p,
          tienda: 'Supabase'
        }));
      } catch (e) {
        console.warn('[ProductService] Error filtrando por tienda:', e);
        // Fallback to localStorage
        return StorageService.get('productos', []).filter(p => p.tienda === tiendaEmail);
      }
    }

    // Fallback: localStorage
    return StorageService.get('productos', []).filter(p => p.tienda === tiendaEmail);
  },

  // Canjear producto (reducir puntos del cliente, decrementar stock)
  async canjearProducto(clienteEmail, productoIndex) {
    if (this.isSupabaseEnabled()) {
      try {
        // Obtener perfil del cliente
        const { data: perfil, error: perfilError } = await window.supabase
          .from('profiles')
          .select('*')
          .eq('email', clienteEmail)
          .single();

        if (perfilError || !perfil) {
          return { success: false, message: 'Cliente no encontrado' };
        }

        // Obtener producto
        const productos = await this.obtenerProductos();
        const producto = productos[productoIndex];

        if (!producto) {
          return { success: false, message: 'Producto no encontrado' };
        }

        // Llamar función RPC canjear_producto para operación atómica
        const { data, error } = await window.supabase.rpc('canjear_producto', {
          p_perfil_id: perfil.id,
          p_producto_id: producto.id
        });

        if (error) {
          return { success: false, message: error.message };
        }

        if (!data[0].success) {
          return { 
            success: false, 
            message: data[0].message,
            puntosActuales: data[0].puntos_restantes,
            stockRestante: data[0].stock_restante
          };
        }

        // Registrar transacción localmente (auditoría)
        if (window.TransactionService && typeof TransactionService.registrarTransaccion === 'function') {
          try {
            TransactionService.registrarTransaccion('canje', {
              cliente: clienteEmail,
              producto: producto.nombre,
              puntos: producto.costo_puntos,
              tienda: producto.tienda_id
            });
          } catch (e) {
            console.warn('Failed to register transaction (canje)', e);
          }
        }

        // Emitir eventos
        if (window.EventBus && typeof EventBus.emit === 'function') {
          try {
            EventBus.emit('producto-canjeado', {
              cliente: perfil,
              producto,
              timestamp: new Date()
            });
          } catch (e) {
            console.warn('EventBus emit failed (producto-canjeado)', e);
          }
        }

        return {
          success: true,
          message: `¡Canje exitoso! Has canjeado ${producto.nombre}`,
          puntosRestantes: data[0].puntos_restantes,
          stockRestante: data[0].stock_restante
        };
      } catch (e) {
        console.error('[ProductService] Error canjeando producto:', e);
        return { success: false, message: e.message };
      }
    }

    // Fallback: localStorage (operación local, menos segura)
    return new Promise(async (resolve) => {
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(250);

      const productos = await this.obtenerProductos();
      const producto = productos[productoIndex];

      if (!producto) {
        return resolve({ success: false, message: 'Producto no encontrado' });
      }

      const cliente = AuthService.buscarUsuarioPorEmail(clienteEmail);

      if (!cliente) {
        return resolve({ success: false, message: 'Cliente no encontrado' });
      }

      if (cliente.puntos < producto.costo) {
        return resolve({
          success: false,
          message: 'No tienes suficientes puntos para canjear este producto',
          puntosNecesarios: producto.costo,
          puntosActuales: cliente.puntos
        });
      }

      cliente.puntos -= producto.costo;
      cliente.historial = cliente.historial || [];
      const now = new Date();
      cliente.historial.push({
        producto: producto.nombre,
        costo: producto.costo,
        fecha: now.toLocaleDateString(),
        fechaHora: now.toISOString(),
        tienda: producto.tienda
      });

      if ((producto.stock || 0) <= 0) {
        return resolve({
          success: false,
          message: 'Este producto no está disponible en stock',
          sinStock: true
        });
      }

      const resultadoCliente = AuthService.actualizarUsuario(cliente);
      producto.stock = (producto.stock || 1) - 1;
      this.guardarProductos(productos);

      if (window.TransactionService && typeof TransactionService.registrarTransaccion === 'function') {
        try {
          TransactionService.registrarTransaccion('canje', {
            cliente: cliente.email,
            producto: producto.nombre,
            puntos: producto.costo,
            tienda: producto.tienda
          });
        } catch (e) {
          console.warn('Failed to register transaction (canje)', e);
        }
      }

      if (window.EventBus && typeof EventBus.emit === 'function') {
        try {
          EventBus.emit('producto-canjeado', { cliente, producto, timestamp: new Date() });
        } catch (e) {
          console.warn('EventBus emit failed (producto-canjeado)', e);
        }
      }

      if (resultadoCliente.success) {
        return resolve({
          success: true,
          message: `¡Canje exitoso! Has canjeado ${producto.nombre}`,
          puntosRestantes: cliente.puntos,
          stockRestante: producto.stock
        });
      }

      return resolve({ success: false, message: 'Error al actualizar cliente' });
    });
  },

  // Eliminar producto (opcional para futuras mejoras)
  async eliminarProducto(productoId, tiendaEmail) {
    if (this.isSupabaseEnabled()) {
      try {
        console.log('[ProductService] Intentando eliminar producto de Supabase...');
        
        // Usar fetch directo a PostgREST REST API para DELETE
        const url = `${window.supabase.url}/rest/v1/products?id=eq.${productoId}`;
        const headers = {
          'apikey': window.supabase._anonKey,
          'Prefer': 'return=representation'
        };

        console.log('[ProductService] Fetch directo DELETE a:', url);
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers
        });

        if (response.ok) {
          console.log('[ProductService] ✅ Producto eliminado de Supabase');
          return { success: true, message: 'Producto eliminado correctamente' };
        } else {
          const errorText = await response.text();
          console.warn('[ProductService] ⚠️ Error HTTP ' + response.status + ':', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (e) {
        console.error('[ProductService] Error eliminando producto de Supabase:', e);
        console.log('[ProductService] Cayendo a fallback localStorage');
        // Caer a fallback si hay error
      }
    }

    // Fallback: localStorage
    const productos = await this.obtenerProductos();
    const index = productos.findIndex(p => p.id === productoId && p.tienda === tiendaEmail);
    
    if (index === -1) {
      return { success: false, message: "Producto no encontrado o no autorizado" };
    }

    productos.splice(index, 1);
    this.guardarProductos(productos);

    return { success: true, message: "Producto eliminado" };
  },

  // Actualizar producto (editar detalles incluyendo stock)
  async actualizarProducto(productoId, tiendaEmail, nombre, costo, precioDolar = null, descripcion = null, imagen = null, stock = null) {
    // Intentar actualizar en Supabase usando UPDATE con filtro en URL
    console.log('[ProductService] Actualizando producto en Supabase...');
    
    let supabaseSuccess = false;
    try {
      if (!window.supabase) {
        throw new Error('Supabase no está disponible');
      }

      // Construir URL con filtro manualmente para evitar problemas con PostgREST
      const updateData = {
        nombre: nombre.trim(),
        costo_puntos: parseInt(costo),
        precio_dolar: precioDolar ? parseFloat(precioDolar) : null,
        descripcion: descripcion ? descripcion.trim() : null,
        imagen_url: imagen ? imagen.trim() : null,
        stock: stock !== null ? parseInt(stock) : null,
        actualizado_at: new Date().toISOString()
      };

      // Eliminar campos null
      Object.keys(updateData).forEach(key => 
        updateData[key] === null && delete updateData[key]
      );

      // Usar fetch directo a PostgREST REST API (más confiable que el cliente)
      const url = `${window.supabase.url}/rest/v1/products?id=eq.${productoId}`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': window.supabase._anonKey,
        'Prefer': 'return=representation'
      };

      console.log('[ProductService] Fetch directo a:', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[ProductService] ✅ Producto actualizado en Supabase:', data);
        supabaseSuccess = true;
      } else {
        const errorText = await response.text();
        console.warn('[ProductService] ⚠️ Error HTTP ' + response.status + ':', errorText);
      }
    } catch (e) {
      console.warn('[ProductService] ⚠️ Supabase update falló:', e.message);
    }

    // Fallback: localStorage (para respaldo si Supabase falla)
    return new Promise(async (resolve) => {
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(200);

      let productos = await this.obtenerProductos();
      
      // Buscar por ID del producto
      // Cuando viene de Supabase: tienda === 'Supabase', buscar solo por ID
      // Cuando viene de localStorage: tienda === email, validar también tienda
      const index = productos.findIndex(p => {
        const idMatch = p.id === productoId;
        
        // Si es de Supabase (tienda === 'Supabase'), buscar solo por ID
        if (p.tienda === 'Supabase') {
          return idMatch;
        }
        
        // Si es de localStorage, validar también tienda
        const tiendaMatch = p.tienda === tiendaEmail || p.owner_id;
        return idMatch && tiendaMatch;
      });

      if (index === -1) {
        console.warn('[ProductService] Producto no encontrado:', { productoId, tiendaEmail, productosDisponibles: productos.length });
        return resolve({ success: false, message: 'Producto no encontrado o no autorizado' });
      }

      if (!nombre || !costo) {
        return resolve({ success: false, message: 'Nombre y costo son requeridos' });
      }

      if (costo <= 0) {
        return resolve({ success: false, message: 'El costo debe ser mayor a 0' });
      }

      if (stock !== null && stock < 0) {
        return resolve({ success: false, message: 'El stock no puede ser negativo' });
      }

      // Actualizar en localStorage como fallback/caché local
      const productoActualizado = {
        ...productos[index],
        nombre: nombre.trim(),
        costo: parseInt(costo),
        costo_puntos: parseInt(costo),
        precioDolar: precioDolar ? parseFloat(precioDolar) : null,
        precio_dolar: precioDolar ? parseFloat(precioDolar) : null,
        descripcion: descripcion ? descripcion.trim() : null,
        imagen: imagen ? imagen.trim() : null,
        imagen_url: imagen ? imagen.trim() : null,
        stock: stock !== null ? parseInt(stock) : (productos[index].stock || 0),
        actualizado_at: new Date().toISOString()
      };

      productos[index] = productoActualizado;
      this.guardarProductos(productos);
      console.log('[ProductService] ✅ Producto guardado en localStorage:', productoActualizado.nombre);

      // Retornar éxito (ya actualizado en Supabase en el bloque anterior)
      const mensaje = supabaseSuccess 
        ? 'Producto actualizado en Supabase y localStorage' 
        : 'Producto actualizado en localStorage (Supabase offline/error)';
      
      return resolve({ success: true, producto: productoActualizado, message: mensaje });
    });
  }
};

// Exportar para usar en otros archivos
window.ProductService = ProductService;