/**
 * StorageService
 * Servicio centralizado para gestionar almacenamiento persistente
 * Usa localStorage (persiste entre sesiones)
 * Incluye expiración, exportación e importación
 */

const StorageService = {
  // Usar localStorage por defecto (persiste entre sesiones)
  storage: localStorage,

  /**
   * Guardar datos con expiración opcional
   * @param {string} key - Clave
   * @param {any} value - Valor a guardar
   * @param {number} expirationMs - Expiración en milisegundos (opcional)
   * @returns {boolean} Éxito de la operación
   */
  set(key, value, expirationMs = null) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiration: expirationMs ? Date.now() + expirationMs : null
      };
      this.storage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`[StorageService] Error guardando "${key}":`, error);
      return false;
    }
  },

  /**
   * Obtener datos verificando expiración
   * @param {string} key - Clave
   * @param {any} defaultValue - Valor por defecto si no existe
   * @returns {any} Valor guardado o por defecto
   */
  get(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(key);
      if (!item) return defaultValue;

      const data = JSON.parse(item);

      // Verificar si expiró
      if (data.expiration && Date.now() > data.expiration) {
        this.remove(key); // Limpiar dato expirado
        return defaultValue;
      }

      return data.value;
    } catch (error) {
      console.error(`[StorageService] Error leyendo "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Remover una clave específica
   * @param {string} key - Clave a remover
   */
  remove(key) {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`[StorageService] Error removiendo "${key}":`, error);
    }
  },

  /**
   * Limpiar todo el almacenamiento
   */
  clear() {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('[StorageService] Error limpiando storage:', error);
    }
  },

  /**
   * Verificar si existe una clave
   * @param {string} key - Clave
   * @returns {boolean} Existe o no
   */
  has(key) {
    return this.storage.getItem(key) !== null;
  },

  /**
   * Obtener todas las claves
   * @returns {Array} Array de claves
   */
  keys() {
    return Object.keys(this.storage);
  },

  /**
   * Obtener tamaño usado en KB
   * @returns {string} Tamaño en KB
   */
  getSize() {
    let size = 0;
    for (const key in this.storage) {
      if (this.storage.hasOwnProperty(key)) {
        size += this.storage[key].length + key.length;
      }
    }
    return (size / 1024).toFixed(2);
  },

  /**
   * Exportar todo como JSON (para backup)
   * @returns {string} JSON serializado
   */
  exportAll() {
    const data = {};
    for (const key of this.keys()) {
      data[key] = this.get(key);
    }
    return JSON.stringify(data, null, 2);
  },

  /**
   * Importar desde JSON
   * @param {string} jsonData - JSON a importar
   * @returns {boolean} Éxito de la operación
   */
  importAll(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      for (const [key, value] of Object.entries(data)) {
        this.set(key, value);
      }
      console.log('[StorageService] Datos importados correctamente');
      return true;
    } catch (error) {
      console.error('[StorageService] Error importando datos:', error);
      return false;
    }
  },

  /**
   * Descargar backup como archivo
   */
  downloadBackup() {
    const backup = this.exportAll();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techpoints_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Limpiar datos expirados
   */
  limpiarExpirados() {
    let contador = 0;
    for (const key of this.keys()) {
      try {
        const item = this.storage.getItem(key);
        if (!item) continue;

        const data = JSON.parse(item);
        if (data.expiration && Date.now() > data.expiration) {
          this.remove(key);
          contador++;
        }
      } catch (error) {
        // Ignorar errores en items individuales
      }
    }
    console.log(`[StorageService] ${contador} items expirados removidos`);
    return contador;
  },

  /**
   * Obtener información de storage
   */
  getInfo() {
    return {
      total: this.keys().length,
      tamano: this.getSize() + ' KB',
      claves: this.keys(),
      navegador: this.storage === localStorage ? 'localStorage' : 'sessionStorage'
    };
  }
};

// Exportar para uso global
window.StorageService = StorageService;

// Log de carga
console.log('[StorageService] Cargado correctamente');
