// app.js - Archivo principal que maneja la UI
// Nota: Este archivo usa sessionStorage en lugar de localStorage
// Ya que localStorage no está disponible en este entorno

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  AuthService.inicializarUsuarios();
  inicializarPagina();
});

// Función para inicializar según la página actual
function inicializarPagina() {
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
  if (usuarioActivo && usuarioActivo.role === "cliente") {
    inicializarCliente(usuarioActivo);
  }

  // TIENDA
  if (usuarioActivo && usuarioActivo.role === "tienda") {
    inicializarTienda(usuarioActivo);
  }
}

// ========== LOGIN ==========
function inicializarLogin(formLogin) {
  formLogin.addEventListener("submit", e => {
    e.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const resultado = AuthService.validarLogin(email, password);

    if (resultado.success) {
      AuthService.guardarUsuarioActivo(resultado.usuario);
      
      // Redirigir según el rol
      if (resultado.usuario.role === "cliente") {
        window.location.href = "cliente.html";
      } else {
        window.location.href = "tienda.html";
      }
    } else {
      alert(resultado.message);
    }
  });
}

// ========== REGISTRO ==========
function inicializarRegistro(formRegistro) {
  formRegistro.addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    const resultado = AuthService.registrarUsuario(email, password, role);

    if (resultado.success) {
      alert(resultado.message + " Ahora puedes iniciar sesión.");
      window.location.href = "login.html";
    } else {
      alert(resultado.message);
    }
  });
}

// ========== CLIENTE ==========
function inicializarCliente(usuarioActivo) {
  const resultado = document.getElementById("resultado");
  if (resultado) {
    actualizarInfoCliente(usuarioActivo);
  }

  const productosDisp = document.getElementById("productosDisponibles");
  if (productosDisp) {
    mostrarProductosDisponibles();
    mostrarHistorial();
  }
}

function actualizarInfoCliente(usuario) {
  const resultado = document.getElementById("resultado");
  if (resultado) {
    resultado.textContent = `Hola ${usuario.email}, tienes ${usuario.puntos || 0} puntos.`;
  }
}

function mostrarProductosDisponibles() {
  const productos = ProductService.obtenerProductos();
  const lista = document.getElementById("productosDisponibles");
  
  if (!lista) return;
  
  lista.innerHTML = "";

  if (productos.length === 0) {
    lista.innerHTML = "<li style='grid-column: 1/-1; text-align: center; color: #999;'>No hay productos disponibles</li>";
    return;
  }

  productos.forEach((producto, index) => {
    const li = document.createElement("li");
    li.textContent = `${producto.nombre} (de ${producto.tienda}) - ${producto.costo} puntos`;

    const btn = document.createElement("button");
    btn.textContent = "Canjear";
    btn.onclick = () => canjearProducto(index);

    li.appendChild(btn);
    lista.appendChild(li);
  });
}

function canjearProducto(index) {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  const resultado = ProductService.canjearProducto(usuarioActivo.email, index);

  if (resultado.success) {
    alert(resultado.message);
    actualizarInfoCliente(resultado.cliente);
    mostrarProductosDisponibles();
    mostrarHistorial();
  } else {
    alert(resultado.message);
  }
}

function mostrarHistorial() {
  const usuarioActivo = AuthService.obtenerUsuarioActivo();
  const historial = document.getElementById("historial");
  
  if (!historial) return;
  
  historial.innerHTML = "";

  if (!usuarioActivo.historial || usuarioActivo.historial.length === 0) {
    historial.innerHTML = "<li style='text-align: center; color: #999;'>No has realizado canjes aún</li>";
    return;
  }

  usuarioActivo.historial.forEach(item => {
    const li = document.createElement("li");
    if (typeof item === 'string') {
      li.textContent = item;
    } else {
      li.textContent = `${item.producto} - ${item.costo} puntos (${item.fecha})`;
    }
    historial.appendChild(li);
  });
}

// ========== TIENDA ==========
function inicializarTienda(usuarioActivo) {
  // Formulario para agregar puntos
  const formTienda = document.getElementById("formTienda");
  if (formTienda) {
    formTienda.addEventListener("submit", e => {
      e.preventDefault();
      
      const clienteEmail = document.getElementById("cliente").value.trim();
      const puntos = document.getElementById("puntos").value.trim();

      const resultado = StoreService.agregarPuntosCliente(clienteEmail, puntos);
      
      const mensaje = document.getElementById("mensaje");
      if (mensaje) {
        mensaje.textContent = resultado.message;
        mensaje.style.color = resultado.success ? "#2e7d32" : "#c62828";
      }

      if (resultado.success) {
        formTienda.reset();
      }
    });
  }

  // Formulario para agregar productos
  const formProducto = document.getElementById("formProducto");
  if (formProducto) {
    mostrarProductosTienda(usuarioActivo.email);

    formProducto.addEventListener("submit", e => {
      e.preventDefault();
      
      const nombre = document.getElementById("nombreProd").value.trim();
      const costo = document.getElementById("costoProd").value.trim();

      const resultado = ProductService.agregarProducto(usuarioActivo.email, nombre, costo);

      if (resultado.success) {
        alert("Producto agregado exitosamente");
        formProducto.reset();
        mostrarProductosTienda(usuarioActivo.email);
      } else {
        alert(resultado.message);
      }
    });
  }
}

function mostrarProductosTienda(tiendaEmail) {
  const productos = ProductService.obtenerProductosPorTienda(tiendaEmail);
  const lista = document.getElementById("listaProductos");
  
  if (!lista) return;
  
  lista.innerHTML = "";

  if (productos.length === 0) {
    lista.innerHTML = "<li style='grid-column: 1/-1; text-align: center; color: #999;'>No has agregado productos aún</li>";
    return;
  }

  productos.forEach(producto => {
    const li = document.createElement("li");
    li.textContent = `${producto.nombre} - ${producto.costo} puntos`;
    lista.appendChild(li);
  });
}

// ========== LOGOUT ==========
function logout() {
  AuthService.cerrarSesion();
  window.location.href = "login.html";
}