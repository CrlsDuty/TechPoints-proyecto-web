/**
 * TransactionService
 * Servicio para registrar y gestionar todas las transacciones
 * Proporciona auditoría completa de actividades
 */

const TransactionService = {
  /**
   * Verificar si Supabase está disponible
   */
  isSupabaseEnabled() {
    return typeof window.supabase !== 'undefined' && window.supabase !== null;
  },

  /**
   * Obtener token de sesión autenticada
   * @private
   */
  async _obtenerTokenAutenticado() {
    try {
      // Intentar obtener sesión de Supabase primero
      const supabase = window.supabase;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.access_token) {
          console.log('[TransactionService] ✅ Token obtenido de Supabase.getSession()');
          return session.access_token;
        }
      }

      // Intentar obtener del usuario activo
      const usuarioActivo = AuthService.obtenerUsuarioActivo();
      if (usuarioActivo) {
        // Buscar token en varias ubicaciones posibles del usuario activo
        if (usuarioActivo.session?.access_token) {
          console.log('[TransactionService] ✅ Token obtenido de AuthService.session.access_token');
          return usuarioActivo.session.access_token;
        }
        if (usuarioActivo.access_token) {
          console.log('[TransactionService] ✅ Token obtenido de AuthService.access_token');
          return usuarioActivo.access_token;
        }
      }

      // Buscar en localStorage con clave específica de auth
      const storageKey = 'auth_usuario_activo';
      const datosGuardados = localStorage.getItem(storageKey);
      if (datosGuardados) {
        try {
          const datos = JSON.parse(datosGuardados);
          if (datos.session?.access_token) {
            console.log('[TransactionService] ✅ Token obtenido de localStorage.session.access_token');
            return datos.session.access_token;
          }
          if (datos.access_token) {
            console.log('[TransactionService] ✅ Token obtenido de localStorage.access_token');
            return datos.access_token;
          }
        } catch (parseError) {
          console.error('[TransactionService] Error parseando localStorage:', parseError);
        }
      }

      // Buscar en Supabase's standard localStorage keys (sb-auth-token)
      const sbAuthTokenKey = 'sb-auth-token';
      const sbAuthToken = localStorage.getItem(sbAuthTokenKey);
      if (sbAuthToken) {
        try {
          // Intenta primero como JSON
          let tokenData;
          try {
            tokenData = JSON.parse(sbAuthToken);
          } catch (e) {
            // Si no es JSON, podría ser un string directo
            tokenData = { access_token: sbAuthToken };
          }
          
          if (tokenData.access_token) {
            console.log('[TransactionService] ✅ Token obtenido de sb-auth-token');
            return tokenData.access_token;
          }
        } catch (e) {
          console.warn('[TransactionService] ⚠️ Error procesando sb-auth-token:', e.message);
        }
      }

      // Buscar en cualquier clave de localStorage que contenga 'sb-' y 'auth-token'
      const sbStorageKeys = Object.keys(localStorage).filter(k => 
        k.includes('sb-') && k.includes('auth-token')
      );
      
      for (const key of sbStorageKeys) {
        try {
          const sbSession = JSON.parse(localStorage.getItem(key));
          if (sbSession && sbSession.access_token) {
            console.log('[TransactionService] ✅ Token obtenido de localStorage key:', key);
            return sbSession.access_token;
          }
        } catch (e) {
          // continue
        }
      }

      console.warn('[TransactionService] ⚠️ No se pudo obtener token de ninguna fuente');
      return null;
    } catch (e) {
      console.error('[TransactionService] 💥 Exception obteniendo token:', e);
      return null;
    }
  },

  /**
   * Registrar una nueva transacción
   * @param {string} tipo - Tipo: 'canje', 'compra-puntos', 'ajuste', 'login', 'logout', 'registro'
   * @param {Object} datos - Datos de la transacción
   * @returns {Object} Transacción registrada
   */
  registrarTransaccion(tipo, datos) {
    const usuarioActivo = AuthService.obtenerUsuarioActivo();
    
    const transaccion = {
      id: Utils.generarId(),
      tipo,
      datos,
      usuario: usuarioActivo?.email || 'anónimo',
      rol: usuarioActivo?.role || 'desconocido',
      usuarioId: usuarioActivo?.id || null,
      timestamp: new Date().toISOString(),
      estado: 'completado',
      metadata: {
        navegador: navigator.userAgent,
        idioma: navigator.language,
        zona: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pantalla: `${window.innerWidth}x${window.innerHeight}`
      }
    };

    // Guardar localmente
    this._guardarTransaccion(transaccion);
    
    // Guardar en Supabase si está disponible
    if (this.isSupabaseEnabled() && usuarioActivo?.id) {
      this._guardarTransaccionEnSupabase(transaccion);
    }
    
    // Emitir evento
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('transaccion-registrada', transaccion);
    }

    return transaccion;
  },

  /**
   * Registrar cambio de puntos en Supabase
   * @param {string} usuarioId - ID del usuario
   * @param {number} puntosAnterior - Puntos anteriores
   * @param {number} puntosNuevo - Puntos nuevos
   * @param {string} razon - Razón del cambio
   * @param {Object} metadata - Metadata adicional
   */
  async registrarCambioPuntos(usuarioId, puntosAnterior, puntosNuevo, razon, metadata = {}) {
    if (!this.isSupabaseEnabled()) {
      console.warn('[TransactionService] Supabase no está disponible para registrar cambio de puntos');
      return false;
    }

    try {
      const config = window._SUPABASE_CONFIG;
      if (!config) return false;

      // Get authenticated session token
      const accessToken = await this._obtenerTokenAutenticado();
      
      if (!accessToken) {
        console.warn('[TransactionService] No hay token autenticado para registrar cambio de puntos');
        return false;
      }

      const cantidad = puntosNuevo - puntosAnterior;
      
      // Map razon to valid tipo values based on CHECK constraint:
      // CHECK ((tipo = ANY (ARRAY['credito'::text, 'debito'::text, 'ajuste'::text, 'compra_puntos'::text])))
      let tipoValido = 'ajuste'; // default
      
      if (cantidad > 0) {
        // Points added = credit
        tipoValido = 'credito';
      } else if (cantidad < 0) {
        // Points deducted = debit
        tipoValido = 'debito';
      }
      
      // Override if specific razon requires different tipo
      const tipoMapping = {
        'canje': 'debito',           // redeeming products = debit points
        'compra-puntos': 'credito',   // buying points = credit points
        'compra_puntos': 'credito',
        'purchase': 'credito',
        'redemption': 'debito',
        'ajuste': 'ajuste'
      };
      
      if (tipoMapping[razon]) {
        tipoValido = tipoMapping[razon];
      }
      
      const cambio = {
        perfil_id: usuarioId,
        tipo: tipoValido,
        cantidad: cantidad,
        source: {
          puntosAnterior: puntosAnterior,
          puntosNuevo: puntosNuevo,
          razon: razon,
          ...metadata
        },
        creado_at: new Date().toISOString()
      };

      console.log('[TransactionService] 📝 Registrando cambio de puntos en Supabase:', cambio);

      const response = await fetch(
        `${config.url}/rest/v1/points_transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.anonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(cambio)
        }
      );

      if (response.ok) {
        console.log('[TransactionService] ✅ Cambio de puntos registrado en Supabase');
        return true;
      } else {
        const errorText = await response.text();
        console.error('[TransactionService] ❌ Error registrando cambio de puntos:', errorText);
        return false;
      }
    } catch (e) {
      console.error('[TransactionService] 💥 Exception registrando cambio de puntos:', e);
      return false;
    }
  },

  /**
   * Guardar transacción en Supabase
   * @private
   */
  async _guardarTransaccionEnSupabase(transaccion) {
    if (!this.isSupabaseEnabled()) return;

    try {
      const config = window._SUPABASE_CONFIG;
      if (!config) return;

      // Get authenticated session token
      const accessToken = await this._obtenerTokenAutenticado();
      
      if (!accessToken) {
        console.warn('[TransactionService] No hay token autenticado para guardar transacción');
        return;
      }

      console.log('[TransactionService] 📝 Guardando transacción en Supabase:', transaccion.tipo);

      const datosSupabase = {
        usuario_id: transaccion.usuarioId,
        tipo: transaccion.tipo,
        datos: transaccion.datos,
        rol: transaccion.rol,
        metadata: transaccion.metadata,
        creado_at: transaccion.timestamp
      };

      const response = await fetch(
        `${config.url}/rest/v1/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.anonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(datosSupabase)
        }
      );

      if (response.ok) {
        console.log('[TransactionService] ✅ Transacción guardada en Supabase');
      } else {
        const errorText = await response.text();
        console.warn('[TransactionService] ⚠️ Error guardando en Supabase (continuando):', errorText);
      }
    } catch (e) {
      console.warn('[TransactionService] ⚠️ Exception guardando en Supabase (continuando):', e.message);
      // No lanzar error, solo loguear
    }
  },

  /**
   * Guardar transacción en storage
   * @private
   */
  _guardarTransaccion(transaccion) {
    try {
      const transacciones = StorageService.get('transacciones', []);
      transacciones.push(transaccion);
      
      // Mantener solo últimas 1000 transacciones para no saturar storage
      if (transacciones.length > 1000) {
        transacciones.splice(0, transacciones.length - 1000);
      }
      
      StorageService.set('transacciones', transacciones);
    } catch (error) {
      console.error('[TransactionService] Error guardando transacción:', error);
    }
  },

  /**
   * Obtener transacciones del usuario actual
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} Array de transacciones
   */
  obtenerTransacciones(filtros = {}) {
    try {
      const usuarioActivo = AuthService.obtenerUsuarioActivo();
      if (!usuarioActivo) return [];

      const todas = StorageService.get('transacciones', []);
      
      let filtradas = todas.filter(t => t.usuario === usuarioActivo.email);

      // Aplicar filtros
      if (filtros.tipo) {
        filtradas = filtradas.filter(t => t.tipo === filtros.tipo);
      }

      if (filtros.desde) {
        const desdeDate = new Date(filtros.desde);
        filtradas = filtradas.filter(t => new Date(t.timestamp) >= desdeDate);
      }

      if (filtros.hasta) {
        const hastaDate = new Date(filtros.hasta);
        filtradas = filtradas.filter(t => new Date(t.timestamp) <= hastaDate);
      }

      // Ordenar por fecha descendente (más recientes primero)
      return filtradas.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('[TransactionService] Error obteniendo transacciones:', error);
      return [];
    }
  },

  /**
   * Obtener transacciones de un usuario específico
   * @param {string} email - Email del usuario
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} Array de transacciones
   */
  obtenerTransaccionesDelUsuario(email, filtros = {}) {
    try {
      const todas = StorageService.get('transacciones', []);
      
      let filtradas = todas.filter(t => t.usuario === email);

      if (filtros.tipo) {
        filtradas = filtradas.filter(t => t.tipo === filtros.tipo);
      }

      if (filtros.desde) {
        const desdeDate = new Date(filtros.desde);
        filtradas = filtradas.filter(t => new Date(t.timestamp) >= desdeDate);
      }

      if (filtros.hasta) {
        const hastaDate = new Date(filtros.hasta);
        filtradas = filtradas.filter(t => new Date(t.timestamp) <= hastaDate);
      }

      return filtradas.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('[TransactionService] Error obteniendo transacciones:', error);
      return [];
    }
  },

  /**
   * Obtener estadísticas de transacciones
   * @param {string} email - Email del usuario (opcional, si no se proporciona usa activo)
   * @returns {Object} Estadísticas
   */
  obtenerEstadisticas(email = null) {
    try {
      const transacciones = email ? 
        this.obtenerTransaccionesDelUsuario(email) : 
        this.obtenerTransacciones();

      const ahora = new Date();
      const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      const hace30dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      const hoy = ahora.toDateString();

      return {
        total: transacciones.length,
        hoy: transacciones.filter(t => new Date(t.timestamp).toDateString() === hoy).length,
        semana: transacciones.filter(t => new Date(t.timestamp) >= hace7dias).length,
        mes: transacciones.filter(t => new Date(t.timestamp) >= hace30dias).length,
        porTipo: this._contarPorTipo(transacciones),
        ultimaTransaccion: transacciones[0] || null,
        primeraTransaccion: transacciones[transacciones.length - 1] || null
      };
    } catch (error) {
      console.error('[TransactionService] Error en estadísticas:', error);
      return {};
    }
  },

  /**
   * Contar transacciones por tipo
   * @private
   */
  _contarPorTipo(transacciones) {
    return transacciones.reduce((acc, t) => {
      acc[t.tipo] = (acc[t.tipo] || 0) + 1;
      return acc;
    }, {});
  },

  /**
   * Exportar transacciones como CSV
   * @param {string} email - Email del usuario (opcional)
   */
  exportarCSV(email = null) {
    try {
      const transacciones = email ? 
        this.obtenerTransaccionesDelUsuario(email) : 
        this.obtenerTransacciones();

      if (transacciones.length === 0) {
        if (typeof Utils !== 'undefined' && Utils.mostrarToast) {
          Utils.mostrarToast('No hay transacciones para exportar', 'warning');
        }
        return;
      }

      const headers = ['ID', 'Tipo', 'Usuario', 'Fecha/Hora', 'Estado', 'Detalles'];
      const rows = transacciones.map(t => [
        t.id,
        t.tipo,
        t.usuario,
        new Date(t.timestamp).toLocaleString(),
        t.estado,
        JSON.stringify(t.datos).replace(/"/g, '""')
      ]);

      // Construir CSV
      const csv = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${c}"`).join(','))
      ].join('\n');

      // Descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const nombreArchivo = email ? 
        `transacciones_${email.replace(/@.*/, '')}_${new Date().toISOString().slice(0, 10)}.csv` :
        `transacciones_${new Date().toISOString().slice(0, 10)}.csv`;
      a.download = nombreArchivo;
      a.click();
      URL.revokeObjectURL(url);

      if (typeof Utils !== 'undefined' && Utils.mostrarToast) {
        Utils.mostrarToast('CSV exportado correctamente', 'success');
      }
    } catch (error) {
      console.error('[TransactionService] Error exportando CSV:', error);
      if (typeof Utils !== 'undefined' && Utils.mostrarToast) {
        Utils.mostrarToast('Error al exportar CSV', 'error');
      }
    }
  },

  /**
   * Exportar transacciones como JSON
   * @param {string} email - Email del usuario (opcional)
   */
  exportarJSON(email = null) {
    try {
      const transacciones = email ? 
        this.obtenerTransaccionesDelUsuario(email) : 
        this.obtenerTransacciones();

      const json = JSON.stringify(transacciones, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const nombreArchivo = email ? 
        `transacciones_${email.replace(/@.*/, '')}_${new Date().toISOString().slice(0, 10)}.json` :
        `transacciones_${new Date().toISOString().slice(0, 10)}.json`;
      a.download = nombreArchivo;
      a.click();
      URL.revokeObjectURL(url);

      if (typeof Utils !== 'undefined' && Utils.mostrarToast) {
        Utils.mostrarToast('JSON exportado correctamente', 'success');
      }
    } catch (error) {
      console.error('[TransactionService] Error exportando JSON:', error);
      if (typeof Utils !== 'undefined' && Utils.mostrarToast) {
        Utils.mostrarToast('Error al exportar JSON', 'error');
      }
    }
  },

  /**
   * Limpiar transacciones antiguas
   * @param {number} diasAntiguos - Eliminar transacciones más antiguas que esto
   * @returns {number} Cantidad eliminada
   */
  limpiarTransaccionesAntiguas(diasAntiguos = 90) {
    try {
      const fechaLimite = new Date(Date.now() - diasAntiguos * 24 * 60 * 60 * 1000);
      const transacciones = StorageService.get('transacciones', []);
      const cantidad = transacciones.length;

      const filtradas = transacciones.filter(t => new Date(t.timestamp) >= fechaLimite);

      StorageService.set('transacciones', filtradas);

      const eliminadas = cantidad - filtradas.length;
      console.log(`[TransactionService] ${eliminadas} transacciones antiguas eliminadas`);
      return eliminadas;
    } catch (error) {
      console.error('[TransactionService] Error limpiando transacciones:', error);
      return 0;
    }
  },

  /**
   * Obtener información del servicio
   * @returns {Object} Información
   */
  getInfo() {
    try {
      const usuarioActivo = AuthService.obtenerUsuarioActivo();
      const miasTransacciones = this.obtenerTransacciones().length;
      const todasLasTransacciones = StorageService.get('transacciones', []).length;

      return {
        transaccionesDelUsuario: miasTransacciones,
        transaccionesTotales: todasLasTransacciones,
        usuarioActivo: usuarioActivo?.email || 'ninguno',
        estadisticas: this.obtenerEstadisticas()
      };
    } catch (error) {
      console.error('[TransactionService] Error obteniendo info:', error);
      return {};
    }
  }
};

// Exportar para uso global
window.TransactionService = TransactionService;

// Log de carga
console.log('[TransactionService] Cargado correctamente');
