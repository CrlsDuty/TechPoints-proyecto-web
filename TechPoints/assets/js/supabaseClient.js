// assets/js/supabaseClient.js
// Inicializa el cliente de Supabase para uso en el frontend.
// RECUERDA: reemplaza `SUPABASE_URL` y `SUPABASE_ANON_KEY` por tus valores reales.
(function () {
  const SUPABASE_URL = 'https://nfetcnyhwgimusluxdfj.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZXRjbnlod2dpbXVzbHV4ZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNTM1NTEsImV4cCI6MjA3ODkyOTU1MX0._v9KKrBNyzog40YfY-jwiHy3r9eEEwvqR90IxSz6vYQ';

  const LOCAL_CDN_URL = './assets/vendor/supabase.min.js';
  const REMOTE_CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js';

  function findCreateClient() {
    return (
      (window.supabase && window.supabase.createClient) ||
      (window.supabaseJs && window.supabaseJs.createClient) ||
      (window.Supabase && window.Supabase.createClient) ||
      null
    );
  }

  function initWithFactory(factory) {
    try {
      const supabase = factory(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabase = supabase;
      console.log('[Supabase] Cliente inicializado correctamente.');
      return true;
    } catch (err) {
      console.error('[Supabase] Error inicializando el cliente:', err);
      return false;
    }
  }

  // Intento 1: buscar factory ya cargado
  const existingFactory = findCreateClient();
  if (existingFactory) {
    initWithFactory(existingFactory);
    return;
  }

  // Intento 2: cargar desde vendor local
  console.warn('[Supabase] createClient no disponible. Intentando cargar desde vendor local...');
  
  if (!document.querySelector('script[data-supabase-bundle]')) {
    const s = document.createElement('script');
    s.setAttribute('src', LOCAL_CDN_URL);
    s.setAttribute('data-supabase-bundle', 'true');
    s.onload = function () {
      const factory = findCreateClient();
      if (factory) {
        initWithFactory(factory);
      } else {
        console.warn('[Supabase] Vendor local no tuvo éxito. Intentando CDN remoto...');
        loadRemoteCDN();
      }
    };
    s.onerror = function (ev) {
      console.warn('[Supabase] Error cargando vendor local:', LOCAL_CDN_URL, ev);
      loadRemoteCDN();
    };
    document.head.appendChild(s);
  }

  function loadRemoteCDN() {
    if (!document.querySelector('script[data-supabase-remote]')) {
      const s = document.createElement('script');
      s.setAttribute('src', REMOTE_CDN_URL);
      s.setAttribute('data-supabase-remote', 'true');
      s.onload = function () {
        const factory = findCreateClient();
        if (factory) {
          initWithFactory(factory);
        } else {
          console.error('[Supabase] CDN remoto se cargó pero no se encontró `createClient`.');
        }
      };
      s.onerror = function (ev) {
        console.error('[Supabase] Error cargando CDN remoto:', REMOTE_CDN_URL, ev);
      };
      document.head.appendChild(s);
    }
  }
})();
