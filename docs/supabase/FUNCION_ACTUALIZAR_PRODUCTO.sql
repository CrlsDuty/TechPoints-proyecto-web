-- ========================================================================
-- FUNCIÓN RPC: ACTUALIZAR_PRODUCTO
-- Para usar desde el cliente sin problemas de RLS
-- Ejecuta este script en el SQL Editor de Supabase Console
-- ========================================================================

DROP FUNCTION IF EXISTS actualizar_producto(bigint, text, integer, numeric, integer);

CREATE OR REPLACE FUNCTION actualizar_producto(
  p_id BIGINT,
  p_nombre TEXT DEFAULT NULL,
  p_costo_puntos INTEGER DEFAULT NULL,
  p_precio_dolar NUMERIC DEFAULT NULL,
  p_stock INTEGER DEFAULT NULL,
  p_descripcion TEXT DEFAULT NULL,
  p_imagen_url TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  producto_id BIGINT,
  producto_nombre TEXT
) AS $$
DECLARE
  v_count INT;
BEGIN
  -- Verificar que el producto existe
  SELECT COUNT(*) INTO v_count FROM products WHERE id = p_id;
  
  IF v_count = 0 THEN
    RETURN QUERY SELECT false, 'Producto no encontrado'::TEXT, p_id, ''::TEXT;
    RETURN;
  END IF;
  
  -- Actualizar solo los campos que no son NULL
  UPDATE products
  SET 
    nombre = COALESCE(p_nombre, nombre),
    costo_puntos = COALESCE(p_costo_puntos, costo_puntos),
    precio_dolar = COALESCE(p_precio_dolar, precio_dolar),
    descripcion = COALESCE(p_descripcion, descripcion),
    imagen_url = COALESCE(p_imagen_url, imagen_url),
    stock = COALESCE(p_stock, stock),
    actualizado_at = NOW()
  WHERE id = p_id;
  
  -- Retornar éxito
  RETURN QUERY SELECT 
    true, 
    'Producto actualizado correctamente'::TEXT, 
    p_id, 
    COALESCE(p_nombre, (SELECT nombre FROM products WHERE id = p_id))::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- PRUEBA MANUAL: Ejecuta esto para verificar
-- ========================================================================
-- SELECT * FROM actualizar_producto(
--   6,
--   'Teclado Mecánico RGB Actualizado',
--   1200,
--   85.50,
--   25,
--   'Teclado gaming',
--   'https://example.com/teclado.jpg'
-- );
