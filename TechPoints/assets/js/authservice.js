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

  // Devuelve true si hay un cliente Supabase inicializado (usar supabase en frontend)
  isSupabaseEnabled() {
    return typeof window.supabase !== 'undefined' && window.supabase !== null;
  },

  // Iniciar sesión usando Supabase cuando esté disponible; si no, fallback local
  async signIn(email, password) {
    if (!this.isSupabaseEnabled()) {
      return this.validarLogin(email, password);
    }

    try {
      console.log('[AuthService] Intentando signIn con Supabase para:', email);
      const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
      console.log('[AuthService] signInWithPassword response:', { data, error });
      
      // Si Supabase Auth falla, intentar fallback local
      if (error || !data?.user?.id) {
        console.warn('[AuthService] Supabase Auth falló, intentando fallback local:', error?.message);
        return this.validarLogin(email, password);
      }

      const userId = data.user.id;
      console.log('[AuthService] userId obtenido:', userId);
      
      // Use .single() to get single row
      const profileResult = await window.supabase.from('profiles').select('*').eq('id', userId).single();
      console.log('[AuthService] profileResult:', profileResult);
      
      const { data: profile, error: pErr } = profileResult;
      if (pErr) {
        console.warn('[AuthService] Error cargando profiles, intentando fallback local:', pErr.message);
        return this.validarLogin(email, password);
      }
      
      if (!profile) {
        console.warn('[AuthService] Perfil no encontrado, intentando fallback local');
        return this.validarLogin(email, password);
      }

      StorageService.set('usuarioActivo', profile, 24 * 60 * 60 * 1000);
      console.log('[AuthService] Login exitoso via Supabase, perfil cargado:', profile);
      return { success: true, usuario: profile };
    } catch (e) {
      console.error('[AuthService] Error en signIn, usando fallback local:', e);
      return this.validarLogin(email, password);
    }
  },

  // Registrar usando Supabase cuando esté disponible; si no, fallback local
  async signUp(email, password, role, tiendaInfo = null) {
    if (!this.isSupabaseEnabled()) {
      return this.registrarUsuario(email, password, role, tiendaInfo);
    }

    try {
      const { data, error } = await window.supabase.auth.signUp({ email, password });
      if (error) return { success: false, message: error.message };

      const userId = data?.user?.id;
      if (!userId) return { success: false, message: 'No se obtuvo id de usuario' };

      const profile = {
        id: userId,
        email,
        role,
        nombre: role === 'cliente' ? '' : (tiendaInfo?.nombre || ''),
        puntos: role === 'cliente' ? (window.Config?.PUNTOS?.BONUS_REGISTRO || 0) : 0,
        metadata: tiendaInfo || {}
      };

      const { error: pErr } = await window.supabase.from('profiles').insert([profile]);
      if (pErr) return { success: false, message: pErr.message };

      StorageService.set('usuarioActivo', profile, 24 * 60 * 60 * 1000);
      return { success: true, message: 'Usuario registrado', usuario: profile };
    } catch (e) {
      return { success: false, message: e.message || 'Error en signUp' };
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
    
    return { success: false, message: "Credenciales incorrectos" };
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