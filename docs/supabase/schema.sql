-- ========================================================================
-- TECHPOINTS SUPABASE SCHEMA
-- Ejecuta este script en el SQL Editor de Supabase Console
-- ========================================================================

-- 1. TABLA PROFILES (complementa auth.users de Supabase)
-- Almacena información adicional del usuario (puntos, rol, metadatos)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('cliente', 'tienda', 'admin')),
  nombre text,
  puntos integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  creado_at timestamptz DEFAULT now(),
  actualizado_at timestamptz DEFAULT now()
);

-- 2. TABLA STORES (tiendas afiliadas)
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  contacto jsonb DEFAULT '{}'::jsonb,
  creado_at timestamptz DEFAULT now(),
  actualizado_at timestamptz DEFAULT now()
);

-- 3. TABLA PRODUCTS (productos de las tiendas)
CREATE TABLE IF NOT EXISTS products (
  id bigserial PRIMARY KEY,
  tienda_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  categoria text,
  costo_puntos integer NOT NULL CHECK (costo_puntos > 0),
  precio_dolar numeric(10, 2),
  stock integer DEFAULT 0 CHECK (stock >= 0),
  imagen_url text,
  creado_at timestamptz DEFAULT now(),
  actualizado_at timestamptz DEFAULT now()
);

-- 4. TABLA POINTS_TRANSACTIONS (historial de puntos)
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('credito', 'debito', 'ajuste', 'compra_puntos')),
  cantidad integer NOT NULL,
  source jsonb DEFAULT '{}'::jsonb,
  creado_at timestamptz DEFAULT now()
);

-- 5. TABLA REDEMPTIONS (canjes de productos)
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  producto_id bigint NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  puntos_usados integer NOT NULL,
  estado text NOT NULL DEFAULT 'completado' CHECK (estado IN ('completado', 'pendiente', 'cancelado')),
  creado_at timestamptz DEFAULT now()
);

-- 6. TABLA TRANSACTIONS (auditoría general - opcional)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  datos jsonb DEFAULT '{}'::jsonb,
  rol text,
  metadata jsonb DEFAULT '{}'::jsonb,
  creado_at timestamptz DEFAULT now()
);

