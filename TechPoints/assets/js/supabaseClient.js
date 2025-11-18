// assets/js/supabaseClient.js
// Inicializa el cliente de Supabase para uso en el frontend.
(function () {
  const SUPABASE_URL = 'https://nfetcnyhwgimusluxdfj.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZXRjbnlod2dpbXVzbHV4ZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNTM1NTEsImV4cCI6MjA3ODkyOTU1MX0._v9KKrBNyzog40YfY-jwiHy3r9eEEwvqR90IxSz6vYQ';
  
  // Guardar en window para acceso desde otros scripts
  window._SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };

  const LOCAL_CDN_URL = './assets/vendor/supabase.min.js';
  const REMOTE_CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js';

  function findCreateClient() {
    if (window.supabase?.createClient) return window.supabase.createClient;
    if (window.supabaseJs?.createClient) return window.supabaseJs.createClient;
    if (window.Supabase?.createClient) return window.Supabase.createClient;
    // Buscar en la biblioteca global (puede estar en diferentes niveles)
    if (window['supabase-js']?.createClient) return window['supabase-js'].createClient;
    return null;
  }

  function initWithFactory(factory) {
    try {
      const supabase = factory(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabase = supabase;
      console.log('[Supabase] ✅ Cliente inicializado correctamente.');
      console.log('[Supabase] URL:', SUPABASE_URL);
      return true;
    } catch (err) {
      console.error('[Supabase] ❌ Error inicializando el cliente:', err);
      return false;
    }
  }

  function tryInit() {
    const factory = findCreateClient();
    if (factory) {
      console.log('[Supabase] Encontrado createClient, inicializando...');
      return initWithFactory(factory);
    }
    return false;
  }

  // Intento inmediato
  console.log('[Supabase] Iniciando búsqueda de createClient...');
  if (tryInit()) {
    return;
  }

  // Si no está disponible inmediatamente, esperar a que DOM esté listo
  console.warn('[Supabase] createClient no disponible inmediatamente. Esperando...');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!tryInit()) {
        console.warn('[Supabase] Aún no disponible después de DOMContentLoaded. Reintentar...');
        loadRemoteCDN();
      }
    });
  } else {
    // DOM ya cargado
    if (!tryInit()) {
      console.warn('[Supabase] Intentando cargar desde CDN remoto...');
      loadRemoteCDN();
    }
  }

  function loadRemoteCDN() {
    if (!document.querySelector('script[data-supabase-remote]')) {
      console.warn('[Supabase] Cargando desde CDN remoto...');
      const s = document.createElement('script');
      s.setAttribute('src', REMOTE_CDN_URL);
      s.setAttribute('data-supabase-remote', 'true');
      s.async = true;
      s.onload = function () {
        console.log('[Supabase] CDN remoto cargado. Buscando createClient...');
        if (!tryInit()) {
          console.error('[Supabase] ❌ CDN remoto se cargó pero createClient no se encontró.');
        }
      };
      s.onerror = function (ev) {
        console.error('[Supabase] ❌ Error cargando CDN remoto:', REMOTE_CDN_URL, ev);
      };
      document.head.appendChild(s);
    }
  }
})();
