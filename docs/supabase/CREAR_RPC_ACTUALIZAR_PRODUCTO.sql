-- ========================================================================
-- FUNCIÓN RPC: ACTUALIZAR_PRODUCTO
-- Soluciona problemas con PostgREST UPDATE
-- Ejecuta este script en: Supabase Console > SQL Editor
-- ========================================================================

CREATE OR REPLACE FUNCTION actualizar_producto(
  p_id bigint,
  p_nombre text DEFAULT NULL,
  p_costo_puntos integer DEFAULT NULL,
  p_precio_dolar numeric DEFAULT NULL,
  p_stock integer DEFAULT NULL,
  p_descripcion text DEFAULT NULL,
  p_imagen_url text DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  message text,
  producto_id bigint,
  producto_nombre text
) AS $$
DECLARE
  v_producto products%ROWTYPE;
BEGIN
  -- 1. Verificar que el producto existe
  SELECT * INTO v_producto FROM products WHERE id = p_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Producto no encontrado'::text, 0::bigint, ''::text;
    RETURN;
  END IF;

  -- 2. Actualizar solo los campos que no son NULL (parámetros proporcionados)
  UPDATE products SET
    nombre = COALESCE(p_nombre, nombre),
    costo_puntos = COALESCE(p_costo_puntos, costo_puntos),
    precio_dolar = COALESCE(p_precio_dolar, precio_dolar),
    stock = COALESCE(p_stock, stock),
    descripcion = COALESCE(p_descripcion, descripcion),
    imagen_url = COALESCE(p_imagen_url, imagen_url),
    actualizado_at = now()
  WHERE id = p_id;

  -- 3. Obtener el producto actualizado para confirmación
  SELECT * INTO v_producto FROM products WHERE id = p_id;
  
  -- 4. Retornar éxito
  RETURN QUERY SELECT 
    true,
    'Producto actualizado exitosamente'::text,
    v_producto.id,
    v_producto.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- VERIFICACIÓN: Confirmar que la función fue creada
-- ========================================================================
-- Ejecuta esto para verificar:
-- SELECT * FROM information_schema.routines WHERE routine_name = 'actualizar_producto';

-- ========================================================================
-- TEST: Prueba la función con un producto existente (reemplaza 1 con ID real)
-- ========================================================================
-- SELECT * FROM actualizar_producto(
--   1::bigint,
--   'Nuevo Nombre'::text,
--   500::integer,
--   45.99::numeric,
--   10::integer,
--   'Nueva descripción'::text,
--   NULL::text
-- );
