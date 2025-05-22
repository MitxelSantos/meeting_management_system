/**
 * Configuración principal de la aplicación
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

/**
 * Configuración del entorno
 */
const isDevelopment = process?.env?.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

/**
 * Configuración principal de la aplicación
 */
const config = {
    // Información de la aplicación
    APP: {
        NAME: 'Sistema de Gestión de Reuniones',
        VERSION: '1.0.0',
        DESCRIPTION: 'Sistema de Gestión de Reuniones - Secretaría de Salud del Tolima',
        AUTHOR: 'Secretaría de Salud del Tolima',
    },

    // Configuración del entorno
    ENV: {
        DEVELOPMENT: isDevelopment,
        PRODUCTION: !isDevelopment,
        DEBUG: isDevelopment,
    },

    // URLs de la API
    API: {
        BASE_URL: isDevelopment ? 'http://localhost:3001/api' : '/api',
        TIMEOUT: 30000, // 30 segundos
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000, // 1 segundo
    },

    // Configuración de autenticación
    AUTH: {
        SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 horas
        INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutos
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos
        PASSWORD_MIN_LENGTH: 6,
        REQUIRE_STRONG_PASSWORD: !isDevelopment,
    },

    // Configuración de la base de datos (localStorage para desarrollo)
    DATABASE: {
        TYPE: isDevelopment ? 'localStorage' : 'api',
        PREFIX: 'sgt_', // Sistema Gestión Tolima
        VERSION: '1.0',
        MAX_ENTRIES: 1000,
        CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
    },

    // Configuración de la interfaz de usuario
    UI: {
        THEME: 'light',
        LANGUAGE: 'es-CO',
        TIMEZONE: 'America/Bogota',
        DATE_FORMAT: 'dd/MM/yyyy',
        TIME_FORMAT: 'HH:mm',
        CURRENCY: 'COP',
        PAGINATION_SIZE: 10,
        TOAST_DURATION: 5000,
        MODAL_ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300,
    },

    // Configuración del calendario
    CALENDAR: {
        WORK_DAYS: [1, 2, 3, 4, 5], // Lunes a Viernes
        WORK_START_HOUR: 7,
        WORK_END_HOUR: 18,
        LUNCH_START_HOUR: 12,
        LUNCH_END_HOUR: 14,
        MIN_MEETING_DURATION: 15, // minutos
        MAX_MEETING_DURATION: 480, // 8 horas
        DEFAULT_MEETING_DURATION: 60, // 1 hora
        TIME_SLOTS: [
            '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
            '10:00', '10:30', '11:00', '11:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
        ],
    },

    // Configuración de reuniones
    MEETINGS: {
        MAX_ATTENDEES: 50,
        MAX_TITLE_LENGTH: 100,
        MAX_DESCRIPTION_LENGTH: 1000,
        MAX_AGENDA_LENGTH: 2000,
        MAX_NOTES_LENGTH: 2000,
        DEFAULT_REMINDERS: [15, 60], // minutos
        MAX_ATTACHMENTS: 10,
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_FILE_TYPES: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'text/plain'
        ],
    },

    // Configuración de notificaciones
    NOTIFICATIONS: {
        ENABLED: true,
        TYPES: {
            BROWSER: true,
            EMAIL: !isDevelopment,
            IN_APP: true,
        },
        DEFAULT_REMINDERS: [
            { time: 24 * 60, message: '1 día antes' },
            { time: 60, message: '1 hora antes' },
            { time: 15, message: '15 minutos antes' }
        ],
        MAX_NOTIFICATIONS: 100,
        CLEANUP_AFTER_DAYS: 30,
    },

    // Configuración de reportes
    REPORTS: {
        MAX_EXPORT_RECORDS: 5000,
        SUPPORTED_FORMATS: ['pdf', 'excel', 'csv'],
        CHART_COLORS: [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
        ],
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
    },

    // Configuración de integración con Microsoft Graph
    MICROSOFT_GRAPH: {
        ENABLED: !isDevelopment,
        CLIENT_ID: process?.env?.AZURE_CLIENT_ID || '',
        TENANT_ID: process?.env?.AZURE_TENANT_ID || '',
        SCOPES: [
            'https://graph.microsoft.com/calendars.readwrite',
            'https://graph.microsoft.com/mail.send',
            'https://graph.microsoft.com/user.read'
        ],
        REDIRECT_URI: isDevelopment ?
            'http://localhost:3000/auth/callback' :
            `${window.location.origin}/auth/callback`,
    },

    // Configuración de correo electrónico
    EMAIL: {
        ENABLED: !isDevelopment,
        SMTP_HOST: process?.env?.SMTP_HOST || '',
        SMTP_PORT: process?.env?.SMTP_PORT || 587,
        FROM_ADDRESS: 'noreply@saludtolima.gov.co',
        FROM_NAME: 'Sistema de Gestión de Reuniones',
        TEMPLATE_PATH: '/templates/email/',
        RETRY_ATTEMPTS: 3,
        BATCH_SIZE: 50, // emails por lote
    },

    // Configuración de logs y auditoría
    LOGGING: {
        ENABLED: true,
        LEVEL: isDevelopment ? 'debug' : 'info',
        MAX_ENTRIES: 1000,
        RETENTION_DAYS: 90,
        CATEGORIES: {
            AUTH: true,
            MEETINGS: true,
            SYSTEM: true,
            ERRORS: true,
            PERFORMANCE: isDevelopment,
        },
        CONSOLE_OUTPUT: isDevelopment,
        REMOTE_LOGGING: !isDevelopment,
    },

    // Configuración de seguridad
    SECURITY: {
        ENABLE_CSP: !isDevelopment,
        ALLOWED_DOMAINS: [
            'saludtolima.gov.co',
            'tolima.gov.co',
            'gov.co'
        ],
        SANITIZE_INPUT: true,
        ENCRYPT_STORAGE: !isDevelopment,
        RATE_LIMITING: {
            ENABLED: !isDevelopment,
            MAX_REQUESTS: 100,
            WINDOW_MS: 15 * 60 * 1000, // 15 minutos
        },
        CORS: {
            ENABLED: !isDevelopment,
            ALLOWED_ORIGINS: [
                'https://saludtolima.gov.co',
                'https://www.saludtolima.gov.co'
            ],
        },
    },

    // Configuración de caché
    CACHE: {
        ENABLED: true,
        DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
        MAX_SIZE: 100, // número de entradas
        STRATEGIES: {
            MEETINGS: 30 * 1000, // 30 segundos
            USERS: 2 * 60 * 1000, // 2 minutos
            REPORTS: 10 * 60 * 1000, // 10 minutos
            CALENDAR: 60 * 1000, // 1 minuto
        },
    },

    // Configuración de performance
    PERFORMANCE: {
        LAZY_LOADING: true,
        VIRTUAL_SCROLLING: true,
        DEBOUNCE_SEARCH: 300,
        THROTTLE_SCROLL: 100,
        IMAGE_OPTIMIZATION: true,
        BUNDLE_SPLITTING: !isDevelopment,
    },

    // Configuración de accesibilidad
    ACCESSIBILITY: {
        HIGH_CONTRAST: false,
        SCREEN_READER: true,
        KEYBOARD_NAVIGATION: true,
        FOCUS_INDICATORS: true,
        REDUCED_MOTION: false,
    },

    // Configuración de internacionalización
    I18N: {
        DEFAULT_LOCALE: 'es-CO',
        SUPPORTED_LOCALES: ['es-CO', 'es-ES'],
        FALLBACK_LOCALE: 'es-CO',
        LOAD_PATH: '/locales/{{lng}}/{{ns}}.json',
        DEBUG: isDevelopment,
    },

    // URLs y rutas
    ROUTES: {
        LOGIN: '/',
        DASHBOARD: '/dashboard',
        MEETINGS: '/meetings',
        MEETING_CREATE: '/meetings/create',
        MEETING_EDIT: '/meetings/edit',
        CALENDAR: '/calendar',
        REPORTS: '/reports',
        AUDIT: '/audit',
        SETTINGS: '/settings',
        PROFILE: '/profile',
    },

    // Configuración de desarrollo
    DEVELOPMENT: {
        MOCK_DATA: isDevelopment,
        HOT_RELOAD: isDevelopment,
        SOURCE_MAPS: isDevelopment,
        DETAILED_ERRORS: isDevelopment,
        PERFORMANCE_MONITORING: isDevelopment,
        REDUX_DEVTOOLS: isDevelopment,
    },

    // Mensajes del sistema
    MESSAGES: {
        SUCCESS: {
            LOGIN: 'Inicio de sesión exitoso',
            LOGOUT: 'Sesión cerrada correctamente',
            MEETING_CREATED: 'Reunión creada exitosamente',
            MEETING_UPDATED: 'Reunión actualizada correctamente',
            MEETING_DELETED: 'Reunión eliminada correctamente',
            MEETING_CANCELLED: 'Reunión cancelada',
            EMAIL_SENT: 'Invitaciones enviadas correctamente',
        },
        ERROR: {
            LOGIN_FAILED: 'Credenciales incorrectas',
            NETWORK_ERROR: 'Error de conexión. Intente nuevamente',
            PERMISSION_DENIED: 'No tiene permisos para realizar esta acción',
            SESSION_EXPIRED: 'Su sesión ha expirado. Por favor inicie sesión nuevamente',
            VALIDATION_ERROR: 'Por favor corrija los errores en el formulario',
            GENERIC_ERROR: 'Ha ocurrido un error inesperado',
        },
        WARNING: {
            UNSAVED_CHANGES: 'Tiene cambios sin guardar. ¿Desea continuar?',
            DELETE_CONFIRMATION: '¿Está seguro de que desea eliminar este elemento?',
            CANCEL_MEETING: '¿Está seguro de que desea cancelar esta reunión?',
        },
    },

    // Patrones de validación
    VALIDATION: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        INSTITUTIONAL_EMAIL: /^[a-zA-Z0-9._%+-]+@(saludtolima\.gov\.co|tolima\.gov\.co)$/,
        PHONE: /^(\+57)?[1-9]\d{9}$/,
        TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
        PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    },
};

