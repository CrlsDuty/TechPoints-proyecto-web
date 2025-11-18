// services/ImageStorageService.js
// Servicio para manejar almacenamiento de imágenes en Supabase Storage
// Gestiona upload, download y delete de imágenes de productos

const ImageStorageService = {
  // Nombre del bucket en Supabase Storage
  BUCKET_NAME: 'product-images',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Verificar si Supabase Storage está disponible (vía API, no necesita window.supabase.storage)
  isStorageAvailable() {
    try {
      return typeof window._SUPABASE_CONFIG !== 'undefined' && 
             window._SUPABASE_CONFIG !== null && 
             window._SUPABASE_CONFIG.url &&
             window._SUPABASE_CONFIG.anonKey;
    } catch (e) {
      console.warn('[ImageStorageService] Error verificando disponibilidad:', e.message);
      return false;
    }
  },

  // Generar nombre único para la imagen
  generateFileName(tiendaId, productoId, extension = 'jpg') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${tiendaId}/${productoId}_${timestamp}_${random}.${extension}`;
  },

  // Obtener extensión del archivo
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  },

  // Validar archivo
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No se seleccionó archivo' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: `Tipo de archivo no soportado. Soportados: ${this.ALLOWED_TYPES.join(', ')}` };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `Archivo demasiado grande. Máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    return { valid: true };
  },

  // Convertir File a Blob si es necesario
  async fileToBlob(fileOrBlob) {
    if (fileOrBlob instanceof Blob) {
      return fileOrBlob;
    }
    if (fileOrBlob instanceof File) {
      return new Blob([fileOrBlob], { type: fileOrBlob.type });
    }
    throw new Error('Input must be File or Blob');
  },

  // Subir imagen a Supabase Storage usando fetch directo (sin window.supabase.storage)
  async uploadImage(file, tiendaId, productoId) {
    console.log('[ImageStorageService] 🔍 Verificando disponibilidad de Storage...');
    
    if (!this.isStorageAvailable()) {
      console.warn('[ImageStorageService] ❌ Storage no disponible - Config no encontrada');
      return { success: false, error: 'Storage no disponible', url: null };
    }

    try {
      // Validar archivo
      const validation = this.validateFile(file);
      if (!validation.valid) {
        console.error('[ImageStorageService] Validación fallida:', validation.error);
        return { success: false, error: validation.error, url: null };
      }

      console.log('[ImageStorageService] Subiendo imagen:', {
        filename: file.name,
        size: file.size,
        type: file.type,
        tiendaId,
        productoId
      });

      // Generar nombre único
      const extension = this.getFileExtension(file.name);
      const storagePath = this.generateFileName(tiendaId, productoId, extension);

      console.log('[ImageStorageService] Ruta de almacenamiento:', storagePath);

      // Convertir a Blob
      const blob = await this.fileToBlob(file);

      // Usar fetch directo para subir a Storage
      const config = window._SUPABASE_CONFIG;
      const uploadUrl = `${config.url}/storage/v1/object/${this.BUCKET_NAME}/${storagePath}`;
      
      console.log('[ImageStorageService] 📤 Subiendo a:', uploadUrl);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': file.type
        },
        body: blob
      });

      const uploadResponseText = await uploadResponse.text();
      console.log('[ImageStorageService] 📥 Respuesta upload status:', uploadResponse.status);
      console.log('[ImageStorageService] 📥 Respuesta upload body:', uploadResponseText);

      if (!uploadResponse.ok) {
        console.error('[ImageStorageService] Error en upload:', uploadResponseText);
        
        if (uploadResponse.status === 404) {
          console.warn('[ImageStorageService] ❌ Bucket no existe o Storage no configurado');
          return { 
            success: false, 
            error: 'Bucket no configurado',
            url: null,
            needsSetup: true
          };
        }

        return { success: false, error: uploadResponseText, url: null };
      }

      // Construir URL pública
      const publicUrl = `${config.url}/storage/v1/object/public/${this.BUCKET_NAME}/${storagePath}`;
      
      console.log('[ImageStorageService] ✅ Imagen subida exitosamente:', publicUrl);

      return { success: true, url: publicUrl, path: storagePath };
    } catch (e) {
      console.error('[ImageStorageService] Exception:', e);
      return { success: false, error: e.message, url: null };
    }
  },

  // Eliminar imagen de Storage
  async deleteImage(storagePath) {
    if (!this.isStorageAvailable()) {
      console.warn('[ImageStorageService] Storage no disponible');
      return { success: false, error: 'Storage no disponible' };
    }

    try {
      if (!storagePath) {
        console.warn('[ImageStorageService] No hay ruta de imagen para eliminar');
        return { success: true }; // No es error si no hay imagen
      }

      console.log('[ImageStorageService] Eliminando imagen:', storagePath);

      const config = window._SUPABASE_CONFIG;
      const deleteUrl = `${config.url}/storage/v1/object/${this.BUCKET_NAME}/${storagePath}`;

      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`
        }
      });

      if (!deleteResponse.ok) {
        console.warn('[ImageStorageService] Error eliminando imagen:', deleteResponse.status);
        return { success: true }; // Continuar de todas formas
      }

      console.log('[ImageStorageService] ✅ Imagen eliminada');
      return { success: true };
    } catch (e) {
      console.error('[ImageStorageService] Exception eliminando imagen:', e);
      return { success: true }; // Continuar de todas formas
    }
  },

  // Obtener URL pública de una imagen (si existe)
  getPublicUrl(storagePath) {
    if (!this.isStorageAvailable() || !storagePath) {
      return null;
    }

    try {
      const config = window._SUPABASE_CONFIG;
      return `${config.url}/storage/v1/object/public/${this.BUCKET_NAME}/${storagePath}`;
    } catch (e) {
      console.error('[ImageStorageService] Error obteniendo URL:', e);
      return null;
    }
  },

  // Convertir dataURL a Blob (para migración desde dataURL)
  dataUrlToBlob(dataUrl) {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error('[ImageStorageService] Error convirtiendo dataURL:', e);
      return null;
    }
  },

  // Subir desde dataURL (para compatibilidad)
  async uploadFromDataUrl(dataUrl, tiendaId, productoId) {
    if (!dataUrl) {
      return { success: false, error: 'No hay imagen para subir', url: null };
    }

    try {
      const blob = this.dataUrlToBlob(dataUrl);
      if (!blob) {
        return { success: false, error: 'Error procesando imagen', url: null };
      }

      // Crear un File fake desde el blob
      const file = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });

      return await this.uploadImage(file, tiendaId, productoId);
    } catch (e) {
      console.error('[ImageStorageService] Error en uploadFromDataUrl:', e);
      return { success: false, error: e.message, url: null };
    }
  }
};

// Exportar para usar en otros archivos
window.ImageStorageService = ImageStorageService;
