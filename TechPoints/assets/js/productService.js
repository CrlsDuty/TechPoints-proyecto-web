// services/productService.js
// Servicio de productos - maneja toda la lógica de productos

const ProductService = {
  // Obtener todos los productos
  obtenerProductos() {
    const productos = sessionStorage.getItem("productos");
    return productos ? JSON.parse(productos) : [];
  },

  // Guardar productos
  guardarProductos(productos) {
    sessionStorage.setItem("productos", JSON.stringify(productos));
  },

  // Agregar nuevo producto
  agregarProducto(tiendaEmail, nombre, costo) {
    // Validaciones
    if (!nombre || !costo) {
      return { success: false, message: "Nombre y costo son requeridos" };
    }

    if (costo <= 0) {
      return { success: false, message: "El costo debe ser mayor a 0" };
    }

    const productos = this.obtenerProductos();
    const nuevoProducto = {
      id: Date.now(), // ID único basado en timestamp
      tienda: tiendaEmail,
      nombre: nombre.trim(),
      costo: parseInt(costo)
    };

    productos.push(nuevoProducto);
    this.guardarProductos(productos);

    return { success: true, producto: nuevoProducto };
  },

  // Obtener productos de una tienda específica
  obtenerProductosPorTienda(tiendaEmail) {
    const productos = this.obtenerProductos();
    return productos.filter(p => p.tienda === tiendaEmail);
  },

  // Canjear producto (reducir puntos del cliente)
  canjearProducto(clienteEmail, productoIndex) {
    const productos = this.obtenerProductos();
    const producto = productos[productoIndex];

    if (!producto) {
      return { success: false, message: "Producto no encontrado" };
    }

    // Obtener cliente
    const cliente = AuthService.buscarUsuarioPorEmail(clienteEmail);
    
    if (!cliente) {
      return { success: false, message: "Cliente no encontrado" };
    }

    // Verificar puntos suficientes
    if (cliente.puntos < producto.costo) {
      return { 
        success: false, 
        message: "No tienes suficientes puntos para canjear este producto",
        puntosNecesarios: producto.costo,
        puntosActuales: cliente.puntos
      };
    }

    // Realizar canje
    cliente.puntos -= producto.costo;
    cliente.historial = cliente.historial || [];
    cliente.historial.push({
      producto: producto.nombre,
      costo: producto.costo,
      fecha: new Date().toLocaleDateString(),
      tienda: producto.tienda
    });

    // Actualizar cliente
    const resultado = AuthService.actualizarUsuario(cliente);

    if (resultado.success) {
      return { 
        success: true, 
        message: `¡Canje exitoso! Has canjeado ${producto.nombre}`,
        cliente
      };
    }

    return { success: false, message: "Error al actualizar cliente" };
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
  }
};

// Exportar para usar en otros archivos
window.ProductService = ProductService;