/**
 * Servicio de Notificaciones
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { NOTIFICATION_TYPES, UI_CONFIG } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';

/**
 * Servicio para gestionar notificaciones del sistema
 */
export class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.container = null;
    this.isInitialized = false;
    this.defaultDuration = UI_CONFIG.TOAST_DURATION;
    this.maxNotifications = 5;
    this.init();
  }

  /**
   * Inicializa el servicio de notificaciones
   */
  init() {
    this.createContainer();
    this.isInitialized = true;

    // Exponer globalmente para uso en otros componentes
    window.notifications = this;
  }

  /**
   * Crea el contenedor de notificaciones
   */
  createContainer() {
    // Verificar si ya existe
    let container = document.getElementById('toastContainer');

    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    this.container = container;
  }

  /**
   * Muestra una notificación
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación
   * @param {Object} options - Opciones adicionales
   * @returns {string} ID de la notificación
   */
  show(message, type = NOTIFICATION_TYPES.INFO, options = {}) {
    if (!this.isInitialized) {
      console.warn('NotificationService no está inicializado');
      return null;
    }

    const notificationId = generateId('notification');
    const notification = {
      id: notificationId,
      message,
      type,
      title: options.title || '',
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      closable: options.closable !== false,
      persistent: options.persistent === true,
      onClick: options.onClick || null,
      createdAt: Date.now()
    };

    // Limitar número de notificaciones
    this.limitNotifications();

    // Crear elemento DOM
    const element = this.createElement(notification);

    // Agregar al contenedor
    this.container.appendChild(element);

    // Guardar referencia
    this.notifications.set(notificationId, {
      ...notification,
      element
    });

    // Animar entrada
    requestAnimationFrame(() => {
      element.classList.add('show');
    });

    // Auto-ocultar si no es persistente
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.hide(notificationId);
      }, notification.duration);
    }

    return notificationId;
  }

  /**
   * Crea el elemento DOM de la notificación
   * @param {Object} notification - Datos de la notificación
   * @returns {Element}
   */
  createElement(notification) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${notification.type}`;
    toast.dataset.id = notification.id;

    // Header con título e icono
    const header = document.createElement('div');
    header.className = 'toast-header';

    const icon = this.getIcon(notification.type);
    const title = notification.title || this.getDefaultTitle(notification.type);

    header.innerHTML = `
      <div class="toast-title">
        <i class="${icon}"></i>
        <span>${title}</span>
      </div>
    `;

    // Botón de cerrar si es closable
    if (notification.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = '<i class="fas fa-times"></i>';
      closeBtn.addEventListener('click', () => this.hide(notification.id));
      header.appendChild(closeBtn);
    }

    // Cuerpo con mensaje
    const body = document.createElement('div');
    body.className = 'toast-body';
    body.textContent = notification.message;

    // Ensamblar toast
    toast.appendChild(header);
    toast.appendChild(body);

    // Agregar evento click si se especifica
    if (notification.onClick && typeof notification.onClick === 'function') {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', (e) => {
        if (!e.target.closest('.toast-close')) {
          notification.onClick(notification);
        }
      });
    }

    return toast;
  }

  /**
   * Obtiene el icono para un tipo de notificación
   * @param {string} type - Tipo de notificación
   * @returns {string}
   */
  getIcon(type) {
    const icons = {
      [NOTIFICATION_TYPES.SUCCESS]: 'fas fa-check-circle',
      [NOTIFICATION_TYPES.ERROR]: 'fas fa-times-circle',
      [NOTIFICATION_TYPES.WARNING]: 'fas fa-exclamation-triangle',
      [NOTIFICATION_TYPES.INFO]: 'fas fa-info-circle'
    };

    return icons[type] || icons[NOTIFICATION_TYPES.INFO];
  }

  /**
   * Obtiene el título por defecto para un tipo
   * @param {string} type - Tipo de notificación
   * @returns {string}
   */
  getDefaultTitle(type) {
    const titles = {
      [NOTIFICATION_TYPES.SUCCESS]: 'Éxito',
      [NOTIFICATION_TYPES.ERROR]: 'Error',
      [NOTIFICATION_TYPES.WARNING]: 'Advertencia',
      [NOTIFICATION_TYPES.INFO]: 'Información'
    };

    return titles[type] || titles[NOTIFICATION_TYPES.INFO];
  }

  /**
   * Oculta una notificación
   * @param {string} notificationId - ID de la notificación
   */
  hide(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    const element = notification.element;

    // Animar salida
    element.classList.add('removing');

    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.notifications.delete(notificationId);
    }, 300);
  }

  /**
   * Oculta todas las notificaciones
   */
  hideAll() {
    this.notifications.forEach((_, id) => {
      this.hide(id);
    });
  }

  /**
   * Limita el número de notificaciones visibles
   */
  limitNotifications() {
    if (this.notifications.size >= this.maxNotifications) {
      // Obtener la más antigua
      const oldest = Array.from(this.notifications.values())
        .sort((a, b) => a.createdAt - b.createdAt)[0];

      if (oldest) {
        this.hide(oldest.id);
      }
    }
  }

  /**
   * Métodos de conveniencia para tipos específicos
   */

  /**
   * Muestra notificación de éxito
   * @param {string} message - Mensaje
   * @param {Object} options - Opciones
   * @returns {string}
   */
  success(message, options = {}) {
    return this.show(message, NOTIFICATION_TYPES.SUCCESS, options);
  }

  /**
   * Muestra notificación de error
   * @param {string} message - Mensaje
   * @param {Object} options - Opciones
   * @returns {string}
   */
  error(message, options = {}) {
    return this.show(message, NOTIFICATION_TYPES.ERROR, {
      ...options,
      duration: options.duration !== undefined ? options.duration : 8000 // Más tiempo para errores
    });
  }

  /**
   * Muestra notificación de advertencia
   * @param {string} message - Mensaje
   * @param {Object} options - Opciones
   * @returns {string}
   */
  warning(message, options = {}) {
    return this.show(message, NOTIFICATION_TYPES.WARNING, options);
  }

  /**
   * Muestra notificación de información
   * @param {string} message - Mensaje
   * @param {Object} options - Opciones
   * @returns {string}
   */
  info(message, options = {}) {
    return this.show(message, NOTIFICATION_TYPES.INFO, options);
  }

  /**
   * Muestra notificación persistente que requiere acción del usuario
   * @param {string} message - Mensaje
   * @param {string} type - Tipo
   * @param {Object} options - Opciones
   * @returns {string}
   */
  persistent(message, type = NOTIFICATION_TYPES.INFO, options = {}) {
    return this.show(message, type, {
      ...options,
      persistent: true,
      closable: true
    });
  }

  /**
   * Muestra notificación con acción
   * @param {string} message - Mensaje
   * @param {Function} action - Función a ejecutar al hacer click
   * @param {string} type - Tipo
   * @param {Object} options - Opciones
   * @returns {string}
   */
  withAction(message, action, type = NOTIFICATION_TYPES.INFO, options = {}) {
    return this.show(message, type, {
      ...options,
      onClick: action,
      persistent: true
    });
  }

  /**
   * Muestra notificación de confirmación con botones
   * @param {string} message - Mensaje
   * @param {Function} onConfirm - Callback de confirmación
   * @param {Function} onCancel - Callback de cancelación
   * @param {Object} options - Opciones
   * @returns {string}
   */
  confirm(message, onConfirm, onCancel = null, options = {}) {
    const notificationId = generateId('confirm');

    // Crear elemento personalizado
    const toast = document.createElement('div');
    toast.className = 'toast toast-warning';
    toast.dataset.id = notificationId;

    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">
          <i class="fas fa-question-circle"></i>
          <span>${options.title || 'Confirmación'}</span>
        </div>
      </div>
      <div class="toast-body">
        <p>${message}</p>
        <div class="toast-actions">
          <button class="btn btn-sm btn-primary toast-confirm">
            <i class="fas fa-check"></i> Confirmar
          </button>
          <button class="btn btn-sm btn-secondary toast-cancel">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    `;

    // Eventos de botones
    const confirmBtn = toast.querySelector('.toast-confirm');
    const cancelBtn = toast.querySelector('.toast-cancel');

    confirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      this.hide(notificationId);
    });

    cancelBtn.addEventListener('click', () => {
      if (onCancel) onCancel();
      this.hide(notificationId);
    });

    // Agregar al contenedor
    this.container.appendChild(toast);

    // Guardar referencia
    this.notifications.set(notificationId, {
      id: notificationId,
      element: toast,
      createdAt: Date.now()
    });

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    return notificationId;
  }

  /**
   * Muestra notificación de progreso
   * @param {string} message - Mensaje
   * @param {number} progress - Progreso (0-100)
   * @param {Object} options - Opciones
   * @returns {string}
   */
  progress(message, progress = 0, options = {}) {
    const notificationId = options.id || generateId('progress');

    // Si ya existe, actualizar
    const existing = this.notifications.get(notificationId);
    if (existing) {
      this.updateProgress(notificationId, message, progress);
      return notificationId;
    }

    // Crear nueva notificación de progreso
    const toast = document.createElement('div');
    toast.className = 'toast toast-info';
    toast.dataset.id = notificationId;

    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Procesando</span>
        </div>
      </div>
      <div class="toast-body">
        <p class="progress-message">${message}</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-text">${progress}%</div>
      </div>
    `;

    // Agregar al contenedor
    this.container.appendChild(toast);

    // Guardar referencia
    this.notifications.set(notificationId, {
      id: notificationId,
      element: toast,
      createdAt: Date.now(),
      type: 'progress'
    });

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    return notificationId;
  }

  /**
   * Actualiza una notificación de progreso
   * @param {string} notificationId - ID de la notificación
   * @param {string} message - Nuevo mensaje
   * @param {number} progress - Nuevo progreso
   */
  updateProgress(notificationId, message, progress) {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.type !== 'progress') return;

    const element = notification.element;
    const messageEl = element.querySelector('.progress-message');
    const fillEl = element.querySelector('.progress-fill');
    const textEl = element.querySelector('.progress-text');

    if (messageEl) messageEl.textContent = message;
    if (fillEl) fillEl.style.width = `${progress}%`;
    if (textEl) textEl.textContent = `${progress}%`;

    // Si el progreso está completo, cambiar a éxito
    if (progress >= 100) {
      setTimeout(() => {
        element.classList.remove('toast-info');
        element.classList.add('toast-success');

        const icon = element.querySelector('.toast-title i');
        if (icon) {
          icon.className = 'fas fa-check-circle';
        }

        const title = element.querySelector('.toast-title span');
        if (title) {
          title.textContent = 'Completado';
        }

        // Auto-ocultar después de 2 segundos
        setTimeout(() => {
          this.hide(notificationId);
        }, 2000);
      }, 500);
    }
  }

  /**
   * Muestra notificación de carga
   * @param {string} message - Mensaje
   * @param {Object} options - Opciones
   * @returns {string}
   */
  loading(message = 'Cargando...', options = {}) {
    return this.show(message, NOTIFICATION_TYPES.INFO, {
      ...options,
      title: options.title || 'Procesando',
      persistent: true,
      closable: false
    });
  }

  /**
   * Obtiene todas las notificaciones activas
   * @returns {Array}
   */
  getAll() {
    return Array.from(this.notifications.values());
  }

  /**
   * Obtiene notificaciones por tipo
   * @param {string} type - Tipo de notificación
   * @returns {Array}
   */
  getByType(type) {
    return this.getAll().filter(notification => notification.type === type);
  }

  /**
   * Cuenta notificaciones por tipo
   * @returns {Object}
   */
  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      success: all.filter(n => n.type === NOTIFICATION_TYPES.SUCCESS).length,
      error: all.filter(n => n.type === NOTIFICATION_TYPES.ERROR).length,
      warning: all.filter(n => n.type === NOTIFICATION_TYPES.WARNING).length,
      info: all.filter(n => n.type === NOTIFICATION_TYPES.INFO).length
    };
  }

  /**
   * Verifica si hay notificaciones de error
   * @returns {boolean}
   */
  hasErrors() {
    return this.getByType(NOTIFICATION_TYPES.ERROR).length > 0;
  }

  /**
   * Configura opciones globales
   * @param {Object} options - Opciones
   */
  configure(options = {}) {
    if (options.defaultDuration !== undefined) {
      this.defaultDuration = options.defaultDuration;
    }

    if (options.maxNotifications !== undefined) {
      this.maxNotifications = options.maxNotifications;
    }
  }

  /**
   * Limpia notificaciones antiguas
   * @param {number} maxAge - Edad máxima en milisegundos
   */
  cleanup(maxAge = 5 * 60 * 1000) { // 5 minutos por defecto
    const now = Date.now();

    this.notifications.forEach((notification, id) => {
      if (now - notification.createdAt > maxAge) {
        this.hide(id);
      }
    });
  }

  /**
   * Destruye el servicio
   */
  destroy() {
    this.hideAll();

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.notifications.clear();
    this.isInitialized = false;

    // Remover referencia global
    if (window.notifications === this) {
      delete window.notifications;
    }
  }
}

export default NotificationService;