-- ========================================================================
-- ÍNDICES (para mejorar consultas)
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_tienda ON products(tienda_id);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_points_transactions_perfil ON points_transactions(perfil_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_tipo ON points_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_points_transactions_fecha ON points_transactions(creado_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_perfil ON redemptions(perfil_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_producto ON redemptions(producto_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_fecha ON redemptions(creado_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_usuario ON transactions(usuario_id);

-- ========================================================================
-- FUNCIÓN RPC: CANJEAR_PRODUCTO
-- Operación atómica: verifica puntos, stock, actualiza ambos e inserta transacciones
-- SEGURIDAD: usa SECURITY DEFINER para garantizar integridad (ejecutada como owner de la función)
-- ========================================================================
CREATE OR REPLACE FUNCTION canjear_producto(
  p_perfil_id uuid,
  p_producto_id bigint
)
RETURNS TABLE(
  success boolean,
  message text,
  puntos_restantes integer,
  stock_restante integer
) AS $$
DECLARE
  v_perfil profiles%ROWTYPE;
  v_producto products%ROWTYPE;
BEGIN
  -- 1. Obtener perfil con bloqueo (FOR UPDATE)
  SELECT * INTO v_perfil FROM profiles
  WHERE id = p_perfil_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Perfil no encontrado'::text, 0, 0;
    RETURN;
  END IF;

  -- 2. Obtener producto con bloqueo (FOR UPDATE)
  SELECT * INTO v_producto FROM products
  WHERE id = p_producto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Producto no encontrado'::text, v_perfil.puntos, 0;
    RETURN;
  END IF;

  -- 3. Validar stock disponible
  IF v_producto.stock <= 0 THEN
    RETURN QUERY SELECT false, 'Producto sin stock'::text, v_perfil.puntos, v_producto.stock;
    RETURN;
  END IF;

  -- 4. Validar puntos suficientes
  IF v_perfil.puntos < v_producto.costo_puntos THEN
    RETURN QUERY SELECT false, 'Puntos insuficientes'::text, v_perfil.puntos, v_producto.stock;
    RETURN;
  END IF;

  -- 5. Restar puntos del perfil
  UPDATE profiles
  SET puntos = puntos - v_producto.costo_puntos,
      actualizado_at = now()
  WHERE id = p_perfil_id;

  -- 6. Decrementar stock del producto
  UPDATE products
  SET stock = stock - 1,
      actualizado_at = now()
  WHERE id = p_producto_id;

  -- 7. Insertar en redemptions (auditoría de canje)
  INSERT INTO redemptions (perfil_id, producto_id, puntos_usados, estado)
  VALUES (p_perfil_id, p_producto_id, v_producto.costo_puntos, 'completado');

  -- 8. Insertar en points_transactions (auditoría de puntos)
  INSERT INTO points_transactions (perfil_id, tipo, cantidad, source)
  VALUES (
    p_perfil_id,
    'debito'::text,
    v_producto.costo_puntos,
    jsonb_build_object('producto_id', p_producto_id, 'tipo', 'canje')
  );

  -- 9. Retornar éxito
  RETURN QUERY SELECT true, 'Canje completado exitosamente'::text,
    v_perfil.puntos - v_producto.costo_puntos,
    v_producto.stock - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- FUNCIÓN RPC: AGREGAR_PUNTOS_CLIENTE
-- Agregar puntos a un cliente (usada por tiendas/admin)
-- ========================================================================
CREATE OR REPLACE FUNCTION agregar_puntos_cliente(
  p_perfil_id uuid,
  p_puntos integer,
  p_source text DEFAULT 'compra'
)
RETURNS TABLE(
  success boolean,
  message text,
  puntos_nuevos integer
) AS $$
DECLARE
  v_perfil profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_perfil FROM profiles
  WHERE id = p_perfil_id AND role = 'cliente'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cliente no encontrado'::text, 0;
    RETURN;
  END IF;

  IF p_puntos <= 0 THEN
    RETURN QUERY SELECT false, 'Los puntos deben ser mayores a 0'::text, v_perfil.puntos;
    RETURN;
  END IF;

  -- Actualizar puntos
  UPDATE profiles
  SET puntos = puntos + p_puntos,
      actualizado_at = now()
  WHERE id = p_perfil_id;

  -- Registrar transacción
  INSERT INTO points_transactions (perfil_id, tipo, cantidad, source)
  VALUES (
    p_perfil_id,
    'credito'::text,
    p_puntos,
    jsonb_build_object('fuente', p_source)
  );

  RETURN QUERY SELECT true, 'Puntos agregados exitosamente'::text, v_perfil.puntos + p_puntos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- FUNCIÓN RPC: OBTENER_ESTADISTICAS_CLIENTE
-- Retorna estadísticas del cliente (puntos, canjes, transacciones)
-- ========================================================================
CREATE OR REPLACE FUNCTION obtener_estadisticas_cliente(p_perfil_id uuid)
RETURNS TABLE(
  puntos_actuales integer,
  total_canjes integer,
  total_transacciones integer,
  ultimo_canje timestamptz,
  proximos_canjes integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT puntos FROM profiles WHERE id = p_perfil_id)::integer,
    (SELECT COUNT(*) FROM redemptions WHERE perfil_id = p_perfil_id AND estado = 'completado')::integer,
    (SELECT COUNT(*) FROM points_transactions WHERE perfil_id = p_perfil_id)::integer,
    (SELECT MAX(creado_at) FROM redemptions WHERE perfil_id = p_perfil_id),
    (SELECT COUNT(*) FROM redemptions WHERE perfil_id = p_perfil_id AND estado = 'pendiente')::integer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE ACCESO
-- ========================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES: el usuario puede ver/actualizar su propio perfil
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- STORES: públicamente visible pero editable solo por owner
CREATE POLICY "stores_select_public" ON stores FOR SELECT
USING (true);

CREATE POLICY "stores_insert_own" ON stores FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "stores_update_own" ON stores FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "stores_delete_own" ON stores FOR DELETE
USING (auth.uid() = owner_id);

-- PRODUCTS: públicamente visible pero editable solo por propietario de tienda
CREATE POLICY "products_select_public" ON products FOR SELECT
USING (true);

CREATE POLICY "products_insert_store_owner" ON products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores WHERE id = tienda_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "products_update_store_owner" ON products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores WHERE id = tienda_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores WHERE id = tienda_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "products_delete_store_owner" ON products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM stores WHERE id = tienda_id AND owner_id = auth.uid()
  )
);

-- POINTS_TRANSACTIONS: solo el usuario puede ver sus propias transacciones
CREATE POLICY "points_transactions_select_own" ON points_transactions FOR SELECT
USING (perfil_id = auth.uid());

CREATE POLICY "points_transactions_insert_functions_only" ON points_transactions FOR INSERT
WITH CHECK (false);  -- Solo inserciones vía funciones RPC

-- REDEMPTIONS: solo el usuario puede ver sus canjes
CREATE POLICY "redemptions_select_own" ON redemptions FOR SELECT
USING (perfil_id = auth.uid());

CREATE POLICY "redemptions_insert_functions_only" ON redemptions FOR INSERT
WITH CHECK (false);  -- Solo inserciones vía funciones RPC

-- TRANSACTIONS: solo el usuario puede ver sus propias transacciones
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
USING (usuario_id = auth.uid());

-- ========================================================================
-- TRIGGER: actualizar timestamp en perfiles
-- ========================================================================
CREATE OR REPLACE FUNCTION update_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_update_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_timestamp();

-- ========================================================================
-- DATOS INICIALES (OPCIONAL - ejecuta solo si necesitas datos de demo)
-- ========================================================================

-- Nota: Los usuarios se crean vía supabase.auth.signUp(), no aquí.
-- Descomenta y adapta los UUIDs si necesitas insertar datos manualmente:

/*
-- Insertar usuario demo cliente (REEMPLAZA CON UUID REAL)
INSERT INTO profiles (id, email, role, nombre, puntos)
VALUES (
  'PUT_CLIENT_UUID_HERE',
  'ana@mail.com',
  'cliente',
  'Ana García',
  50
) ON CONFLICT (id) DO NOTHING;

-- Insertar usuario demo tienda (REEMPLAZA CON UUID REAL)
INSERT INTO profiles (id, email, role, nombre, puntos)
VALUES (
  'PUT_STORE_UUID_HERE',
  'tienda@mail.com',
  'tienda',
  'Demo Store',
  0
) ON CONFLICT (id) DO NOTHING;

-- Insertar tienda (REEMPLAZA CON UUID REAL)
INSERT INTO stores (owner_id, nombre, descripcion, contacto)
VALUES (
  'PUT_STORE_UUID_HERE',
  'TechStore',
  'Tu tienda de tecnología de confianza',
  '{"telefono": "+56 9 0000 0000", "horario": "Lun-Vie 9:00-18:00"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Insertar productos demo (REEMPLAZA store_id)
INSERT INTO products (tienda_id, nombre, descripcion, categoria, costo_puntos, precio_dolar, stock, imagen_url)
VALUES
  (1, 'Mouse Gamer RGB', 'Mouse gaming de alta precisión', 'accesorios', 500, 25.00, 10, NULL),
  (1, 'Teclado Mecánico', 'Teclado con switches Cherry MX', 'accesorios', 800, 40.00, 5, NULL),
  (1, 'Auriculares Gaming', 'Sonido envolvente 7.1', 'audio', 600, 30.00, 8, NULL);
*/

-- ========================================================================
-- FIN DEL SCHEMA
-- ========================================================================
