// services/ImageStorageService.js
// Servicio para manejar almacenamiento de imágenes en Supabase Storage
// Gestiona upload, download y delete de imágenes de productos

const ImageStorageService = {
  // Nombre del bucket en Supabase Storage
  BUCKET_NAME: 'product-images',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Verificar si Supabase Storage está disponible
  isStorageAvailable() {
    return typeof window.supabase !== 'undefined' && 
           window.supabase !== null && 
           typeof window.supabase.storage !== 'undefined';
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

  // Subir imagen a Supabase Storage
  async uploadImage(file, tiendaId, productoId) {
    if (!this.isStorageAvailable()) {
      console.warn('[ImageStorageService] Storage no disponible, retornando null');
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

      // Subir a Storage
      const { data, error } = await window.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(storagePath, blob, {
          contentType: file.type,
          upsert: false // No sobrescribir
        });

      if (error) {
        console.error('[ImageStorageService] Error en upload:', error.message);
        
        // Si el bucket no existe, intentar crear uno
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.warn('[ImageStorageService] Bucket no existe. Por favor, crea un bucket llamado "product-images" en Supabase Storage');
          return { 
            success: false, 
            error: 'Bucket no configurado. Por favor, configura Supabase Storage.',
            url: null,
            needsSetup: true
          };
        }

        return { success: false, error: error.message, url: null };
      }

      console.log('[ImageStorageService] Archivo subido:', data);

      // Obtener URL pública
      const { data: publicUrlData } = window.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        console.error('[ImageStorageService] No se pudo obtener URL pública');
        return { success: false, error: 'No se pudo obtener URL de la imagen', url: null };
      }

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

      const { error } = await window.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([storagePath]);

      if (error) {
        console.warn('[ImageStorageService] Error eliminando imagen:', error.message);
        // No es crítico si falla la eliminación
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
      const { data } = window.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(storagePath);

      return data?.publicUrl || null;
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
