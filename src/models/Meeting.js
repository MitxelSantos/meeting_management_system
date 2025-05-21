/**
 * Modelo de Reunión
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { 
  MEETING_TYPES, 
  MEETING_TYPE_LABELS, 
  PRIORITY_LEVELS, 
  MEETING_STATUS,
  AREA_LABELS 
} from '../utils/constants.js';
import { formatDate, formatTime, addMinutes } from '../utils/dateUtils.js';
import { generateId } from '../utils/helpers.js';

/**
 * Clase Meeting - Representa una reunión en el sistema
 */
export class Meeting {
  /**
   * Constructor de la reunión
   * @param {Object} data - Datos de la reunión
   */
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.type = data.type || MEETING_TYPES.PRESENCIAL;
    this.date = data.date || '';
    this.startTime = data.startTime || '';
    this.endTime = data.endTime || '';
    this.location = data.location || '';
    this.organizer = data.organizer || '';
    this.attendees = data.attendees || '';
    this.externalEmails = data.externalEmails || '';
    this.agenda = data.agenda || '';
    this.notes = data.notes || '';
    this.priority = data.priority || PRIORITY_LEVELS.MEDIA;
    this.status = data.status || MEETING_STATUS.PROGRAMADA;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null;
    this.reminders = data.reminders || [15]; // minutos antes
    this.attachments = data.attachments || [];
    this.recurring = data.recurring || null; // configuración de recurrencia
    this.parentMeetingId = data.parentMeetingId || null; // para reuniones recurrentes
    this.cancelReason = data.cancelReason || null;
    this.feedbackScore = data.feedbackScore || null;
    this.feedbackComments = data.feedbackComments || null;
  }

  /**
   * Obtiene la fecha y hora de inicio como objeto Date
   * @returns {Date}
   */
  getStartDateTime() {
    if (!this.date || !this.startTime) return null;
    return new Date(`${this.date}T${this.startTime}`);
  }

  /**
   * Obtiene la fecha y hora de fin como objeto Date
   * @returns {Date}
   */
  getEndDateTime() {
    if (!this.date || !this.endTime) return null;
    return new Date(`${this.date}T${this.endTime}`);
  }

  /**
   * Calcula la duración de la reunión en minutos
   * @returns {number}
   */
  getDurationMinutes() {
    const start = this.getStartDateTime();
    const end = this.getEndDateTime();
    if (!start || !end) return 0;
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Verifica si la reunión está actualmente en curso
   * @returns {boolean}
   */
  isActive() {
    const now = new Date();
    const start = this.getStartDateTime();
    const end = this.getEndDateTime();
    
    if (!start || !end) return false;
    return now >= start && now <= end && this.status === MEETING_STATUS.PROGRAMADA;
  }

  /**
   * Verifica si la reunión es próxima (futura)
   * @returns {boolean}
   */
  isUpcoming() {
    const now = new Date();
    const start = this.getStartDateTime();
    
    if (!start) return false;
    return start > now && this.status === MEETING_STATUS.PROGRAMADA;
  }

  /**
   * Verifica si la reunión ya finalizó
   * @returns {boolean}
   */
  isPast() {
    const now = new Date();
    const end = this.getEndDateTime();
    
    if (!end) return false;
    return end < now;
  }

  /**
   * Verifica si la reunión requiere recordatorio
   * @param {number} minutesBefore - Minutos antes de la reunión
   * @returns {boolean}
   */
  needsReminder(minutesBefore = 15) {
    const now = new Date();
    const start = this.getStartDateTime();
    
    if (!start || !this.isUpcoming()) return false;
    
    const reminderTime = addMinutes(start, -minutesBefore);
    return now >= reminderTime && now < start;
  }

  /**
   * Obtiene el texto descriptivo del tipo de reunión
   * @returns {string}
   */
  getTypeLabel() {
    return MEETING_TYPE_LABELS[this.type] || this.type;
  }

  /**
   * Obtiene el texto descriptivo de la ubicación
   * @returns {string}
   */
  getLocationText() {
    const baseLocation = MEETING_TYPE_LABELS[this.type] || this.type;
    return this.location ? `${baseLocation} - ${this.location}` : baseLocation;
  }

  /**
   * Obtiene el nombre del organizador
   * @returns {string}
   */
  getOrganizerName() {
    return AREA_LABELS[this.organizer] || this.organizer;
  }

  /**
   * Obtiene la lista de asistentes como array
   * @returns {Array<string>}
   */
  getAttendeesList() {
    if (!this.attendees) return [];
    return this.attendees
      .split(',')
      .map(attendee => attendee.trim())
      .filter(attendee => attendee.length > 0);
  }

  /**
   * Obtiene la lista de correos externos como array
   * @returns {Array<string>}
   */
  getExternalEmailsList() {
    if (!this.externalEmails) return [];
    return this.externalEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  /**
   * Genera el cuerpo del email de invitación
   * @returns {string}
   */
  generateEmailBody() {
    const startDate = this.getStartDateTime();
    const formattedDate = startDate ? formatDate(startDate, 'EEEE, d \'de\' MMMM \'de\' yyyy') : this.date;
    
    return `
INVITACIÓN A REUNIÓN

Estimado(a) participante,

Se le invita cordialmente a la siguiente reunión:

📋 TÍTULO: ${this.title}
📅 FECHA: ${formattedDate}
🕐 HORA: ${this.startTime} - ${this.endTime} (${this.getDurationMinutes()} minutos)
📍 UBICACIÓN: ${this.getLocationText()}
👤 ORGANIZADOR: ${this.getOrganizerName()}
⚡ PRIORIDAD: ${this.priority.toUpperCase()}

${this.agenda ? `📝 AGENDA:
${this.agenda}

` : ''}${this.notes ? `📌 OBSERVACIONES:
${this.notes}

` : ''}Por favor confirme su asistencia respondiendo a este correo.

En caso de no poder asistir, le solicitamos informar con la mayor anticipación posible.

Atentamente,
${this.getOrganizerName()}
Secretaría de Salud del Tolima

---
Este es un mensaje automático del Sistema de Gestión de Reuniones.
Para consultas técnicas contacte: sistemas@saludtolima.gov.co
    `.trim();
  }

  /**
   * Genera un objeto para integración con Outlook
   * @returns {Object}
   */
  generateOutlookEvent() {
    const start = this.getStartDateTime();
    const end = this.getEndDateTime();
    
    if (!start || !end) return null;

    return {
      subject: this.title,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'America/Bogota'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'America/Bogota'
      },
      location: {
        displayName: this.getLocationText()
      },
      body: {
        contentType: 'text',
        content: this.generateEmailBody()
      },
      attendees: this.getExternalEmailsList().map(email => ({
        emailAddress: {
          address: email,
          name: email
        },
        type: 'required'
      })),
      isReminderOn: true,
      reminderMinutesBeforeStart: this.reminders[0] || 15,
      importance: this.priority === PRIORITY_LEVELS.URGENTE ? 'high' : 
                  this.priority === PRIORITY_LEVELS.ALTA ? 'high' : 'normal',
      showAs: 'busy',
      categories: ['Reunión Secretaría Salud']
    };
  }

  /**
   * Valida si los datos de la reunión son correctos
   * @returns {Object} - {isValid: boolean, errors: Array<string>}
   */
  validate() {
    const errors = [];

    // Validaciones requeridas
    if (!this.title?.trim()) {
      errors.push('El título de la reunión es requerido');
    }

    if (!this.date) {
      errors.push('La fecha de la reunión es requerida');
    }

    if (!this.startTime) {
      errors.push('La hora de inicio es requerida');
    }

    if (!this.endTime) {
      errors.push('La hora de fin es requerida');
    }

    if (!this.attendees?.trim()) {
      errors.push('Los asistentes son requeridos');
    }

    // Validaciones de lógica
    const start = this.getStartDateTime();
    const end = this.getEndDateTime();

    if (start && end) {
      if (start >= end) {
        errors.push('La hora de fin debe ser posterior a la hora de inicio');
      }

      if (this.getDurationMinutes() < 15) {
        errors.push('La duración mínima de una reunión es 15 minutos');
      }

      if (this.getDurationMinutes() > 480) { // 8 horas
        errors.push('La duración máxima de una reunión es 8 horas');
      }

      // Validar que no sea en el pasado
      const now = new Date();
      if (start < now) {
        errors.push('No se pueden programar reuniones en el pasado');
      }
    }

    // Validar emails externos
    const externalEmails = this.getExternalEmailsList();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of externalEmails) {
      if (!emailRegex.test(email)) {
        errors.push(`Email inválido: ${email}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Actualiza la reunión con nuevos datos
   * @param {Object} data - Nuevos datos
   */
  update(data) {
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'createdAt' && this.hasOwnProperty(key)) {
        this[key] = data[key];
      }
    });
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Cancela la reunión
   * @param {string} reason - Razón de cancelación
   */
  cancel(reason = '') {
    this.status = MEETING_STATUS.CANCELADA;
    this.cancelReason = reason;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Marca la reunión como finalizada
   */
  markAsCompleted() {
    this.status = MEETING_STATUS.FINALIZADA;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Convierte la reunión a objeto plano para serialización
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      type: this.type,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      location: this.location,
      organizer: this.organizer,
      attendees: this.attendees,
      externalEmails: this.externalEmails,
      agenda: this.agenda,
      notes: this.notes,
      priority: this.priority,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      reminders: this.reminders,
      attachments: this.attachments,
      recurring: this.recurring,
      parentMeetingId: this.parentMeetingId,
      cancelReason: this.cancelReason,
      feedbackScore: this.feedbackScore,
      feedbackComments: this.feedbackComments
    };
  }

  /**
   * Crea una reunión desde un objeto plano
   * @param {Object} data - Datos de la reunión
   * @returns {Meeting}
   */
  static fromJSON(data) {
    return new Meeting(data);
  }

  /**
   * Crea una copia de la reunión
   * @returns {Meeting}
   */
  clone() {
    return Meeting.fromJSON(this.toJSON());
  }
}

export default Meeting;