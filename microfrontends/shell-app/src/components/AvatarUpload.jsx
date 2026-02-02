import React, { useState } from 'react'
import { supabase } from '../utils/supabase'

export const AvatarUpload = ({ userId, currentAvatar, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentAvatar)

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)

      const file = event.target.files?.[0]
      if (!file) return

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen')
        return
      }

      // Validar tamaño (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen debe pesar menos de 2MB')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Actualizar perfil en la base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setPreview(publicUrl)
      onUploadSuccess?.(publicUrl)

      alert('¡Avatar actualizado correctamente!')
    } catch (error) {
      console.error('[AvatarUpload] Error:', error)
      alert('Error al subir el avatar: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.avatarContainer}>
        {preview ? (
          <img 
            src={preview} 
            alt="Avatar" 
            style={styles.avatar}
          />
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.placeholderIcon}>👤</span>
          </div>
        )}
        
        <label style={styles.uploadButton} htmlFor="avatar-upload" title="Cambiar avatar (máx 2MB)">
          {uploading ? '⏳' : '📷'}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            style={styles.fileInput}
          />
        </label>
      </div>
    </div>
  )
}

const styles = {
  container: {
    textAlign: 'center'
  },
  avatarContainer: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '1rem'
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #667eea',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  placeholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '4px solid #667eea',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  placeholderIcon: {
    fontSize: '3rem',
    filter: 'brightness(2)'
  },
  uploadButton: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    transition: 'transform 0.2s ease'
  },
  fileInput: {
    display: 'none'
  },
  hint: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#64748b',
    lineHeight: '1.5'
  }
}

export default AvatarUpload
