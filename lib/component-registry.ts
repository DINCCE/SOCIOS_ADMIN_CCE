import type { ComponentMeta } from '@/types/component-registry'

/**
 * Component Registry
 *
 * Comprehensive registry of all components in the project.
 * Manually curated - consider auto-generation script for future.
 */

export const COMPONENT_REGISTRY: ComponentMeta[] = [
  // ============================================================================
  // NATIVE SHADCN/UI COMPONENTS
  // ============================================================================

  // --- Form Inputs ---
  {
    id: 'input',
    name: 'Input',
    category: 'native-forms',
    description: 'Campo de entrada de texto estándar',
    source: 'shadcn',
    filePath: '@/components/ui/input',
    keywords: ['entrada', 'texto', 'campo', 'formulario', 'input'],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    category: 'native-forms',
    description: 'Campo de entrada de texto multilínea',
    source: 'shadcn',
    filePath: '@/components/ui/textarea',
    keywords: ['entrada', 'texto', 'multilínea', 'área', 'formulario'],
  },
  {
    id: 'select',
    name: 'Select',
    category: 'native-forms',
    description: 'Menú desplegable para selección única',
    source: 'shadcn',
    filePath: '@/components/ui/select',
    keywords: ['dropdown', 'menú', 'selección', 'opción', 'formulario'],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'native-forms',
    description: 'Casilla de verificación para opciones binarias',
    source: 'shadcn',
    filePath: '@/components/ui/checkbox',
    keywords: ['casilla', 'verificación', 'check', 'opción', 'booleano'],
  },
  {
    id: 'radio-group',
    name: 'Radio Group',
    category: 'native-forms',
    description: 'Grupo de opciones radio (selección única)',
    source: 'shadcn',
    filePath: '@/components/ui/radio-group',
    keywords: ['radio', 'opción', 'grupo', 'selección', 'única'],
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'native-forms',
    description: 'Interruptor de palanca para activar/desactivar',
    source: 'shadcn',
    filePath: '@/components/ui/switch',
    keywords: ['toggle', 'interruptor', 'palanca', 'activar', 'booleano'],
  },
  {
    id: 'slider',
    name: 'Slider',
    category: 'native-forms',
    description: 'Control deslizante para valores numéricos',
    source: 'shadcn',
    filePath: '@/components/ui/slider',
    keywords: ['rango', 'deslizador', 'valor', 'numérico', 'control'],
  },
  {
    id: 'input-otp',
    name: 'Input OTP',
    category: 'native-forms',
    description: 'Campo de entrada para código de un solo uso',
    source: 'shadcn',
    filePath: '@/components/ui/input-otp',
    keywords: ['otp', 'código', 'verificación', 'pin', 'autenticación'],
  },
  {
    id: 'label',
    name: 'Label',
    category: 'native-forms',
    description: 'Etiqueta para campos de formulario',
    source: 'shadcn',
    filePath: '@/components/ui/label',
    keywords: ['etiqueta', 'texto', 'campo', 'formulario'],
  },
  {
    id: 'button',
    name: 'Button',
    category: 'native-forms',
    description: 'Botón con múltiples variantes y tamaños',
    source: 'shadcn',
    filePath: '@/components/ui/button',
    keywords: ['botón', 'acción', 'click', 'submit', 'formulario'],
    playground: {
      variant: {
        type: 'select',
        options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
        defaultValue: 'default',
        label: 'Variante',
      },
      size: {
        type: 'select',
        options: ['default', 'sm', 'lg', 'icon'],
        defaultValue: 'default',
        label: 'Tamaño',
      },
      disabled: {
        type: 'toggle',
        defaultValue: false,
        label: 'Deshabilitado',
      },
    },
  },

  // --- Navigation ---
  {
    id: 'navigation-menu',
    name: 'Navigation Menu',
    category: 'native-navigation',
    description: 'Menú de navegación principal con soporte para teclado',
    source: 'shadcn',
    filePath: '@/components/ui/navigation-menu',
    keywords: ['menú', 'navegación', 'principal', 'header', 'links'],
  },
  {
    id: 'menubar',
    name: 'Menubar',
    category: 'native-navigation',
    description: 'Barra de menú estilo aplicación de escritorio',
    source: 'shadcn',
    filePath: '@/components/ui/menubar',
    keywords: ['menú', 'barra', 'desktop', 'aplicación', 'archivo'],
  },
  {
    id: 'dropdown-menu',
    name: 'Dropdown Menu',
    category: 'native-navigation',
    description: 'Menú contextual desplegable',
    source: 'shadcn',
    filePath: '@/components/ui/dropdown-menu',
    keywords: ['dropdown', 'menú', 'contextual', 'opciones', 'acciones'],
  },
  {
    id: 'context-menu',
    name: 'Context Menu',
    category: 'native-navigation',
    description: 'Menú de clic derecho (contextual)',
    source: 'shadcn',
    filePath: '@/components/ui/context-menu',
    keywords: ['contextual', 'clic derecho', 'menú', 'acciones'],
  },
  {
    id: 'pagination',
    name: 'Pagination',
    category: 'native-navigation',
    description: 'Control de paginación para listas largas',
    source: 'shadcn',
    filePath: '@/components/ui/pagination',
    keywords: ['paginación', 'páginas', 'navegación', 'lista'],
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'native-navigation',
    description: 'Pestañas para organizar contenido',
    source: 'shadcn',
    filePath: '@/components/ui/tabs',
    keywords: ['pestañas', 'tabs', 'organizar', 'contenido', 'vistas'],
  },
  {
    id: 'toggle-group',
    name: 'Toggle Group',
    category: 'native-navigation',
    description: 'Grupo de botones toggle para selección múltiple',
    source: 'shadcn',
    filePath: '@/components/ui/toggle-group',
    keywords: ['toggle', 'grupo', 'opciones', 'selección'],
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    category: 'native-navigation',
    description: 'Ruta de navegación (migas de pan)',
    source: 'shadcn',
    filePath: '@/components/ui/breadcrumb',
    keywords: ['breadcrumb', 'ruta', 'navegación', 'jerarquía'],
  },
  {
    id: 'command-search',
    name: 'Command Search',
    category: 'native-navigation',
    description: 'Paleta de comandos con búsqueda difusa',
    source: 'shadcn',
    filePath: '@/components/ui/command-search',
    keywords: ['comando', 'búsqueda', 'paleta', 'cmd+k', 'difuso'],
  },

  // --- Feedback & Status ---
  {
    id: 'alert',
    name: 'Alert',
    category: 'native-feedback',
    description: 'Mensaje de alerta contextual',
    source: 'shadcn',
    filePath: '@/components/ui/alert',
    keywords: ['alerta', 'mensaje', 'aviso', 'información', 'advertencia'],
  },
  {
    id: 'alert-dialog',
    name: 'Alert Dialog',
    category: 'native-feedback',
    description: 'Diálogo de confirmación para acciones destructivas',
    source: 'shadcn',
    filePath: '@/components/ui/alert-dialog',
    keywords: ['diálogo', 'confirmación', 'destructivo', 'alerta'],
  },
  {
    id: 'progress',
    name: 'Progress',
    category: 'native-feedback',
    description: 'Barra de progreso lineal',
    source: 'shadcn',
    filePath: '@/components/ui/progress',
    keywords: ['progreso', 'barra', 'carga', 'porcentaje'],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'native-feedback',
    description: 'Esqueleto de carga (placeholder)',
    source: 'shadcn',
    filePath: '@/components/ui/skeleton',
    keywords: ['esqueleto', 'carga', 'placeholder', 'loading'],
  },
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'native-feedback',
    description: 'Indicador de carga giratorio',
    source: 'shadcn',
    filePath: '@/components/ui/spinner',
    keywords: ['spinner', 'carga', 'loading', 'girar', 'indicador'],
  },
  {
    id: 'table-skeleton',
    name: 'Table Skeleton',
    category: 'native-feedback',
    description: 'Esqueleto específico para tablas',
    source: 'shadcn',
    filePath: '@/components/ui/table-skeleton',
    keywords: ['tabla', 'esqueleto', 'carga', 'filas'],
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'native-feedback',
    description: 'Etiqueta pequeña para estado o categorías',
    source: 'shadcn',
    filePath: '@/components/ui/badge',
    keywords: ['etiqueta', 'badge', 'estado', 'categoría', 'tag'],
  },
  {
    id: 'kbd',
    name: 'Kbd',
    category: 'native-feedback',
    description: 'Representación visual de atajo de teclado',
    source: 'shadcn',
    filePath: '@/components/ui/kbd',
    keywords: ['teclado', 'atajo', 'hotkey', 'combinación'],
  },

  // --- Data Display ---
  {
    id: 'table',
    name: 'Table',
    category: 'native-data',
    description: 'Tabla para mostrar datos tabulares',
    source: 'shadcn',
    filePath: '@/components/ui/table',
    keywords: ['tabla', 'datos', 'filas', 'columnas', 'grid'],
  },
  {
    id: 'card',
    name: 'Card',
    category: 'native-data',
    description: 'Tarjeta contenedora con sombra y borde',
    source: 'shadcn',
    filePath: '@/components/ui/card',
    keywords: ['tarjeta', 'card', 'contenedor', 'caja', 'panel'],
  },
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'native-data',
    description: 'Imagen de perfil con fallback',
    source: 'shadcn',
    filePath: '@/components/ui/avatar',
    keywords: ['avatar', 'perfil', 'imagen', 'foto', 'usuario'],
  },
  {
    id: 'carousel',
    name: 'Carousel',
    category: 'native-data',
    description: 'Carrusel de imágenes o contenido',
    source: 'shadcn',
    filePath: '@/components/ui/carousel',
    keywords: ['carrusel', 'slider', 'imágenes', 'galería', 'rotar'],
  },
  {
    id: 'aspect-ratio',
    name: 'Aspect Ratio',
    category: 'native-data',
    description: 'Contenedor con relación de aspecto fija',
    source: 'shadcn',
    filePath: '@/components/ui/aspect-ratio',
    keywords: ['aspecto', 'ratio', 'proporción', '16:9', 'contenedor'],
  },
  {
    id: 'separator',
    name: 'Separator',
    category: 'native-data',
    description: 'Línea divisoria horizontal o vertical',
    source: 'shadcn',
    filePath: '@/components/ui/separator',
    keywords: ['separador', 'divisor', 'línea', 'hr'],
  },
  {
    id: 'collapsible',
    name: 'Collapsible',
    category: 'native-data',
    description: 'Contenedor colapsable animado',
    source: 'shadcn',
    filePath: '@/components/ui/collapsible',
    keywords: ['colapsable', 'expandir', 'contraer', 'acordeón'],
  },
  {
    id: 'accordion',
    name: 'Accordion',
    category: 'native-data',
    description: 'Lista colapsable animada (acordeón)',
    source: 'shadcn',
    filePath: '@/components/ui/accordion',
    keywords: ['acordeón', 'colapsable', 'expandir', 'lista'],
  },

  // --- Overlays & Modals ---
  {
    id: 'dialog',
    name: 'Dialog',
    category: 'native-overlays',
    description: 'Ventana modal para contenido importante',
    source: 'shadcn',
    filePath: '@/components/ui/dialog',
    keywords: ['diálogo', 'modal', 'ventana', 'popup', 'overlay'],
  },
  {
    id: 'sheet',
    name: 'Sheet',
    category: 'native-overlays',
    description: 'Panel lateral deslizante (drawer)',
    source: 'shadcn',
    filePath: '@/components/ui/sheet',
    keywords: ['panel', 'lateral', 'drawer', 'deslizar', 'sidebar'],
  },
  {
    id: 'drawer',
    name: 'Drawer',
    category: 'native-overlays',
    description: 'Cajón deslizante desde bordes',
    source: 'shadcn',
    filePath: '@/components/ui/drawer',
    keywords: ['cajón', 'drawer', 'deslizar', 'panel', 'lateral'],
  },
  {
    id: 'popover',
    name: 'Popover',
    category: 'native-overlays',
    description: 'Ventana emergente flotante',
    source: 'shadcn',
    filePath: '@/components/ui/popover',
    keywords: ['popover', 'emergente', 'flotante', 'tooltip', 'popup'],
  },
  {
    id: 'hover-card',
    name: 'Hover Card',
    category: 'native-overlays',
    description: 'Tarjeta que aparece al pasar el mouse',
    source: 'shadcn',
    filePath: '@/components/ui/hover-card',
    keywords: ['hover', 'tarjeta', 'mouse', 'flotante', 'tooltip'],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'native-overlays',
    description: 'Etiqueta informativa flotante',
    source: 'shadcn',
    filePath: '@/components/ui/tooltip',
    keywords: ['tooltip', 'información', 'ayuda', 'flotante', 'hint'],
  },

  // --- Layout & Structure ---
  {
    id: 'scroll-area',
    name: 'Scroll Area',
    category: 'native-layout',
    description: 'Área con scroll personalizado',
    source: 'shadcn',
    filePath: '@/components/ui/scroll-area',
    keywords: ['scroll', 'área', 'desplazar', 'scrollbar', 'personalizado'],
  },
  {
    id: 'resizable',
    name: 'Resizable',
    category: 'native-layout',
    description: 'Panel redimensionable',
    source: 'shadcn',
    filePath: '@/components/ui/resizable',
    keywords: ['redimensionar', 'panel', 'resize', 'arrastrar'],
  },
  {
    id: 'empty',
    name: 'Empty',
    category: 'native-layout',
    description: 'Estado vacío con ilustración',
    source: 'shadcn',
    filePath: '@/components/ui/empty',
    keywords: ['vacío', 'empty', 'estado', 'sin datos', 'placeholder'],
  },

  // ============================================================================
  // CUSTOM COMPONENTS
  // ============================================================================

  // --- Layout & Structure ---
  {
    id: 'page-shell',
    name: 'Page Shell',
    category: 'custom-layout',
    description: 'Contenedor de página con altura completa',
    source: 'custom',
    filePath: '@/components/shell/page-shell',
    keywords: ['página', 'contenedor', 'altura', 'layout', 'shell'],
  },
  {
    id: 'page-header',
    name: 'Page Header',
    category: 'custom-layout',
    description: 'Encabezado de página compacto con acciones',
    source: 'custom',
    filePath: '@/components/shell/page-header',
    keywords: ['encabezado', 'header', 'página', 'título', 'acciones'],
  },
  {
    id: 'page-toolbar',
    name: 'Page Toolbar',
    category: 'custom-layout',
    description: 'Barra de herramientas de página',
    source: 'custom',
    filePath: '@/components/shell/page-toolbar',
    keywords: ['toolbar', 'barra', 'herramientas', 'filtros'],
  },
  {
    id: 'page-content',
    name: 'Page Content',
    category: 'custom-layout',
    description: 'Área de contenido de página con scroll',
    source: 'custom',
    filePath: '@/components/shell/page-content',
    keywords: ['contenido', 'scroll', 'área', 'página'],
  },
  {
    id: 'dynamic-breadcrumb',
    name: 'Dynamic Breadcrumb',
    category: 'custom-layout',
    description: 'Breadcrumb generado dinámicamente desde navegación',
    source: 'custom',
    filePath: '@/components/navigation/dynamic-breadcrumb',
    keywords: ['breadcrumb', 'dinámico', 'ruta', 'navegación'],
  },
  {
    id: 'app-sidebar',
    name: 'App Sidebar',
    category: 'custom-layout',
    description: 'Barra lateral de navegación principal',
    source: 'custom',
    filePath: '@/components/app-sidebar',
    keywords: ['sidebar', 'navegación', 'menú', 'lateral'],
  },

  // --- Forms ---
  {
    id: 'login-form',
    name: 'Login Form',
    category: 'custom-forms',
    description: 'Formulario de inicio de sesión',
    source: 'custom',
    filePath: '@/components/auth/login-form',
    keywords: ['login', 'formulario', 'sesión', 'autenticación'],
  },
  {
    id: 'register-form',
    name: 'Register Form',
    category: 'custom-forms',
    description: 'Formulario de registro',
    source: 'custom',
    filePath: '@/components/auth/register-form',
    keywords: ['registro', 'formulario', 'crear', 'cuenta'],
  },

  // --- Business Components (Socios) ---
  {
    id: 'new-person-sheet',
    name: 'New Person Sheet',
    category: 'custom-business',
    description: 'Panel para crear nueva persona',
    source: 'custom',
    filePath: '@/components/socios/personas/new-person-sheet',
    keywords: ['persona', 'crear', 'nueva', 'sheet', 'formulario'],
  },
  {
    id: 'family-card',
    name: 'Family Card',
    category: 'custom-business',
    description: 'Tarjeta de miembro familiar',
    source: 'custom',
    filePath: '@/components/socios/personas/family-card',
    keywords: ['familia', 'tarjeta', 'miembro', 'parentesco'],
  },
  {
    id: 'person-tabs-content',
    name: 'Person Tabs Content',
    category: 'custom-business',
    description: 'Contenido de pestañas de persona',
    source: 'custom',
    filePath: '@/components/socios/personas/person-tabs-content',
    keywords: ['persona', 'pestañas', 'tabs', 'contenido'],
  },
  {
    id: 'person-dashboard',
    name: 'Person Dashboard',
    category: 'custom-business',
    description: 'Dashboard de información de persona',
    source: 'custom',
    filePath: '@/components/socios/personas/person-dashboard',
    keywords: ['persona', 'dashboard', 'resumen', 'información'],
  },

  // --- Process Components ---
  {
    id: 'tarea-card',
    name: 'Tarea Card',
    category: 'custom-process',
    description: 'Tarjeta de tarea para tablero Kanban',
    source: 'custom',
    filePath: '@/components/procesos/tareas/tarea-card',
    keywords: ['tarea', 'card', 'tarjeta', 'kanban', 'proceso'],
  },
  {
    id: 'tareas-board',
    name: 'Tareas Board',
    category: 'custom-process',
    description: 'Tablero Kanban de tareas',
    source: 'custom',
    filePath: '@/components/procesos/tareas/tareas-board',
    keywords: ['tareas', 'tablero', 'kanban', 'proceso', 'columnas'],
  },
  {
    id: 'oportunidad-card',
    name: 'Oportunidad Card',
    category: 'custom-process',
    description: 'Tarjeta de oportunidad comercial',
    source: 'custom',
    filePath: '@/components/procesos/oportunidades/oportunidad-card',
    keywords: ['oportunidad', 'card', 'tarjeta', 'venta', 'proceso'],
  },
  {
    id: 'view-toggle',
    name: 'View Toggle',
    category: 'custom-process',
    description: 'Toggle entre vista lista y tablero',
    source: 'custom',
    filePath: '@/components/procesos/view-toggle',
    keywords: ['vista', 'toggle', 'lista', 'tablero', 'cambiar'],
    playground: {
      view: {
        type: 'select',
        options: ['list', 'board'],
        defaultValue: 'list',
        label: 'Vista',
      },
    },
  },

  // --- Advanced Custom ---
  {
    id: 'color-scheme-provider',
    name: 'Color Scheme Provider',
    category: 'custom-providers',
    description: 'Provider para gestión de tema claro/oscuro',
    source: 'custom',
    filePath: '@/components/providers/color-scheme-provider',
    keywords: ['tema', 'oscuro', 'claro', 'provider', 'modo'],
  },
]

/**
 * Get component by ID
 */
export function getComponent(id: string): ComponentMeta | undefined {
  return COMPONENT_REGISTRY.find((c) => c.id === id)
}

/**
 * Get components by category
 */
export function getComponentsByCategory(categoryId: string): ComponentMeta[] {
  return COMPONENT_REGISTRY.filter((c) => c.category === categoryId)
}

/**
 * Get components by source
 */
export function getComponentsBySource(source: 'shadcn' | 'custom'): ComponentMeta[] {
  return COMPONENT_REGISTRY.filter((c) => c.source === source)
}

/**
 * Search components by keywords
 */
export function searchComponents(query: string): ComponentMeta[] {
  const lowerQuery = query.toLowerCase()
  return COMPONENT_REGISTRY.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get component count by category
 */
export function getComponentCountByCategory(categoryId: string): number {
  return COMPONENT_REGISTRY.filter((c) => c.category === categoryId).length
}
