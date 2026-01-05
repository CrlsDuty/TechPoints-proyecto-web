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

  // Generar un UUID v4 válido
  generateUUID() {
    // Usar crypto.getRandomValues si está disponible (más seguro)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      buf[6] = (buf[6] & 0x0f) | 0x40; // version 4
      buf[8] = (buf[8] & 0x3f) | 0x80; // variant 1
      
      const bytes = Array.from(buf);
      return [
        bytes.slice(0, 4).map(b => ('0' + b.toString(16)).slice(-2)).join(''),
        bytes.slice(4, 6).map(b => ('0' + b.toString(16)).slice(-2)).join(''),
        bytes.slice(6, 8).map(b => ('0' + b.toString(16)).slice(-2)).join(''),
        bytes.slice(8, 10).map(b => ('0' + b.toString(16)).slice(-2)).join(''),
        bytes.slice(10, 16).map(b => ('0' + b.toString(16)).slice(-2)).join('')
      ].join('-');
    }
    
    // Fallback: generar UUID v4 usando Math.random()
    const chars = '0123456789abcdef'.split('');
    const uuid = [];
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid[i] = '-';
      } else if (i === 14) {
        uuid[i] = '4'; // version 4
      } else if (i === 19) {
        uuid[i] = chars[(Math.random() * 4 | 8)]; // variant 1
      } else {
        uuid[i] = chars[Math.random() * 16 | 0];
      }
    }
    return uuid.join('');
  },

  // Iniciar sesión usando Supabase Auth API
  async signIn(email, password) {
    // IMPORTANTE: signIn DEBE usar Supabase siempre para login
    if (!this.isSupabaseEnabled()) {
      console.error('[AuthService] ❌ CRÍTICO: Supabase no está disponible. No se puede iniciar sesión.');
      return { 
        success: false, 
        message: 'No hay conexión a Supabase. Por favor, verifica tu conexión a internet y recarga la página.' 
      };
    }

    try {
      console.log('[AuthService] 🔐 Intentando signIn con Supabase para:', email);
      
      const config = window._SUPABASE_CONFIG;
      if (!config) {
        console.error('[AuthService] ❌ Config de Supabase no disponible');
        return { success: false, message: 'Configuración de Supabase no disponible' };
      }

      // Paso 1: Autenticar contra Supabase usando la API de Auth
      console.log('[AuthService] 📝 Validando credenciales contra Supabase...');
      
      const authResponse = await fetch(
        `${config.url}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.anonKey
          },
          body: JSON.stringify({
            email: email.toLowerCase(),
            password: password
          })
        }
      );

      console.log('[AuthService] 📦 Auth response status:', authResponse.status);

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        console.error('[AuthService] ❌ Error en auth:', errorData);
        return { success: false, message: 'Usuario o contraseña incorrectos' };
      }

      const authData = await authResponse.json();
      const userId = authData.user.id;
      const accessToken = authData.access_token;

      console.log('[AuthService] ✅ Autenticación exitosa, userId:', userId);

      // Paso 2: Obtener datos del perfil desde Supabase
      console.log('[AuthService] 📍 Consultando datos del perfil desde Supabase...');
      
      const queryUrl = new URL(`${config.url}/rest/v1/profiles`);
      queryUrl.searchParams.append('id', `eq.${userId}`);
      queryUrl.searchParams.append('select', '*');

      const queryResponse = await fetch(queryUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.anonKey,
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('[AuthService] 📦 Query status:', queryResponse.status);

      if (!queryResponse.ok) {
        console.error('[AuthService] ❌ Error consultando perfil');
        return { success: false, message: 'Error consultando perfil' };
      }

      const profiles = await queryResponse.json();

      if (!profiles || profiles.length === 0) {
        console.error('[AuthService] ❌ Perfil no encontrado');
        return { success: false, message: 'Perfil no encontrado' };
      }

      const profileData = profiles[0];
      console.log('[AuthService] ✅ Perfil encontrado:', profileData.email);

      // Construir objeto usuario final
      let usuarioFinal = {
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
        nombre: profileData.nombre,
        puntos: profileData.puntos || 0
      };

      // Paso 3: Si es tienda, cargar datos de la tienda desde tabla stores
      if (profileData.role === 'tienda') {
        console.log('[AuthService] 🏪 Usuario es tienda, cargando datos de stores...');
        try {
          const storesUrl = new URL(`${config.url}/rest/v1/stores`);
          storesUrl.searchParams.append('owner_id', `eq.${profileData.id}`);
          storesUrl.searchParams.append('select', '*');

          const storesResponse = await fetch(storesUrl.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.anonKey,
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (storesResponse.ok) {
            const stores = await storesResponse.json();
            if (stores && stores.length > 0) {
              const store = stores[0];
              console.log('[AuthService] 📦 Datos de tienda cargados:', store.nombre);
              const contacto = store.contacto || {};
              usuarioFinal.tienda = {
                id: store.id,
                nombre: store.nombre,
                descripcion: store.descripcion,
                direccion: contacto.direccion || '',
                telefono: contacto.telefono || '',
                horario: contacto.horario || '',
                responsable: contacto.responsable || ''
              };
            }
          }
        } catch (err) {
          console.warn('[AuthService] ⚠️ Exception al cargar tienda:', err.message);
        }
      }

      StorageService.set('usuarioActivo', usuarioFinal, 24 * 60 * 60 * 1000);
      console.log('[AuthService] ✅✅✅ Login EXITOSO:', { 
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
      return { success: false, message: 'Error en la autenticación: ' + e.message };
    }
  },

  // Registrar usando la API de Autenticación de Supabase
  async signUp(email, password, role, tiendaInfo = null) {
    // IMPORTANTE: signUp DEBE usar Supabase siempre
    if (!this.isSupabaseEnabled()) {
      console.error('[AuthService] ❌ CRÍTICO: Supabase no está disponible. No se puede registrar.');
      return { 
        success: false, 
        message: 'No hay conexión a Supabase. Por favor, verifica tu conexión a internet y recarga la página.' 
      };
    }

    try {
      console.log('[AuthService] 🔄 Iniciando registro en Supabase:', email);
      console.log('[AuthService] Datos de tienda:', tiendaInfo);
      
      const config = window._SUPABASE_CONFIG;
      if (!config) {
        console.error('[AuthService] ❌ Config de Supabase no disponible');
        return { success: false, message: 'Configuración de Supabase no disponible' };
      }

      // Paso 1: Crear usuario en auth.users usando la API de Auth de Supabase
      console.log('[AuthService] 📝 Creando usuario en auth.users...');
      
      const authResponse = await fetch(
        `${config.url}/auth/v1/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.anonKey
          },
          body: JSON.stringify({
            email: email.toLowerCase(),
            password: password,
            data: {
              role: role,
              name: role === 'cliente' ? '' : (tiendaInfo?.nombre || '')
            }
          })
        }
      );

      console.log('[AuthService] 📡 Auth signup response status:', authResponse.status);

      let userId;
      let authData;

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        console.error('[AuthService] ❌ Error en auth signup:', {
          status: authResponse.status,
          error: errorData
        });

        // Error 422 = puede ser usuario existente O contraseña débil/inválida
        if (authResponse.status === 422) {
          // Analizar el mensaje de error para determinar la causa real
          const errorMsg = errorData.error_description || errorData.message || errorData.msg || JSON.stringify(errorData) || '';
          console.warn('[AuthService] ⚠️ Error 422 detectado. Datos completos:', errorData);
          console.warn('[AuthService] ⚠️ Mensaje extraído:', errorMsg);
          
          // Si el error menciona contraseña, es un problema de validación de contraseña
          if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('weak') || errorMsg.toLowerCase().includes('strength')) {
            console.error('[AuthService] ❌ Contraseña rechazada por Supabase:', errorMsg);
            return { 
              success: false, 
              message: 'La contraseña no cumple con los requisitos de seguridad. Usa una contraseña con al menos 8 caracteres, incluyendo mayúsculas, números y caracteres especiales.' 
            };
          }
          
          // Si menciona email o user existe, es un usuario duplicado
          if (errorMsg.toLowerCase().includes('user') || errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('exist')) {
            console.warn('[AuthService] ⚠️ Usuario ya existe en auth.users, intentando recuperar...');
          } else if (errorMsg === '' || errorMsg === '{}') {
            // Error vacío - probablemente contraseña muy débil o requisito de Supabase
            console.error('[AuthService] ❌ Error 422 sin mensaje. Probablemente validación de contraseña o email duplicado sin descripción.');
            
            // Intentar determinar si es email duplicado intentando login
            const testLoginResponse = await fetch(
              `${config.url}/auth/v1/token?grant_type=password`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': config.anonKey
                },
                body: JSON.stringify({
                  email: email.toLowerCase(),
                  password: password
                })
              }
            );

            if (testLoginResponse.ok) {
              // Usuario existe y las credenciales son válidas
              console.log('[AuthService] ℹ️ Error 422 pero login funciona, probablemente email duplicado con credenciales coincidentes');
              // Continuar con el flujo de usuario existente abajo
            } else {
              const loginError = await testLoginResponse.json().catch(() => ({}));
              const loginMsg = loginError.error_description || loginError.message || '';
              
              if (loginMsg.toLowerCase().includes('invalid') || loginMsg.toLowerCase().includes('credentials')) {
                return { 
                  success: false, 
                  message: 'Este email ya está registrado con una contraseña diferente. Si es tu email, intenta iniciar sesión o recupera tu contraseña.' 
                };
              }
              
              return { 
                success: false, 
                message: 'La contraseña no cumple con los requisitos mínimos de Supabase. Intenta una contraseña más compleja (mínimo 8 caracteres con mayúsculas, números y símbolos).' 
              };
            }
          } else {
            // Otros errores 422 que no entendemos
            console.error('[AuthService] ❌ Error 422 desconocido:', errorMsg);
            return { 
              success: false, 
              message: `Error en el registro: ${errorMsg || 'Verifica que el email sea válido y la contraseña cumpla requisitos de seguridad'}` 
            };
          }
          
          // Intentaremos login para verificar credenciales (si realmente es usuario duplicado)
          const testLoginResponse = await fetch(
            `${config.url}/auth/v1/token?grant_type=password`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': config.anonKey
              },
              body: JSON.stringify({
                email: email.toLowerCase(),
                password: password
              })
            }
          );

          if (testLoginResponse.ok) {
            const tokenData = await testLoginResponse.json();
            userId = tokenData.user?.id;
            console.log('[AuthService] ✅ Usuario existe y credenciales son válidas, ID:', userId);
            
            // Usuario ya existe con las credenciales correctas
            // Simplemente actualizar su perfil
            authData = { user: { id: userId, email: email.toLowerCase() } };
          } else {
            // Las credenciales no funcionan, pero el usuario existe
            // Intentaremos obtener el ID desde la tabla profiles buscando por email
            console.warn('[AuthService] ⚠️ Usuario existe pero credenciales no coinciden, buscando en profiles...');
            
            try {
              const profileQuery = new URL(`${config.url}/rest/v1/profiles`);
              profileQuery.searchParams.append('email', `eq.${email.toLowerCase()}`);
              profileQuery.searchParams.append('select', 'id');
              
              const profileResponse = await fetch(profileQuery.toString(), {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': config.anonKey
                }
              });
              
              if (profileResponse.ok) {
                const profiles = await profileResponse.json();
                if (profiles && profiles.length > 0) {
                  userId = profiles[0].id;
                  console.log('[AuthService] ✅ Usuario encontrado en profiles, ID:', userId);
                  console.warn('[AuthService] ⚠️ NOTA: Email registrado con contraseña diferente. Se actualizará el perfil con los datos nuevos.');
                  authData = { user: { id: userId, email: email.toLowerCase() } };
                } else {
                  return { 
                    success: false, 
                    message: 'Este email ya está registrado pero no se puede acceder con las credenciales proporcionadas' 
                  };
                }
              } else {
                return { 
                  success: false, 
                  message: 'Este email ya está registrado pero no se puede acceder con las credenciales proporcionadas' 
                };
              }
            } catch (err) {
              console.error('[AuthService] Error buscando en profiles:', err);
              return { 
                success: false, 
                message: 'Este email ya está registrado pero no se puede verificar' 
              };
            }
          }
        } else {
          return { 
            success: false, 
            message: `Error en auth: ${errorData.error_description || errorData.message || authResponse.statusText}` 
          };
        }
      } else {
        authData = await authResponse.json();
        userId = authData.user.id;
        console.log('[AuthService] ✅ Usuario creado en auth.users:', userId);
      }

      console.log('[AuthService] 🔐 Datos de auth:', {
        email: authData.user?.email,
        id: userId,
        confirmed_at: authData.user?.confirmed_at
      });

      // Paso 2: Actualizar perfil en tabla profiles (Supabase crea uno automáticamente)
      const profile = {
        id: userId,
        email: email.toLowerCase(),
        role,
        nombre: role === 'cliente' ? '' : (tiendaInfo?.nombre || ''),
        puntos: role === 'cliente' ? (window.Config?.PUNTOS?.BONUS_REGISTRO || 100) : 0,
        metadata: {
          registro_timestamp: new Date().toISOString(),
          ...tiendaInfo
        }
      };

      console.log('[AuthService] 📝 Actualizando perfil en profiles:', { 
        id: profile.id,
        email: profile.email,
        role: profile.role
      });

      // Usar PATCH para actualizar el registro existente
      const updateResponse = await fetch(
        `${config.url}/rest/v1/profiles?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(profile)
        }
      );

      console.log('[AuthService] 📡 Respuesta UPDATE profiles - Status:', updateResponse.status);

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        console.error('[AuthService] ❌ Error en UPDATE profiles:', {
          status: updateResponse.status,
          error: errorData
        });
        console.warn('[AuthService] ⚠️ Usuario creado en auth pero falló la actualización del perfil.');
      } else {
        const profileData = await updateResponse.json();
        console.log('[AuthService] ✅ Perfil actualizado exitosamente');
      }

      // Paso 3: Si es tienda, crear store
      if (role === 'tienda' && tiendaInfo) {
        const storeData = {
          owner_id: userId,
          nombre: tiendaInfo.nombre || 'Tienda sin nombre',
          descripcion: tiendaInfo.descripcion || 'Tienda de ' + tiendaInfo.nombre,
          contacto: {
            telefono: tiendaInfo.telefono || '',
            direccion: tiendaInfo.direccion || '',
            horario: tiendaInfo.horario || '',
            responsable: tiendaInfo.responsable || ''
          }
        };

        console.log('[AuthService] 📝 Insertando store:', storeData.nombre);

        const storeResponse = await fetch(
          `${config.url}/rest/v1/stores`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.anonKey,
              'Authorization': `Bearer ${config.anonKey}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(storeData)
          }
        );

        console.log('[AuthService] 📡 Respuesta INSERT stores - Status:', storeResponse.status);

        if (!storeResponse.ok) {
          const errorData = await storeResponse.json().catch(() => ({}));
          console.error('[AuthService] ❌ Error en INSERT stores:', errorData);
          console.warn('[AuthService] ⚠️ Perfil creado pero store falló.');
        } else {
          console.log('[AuthService] ✅ Store creada exitosamente');
        }
      }

      // Paso 4: Guardar credenciales en localStorage para login posterior
      const userFinal = {
        id: userId,
        email: profile.email,
        role,
        nombre: profile.nombre,
        puntos: profile.puntos
      };

      console.log('[AuthService] 💾 Intentando validar credenciales inmediatamente...');
      
      // Intentar login inmediato para verificar si funciona
      const testAuthResponse = await fetch(
        `${config.url}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.anonKey
          },
          body: JSON.stringify({
            email: email.toLowerCase(),
            password: password
          })
        }
      );

      console.log('[AuthService] 📦 Test auth response status:', testAuthResponse.status);

      if (!testAuthResponse.ok) {
        const errorData = await testAuthResponse.json().catch(() => ({}));
        console.warn('[AuthService] ⚠️ Login inmediato falló:', errorData);
        console.warn('[AuthService] Esto puede indicar que el email requiere confirmación o hay otro problema.');
      } else {
        console.log('[AuthService] ✅ Login inmediato funcionó correctamente');
      }

      // Guardar credenciales para respaldo local (solo para debugging)
      const usuarios = this.obtenerUsuarios();
      usuarios.push({ email: email.toLowerCase(), password, role });
      this.guardarUsuarios(usuarios);

      console.log('[AuthService] 💾 Guardando usuarioActivo en localStorage...');
      StorageService.set('usuarioActivo', userFinal, 24 * 60 * 60 * 1000);

      console.log('[AuthService] ✅✅✅ Usuario registrado exitosamente:', email);
      return { success: true, message: 'Usuario registrado', usuario: userFinal };

    } catch (e) {
      console.error('[AuthService] 💥 Exception en signUp:', e);
      console.error('[AuthService] Stack:', e.stack);
      return { success: false, message: 'Error en el registro: ' + e.message };
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
    const usuario = StorageService.get('usuarioActivo', null);
    console.log('[AuthService] obtenerUsuarioActivo - Usuario recuperado:', usuario?.email, 'Historial:', usuario?.historial?.length || 0);
    return usuario;
  },

  // Guardar usuario activo en sesión
  guardarUsuarioActivo(usuario) {
    console.log('[AuthService] Guardando usuario activo:', usuario?.email, 'Historial:', usuario?.historial?.length || 0, 'Datos completos:', usuario);
    // Guardamos con expiración por defecto de 24 horas para sesiones
    StorageService.set('usuarioActivo', usuario, 24 * 60 * 60 * 1000);
    // Verificar inmediatamente que se guardó
    const verificacion = StorageService.get('usuarioActivo', null);
    console.log('[AuthService] Verificación post-guardado:', verificacion?.email, 'Historial:', verificacion?.historial?.length || 0);
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

  // Actualizar datos de tienda en Supabase y localStorage
  async actualizarTiendaEnSupabase(usuarioActualizado) {
    if (!this.isSupabaseEnabled()) {
      console.error('[AuthService] ❌ Supabase no está disponible');
      return { success: false, message: 'No hay conexión a Supabase' };
    }

    try {
      const config = window._SUPABASE_CONFIG;
      if (!config) {
        console.error('[AuthService] ❌ Config de Supabase no disponible');
        return { success: false, message: 'Configuración de Supabase no disponible' };
      }

      const userId = usuarioActualizado.id;
      if (!userId) {
        return { success: false, message: 'ID de usuario no disponible' };
      }

      console.log('[AuthService] 🔄 Actualizando tienda en Supabase:', userId);

      // Actualizar tabla stores con los nuevos datos de tienda
      if (usuarioActualizado.tienda) {
        const storeData = {
          nombre: usuarioActualizado.tienda.nombre,
          descripcion: usuarioActualizado.tienda.descripcion || '',
          contacto: {
            telefono: usuarioActualizado.tienda.telefono || '',
            direccion: usuarioActualizado.tienda.direccion || '',
            horario: usuarioActualizado.tienda.horario || '',
            responsable: usuarioActualizado.tienda.responsable || ''
          }
        };

        console.log('[AuthService] 📝 Actualizando store:', storeData);

        // Buscar el store del usuario primero
        const queryUrl = new URL(`${config.url}/rest/v1/stores`);
        queryUrl.searchParams.append('owner_id', `eq.${userId}`);
        queryUrl.searchParams.append('select', 'id');

        const queryResponse = await fetch(queryUrl.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.anonKey
          }
        });

        if (queryResponse.ok) {
          const stores = await queryResponse.json();
          
          if (stores && stores.length > 0) {
            // Actualizar el store existente
            const storeId = stores[0].id;
            const updateResponse = await fetch(
              `${config.url}/rest/v1/stores?id=eq.${storeId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': config.anonKey,
                  'Authorization': `Bearer ${config.anonKey}`,
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(storeData)
              }
            );

            console.log('[AuthService] 📡 Respuesta UPDATE store - Status:', updateResponse.status);

            if (!updateResponse.ok) {
              const errorData = await updateResponse.json().catch(() => ({}));
              console.error('[AuthService] ❌ Error actualizando store:', errorData);
              return { success: false, message: 'Error actualizando tienda en Supabase' };
            }

            console.log('[AuthService] ✅ Store actualizado en Supabase');
          }
        }
      }

      // Actualizar localStorage
      this.actualizarUsuario(usuarioActualizado);
      console.log('[AuthService] ✅✅✅ Tienda actualizada exitosamente');
      return { success: true, message: 'Tienda actualizada en Supabase' };

    } catch (e) {
      console.error('[AuthService] 💥 Exception al actualizar tienda:', e);
      return { success: false, message: 'Error: ' + e.message };
    }
  },

  // Buscar usuario por email
  buscarUsuarioPorEmail(email) {
    const usuarios = this.obtenerUsuarios();
    return usuarios.find(u => u.email === email);
  },

  // Cargar historial de canjes desde Supabase
  async cargarHistorialDesdeSupabase(usuarioId) {
    if (!this.isSupabaseEnabled() || !usuarioId) {
      console.log('[AuthService] Supabase no disponible o usuarioId faltante, historial vacío');
      return [];
    }

    try {
      console.log('[AuthService] Cargando historial de canjes desde Supabase...');
      
      // Obtener redemptions del usuario
      const url = `${window.supabase.url}/rest/v1/redemptions?perfil_id=eq.${usuarioId}&select=*,products(nombre,tienda_id)&order=creado_at.desc`;
      const headers = {
        'apikey': window.supabase._anonKey,
        'Content-Type': 'application/json'
      };

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[AuthService] Error cargando redemptions:', errorText);
        return [];
      }

      const redemptions = await response.json();
      console.log('[AuthService] Redemptions cargados:', redemptions.length);

      // Mapear redemptions a formato de historial
      return (redemptions || []).map(r => ({
        fecha: new Date(r.creado_at).toLocaleDateString(),
        fechaHora: r.creado_at,
        tipo: 'canje',
        producto: r.products?.nombre || 'Producto desconocido',
        costo: r.puntos_usados,
        puntos: r.puntos_usados,
        tienda: 'Tienda',
        descripcion: `Canjeaste ${r.products?.nombre || 'un producto'} por ${r.puntos_usados} puntos`
      }));
    } catch (e) {
      console.warn('[AuthService] Error en cargarHistorialDesdeSupabase:', e.message);
      return [];
    }
  }
};

// Exportar para usar en otros archivos
window.AuthService = AuthService;