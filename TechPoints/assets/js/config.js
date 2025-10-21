// assets/js/config.js
// Configuración centralizada de la aplicación

const Config = {
  // ========== INFORMACIÓN DE LA APP ==========
  APP_NAME: 'TechPoints',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Sistema de fidelización para productos tecnológicos',

  // ========== SISTEMA DE PUNTOS ==========
  PUNTOS: {
    // Conversión: cada $10 USD = 10 puntos
    PUNTOS_POR_DOLAR: 10,
    DOLARES_POR_10: 1,
    
    // Conversión para canjes: 100 puntos = $5 USD en productos
    DOLARES_POR_100_PUNTOS: 5,
    RATIO_CANJE: 20, // 20 puntos = $1 USD en productos
    
    // Límites
    MIN_PUNTOS_COMPRA: 1,
    MAX_PUNTOS_COMPRA: 10000,
    BONUS_PRIMER_CANJE: 50,
    BONUS_REGISTRO: 100
  },

  // ========== NIVELES DE USUARIO ==========
  NIVELES: {
    BRONCE: {
      nombre: 'Bronce',
      min: 0,
      max: 500,
      multiplicador: 1.0,
      color: '#cd7f32',
      icono: '🥉',
      beneficios: [
        'Acumulación estándar de puntos',
        'Acceso a todos los productos'
      ]
    },
    PLATA: {
      nombre: 'Plata',
      min: 501,
      max: 1500,
      multiplicador: 1.25,
      color: '#c0c0c0',
      icono: '🥈',
      beneficios: [
        '25% más puntos en cada compra',
        'Acceso anticipado a nuevos productos',
        'Descuentos especiales'
      ]
    },
    ORO: {
      nombre: 'Oro',
      min: 1501,
      max: Infinity,
      multiplicador: 1.5,
      color: '#ffd700',
      icono: '🥇',
      beneficios: [
        '50% más puntos en cada compra',
        'Productos exclusivos',
        'Envío gratis',
        'Soporte prioritario'
      ]
    }
  },

  // ========== CATEGORÍAS DE PRODUCTOS ==========
  CATEGORIAS: [
    { id: 'laptops', nombre: 'Laptops', icono: '💻' },
    { id: 'smartphones', nombre: 'Smartphones', icono: '📱' },
    { id: 'accesorios', nombre: 'Accesorios', icono: '⌨️' },
    { id: 'componentes', nombre: 'Componentes', icono: '🔧' },
    { id: 'audio', nombre: 'Audio', icono: '🎧' },
    { id: 'gaming', nombre: 'Gaming', icono: '🎮' },
    { id: 'smart-home', nombre: 'Smart Home', icono: '🏠' },
    { id: 'monitores', nombre: 'Monitores', icono: '🖥️' }
  ],

  // ========== VALIDACIONES ==========
  VALIDACION: {
    PASSWORD_MIN_LENGTH: 4,
    PASSWORD_MAX_LENGTH: 50,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NOMBRE_MIN_LENGTH: 3,
    NOMBRE_MAX_LENGTH: 100,
    DESCRIPCION_MAX_LENGTH: 500
  },

  // ========== UI/UX ==========
  UI: {
    // Duraciones en milisegundos
    TOAST_DURATION: 3000,
    TOOLTIP_DELAY: 500,
    DEBOUNCE_DELAY: 300,
    LOADING_MIN_TIME: 500,
    
    // Animaciones
    ANIMATION_SPEED: 300,
    
    // Paginación
    ITEMS_PER_PAGE: 12,
    PRODUCTOS_POR_PAGINA: 9,
    
    // Colores (para uso en JavaScript)
    COLORS: {
      primary: '#0ea5e9',
      secondary: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      success: '#22c55e'
    }
  },

  // ========== MENSAJES ==========
  MENSAJES: {
    EXITO: {
      REGISTRO: '¡Registro exitoso! Bienvenido a TechPoints',
      LOGIN: '¡Bienvenido de nuevo!',
      CANJE_EXITOSO: '¡Canje realizado con éxito!',
      PUNTOS_AGREGADOS: 'Puntos agregados correctamente',
      PRODUCTO_AGREGADO: 'Producto agregado al catálogo',
      PERFIL_ACTUALIZADO: 'Perfil actualizado correctamente'
    },
    ERROR: {
      CREDENCIALES_INVALIDAS: 'Email o contraseña incorrectos',
      EMAIL_EXISTENTE: 'Este email ya está registrado',
      PUNTOS_INSUFICIENTES: 'No tienes suficientes puntos',
      CAMPOS_REQUERIDOS: 'Por favor completa todos los campos',
      SESION_EXPIRADA: 'Tu sesión ha expirado, inicia sesión nuevamente',
      PRODUCTO_NO_ENCONTRADO: 'Producto no encontrado',
      USUARIO_NO_ENCONTRADO: 'Usuario no encontrado',
      ERROR_GENERICO: 'Ha ocurrido un error. Intenta nuevamente'
    },
    CONFIRMACION: {
      CANJE: '¿Estás seguro de canjear este producto?',
      LOGOUT: '¿Deseas cerrar sesión?',
      ELIMINAR_PRODUCTO: '¿Eliminar este producto del catálogo?'
    }
  },

  // ========== ALMACENAMIENTO ==========
  STORAGE: {
    KEYS: {
      USUARIOS: 'usuarios',
      USUARIO_ACTIVO: 'usuarioActivo',
      PRODUCTOS: 'productos',
      CONFIGURACION: 'configuracion',
      TEMAS: 'tema'
    }
  },

  // ========== DATOS MOCK INICIALES ==========
  DATOS_INICIALES: {
    USUARIOS: [
      { 
        email: 'ana@mail.com', 
        password: '1234', 
        role: 'cliente', 
        puntos: 50,
        nombre: 'Ana García',
        historial: []
      },
      { 
        email: 'tienda@mail.com', 
        password: 'admin', 
        role: 'tienda',
        nombreTienda: 'TechStore',
        descripcion: 'Tu tienda de tecnología de confianza'
      }
    ],
    PRODUCTOS: [
      {
        id: 1,
        nombre: 'Mouse Gamer RGB',
        categoria: 'accesorios',
        tienda: 'tienda@mail.com',
        costo: 500,
        descripcion: 'Mouse gaming de alta precisión con iluminación RGB',
        stock: 10
      },
      {
        id: 2,
        nombre: 'Teclado Mecánico',
        categoria: 'accesorios',
        tienda: 'tienda@mail.com',
        costo: 800,
        descripcion: 'Teclado mecánico con switches Cherry MX',
        stock: 5
      },
      {
        id: 3,
        nombre: 'Auriculares Gaming',
        categoria: 'audio',
        tienda: 'tienda@mail.com',
        costo: 600,
        descripcion: 'Auriculares con sonido envolvente 7.1',
        stock: 8
      }
    ]
  },

  // ========== FEATURES FLAGS ==========
  FEATURES: {
    SISTEMA_NIVELES: true,
    SISTEMA_FAVORITOS: false, // Por implementar
    MODO_OSCURO: false, // Por implementar
    NOTIFICACIONES: false, // Por implementar
    COMPARTIR_REDES: false, // Por implementar
    BUSQUEDA_AVANZADA: false, // Por implementar
    ESTADISTICAS_TIENDA: false // Por implementar
  },

  // ========== DESARROLLO ==========
  DEV: {
    DEBUG: true, // Cambiar a false en producción
    MOCK_DATA: true, // Usar datos mock
    LOG_LEVEL: 'info', // 'error', 'warn', 'info', 'debug'
    ENABLE_CONSOLE: true
  },

  // ========== MÉTODOS AUXILIARES ==========
  
  /**
   * Obtiene la configuración de un nivel por puntos
   */
  obtenerNivelPorPuntos(puntos) {
    const niveles = Object.values(this.NIVELES);
    return niveles.find(n => puntos >= n.min && puntos <= n.max) || this.NIVELES.BRONCE;
  },

  /**
   * Calcula puntos aplicando multiplicador de nivel
   */
  calcularPuntosConNivel(puntosBase, nivel) {
    const config = this.NIVELES[nivel.toUpperCase()];
    return Math.floor(puntosBase * (config?.multiplicador || 1));
  },

  /**
   * Obtiene el icono de una categoría
   */
  obtenerIconoCategoria(categoriaId) {
    const categoria = this.CATEGORIAS.find(c => c.id === categoriaId);
    return categoria?.icono || '📦';
  },

  /**
   * Verifica si una feature está habilitada
   */
  featureHabilitada(featureName) {
    return this.FEATURES[featureName] || false;
  },

  /**
   * Log condicional basado en configuración
   */
  log(mensaje, nivel = 'info') {
    if (!this.DEV.ENABLE_CONSOLE) return;
    
    const niveles = { error: 0, warn: 1, info: 2, debug: 3 };
    const nivelActual = niveles[this.DEV.LOG_LEVEL] || 2;
    const nivelMensaje = niveles[nivel] || 2;

    if (nivelMensaje <= nivelActual) {
      const timestamp = new Date().toLocaleTimeString();
      console[nivel](`[${timestamp}] [${nivel.toUpperCase()}]`, mensaje);
    }
  }
};

// Inicializar datos mock si está habilitado
if (Config.DEV.MOCK_DATA) {
  Config.log('Modo desarrollo: Datos mock habilitados', 'info');
}

// Exportar configuración
window.Config = Config;

// Hacer disponible también como objeto inmutable (opcional)
Object.freeze(Config.NIVELES);
Object.freeze(Config.CATEGORIAS);
Object.freeze(Config.VALIDACION);