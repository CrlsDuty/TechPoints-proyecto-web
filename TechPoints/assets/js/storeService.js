// services/storeService.js
// Servicio de tienda - maneja la lógica específica de tiendas

const StoreService = {
  // Agregar puntos a un cliente
  agregarPuntosCliente(clienteEmail, puntos) {
    return new Promise(async (resolve) => {
      if (!clienteEmail || !puntos) {
        return resolve({ success: false, message: "Email y puntos son requeridos" });
      }

      const puntosNum = parseInt(puntos);
      if (isNaN(puntosNum) || puntosNum <= 0) {
        return resolve({ success: false, message: "Los puntos deben ser un número mayor a 0" });
      }

      // Simular operación asíncrona
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(200);

      // Buscar cliente
      const cliente = AuthService.buscarUsuarioPorEmail(clienteEmail);

      if (!cliente) {
        return resolve({ success: false, message: "Cliente no encontrado" });
      }

      if (cliente.role !== "cliente") {
        return resolve({ success: false, message: "Este usuario no es un cliente" });
      }

      // Agregar puntos
      cliente.puntos = (cliente.puntos || 0) + puntosNum;

      // Actualizar cliente
      const resultado = AuthService.actualizarUsuario(cliente);

      if (resultado.success) {
        return resolve({ 
          success: true, 
          message: `Se agregaron ${puntosNum} puntos a ${clienteEmail}`,
          puntosNuevos: cliente.puntos
        });
      }

      return resolve({ success: false, message: "Error al actualizar puntos" });
    });
  },

  // Obtener estadísticas de la tienda (opcional para futuras mejoras)
  obtenerEstadisticas(tiendaEmail) {
    const productos = ProductService.obtenerProductosPorTienda(tiendaEmail);
    const usuarios = AuthService.obtenerUsuarios();
    const clientes = usuarios.filter(u => u.role === "cliente");

    // Contar canjes por producto
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