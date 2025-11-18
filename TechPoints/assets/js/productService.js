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
        
        // Usar PostgREST para hacer join y obtener nombre de tienda
        const url = `${window.supabase.url}/rest/v1/products?select=*,stores(nombre,owner_id)`;
        const headers = {
          'apikey': window.supabase._anonKey,
          'Content-Type': 'application/json'
        };

        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ProductService] Error de Supabase:', errorText);
          throw new Error('Error fetching products');
        }

        const data = await response.json();
        console.log('[ProductService] Productos obtenidos de Supabase:', data?.length || 0);
        
        // Mapear datos con nombre de tienda
        return (data || []).map(p => {
          const tiendaNombre = p.stores?.nombre || 'Tienda desconocida';
          return {
            ...p,
            tienda_nombre: tiendaNombre,
            tienda: tiendaNombre,
            tienda_id: p.tienda_id,
            owner_id: p.stores?.owner_id
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
  async agregarProducto(tiendaEmail, nombre, costo, precioDolar = null, descripcion = null, imagenFile = null, stock = 0) {
    if (this.isSupabaseEnabled()) {
      try {
        console.log('[ProductService] Intentando agregar producto a Supabase...');
        
        // Obtener usuario actual
        const usuario = (await window.supabase.auth.getUser()).data?.user;
        
        // Si es usuario local (fallback), usar localStorage
        if (!usuario || usuario.id?.startsWith('local-')) {
          console.log('[ProductService] Usuario local detected, usando fallback localStorage');
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

        let imagenUrl = null;
        let imagenPath = null;

        // Si hay imagen, subirla a Storage PRIMERO
        if (imagenFile) {
          console.log('[ProductService] 📸 Subiendo imagen a Storage...');
          
          // Si es dataURL, convertir a File
          if (typeof imagenFile === 'string') {
            console.log('[ProductService] Detectado dataURL, subiendo desde dataURL...');
            const uploadResult = await ImageStorageService.uploadFromDataUrl(
              imagenFile,
              stores.id,
              'temp_' + Date.now() // ID temporal, será actualizado después
            );
            
            if (uploadResult.success) {
              imagenUrl = uploadResult.url;
              imagenPath = uploadResult.path;
              console.log('[ProductService] ✅ Imagen subida desde dataURL:', imagenUrl);
            } else {
              console.warn('[ProductService] ⚠️ Error subiendo imagen:', uploadResult.error);
              // Continuar sin imagen si falla
            }
          } else if (imagenFile instanceof File) {
            const uploadResult = await ImageStorageService.uploadImage(
              imagenFile,
              stores.id,
              'temp_' + Date.now()
            );
            
            if (uploadResult.success) {
              imagenUrl = uploadResult.url;
              imagenPath = uploadResult.path;
              console.log('[ProductService] ✅ Imagen subida:', imagenUrl);
            } else {
              console.warn('[ProductService] ⚠️ Error subiendo imagen:', uploadResult.error);
              // Continuar sin imagen si falla
            }
          }
        }

        const nuevoProducto = {
          tienda_id: stores.id,
          nombre: nombre.trim(),
          descripcion: descripcion ? descripcion.trim() : null,
          costo_puntos: parseInt(costo),
          precio_dolar: precioDolar ? parseFloat(precioDolar) : null,
          imagen_url: imagenUrl, // URL de Storage, no dataURL
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
          
          // Si el producto no se guardó pero la imagen sí, eliminarla
          if (imagenPath) {
            console.warn('[ProductService] Eliminando imagen que se subió pero no se usó...');
            await ImageStorageService.deleteImage(imagenPath);
          }
          
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (e) {
        console.error('[ProductService] Error agregando producto a Supabase:', e);
        console.log('[ProductService] Cayendo a fallback localStorage');
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
        console.log('[ProductService] Intentando canjear producto en Supabase...');
        
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

        // Validar stock
        if (producto.stock <= 0) {
          return { success: false, message: 'Producto sin stock' };
        }

        // Validar puntos suficientes
        if (perfil.puntos < producto.costo_puntos) {
          return {
            success: false,
            message: 'No tienes suficientes puntos para canjear este producto',
            puntosNecesarios: producto.costo_puntos,
            puntosActuales: perfil.puntos
          };
        }

        // Actualizar puntos del cliente (restar puntos de canje)
        const nuevosPuntos = perfil.puntos - producto.costo_puntos;
        const profileUrl = `${window.supabase.url}/rest/v1/profiles?id=eq.${perfil.id}`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': window.supabase._anonKey,
          'Prefer': 'return=representation'
        };

        const profileUpdateData = {
          puntos: nuevosPuntos,
          actualizado_at: new Date().toISOString()
        };

        const profileResponse = await fetch(profileUrl, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(profileUpdateData)
        });

        if (!profileResponse.ok) {
          const errorText = await profileResponse.text();
          console.warn('[ProductService] Error actualizando puntos:', errorText);
          return { success: false, message: 'Error al actualizar puntos' };
        }

        // Actualizar stock del producto (decrementar)
        const nuevoStock = producto.stock - 1;
        const productUrl = `${window.supabase.url}/rest/v1/products?id=eq.${producto.id}`;
        const productUpdateData = {
          stock: nuevoStock,
          actualizado_at: new Date().toISOString()
        };

        const productResponse = await fetch(productUrl, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(productUpdateData)
        });

        if (!productResponse.ok) {
          const errorText = await productResponse.text();
          console.warn('[ProductService] Error actualizando stock:', errorText);
          // No retornar error, el canje ya se registró
        }

        // Registrar redemption en Supabase
        try {
          console.log('[ProductService] Registrando redemption en Supabase...');
          const redemptionUrl = `${window.supabase.url}/rest/v1/redemptions`;
          const redemptionData = {
            perfil_id: perfil.id,
            producto_id: producto.id,
            puntos_usados: producto.costo_puntos,
            estado: 'completado'
          };

          const redemptionResponse = await fetch(redemptionUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(redemptionData)
          });

          if (redemptionResponse.ok) {
            console.log('[ProductService] ✅ Redemption registrado en Supabase');
          } else {
            const errorText = await redemptionResponse.text();
            console.warn('[ProductService] Error registrando redemption:', errorText);
          }
        } catch (e) {
          console.warn('[ProductService] Error en redemption:', e.message);
        }

        console.log('[ProductService] ✅ Canje completado exitosamente');

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
          cliente: {
            ...perfil,
            puntos: nuevosPuntos
          },
          puntosRestantes: nuevosPuntos,
          stockRestante: nuevoStock,
          producto: producto.nombre,
          tienda: producto.tienda_nombre || producto.tienda || 'Tienda desconocida'
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

  // Actualizar producto (editar detalles incluyendo stock e imágenes)
  async actualizarProducto(productoId, tiendaEmail, nombre, costo, precioDolar = null, descripcion = null, imagenFileOrUrl = null, stock = null) {
    console.log('[ProductService] Actualizando producto en Supabase vía RPC...');
    
    let supabaseSuccess = false;
    
    try {
      if (!window.supabase) {
        throw new Error('Supabase no está disponible');
      }

      // Validaciones
      if (!nombre || !costo) {
        throw new Error('Nombre y costo son requeridos');
      }

      if (costo <= 0) {
        throw new Error('El costo debe ser mayor a 0');
      }

      if (stock !== null && stock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      // Si hay nueva imagen (File), intentar subirla a Storage
      let imagenUrlFinal = null;
      if (imagenFileOrUrl && imagenFileOrUrl instanceof File) {
        console.log('[ProductService] 📸 Nueva imagen detectada, intentando subir a Storage...');
        
        // Obtener tienda para subir imagen
        const { data: stores, error: storeError } = await window.supabase
          .from('stores')
          .select('id')
          .eq('owner_id', (await window.supabase.auth.getUser()).data?.user?.id)
          .single();

        if (!storeError && stores) {
          if (!window.ImageStorageService?.isStorageAvailable?.()) {
            console.warn('[ProductService] ⚠️ Storage no disponible, continuando sin imagen');
          } else {
            const uploadResult = await window.ImageStorageService.uploadImage(
              imagenFileOrUrl,
              stores.id,
              productoId
            );

            if (uploadResult.success) {
              imagenUrlFinal = uploadResult.url;
              console.log('[ProductService] ✅ Imagen subida a Storage:', imagenUrlFinal);
            } else {
              console.warn('[ProductService] ⚠️ No se pudo subir imagen:', uploadResult.error);
              if (uploadResult.needsSetup) {
                console.warn('[ProductService] ⚠️ IMPORTANTE: Necesitas configurar Supabase Storage.');
                console.warn('[ProductService] Ver: CONFIGURAR_STORAGE_IMAGENES.md');
              }
            }
          }
        } else {
          console.warn('[ProductService] ⚠️ No se pudo obtener storeId');
        }
      } else if (typeof imagenFileOrUrl === 'string' && imagenFileOrUrl) {
        // Si es URL existente, mantenerla
        imagenUrlFinal = imagenFileOrUrl;
      }

      // Preparar datos para RPC
      const rpcParams = {
        p_id: productoId,
        p_nombre: nombre ? nombre.trim() : null,
        p_costo_puntos: costo ? parseInt(costo) : null,
        p_precio_dolar: precioDolar ? parseFloat(precioDolar) : null,
        p_stock: stock !== null ? parseInt(stock) : null,
        p_descripcion: descripcion ? descripcion.trim() : null,
        p_imagen_url: imagenUrlFinal || null
      };

      console.log('[ProductService] 🔄 Llamando RPC actualizar_producto con:', rpcParams);

      // Llamar RPC function
      const { data, error } = await window.supabase.rpc('actualizar_producto', rpcParams);

      if (error) {
        console.warn('[ProductService] ⚠️ Error en RPC:', error.message);
        
        // Si es 404, probablemente la función no existe o hay problema con el nombre
        if (error.message.includes('404')) {
          console.error('[ProductService] ❌ RPC no encontrada. Usando PATCH como fallback...');
          
          // Usar PATCH directo con fetch (más compatible)
          const patchData = {
            nombre: nombre ? nombre.trim() : undefined,
            costo_puntos: costo ? parseInt(costo) : undefined,
            precio_dolar: precioDolar ? parseFloat(precioDolar) : undefined,
            descripcion: descripcion ? descripcion.trim() : undefined,
            imagen_url: imagenUrlFinal || undefined,
            stock: stock !== null ? parseInt(stock) : undefined,
            actualizado_at: new Date().toISOString()
          };
          
          // Limpiar valores undefined
          Object.keys(patchData).forEach(key => patchData[key] === undefined && delete patchData[key]);
          
          const config = window._SUPABASE_CONFIG;
          // Usar formato correcto para el filtro: ?id=eq.VALOR
          const patchUrl = `${config.url}/rest/v1/products?id=eq.${productoId}`;
          const patchHeaders = {
            'Content-Type': 'application/json',
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`,
            'Prefer': 'return=representation'
          };
          
          console.log('[ProductService] 📤 Enviando PATCH a:', patchUrl);
          console.log('[ProductService] 📤 Datos:', JSON.stringify(patchData));
          
          const patchResponse = await fetch(patchUrl, {
            method: 'PATCH',
            headers: patchHeaders,
            body: JSON.stringify(patchData)
          });
          
          const patchResponseText = await patchResponse.text();
          console.log('[ProductService] 📥 Respuesta PATCH status:', patchResponse.status);
          console.log('[ProductService] 📥 Respuesta PATCH body:', patchResponseText);
          
          if (!patchResponse.ok) {
            console.error('[ProductService] ❌ PATCH error:', patchResponseText);
            throw new Error(`PATCH error: ${patchResponse.status} ${patchResponseText}`);
          }
          
          try {
            const patchResult = JSON.parse(patchResponseText);
            console.log('[ProductService] ✅ Producto actualizado via PATCH:', patchResult);
          } catch (e) {
            console.log('[ProductService] ✅ Producto actualizado via PATCH (sin respuesta JSON)');
          }
          supabaseSuccess = true;
          
          // Recargar productos desde Supabase para reflejar cambios en UI
          console.log('[ProductService] 🔄 Recargando productos desde Supabase...');
          const productosActualizados = await this.obtenerProductos();
          if (productosActualizados && productosActualizados.length > 0) {
            console.log('[ProductService] ✅ Productos recargados desde Supabase');
          }
        } else {
          throw error;
        }
      } else if (!data || !data[0]?.success) {
        console.warn('[ProductService] ⚠️ RPC retornó error:', data?.[0]?.message);
        throw new Error(data?.[0]?.message || 'Error desconocido en RPC');
      } else {
        console.log('[ProductService] ✅ Producto actualizado en Supabase vía RPC:', data[0]);
        supabaseSuccess = true;
      }
    } catch (e) {
      console.warn('[ProductService] ⚠️ Supabase update falló:', e.message);
    }    // Fallback: localStorage (para respaldo si Supabase falla)
    return new Promise(async (resolve) => {
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(200);

      let productos = await this.obtenerProductos();
      
      // Buscar por ID del producto
      const index = productos.findIndex(p => {
        const idMatch = p.id === productoId;
        if (p.tienda === 'Supabase') {
          return idMatch;
        }
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
        imagen: imagenFileOrUrl && typeof imagenFileOrUrl === 'string' ? imagenFileOrUrl : (productos[index].imagen || null),
        imagen_url: imagenFileOrUrl && typeof imagenFileOrUrl === 'string' ? imagenFileOrUrl : (productos[index].imagen_url || null),
        stock: stock !== null ? parseInt(stock) : (productos[index].stock || 0),
        actualizado_at: new Date().toISOString()
      };

      productos[index] = productoActualizado;
      this.guardarProductos(productos);
      console.log('[ProductService] ✅ Producto guardado en localStorage:', productoActualizado.nombre);

      // Retornar éxito
      const mensaje = supabaseSuccess 
        ? 'Producto actualizado en Supabase y localStorage' 
        : 'Producto actualizado en localStorage (Supabase offline/error)';
      
      return resolve({ success: true, producto: productoActualizado, message: mensaje });
    });
  }
};

// Exportar para usar en otros archivos
window.ProductService = ProductService;