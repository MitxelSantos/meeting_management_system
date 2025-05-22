/**
 * Modelo de Log de Auditoría
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { AUDIT_ACTIONS } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';
import { getCurrentTimestamp } from '../utils/dateUtils.js';

/**
 * Clase AuditLog - Representa una entrada de auditoría en el sistema
 */
export class AuditLog {
  /**
   * Constructor del log de auditoría
   * @param {Object} data - Datos del log
   */
  constructor(data = {}) {
    this.id = data.id || generateId('audit');
    this.action = data.action || '';
    this.description = data.description || '';
    this.userId = data.userId || null;
    this.userName = data.userName || '';
    this.userArea = data.userArea || '';
    this.timestamp = data.timestamp || getCurrentTimestamp();
    this.ipAddress = data.ipAddress || null;
    this.userAgent = data.userAgent || '';
    this.sessionId = data.sessionId || null;
    this.severity = data.severity || this.calculateSeverity(data.action);
    this.resourceType = data.resourceType || null;
    this.resourceId = data.resourceId || null;
    this.changes = data.changes || {};
    this.additionalData = data.additionalData || {};
    this.success = data.success !== undefined ? data.success : true;
    this.errorMessage = data.errorMessage || null;
  }

  /**
   * Calcula la severidad basada en la acción
   * @param {string} action - Acción realizada
   * @returns {string}
   */
  calculateSeverity(action) {
    switch (action) {
      case AUDIT_ACTIONS.LOGIN:
      case AUDIT_ACTIONS.LOGOUT:
      case AUDIT_ACTIONS.VIEW_SECTION:
        return 'info';

      case AUDIT_ACTIONS.CREATE_MEETING:
      case AUDIT_ACTIONS.EDIT_MEETING:
      case AUDIT_ACTIONS.GENERATE_REPORT:
      case AUDIT_ACTIONS.SEND_EMAIL:
        return 'info';

      case AUDIT_ACTIONS.DELETE_MEETING:
        return 'warning';

      case AUDIT_ACTIONS.SYSTEM_ERROR:
        return 'error';

      default:
        return 'info';
    }
  }

  /**
   * Obtiene el nombre descriptivo de la acción
   * @returns {string}
   */
  getActionName() {
    const actionNames = {
      [AUDIT_ACTIONS.LOGIN]: 'Inicio de Sesión',
      [AUDIT_ACTIONS.LOGOUT]: 'Cierre de Sesión',
      [AUDIT_ACTIONS.CREATE_MEETING]: 'Crear Reunión',
      [AUDIT_ACTIONS.EDIT_MEETING]: 'Editar Reunión',
      [AUDIT_ACTIONS.DELETE_MEETING]: 'Eliminar Reunión',
      [AUDIT_ACTIONS.VIEW_SECTION]: 'Ver Sección',
      [AUDIT_ACTIONS.GENERATE_REPORT]: 'Generar Reporte',
      [AUDIT_ACTIONS.SEND_EMAIL]: 'Enviar Email',
      [AUDIT_ACTIONS.SYSTEM_ERROR]: 'Error del Sistema'
    };

    return actionNames[this.action] || this.action;
  }

  /**
   * Obtiene el icono correspondiente a la acción
   * @returns {string}
   */
  getActionIcon() {
    const actionIcons = {
      [AUDIT_ACTIONS.LOGIN]: 'fas fa-sign-in-alt',
      [AUDIT_ACTIONS.LOGOUT]: 'fas fa-sign-out-alt',
      [AUDIT_ACTIONS.CREATE_MEETING]: 'fas fa-plus-circle',
      [AUDIT_ACTIONS.EDIT_MEETING]: 'fas fa-edit',
      [AUDIT_ACTIONS.DELETE_MEETING]: 'fas fa-trash',
      [AUDIT_ACTIONS.VIEW_SECTION]: 'fas fa-eye',
      [AUDIT_ACTIONS.GENERATE_REPORT]: 'fas fa-chart-bar',
      [AUDIT_ACTIONS.SEND_EMAIL]: 'fas fa-envelope',
      [AUDIT_ACTIONS.SYSTEM_ERROR]: 'fas fa-exclamation-triangle'
    };

    return actionIcons[this.action] || 'fas fa-info-circle';
  }

