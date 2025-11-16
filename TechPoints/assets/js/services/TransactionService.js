/**
 * TransactionService
 * Servicio para registrar y gestionar todas las transacciones
 * Proporciona auditoría completa de actividades
 */

const TransactionService = {
  /**
   * Registrar una nueva transacción
   * @param {string} tipo - Tipo: 'canje', 'compra-puntos', 'ajuste', 'login', 'logout'
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
      timestamp: new Date().toISOString(),
      estado: 'completado',
      metadata: {
        navegador: navigator.userAgent,
        idioma: navigator.language,
        zona: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pantalla: `${window.innerWidth}x${window.innerHeight}`
      }
    };

    this._guardarTransaccion(transaccion);
    
    // Emitir evento
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('transaccion-registrada', transaccion);
    }

    return transaccion;
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
