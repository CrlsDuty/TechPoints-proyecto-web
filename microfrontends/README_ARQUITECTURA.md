/**
 * TechPoints - Sistema de Puntos y Canjes
 * 
 * Este proyecto implementa una arquitectura de microfrontends para un sistema
 * de fidelización con puntos. Permite a los clientes acumular puntos y canjearlos
 * por productos de tecnología.
 * 
 * ARQUITECTURA:
 * - Shell App (React): Contenedor principal, autenticación y navegación
 * - Micro-Productos (React): Catálogo de productos con filtros y búsqueda
 * - Micro-Historial (Vue): Historial de canjes del usuario
 * - Micro-Canje (Vue): Sistema de carrito y confirmación de canjes
 * 
 * COMUNICACIÓN:
 * - PostMessage: Para compartir sesión entre Shell y microfrontends
 * - EventBus: Para eventos compartidos entre componentes
 * - Supabase: Base de datos centralizada (BaaS)
 * 
 * TECNOLOGÍAS:
 * - React 18 + Vite
 * - Vue 3 + Composition API
 * - Supabase (PostgreSQL + Auth + Storage)
 * - Vitest + React Testing Library
 * 
 * AUTORES: Equipo TechPoints
 * FECHA: Febrero 2026
 */

export const APP_INFO = {
  name: 'TechPoints',
  version: '1.0.0',
  description: 'Sistema de fidelización con microfrontends'
}