  /**
   * Obtiene el color correspondiente a la severidad
   * @returns {string}
   */
  getSeverityColor() {
    const severityColors = {
      'info': '#3182ce',
      'warning': '#d69e2e',
      'error': '#e53e3e',
      'critical': '#c53030'
    };

    return severityColors[this.severity] || '#3182ce';
  }

  /**
   * Verifica si el log es de una acción crítica
   * @returns {boolean}
   */
  isCritical() {
    const criticalActions = [
      AUDIT_ACTIONS.DELETE_MEETING,
      AUDIT_ACTIONS.SYSTEM_ERROR
    ];

    return criticalActions.includes(this.action) || this.severity === 'critical';
  }

  /**
   * Verifica si el log representa un error
   * @returns {boolean}
   */
  isError() {
    return !this.success || this.severity === 'error' || this.severity === 'critical';
  }

  /**
   * Obtiene información resumida del cambio realizado
   * @returns {string}
   */
  getChangesSummary() {
    if (!this.changes || Object.keys(this.changes).length === 0) {
      return '';
    }

    const changes = [];
    Object.entries(this.changes).forEach(([field, change]) => {
      if (change.from !== change.to) {
        changes.push(`${field}: "${change.from}" → "${change.to}"`);
      }
    });

    return changes.join(', ');
  }

  /**
   * Agrega información adicional al log
   * @param {string} key - Clave
   * @param {any} value - Valor
   */
  addAdditionalData(key, value) {
    this.additionalData[key] = value;
  }

  /**
   * Registra un cambio en un campo
   * @param {string} field - Campo modificado
   * @param {any} fromValue - Valor anterior
   * @param {any} toValue - Valor nuevo
   */
  recordChange(field, fromValue, toValue) {
    this.changes[field] = {
      from: fromValue,
      to: toValue,
      timestamp: getCurrentTimestamp()
    };
  }

  /**
   * Marca el log como error
   * @param {string} errorMessage - Mensaje de error
   */
  markAsError(errorMessage) {
    this.success = false;
    this.severity = 'error';
    this.errorMessage = errorMessage;
  }

  /**
   * Obtiene duración desde la creación del log
   * @returns {number} Duración en milisegundos
   */
  getDurationFromCreation() {
    return Date.now() - new Date(this.timestamp).getTime();
  }

