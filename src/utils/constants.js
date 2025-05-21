/**
 * Constantes del sistema
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

// Tipos de reunión
export const MEETING_TYPES = {
  PRESENCIAL: 'presencial',
  VIRTUAL: 'virtual',
  OFICINA_DIRECTOR: 'oficina-director',
  DESPACHO: 'despacho',
};

// Etiquetas de tipos de reunión
export const MEETING_TYPE_LABELS = {
  [MEETING_TYPES.PRESENCIAL]: 'Presencial - Sala de Reuniones',
  [MEETING_TYPES.VIRTUAL]: 'Virtual - Microsoft Teams',
  [MEETING_TYPES.OFICINA_DIRECTOR]: 'Oficina del Director',
  [MEETING_TYPES.DESPACHO]: 'Despacho del Secretario',
};

// Áreas organizacionales
export const ORGANIZATIONAL_AREAS = {
  DESPACHO: 'despacho',
  DIRECCION_ADMINISTRATIVA: 'direccion-administrativa',
  DIRECCION_SALUD_PUBLICA: 'direccion-salud-publica',
  DIRECCION_ASEGURAMIENTO: 'direccion-aseguramiento',
  DIRECCION_PRESTACION: 'direccion-prestacion',
  DIRECCION_JURIDICA: 'direccion-juridica',
  SISTEMAS: 'sistemas',
};

// Etiquetas de áreas
export const AREA_LABELS = {
  [ORGANIZATIONAL_AREAS.DESPACHO]: 'Despacho del Secretario',
  [ORGANIZATIONAL_AREAS.DIRECCION_ADMINISTRATIVA]: 'Dirección Administrativa y Financiera',
  [ORGANIZATIONAL_AREAS.DIRECCION_SALUD_PUBLICA]: 'Dirección de Salud Pública',
  [ORGANIZATIONAL_AREAS.DIRECCION_ASEGURAMIENTO]: 'Dirección de Aseguramiento',
  [ORGANIZATIONAL_AREAS.DIRECCION_PRESTACION]: 'Dirección de Prestación de Servicios',
  [ORGANIZATIONAL_AREAS.DIRECCION_JURIDICA]: 'Dirección Jurídica',
  [ORGANIZATIONAL_AREAS.SISTEMAS]: 'Sistemas e Informática',
};

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  COORDINADOR: 'coordinador',
  ASISTENTE: 'asistente',
};

// Permisos del sistema
export const PERMISSIONS = {
  ALL: 'all',
  CREATE_MEETING: 'create_meeting',
  EDIT_MEETING: 'edit_meeting',
  DELETE_MEETING: 'delete_meeting',
  VIEW_MEETING: 'view_meeting',
  VIEW_REPORTS: 'view_reports',
  VIEW_AUDIT: 'view_audit',
  MANAGE_USERS: 'manage_users',
};

// Niveles de prioridad
export const PRIORITY_LEVELS = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente',
};

// Etiquetas de prioridad
export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.BAJA]: 'Baja',
  [PRIORITY_LEVELS.MEDIA]: 'Media',
  [PRIORITY_LEVELS.ALTA]: 'Alta',
  [PRIORITY_LEVELS.URGENTE]: 'Urgente',
};

// Colores de prioridad
export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.BAJA]: '#28a745',
  [PRIORITY_LEVELS.MEDIA]: '#ffc107',
  [PRIORITY_LEVELS.ALTA]: '#fd7e14',
  [PRIORITY_LEVELS.URGENTE]: '#dc3545',
};

// Estados de reunión
export const MEETING_STATUS = {
  PROGRAMADA: 'programada',
  EN_CURSO: 'en_curso',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
  REPROGRAMADA: 'reprogramada',
};

// Etiquetas de estado
export const STATUS_LABELS = {
  [MEETING_STATUS.PROGRAMADA]: 'Programada',
  [MEETING_STATUS.EN_CURSO]: 'En Curso',
  [MEETING_STATUS.FINALIZADA]: 'Finalizada',
  [MEETING_STATUS.CANCELADA]: 'Cancelada',
  [MEETING_STATUS.REPROGRAMADA]: 'Reprogramada',
};

// Tipos de actividad de auditoría
export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE_MEETING: 'create_meeting',
  EDIT_MEETING: 'edit_meeting',
  DELETE_MEETING: 'delete_meeting',
  VIEW_SECTION: 'view_section',
  GENERATE_REPORT: 'generate_report',
  SEND_EMAIL: 'send_email',
  SYSTEM_ERROR: 'system_error',
};

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Configuración de tiempo
export const TIME_CONFIG = {
  WORK_START_HOUR: 7,
  WORK_END_HOUR: 18,
  LUNCH_START_HOUR: 12,
  LUNCH_END_HOUR: 14,
  MEETING_SLOTS: [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ],
};

// Configuración de validación
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD_MIN_LENGTH: 6,
  MEETING_TITLE_MAX_LENGTH: 100,
  MEETING_DESCRIPTION_MAX_LENGTH: 500,
  MAX_ATTENDEES: 50,
};

// Mensajes del sistema
export const SYSTEM_MESSAGES = {
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGIN_FAILED: 'Credenciales incorrectas',
  LOGOUT_SUCCESS: 'Sesión cerrada correctamente',
  MEETING_CREATED: 'Reunión creada exitosamente',
  MEETING_UPDATED: 'Reunión actualizada correctamente',
  MEETING_DELETED: 'Reunión eliminada correctamente',
  MEETING_CANCELLED: 'Reunión cancelada',
  VALIDATION_ERROR: 'Por favor corrija los errores en el formulario',
  NETWORK_ERROR: 'Error de conexión. Intente nuevamente',
  PERMISSION_DENIED: 'No tiene permisos para realizar esta acción',
  SESSION_EXPIRED: 'Su sesión ha expirado. Por favor inicie sesión nuevamente',
};

// Configuración de la interfaz
export const UI_CONFIG = {
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  PAGINATION_ITEMS_PER_PAGE: 10,
  MAX_RECENT_ITEMS: 5,
};

// Configuración de almacenamiento
export const STORAGE_KEYS = {
  CURRENT_USER: 'sgt_current_user',
  MEETINGS: 'sgt_meetings',
  AUDIT_LOG: 'sgt_audit_log',
  USERS: 'sgt_users',
  SETTINGS: 'sgt_settings',
  LAST_LOGIN: 'sgt_last_login',
};

// URLs de la aplicación
export const APP_ROUTES = {
  LOGIN: '/',
  DASHBOARD: '/dashboard',
  MEETINGS: '/meetings',
  CALENDAR: '/calendar',
  REPORTS: '/reports',
  AUDIT: '/audit',
  SETTINGS: '/settings',
};

// Configuración de Chart.js
export const CHART_CONFIG = {
  DEFAULT_COLORS: [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
  ],
  ANIMATION_DURATION: 1000,
  RESPONSIVE: true,
  MAINTAIN_ASPECT_RATIO: false,
};

// Configuración de exportación
export const EXPORT_CONFIG = {
  FORMATS: ['pdf', 'excel', 'csv'],
  MAX_EXPORT_RECORDS: 1000,
  DEFAULT_FILENAME_PREFIX: 'reuniones_',
};

// Configuración de integración con Outlook
export const OUTLOOK_CONFIG = {
  SCOPES: [
    'https://graph.microsoft.com/calendars.readwrite',
    'https://graph.microsoft.com/mail.send'
  ],
  CALENDAR_NAME: 'Reuniones Secretaría Salud',
  DEFAULT_REMINDER_MINUTES: 15,
};

// Expresiones regulares útiles
export const REGEX_PATTERNS = {
  COLOMBIAN_EMAIL: /^[a-zA-Z0-9._%+-]+@(saludtolima\.gov\.co|tolima\.gov\.co)$/,
  PHONE_NUMBER: /^(\+57)?[1-9]\d{9}$/,
  TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
};

// Exportar todas las constantes como objeto por defecto
export default {
  MEETING_TYPES,
  MEETING_TYPE_LABELS,
  ORGANIZATIONAL_AREAS,
  AREA_LABELS,
  USER_ROLES,
  PERMISSIONS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  MEETING_STATUS,
  STATUS_LABELS,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
  TIME_CONFIG,
  VALIDATION_RULES,
  SYSTEM_MESSAGES,
  UI_CONFIG,
  STORAGE_KEYS,
  APP_ROUTES,
  CHART_CONFIG,
  EXPORT_CONFIG,
  OUTLOOK_CONFIG,
  REGEX_PATTERNS,
};