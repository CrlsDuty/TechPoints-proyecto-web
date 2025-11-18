// services/storeService.js
// Servicio de tienda - maneja la lógica específica de tiendas
// Adaptado para usar Supabase cuando está disponible, con fallback a localStorage

const StoreService = {
  // Devuelve true si Supabase está habilitado
  isSupabaseEnabled() {
    return typeof window.supabase !== 'undefined' && window.supabase !== null;
  },

  // Agregar puntos a un cliente
  async agregarPuntosCliente(clienteEmail, puntos) {
    if (this.isSupabaseEnabled()) {
      try {
        console.log('[StoreService] Intentando agregar puntos a Supabase...');
        
        // Obtener perfil del cliente
        const { data: perfil, error: perfilError } = await window.supabase
          .from('profiles')
          .select('*')
          .eq('email', clienteEmail)
          .single();

        if (perfilError || !perfil) {
          return { success: false, message: 'Cliente no encontrado' };
        }

        // Actualizar puntos directamente en profiles con fetch POST
        const puntosInt = parseInt(puntos);
        const nuevosPuntos = (perfil.puntos || 0) + puntosInt;
        
        const url = `${window.supabase.url}/rest/v1/profiles?id=eq.${perfil.id}`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': window.supabase._anonKey,
          'Prefer': 'return=representation'
        };

        const updateData = {
          puntos: nuevosPuntos,
          actualizado_at: new Date().toISOString()
        };

        console.log('[StoreService] Actualizando puntos en Supabase:', { clienteEmail, puntosAgregados: puntosInt, nuevosPuntos });
        
        const response = await fetch(url, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[StoreService] ✅ Puntos agregados a Supabase:', data);
          
          // Registrar transacción localmente
          if (window.EventBus && typeof EventBus.emit === 'function') {
            try {
              EventBus.emit('puntos-agregados', perfil);
            } catch (e) {
              console.warn('EventBus emit failed (puntos-agregados)', e);
            }
          }

          if (window.TransactionService && typeof TransactionService.registrarTransaccion === 'function') {
            try {
              const tienda = AuthService.obtenerUsuarioActivo()?.email || 'desconocida';
              TransactionService.registrarTransaccion('compra-puntos', {
                cliente: clienteEmail,
                puntos: puntosInt,
                tienda
              });
            } catch (e) {
              console.warn('Failed to register transaction (compra-puntos)', e);
            }
          }

          return {
            success: true,
            message: `Se agregaron ${puntosInt} puntos a ${clienteEmail}`,
            puntosNuevos: nuevosPuntos
          };
        } else {
          const errorText = await response.text();
          console.warn('[StoreService] ⚠️ Error HTTP ' + response.status + ':', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (e) {
        console.error('[StoreService] Error agregando puntos:', e);
        return { success: false, message: e.message };
      }
    }

    // Fallback: localStorage
    return new Promise(async (resolve) => {
      if (!clienteEmail || !puntos) {
        return resolve({ success: false, message: 'Email y puntos son requeridos' });
      }

      const puntosNum = parseInt(puntos);
      if (isNaN(puntosNum) || puntosNum <= 0) {
        return resolve({ success: false, message: 'Los puntos deben ser un número mayor a 0' });
      }

      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(200);

      const cliente = AuthService.buscarUsuarioPorEmail(clienteEmail);

      if (!cliente) {
        return resolve({ success: false, message: 'Cliente no encontrado' });
      }

      if (cliente.role !== 'cliente') {
        return resolve({ success: false, message: 'Este usuario no es un cliente' });
      }

      cliente.puntos = (cliente.puntos || 0) + puntosNum;
      const resultado = AuthService.actualizarUsuario(cliente);

      if (resultado.success) {
        if (window.EventBus && typeof EventBus.emit === 'function') {
          try {
            EventBus.emit('puntos-agregados', cliente);
          } catch (e) {
            console.warn('EventBus emit failed (puntos-agregados)', e);
          }
        }

        if (window.TransactionService && typeof TransactionService.registrarTransaccion === 'function') {
          try {
            const tienda = AuthService.obtenerUsuarioActivo()?.email || 'desconocida';
            TransactionService.registrarTransaccion('compra-puntos', {
              cliente: clienteEmail,
              puntos: puntosNum,
              tienda
            });
          } catch (e) {
            console.warn('Failed to register transaction (compra-puntos)', e);
          }
        }

        return resolve({
          success: true,
          message: `Se agregaron ${puntosNum} puntos a ${clienteEmail}`,
          puntosNuevos: cliente.puntos
        });
      }

      return resolve({ success: false, message: 'Error al actualizar puntos' });
    });
  },

  // Obtener estadísticas de la tienda (opcional para futuras mejoras)
  async obtenerEstadisticas(tiendaEmail) {
    if (this.isSupabaseEnabled()) {
      try {
        // Obtener tienda
        const { data: stores } = await window.supabase
          .from('stores')
          .select('id')
          .limit(1);

        if (!stores || stores.length === 0) {
          return { totalProductos: 0, totalClientes: 0, totalCanjes: 0 };
        }

        const tienda_id = stores[0].id;

        // Contar productos
        const { data: productos, error: prodError } = await window.supabase
          .from('products')
          .select('id')
          .eq('tienda_id', tienda_id);

        if (prodError) {
          console.warn('[StoreService] Error counting products:', prodError);
        }

        // Obtener redemptions (canjes)
        const { data: redenciones, error: redenError } = await window.supabase
          .from('redemptions')
          .select('id, perfil_id');

        if (redenError) {
          console.warn('[StoreService] Error fetching redemptions:', redenError);
        }

        // Contar clientes únicos
        const clientesUnicos = redenciones
          ? new Set(redenciones.map(r => r.perfil_id)).size
          : 0;

        return {
          totalProductos: productos?.length || 0,
          totalClientes: clientesUnicos,
          totalCanjes: redenciones?.length || 0
        };
      } catch (e) {
        console.error('[StoreService] Error obteniendo estadísticas:', e);
        return { totalProductos: 0, totalClientes: 0, totalCanjes: 0 };
      }
    }

    // Fallback: localStorage
    const productos = ProductService.obtenerProductosPorTienda(tiendaEmail);
    const usuarios = AuthService.obtenerUsuarios();
    const clientes = usuarios.filter(u => u.role === 'cliente');

    let totalCanjes = 0;
    clientes.forEach(cliente => {
      if (cliente.historial) {
        totalCanjes += cliente.historial.length;
      }
    });

    return {
      totalProductos: productos.length,
      totalClientes: clientes.length,
      totalCanjes
    };
  }
};

// Exportar para usar en otros archivos
window.StoreService = StoreService;