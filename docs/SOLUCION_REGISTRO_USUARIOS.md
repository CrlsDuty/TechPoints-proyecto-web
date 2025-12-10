# Solución: Registro de Usuarios - Sincronización con Supabase

## Problema
El registro de usuarios mostraba éxito pero:
1. Solo se guardaba localmente (localStorage)
2. Los datos no llegaban a Supabase
3. Los datos de la tienda (horario, teléfono, etc.) no se reflejaban en la tabla `stores`

## Causa
El código en `authservice.js` no tenía logging adecuado para detectar errores silenciosos de:
- Falta de validación de RLS policies
- Inserción fallida sin retornar error
- Datos no siendo enviados correctamente

## Solución Implementada

### 1. **Mejorado `authservice.js`** - Mejor logging y manejo de errores
```javascript
// Ahora tiene:
✅ Logging detallado de cada paso (signUp, insert perfil, insert store)
✅ Captura de errores con detalles completos
✅ Uso de .select() para confirmar inserts
✅ Manejo diferenciado: si store falla, perfil se mantiene
✅ Better error messages para debugging
```

### 2. **Mejorado `registro.html`** - Mejor visibilidad de datos
```javascript
// Ahora registra y muestra:
✅ tiendaInfo completa en logs
✅ Datos exactos que se envían a AuthService
✅ Resultado detallado del registro
```

## Pasos para Verificar que Funciona

### 1. Abre la consola del navegador (F12 → Console)

### 2. Registra un nuevo usuario como TIENDA:
- Email: `nuevatienda@mail.com`
- Contraseña: `Test123!`
- Rol: **Tienda**
- Nombre tienda: `Mi Tienda Test`
- Teléfono: `+1234567890`
- Dirección: `Calle Principal 123`
- Horario: `Lun-Vie 9:00-18:00`
- Responsable: `Juan Pérez`

### 3. Mira los logs en la consola (busca `[AuthService]`):
```
✅ Usuario creado en auth: [uuid]
✅ Perfil creado
✅ Store creada: [resultado con ID]
✅ Usuario registrado exitosamente
```

### 4. Verifica en Supabase:
**Ir a: Database → profiles**
- Deberías ver una nueva fila con:
  - `email`: `nuevatienda@mail.com`
  - `role`: `tienda`
  - `nombre`: `Mi Tienda Test`
  - `puntos`: `0`

**Ir a: Database → stores**
- Deberías ver una nueva fila con:
  - `owner_id`: El UUID del usuario
  - `nombre`: `Mi Tienda Test`
  - `contacto`: JSON con `{"telefono": "+1234567890", "direccion": "Calle Principal 123", "horario": "Lun-Vie 9:00-18:00", "responsable": "Juan Pérez"}`

## Códigos de Debug en los Logs

Cuando veas estos logs, significa:

| Log | Significado |
|-----|------------|
| `🔄 Registrando usuario` | Iniciando proceso |
| `✅ Usuario creado en auth` | Auth OK, proceder con perfil |
| `❌ Error en signUp` | Fallo en autenticación |
| `❌ Error insertando perfil` | Problema al crear perfil (RLS?) |
| `❌ Error creando store` | Problema al crear tienda |
| `⚠️ Perfil creado pero store falló` | Registro parcial - contactar admin |

## Si No Aparecen en Supabase

### Revisar RLS Policies en `profiles`:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```
Deberían existir políticas que permitan INSERT para nuevos usuarios.

### Revisar RLS Policies en `stores`:
```sql
SELECT * FROM pg_policies WHERE tablename = 'stores';
```
Deberían existir políticas que permitan INSERT.

### Verificar manualmente con SQL:
```sql
-- Ver últimos perfiles creados
SELECT id, email, role, nombre FROM profiles ORDER BY creado_at DESC LIMIT 10;

-- Ver últimas tiendas creadas
SELECT id, owner_id, nombre, contacto FROM stores ORDER BY creado_at DESC LIMIT 10;
```

## Próximos Pasos

1. ✅ Verifica que el registro funcione
2. 📝 Si encuentras errores, reporta los logs de `[AuthService]` exactos
3. 🔐 Si son errores de RLS, podemos crear las políticas correctas
4. ✨ Una vez confirmado, haremos commit

---

**Autor**: Sistema de Diagnóstico de Registro
**Fecha**: 2025-11-18
