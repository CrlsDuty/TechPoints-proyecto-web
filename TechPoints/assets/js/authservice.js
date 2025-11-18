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
      console.log('[AuthService] ⚠️ Supabase NO HABILITADO, usando fallback local');
      return this.validarLogin(email, password);
    }

    try {
      console.log('[AuthService] 🔐 Intentando signIn con Supabase para:', email);
      
      // MÉTODO: Consulta directa a profiles (con RLS permitido)
      console.log('[AuthService] 📍 Consultando profiles desde Supabase...');
      
      const { data: profiles, error: queryErr } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('email', email);
      
      console.log('[AuthService] 📦 Query result:', { 
        count: profiles?.length,
        error: queryErr?.message
      });
      
      if (queryErr) {
        console.error('[AuthService] ❌ Error en query:', queryErr.message);
        console.warn('[AuthService] 🔄 Intentando fallback local...');
        return this.validarLogin(email, password);
      }

      if (!profiles || profiles.length === 0) {
        console.error('[AuthService] ❌ Perfil no encontrado para:', email);
        console.warn('[AuthService] 🔄 Intentando fallback local...');
        return this.validarLogin(email, password);
      }

      const profileData = profiles[0];
      
      // Validar contraseña localmente
      const localUsers = this.obtenerUsuarios();
      const localUser = localUsers.find(u => u.email === email && u.password === password);

      if (!localUser) {
        console.error('[AuthService] ❌ Credenciales incorrectas');
        console.warn('[AuthService] 🔄 Intentando fallback local...');
        return this.validarLogin(email, password);
      }

      // Si llegamos aquí: perfil en Supabase + credenciales válidas
      let usuarioFinal = {
        ...profileData,
        password: undefined
      };

      // Si es tienda, cargar datos de la tienda desde tabla stores
      if (profileData.role === 'tienda') {
        console.log('[AuthService] 🏪 Usuario es tienda, cargando datos de stores...');
        try {
          const { data: stores, error: storeError } = await window.supabase
            .from('stores')
            .select('*')
            .eq('owner_id', profileData.id)
            .single();

          if (storeError) {
            console.warn('[AuthService] ⚠️ Error al cargar datos de tienda:', storeError.message);
          } else if (stores) {
            console.log('[AuthService] 📦 Datos de tienda cargados:', stores.nombre);
            // Extraer datos de contacto (si existen)
            const contacto = stores.contacto || {};
            usuarioFinal.tienda = {
              id: stores.id,
              nombre: stores.nombre,
              descripcion: stores.descripcion,
              direccion: contacto.direccion || '',
              telefono: contacto.telefono || '',
              horario: contacto.horario || '',
              responsable: contacto.responsable || ''
            };
          }
        } catch (err) {
          console.warn('[AuthService] ⚠️ Exception al cargar tienda:', err.message);
        }
      }

      StorageService.set('usuarioActivo', usuarioFinal, 24 * 60 * 60 * 1000);
      console.log('[AuthService] ✅✅✅ Login EXITOSO via Supabase:', { 
        id: usuarioFinal.id,
        email: usuarioFinal.email,
        role: usuarioFinal.role,
        puntos: usuarioFinal.puntos,
        tienda: usuarioFinal.tienda?.nombre || null
      });
      return { success: true, usuario: usuarioFinal };

    } catch (e) {
      console.error('[AuthService] 💥 Exception en signIn:', {
        name: e.name,
        message: e.message
      });
      console.warn('[AuthService] 🔄 Intentando fallback local...');
      return this.validarLogin(email, password);
    }
  },

  // Registrar usando Supabase cuando esté disponible; si no, fallback local
  async signUp(email, password, role, tiendaInfo = null) {
    if (!this.isSupabaseEnabled()) {
      return this.registrarUsuario(email, password, role, tiendaInfo);
    }

    try {
      console.log('[AuthService] Registrando usuario en Supabase:', email);
      
      const { data, error } = await window.supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role: role,
            nombre: role === 'cliente' ? '' : (tiendaInfo?.nombre || '')
          }
        }
      });
      
      if (error) {
        console.error('[AuthService] Error en signUp:', error.message);
        return { success: false, message: error.message };
      }

      const userId = data?.user?.id;
      if (!userId) {
        console.error('[AuthService] No se obtuvo userId');
        return { success: false, message: 'No se obtuvo id de usuario' };
      }

      // Insertar perfil
      const profile = {
        id: userId,
        email,
        role,
        nombre: role === 'cliente' ? '' : (tiendaInfo?.nombre || ''),
        puntos: role === 'cliente' ? (window.Config?.PUNTOS?.BONUS_REGISTRO || 100) : 0,
        metadata: tiendaInfo || {}
      };

      const { error: pErr } = await window.supabase.from('profiles').insert([profile]);
      if (pErr) {
        console.error('[AuthService] Error insertando perfil:', pErr.message);
        return { success: false, message: 'Error creando perfil: ' + pErr.message };
      }

      // Si es tienda, crear store
      if (role === 'tienda' && tiendaInfo) {
        const { error: sErr } = await window.supabase.from('stores').insert([{
          owner_id: userId,
          nombre: tiendaInfo.nombre,
          descripcion: tiendaInfo.descripcion || 'Tienda de ' + tiendaInfo.nombre,
          contacto: {
            telefono: tiendaInfo.telefono,
            direccion: tiendaInfo.direccion,
            horario: tiendaInfo.horario,
            responsable: tiendaInfo.responsable
          }
        }]);
        if (sErr) console.warn('[AuthService] Error creando store:', sErr.message);
      }

      console.log('[AuthService] Usuario registrado exitosamente:', userId);
      StorageService.set('usuarioActivo', profile, 24 * 60 * 60 * 1000);
      return { success: true, message: 'Usuario registrado', usuario: profile };
    } catch (e) {
      console.error('[AuthService] Error en signUp:', e);
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