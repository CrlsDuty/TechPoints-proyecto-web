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
  agregarProducto(tiendaEmail, nombre, costo, precioDolar = null, descripcion = null, imagen = null, stock = 0) {
    // Retorna una Promise para demostrar operaciones asíncronas
    return new Promise(async (resolve) => {
      // Simular delay
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(300);

      // Validaciones
      if (!nombre || !costo) {
        return resolve({ success: false, message: "Nombre y costo son requeridos" });
      }

      if (costo <= 0) {
        return resolve({ success: false, message: "El costo debe ser mayor a 0" });
      }

      if (stock < 0) {
        return resolve({ success: false, message: "El stock no puede ser negativo" });
      }

      const productos = this.obtenerProductos();
      const nuevoProducto = {
        id: Date.now(), // ID único basado en timestamp
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
  obtenerProductosPorTienda(tiendaEmail) {
    const productos = this.obtenerProductos();
    return productos.filter(p => p.tienda === tiendaEmail);
  },

  // Canjear producto (reducir puntos del cliente)
  canjearProducto(clienteEmail, productoIndex) {
    // Retorna una Promise para poder usar async/await
    return new Promise(async (resolve) => {
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(250);

      const productos = this.obtenerProductos();
      const producto = productos[productoIndex];

      if (!producto) {
        return resolve({ success: false, message: "Producto no encontrado" });
      }

      // Obtener cliente
      const cliente = AuthService.buscarUsuarioPorEmail(clienteEmail);
      
      if (!cliente) {
        return resolve({ success: false, message: "Cliente no encontrado" });
      }

      // Verificar puntos suficientes
      if (cliente.puntos < producto.costo) {
        return resolve({ 
          success: false, 
          message: "No tienes suficientes puntos para canjear este producto",
          puntosNecesarios: producto.costo,
          puntosActuales: cliente.puntos
        });
      }

      // Realizar canje
      cliente.puntos -= producto.costo;
      cliente.historial = cliente.historial || [];
      // Añadir registro con fecha y timestamp ISO para trazabilidad
      const now = new Date();
      cliente.historial.push({
        producto: producto.nombre,
        costo: producto.costo,
        fecha: now.toLocaleDateString(),
        fechaHora: now.toISOString(),
        tienda: producto.tienda
      });

      // Verificar stock disponible
      if ((producto.stock || 0) <= 0) {
        return resolve({ 
          success: false, 
          message: "Este producto no está disponible en stock",
          sinStock: true
        });
      }

      // Actualizar cliente
      const resultadoCliente = AuthService.actualizarUsuario(cliente);

      // Decrementar stock del producto
      producto.stock = (producto.stock || 1) - 1;

      // Guardar producto con stock actualizado
      this.guardarProductos(productos);

      if (resultadoCliente.success) {
        return resolve({ 
          success: true, 
          message: `¡Canje exitoso! Has canjeado ${producto.nombre}`,
          cliente,
          stockRestante: producto.stock
        });
      }

      return resolve({ success: false, message: "Error al actualizar cliente" });
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
  actualizarProducto(productoId, tiendaEmail, nombre, costo, precioDolar = null, descripcion = null, imagen = null, stock = null) {
    return new Promise(async (resolve) => {
      if (window.Utils && typeof Utils.delay === 'function') await Utils.delay(200);

      let productos = this.obtenerProductos();
      const index = productos.findIndex(p => p.id === productoId && p.tienda === tiendaEmail);
      
      if (index === -1) {
        return resolve({ success: false, message: "Producto no encontrado o no autorizado" });
      }

      // Validaciones
      if (!nombre || !costo) {
        return resolve({ success: false, message: "Nombre y costo son requeridos" });
      }

      if (costo <= 0) {
        return resolve({ success: false, message: "El costo debe ser mayor a 0" });
      }

      if (stock !== null && stock < 0) {
        return resolve({ success: false, message: "El stock no puede ser negativo" });
      }

      // Actualizar producto
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

      return resolve({ success: true, producto: productos[index], message: "Producto actualizado correctamente" });
    });
  }
};

// Exportar para usar en otros archivos
window.ProductService = ProductService;