  /**
   * Verifica si el log es reciente (última hora)
   * @returns {boolean}
   */
  isRecent() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return new Date(this.timestamp).getTime() > oneHourAgo;
  }

  /**
   * Obtiene información del navegador
   * @returns {Object}
   */
  getBrowserInfo() {
    if (!this.userAgent) return { browser: 'Unknown', version: 'Unknown' };

    const ua = this.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';

    if (ua.indexOf('Chrome') > -1) {
      browser = 'Chrome';
      version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
      browser = 'Safari';
      version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edge') > -1) {
      browser = 'Edge';
      version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }

    return { browser, version };
  }

  /**
   * Genera un hash único para este log
   * @returns {string}
   */
  generateHash() {
    const data = `${this.action}-${this.userId}-${this.timestamp}-${this.description}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Valida la integridad del log
   * @returns {Object}
   */
  validate() {
    const errors = [];

    if (!this.action) {
      errors.push('La acción es requerida');
    }

    if (!this.description) {
      errors.push('La descripción es requerida');
    }

    if (!this.timestamp) {
      errors.push('El timestamp es requerido');
    }

    if (!this.userName && !this.userId) {
      errors.push('Se requiere información del usuario');
    }

    if (!Object.values(AUDIT_ACTIONS).includes(this.action)) {
      errors.push('Acción no válida');
    }

    const validSeverities = ['info', 'warning', 'error', 'critical'];
    if (!validSeverities.includes(this.severity)) {
      errors.push('Severidad no válida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Exporta el log a formato CSV
   * @returns {string}
   */
  toCSV() {
    const fields = [
      this.timestamp,
      this.getActionName(),
      this.description,
      this.userName,
      this.userArea,
      this.severity,
      this.ipAddress || '',
      this.success ? 'Sí' : 'No',
      this.errorMessage || '',
      this.getChangesSummary()
    ];

    return fields.map(field => `"${field}"`).join(',');
  }

  /**
   * Convierte el log a objeto plano para serialización
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      action: this.action,
      description: this.description,
      userId: this.userId,
      userName: this.userName,
      userArea: this.userArea,
      timestamp: this.timestamp,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      sessionId: this.sessionId,
      severity: this.severity,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      changes: this.changes,
      additionalData: this.additionalData,
      success: this.success,
      errorMessage: this.errorMessage
    };
  }

  /**
   * Crea un log desde un objeto plano
   * @param {Object} data - Datos del log
   * @returns {AuditLog}
   */
  static fromJSON(data) {
    return new AuditLog(data);
  }

  /**
   * Crea una copia del log
   * @returns {AuditLog}
   */
  clone() {
    return AuditLog.fromJSON(this.toJSON());
  }

  /**
   * Crea un log de inicio de sesión
   * @param {Object} user - Usuario
   * @param {string} ipAddress - Dirección IP
   * @param {string} userAgent - User agent
   * @returns {AuditLog}
   */
  static createLoginLog(user, ipAddress = null, userAgent = '') {
    return new AuditLog({
      action: AUDIT_ACTIONS.LOGIN,
      description: `Inicio de sesión: ${user.name}`,
      userId: user.id,
      userName: user.name,
      userArea: user.area,
      ipAddress,
      userAgent,
      severity: 'info'
    });
  }

  /**
   * Crea un log de cierre de sesión
   * @param {Object} user - Usuario
   * @param {string} ipAddress - Dirección IP
   * @param {string} userAgent - User agent
   * @returns {AuditLog}
   */
  static createLogoutLog(user, ipAddress = null, userAgent = '') {
    return new AuditLog({
      action: AUDIT_ACTIONS.LOGOUT,
      description: `Cierre de sesión: ${user.name}`,
      userId: user.id,
      userName: user.name,
      userArea: user.area,
      ipAddress,
      userAgent,
      severity: 'info'
    });
  }

  /**
   * Crea un log de creación de reunión
   * @param {Object} user - Usuario
   * @param {Object} meeting - Reunión
   * @returns {AuditLog}
   */
  static createMeetingLog(user, meeting, action = AUDIT_ACTIONS.CREATE_MEETING) {
    const descriptions = {
      [AUDIT_ACTIONS.CREATE_MEETING]: `Reunión creada: ${meeting.title}`,
      [AUDIT_ACTIONS.EDIT_MEETING]: `Reunión editada: ${meeting.title}`,
      [AUDIT_ACTIONS.DELETE_MEETING]: `Reunión eliminada: ${meeting.title}`
    };

    return new AuditLog({
      action,
      description: descriptions[action] || `Acción en reunión: ${meeting.title}`,
      userId: user.id,
      userName: user.name,
      userArea: user.area,
      resourceType: 'meeting',
      resourceId: meeting.id,
      severity: action === AUDIT_ACTIONS.DELETE_MEETING ? 'warning' : 'info'
    });
  }

  /**
   * Crea un log de error del sistema
   * @param {string} errorMessage - Mensaje de error
   * @param {Object} user - Usuario (opcional)
   * @param {Object} additionalData - Datos adicionales
   * @returns {AuditLog}
   */
  static createErrorLog(errorMessage, user = null, additionalData = {}) {
    return new AuditLog({
      action: AUDIT_ACTIONS.SYSTEM_ERROR,
      description: errorMessage,
      userId: user?.id || null,
      userName: user?.name || 'Sistema',
      userArea: user?.area || 'sistema',
      severity: 'error',
      success: false,
      errorMessage,
      additionalData
    });
  }

  /**
   * Obtiene encabezados para exportación CSV
   * @returns {string}
   */
  static getCSVHeaders() {
    return [
      'Fecha/Hora',
      'Acción',
      'Descripción',
      'Usuario',
      'Área',
      'Severidad',
      'IP',
      'Éxito',
      'Error',
      'Cambios'
    ].map(header => `"${header}"`).join(',');
  }
}

export default AuditLog;