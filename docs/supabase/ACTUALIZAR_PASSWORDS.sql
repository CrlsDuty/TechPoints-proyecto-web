-- Script para actualizar las contraseñas de los usuarios de prueba
-- Las contraseñas deben cumplir con los requisitos:
-- - Mínimo 8 caracteres
-- - Al menos una letra mayúscula
-- - Al menos un signo especial

-- IMPORTANTE: Ejecutar este script en el SQL Editor de Supabase

-- Para actualizar la contraseña de ana@mail.com a Ana@1234
-- Ve a Authentication -> Users -> Busca ana@mail.com -> Click en el menú de 3 puntos -> Reset Password
-- O usa la función de administración de Supabase:

-- Nota: Las contraseñas en Supabase se manejan a través del panel de administración
-- o mediante la API de administración. No se almacenan en texto plano en la base de datos.

-- Para actualizar contraseñas desde el panel de Supabase:
-- 1. Ve a Authentication -> Users
-- 2. Busca el usuario por email
-- 3. Click en el menú de 3 puntos (...)
-- 4. Selecciona "Reset Password"
-- 5. Ingresa la nueva contraseña

-- Nuevas contraseñas:
-- ana@mail.com -> Ana@1234
-- tienda@mail.com -> Admin@123
