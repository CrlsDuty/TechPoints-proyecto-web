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
        // Seleccionar productos con info de la tienda (JOIN)
        const { data, error } = await window.supabase
          .from('products')
          .select('*, stores(nombre)')
          .order('creado_at', { ascending: false });
        if (error) throw error;
        
        // Mapear datos para que tengan estructura esperada por app.js
        return (data || []).map(p => ({
          ...p,
          tienda_nombre: p.stores?.nombre || 'Tienda desconocida'
        }));
      } catch (e) {
        console.error('[ProductService] Error obteniendo productos de Supabase:', e);
        return StorageService.get('productos', []) || [];
      }
    }
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
        // Obtener tienda del propietario autenticado
        const { data: stores, error: storeError } = await window.supabase
          .from('stores')
          .select('id')
          .eq('owner_id', (await window.supabase.auth.getUser()).data.user?.id)
          .single();

        if (storeError || !stores) {
          return { success: false, message: 'No tienes una tienda registrada' };
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

        const { data, error } = await window.supabase.from('products').insert([nuevoProducto]).select();
        if (error) throw error;

        return { success: true, producto: data[0] };
      } catch (e) {
        console.error('[ProductService] Error agregando producto a Supabase:', e);
        return { success: false, message: e.message };
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

      const productos = this.obtenerProductos();
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
    if (this.isSupabaseEnabled()) {
      try {
        // En Supabase buscamos por tienda_id
        const { data: stores, error: storesError } = await window.supabase
          .from('stores')
          .select('id')
          .limit(1);
        
        if (storesError || !stores || stores.length === 0) {
          console.warn('[ProductService] No stores found or error:', storesError);
          // Fallback to localStorage
          return StorageService.get('productos', []).filter(p => p.tienda === tiendaEmail);
        }

        const tiendaId = stores[0].id;
        // Query products by tienda_id
        const { data: productos, error } = await window.supabase
          .from('products')
          .select('*')
          .eq('tienda_id', tiendaId);
        
        if (error) {
          console.warn('[ProductService] Error fetching products by tienda:', error);
          // Fallback to localStorage
          return StorageService.get('productos', []).filter(p => p.tienda === tiendaEmail);
        }
        
        return productos || [];
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
  eliminarProducto(productoId, tiendaEmail) {
    let productos = this.obtenerProductos();
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
    if (this.isSupabaseEnabled()) {
      try {
        const actualizacion = {
          nombre: nombre.trim(),
          costo_puntos: parseInt(costo),
          precio_dolar: precioDolar ? parseFloat(precioDolar) : null,
          descripcion: descripcion ? descripcion.trim() : null,
          imagen_url: imagen ? imagen.trim() : null,
          actualizado_at: new Date().toISOString()
        };

        if (stock !== null) {
          actualizacion.stock = parseInt(stock);
        }

        const { data, error } = await window.supabase
          .from('products')
          .update(actualizacion)
          .eq('id', productoId)
          .select();

        if (error) throw error;

        return { success: true, producto: data[0], message: 'Producto actualizado correctamente' };
      } catch (e) {
        console.error('[ProductService] Error actualizando producto:', e);
        return { success: false, message: e.message };
      }
    }

    // Fallback: localStorage
    return new Promise(async (resolve) => {
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(200);

      let productos = await this.obtenerProductos();
      const index = productos.findIndex(p => p.id === productoId && p.tienda === tiendaEmail);

      if (index === -1) {
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

      productos[index] = {
        ...productos[index],
        nombre: nombre.trim(),
        costo: parseInt(costo),
        precioDolar: precioDolar ? parseFloat(precioDolar) : null,
        descripcion: descripcion ? descripcion.trim() : null,
        imagen: imagen ? imagen.trim() : null,
        stock: stock !== null ? parseInt(stock) : (productos[index].stock || 0)
      };

      this.guardarProductos(productos);

      return resolve({ success: true, producto: productos[index], message: 'Producto actualizado correctamente' });
    });
  }
};

// Exportar para usar en otros archivos
window.ProductService = ProductService;