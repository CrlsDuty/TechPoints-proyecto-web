// services/authService.js
// Servicio de autenticación - maneja todo lo relacionado con usuarios

const AuthService = {
  // Inicializar usuarios de prueba
  inicializarUsuarios() {
    const usuarios = this.obtenerUsuarios();
    if (usuarios.length === 0) {
      const usuariosIniciales = [
        { email: "ana@mail.com", password: "1234", role: "cliente", puntos: 50 },
        { 
          email: "tienda@mail.com", 
          password: "admin", 
          role: "tienda",
          tienda: {
            nombre: "Demo Store",
            direccion: "Av. Demo 123",
            telefono: "+56 9 0000 0000",
            horario: "Lun-Vie 9:00-18:00",
            responsable: "Administrador"
          }
        }
      ];
      this.guardarUsuarios(usuariosIniciales);
    }
  },

  // Validar credenciales de login
  validarLogin(email, password) {
    if (!email || !password) {
      return { success: false, message: "Email y contraseña son requeridos" };
    }

    const usuarios = this.obtenerUsuarios();
    const usuario = usuarios.find(u => u.email === email && u.password === password);

    if (usuario) {
      return { success: true, usuario };
    }
    
    return { success: false, message: "Credenciales incorrectas" };
  },

  // Registrar nuevo usuario
  registrarUsuario(email, password, role, tiendaInfo = null) {
    // Validaciones
    if (!email || !password || !role) {
      return { success: false, message: "Todos los campos son requeridos" };
    }

    if (!this.validarEmail(email)) {
      return { success: false, message: "Email inválido" };
    }

    if (password.length < 4) {
      return { success: false, message: "La contraseña debe tener al menos 4 caracteres" };
    }

    const usuarios = this.obtenerUsuarios();
    
    // Verificar si el email ya existe
    if (usuarios.find(u => u.email === email)) {
      return { success: false, message: "Este correo ya está registrado" };
    }

    // Crear nuevo usuario
    const nuevoUsuario = { email, password, role };
    if (role === "cliente") {
      nuevoUsuario.puntos = 0;
      nuevoUsuario.historial = [];
    }

    // Si es tienda, guardar la información adicional (si se entregó)
    if (role === "tienda") {
      nuevoUsuario.tienda = tiendaInfo || {};
    }

    usuarios.push(nuevoUsuario);
    this.guardarUsuarios(usuarios);

    return { success: true, message: "Usuario registrado con éxito" };
  },

  // Validar formato de email
  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Obtener usuario activo
  obtenerUsuarioActivo() {
    return StorageService.get('usuarioActivo', null);
  },

  // Guardar usuario activo en sesión
  guardarUsuarioActivo(usuario) {
    // Guardamos con expiración por defecto de 24 horas para sesiones
    StorageService.set('usuarioActivo', usuario, 24 * 60 * 60 * 1000);
  },

  // Cerrar sesión
  cerrarSesion() {
    StorageService.remove('usuarioActivo');
  },

  // Obtener todos los usuarios
  obtenerUsuarios() {
    return StorageService.get('usuarios', []) || [];
  },

  // Guardar usuarios
  guardarUsuarios(usuarios) {
    StorageService.set('usuarios', usuarios);
  },

  // Actualizar usuario en la lista
  actualizarUsuario(usuarioActualizado) {
    const usuarios = this.obtenerUsuarios();
    const index = usuarios.findIndex(u => u.email === usuarioActualizado.email);
    
    if (index !== -1) {
      usuarios[index] = usuarioActualizado;
      this.guardarUsuarios(usuarios);
      this.guardarUsuarioActivo(usuarioActualizado);
      return { success: true };
    }
    
    return { success: false, message: "Usuario no encontrado" };
  },

  // Buscar usuario por email
  buscarUsuarioPorEmail(email) {
    const usuarios = this.obtenerUsuarios();
    return usuarios.find(u => u.email === email);
  }
};

// Exportar para usar en otros archivos
window.AuthService = AuthService;