// Función para obtener configuración específica del entorno
export function getConfig(key) {
    const keys = key.split('.');
    let value = config;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return undefined;
        }
    }

    return value;
}

// Función para actualizar configuración en tiempo de ejecución
export function updateConfig(key, value) {
    const keys = key.split('.');
    let target = config;

    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in target) || typeof target[k] !== 'object') {
            target[k] = {};
        }
        target = target[k];
    }

    target[keys[keys.length - 1]] = value;
}

// Función para validar configuración
export function validateConfig() {
    const errors = [];

    // Validar configuraciones críticas
    if (!config.AUTH.SESSION_TIMEOUT || config.AUTH.SESSION_TIMEOUT < 60000) {
        errors.push('SESSION_TIMEOUT debe ser al menos 1 minuto');
    }

    if (config.MEETINGS.MAX_ATTENDEES < 1) {
        errors.push('MAX_ATTENDEES debe ser al menos 1');
    }

    if (config.CALENDAR.WORK_START_HOUR >= config.CALENDAR.WORK_END_HOUR) {
        errors.push('WORK_START_HOUR debe ser menor que WORK_END_HOUR');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Log de configuración en desarrollo
if (config.ENV.DEVELOPMENT && config.LOGGING.CONSOLE_OUTPUT) {
    console.log('🔧 Configuración de la aplicación:', config);

    const validation = validateConfig();
    if (!validation.isValid) {
        console.warn('⚠️ Errores de configuración:', validation.errors);
    }
}

export default config;