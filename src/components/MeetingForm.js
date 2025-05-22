/**
 * Componente de formulario de reuniones
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { Meeting } from '../models/Meeting.js';
import {
  MEETING_TYPES,
  MEETING_TYPE_LABELS,
  PRIORITY_LEVELS,
  ORGANIZATIONAL_AREAS,
  AREA_LABELS,
  TIME_CONFIG
} from '../utils/constants.js';
import { formatDate, formatTime, addMinutes } from '../utils/dateUtils.js';
import { validateEmail, generateId } from '../utils/helpers.js';

/**
 * Componente para crear y editar reuniones
 */
export class MeetingForm {
  constructor(meetingService, authService) {
    this.meetingService = meetingService;
    this.authService = authService;
    this.container = null;
    this.mode = 'create'; // 'create' | 'edit'
    this.meetingId = null;
    this.currentMeeting = null;
    this.isDirty = false;
    this.validationErrors = {};
  }

  /**
   * Renderiza el formulario
   * @param {Element} container - Contenedor
   * @param {string} mode - Modo ('create' | 'edit')  
   * @param {string} meetingId - ID de reunión (para edición)
   */
  async render(container, mode = 'create', meetingId = null) {
    this.container = container;
    this.mode = mode;
    this.meetingId = meetingId;

    try {
      // Cargar reunión existente si es edición
      if (mode === 'edit' && meetingId) {
        this.currentMeeting = await this.meetingService.getById(meetingId);
        if (!this.currentMeeting) {
          throw new Error('Reunión no encontrada');
        }
      } else {
        this.currentMeeting = new Meeting();
        // Pre-llenar con datos del usuario actual
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.currentMeeting.organizer = currentUser.area;
        }
      }

      // Renderizar HTML
      const html = this.generateHTML();
      this.container.innerHTML = html;

      // Configurar eventos
      this.setupEvents();

      // Pre-rellenar formulario si es edición
      if (mode === 'edit') {
        this.fillForm();
      }

      // Configurar valores por defecto
      this.setDefaults();

    } catch (error) {
      console.error('Error al renderizar formulario:', error);
      this.renderError(error.message);
    }
  }

  /**
   * Genera el HTML del formulario
   * @returns {string}
   */
  generateHTML() {
    const currentUser = this.authService.getCurrentUser();
    const title = this.mode === 'edit' ? 'Editar Reunión' : 'Nueva Reunión';
    const icon = this.mode === 'edit' ? 'fa-edit' : 'fa-plus';

    return `
      <div class="meeting-form-container">
        <div class="form-header">
          <h2><i class="fas ${icon}"></i> ${title}</h2>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" id="cancelForm">
              <i class="fas fa-times"></i> Cancelar
            </button>
            <button type="button" class="btn btn-outline" id="previewMeeting">
              <i class="fas fa-eye"></i> Vista Previa
            </button>
            <button type="submit" class="btn btn-primary" id="saveMeeting">
              <i class="fas fa-save"></i> ${this.mode === 'edit' ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>

        <form id="meetingForm" novalidate>
          <!-- Información Básica -->
          <div class="form-section">
            <h3 class="form-section-title">
              <i class="fas fa-info-circle"></i>
              Información Básica
            </h3>
            
            <div class="form-row two-columns">
              <div class="form-group">
                <label for="title" class="form-label required">Título de la Reunión</label>
                <input type="text" id="title" name="title" class="form-control" 
                       placeholder="Ingrese el título de la reunión" maxlength="100" required>
                <div class="form-error" id="title-error"></div>
              </div>
              
              <div class="form-group">
                <label for="type" class="form-label required">Tipo de Reunión</label>
                <select id="type" name="type" class="form-control form-select" required>
                  <option value="">Seleccionar tipo</option>
                  ${Object.entries(MEETING_TYPE_LABELS).map(([value, label]) =>
      `<option value="${value}">${label}</option>`
    ).join('')}
                </select>
                <div class="form-error" id="type-error"></div>
              </div>
            </div>

            <div class="form-group">
              <label for="description" class="form-label">Descripción</label>
              <textarea id="description" name="description" class="form-control form-textarea" 
                        rows="3" placeholder="Describa brevemente el propósito de la reunión" maxlength="500"></textarea>
              <div class="form-help">Opcional - Máximo 500 caracteres</div>
            </div>
          </div>

          <!-- Fecha y Hora -->
          <div class="form-section">
            <h3 class="form-section-title">
              <i class="fas fa-calendar-alt"></i>
              Fecha y Hora
            </h3>
            
            <div class="form-row three-columns">
              <div class="form-group">
                <label for="date" class="form-label required">Fecha</label>
                <input type="date" id="date" name="date" class="form-control" required>
                <div class="form-error" id="date-error"></div>
              </div>
              
              <div class="form-group">
                <label for="startTime" class="form-label required">Hora de Inicio</label>
                <select id="startTime" name="startTime" class="form-control form-select" required>
                  <option value="">Seleccionar hora</option>
                  ${TIME_CONFIG.MEETING_SLOTS.map(time =>
      `<option value="${time}">${time}</option>`
    ).join('')}
                </select>
                <div class="form-error" id="startTime-error"></div>
              </div>
              
              <div class="form-group">
                <label for="endTime" class="form-label required">Hora de Fin</label>
                <select id="endTime" name="endTime" class="form-control form-select" required>
                  <option value="">Seleccionar hora</option>
                  ${TIME_CONFIG.MEETING_SLOTS.map(time =>
      `<option value="${time}">${time}</option>`
    ).join('')}
                </select>
                <div class="form-error" id="endTime-error"></div>
              </div>
            </div>

            <div class="form-row two-columns">
              <div class="form-group">
                <label for="location" class="form-label">Ubicación Específica</label>
                <input type="text" id="location" name="location" class="form-control" 
                       placeholder="Especificar ubicación (opcional)">
                <div class="form-help">Para reuniones presenciales, especifique la sala o ubicación exacta</div>
              </div>
              
              <div class="form-group">
                <label for="priority" class="form-label required">Prioridad</label>
                <select id="priority" name="priority" class="form-control form-select" required>
                  <option value="">Seleccionar prioridad</option>
                  ${Object.entries(PRIORITY_LEVELS).map(([key, value]) =>
      `<option value="${value}">${key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}</option>`
    ).join('')}
                </select>
                <div class="form-error" id="priority-error"></div>
              </div>
            </div>
          </div>

          <!-- Organizador y Asistentes -->
          <div class="form-section">
            <h3 class="form-section-title">
              <i class="fas fa-users"></i>
              Organizador y Asistentes
            </h3>
            
            <div class="form-row two-columns">
              <div class="form-group">
                <label for="organizer" class="form-label required">Área Organizadora</label>
                <select id="organizer" name="organizer" class="form-control form-select" 
                        ${!currentUser?.isAdmin() ? 'readonly' : ''} required>
                  <option value="">Seleccionar área</option>
                  ${Object.entries(AREA_LABELS).map(([value, label]) =>
      `<option value="${value}">${label}</option>`
    ).join('')}
                </select>
                <div class="form-error" id="organizer-error"></div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Duración Estimada</label>
                <div class="duration-display" id="durationDisplay">--</div>
                <div class="form-help">Se calcula automáticamente basado en las horas seleccionadas</div>
              </div>
            </div>

            <div class="form-group">
              <label for="attendees" class="form-label required">Asistentes Internos</label>
              <textarea id="attendees" name="attendees" class="form-control form-textarea" 
                        rows="3" placeholder="Liste los asistentes separados por comas" required></textarea>
              <div class="form-help">Ejemplo: Director Administrativo, Coordinador de Salud Pública, etc.</div>
              <div class="form-error" id="attendees-error"></div>
            </div>

            <div class="form-group">
              <label for="externalEmails" class="form-label">Invitados Externos (Emails)</label>
              <textarea id="externalEmails" name="externalEmails" class="form-control form-textarea" 
                        rows="2" placeholder="Emails separados por comas (opcional)"></textarea>
              <div class="form-help">Para invitados externos a la secretaría. Emails válidos separados por comas.</div>
              <div class="form-error" id="externalEmails-error"></div>
            </div>
          </div>

          <!-- Agenda y Notas -->
          <div class="form-section">
            <h3 class="form-section-title">
              <i class="fas fa-list"></i>
              Agenda y Notas
            </h3>
            
            <div class="form-group">
              <label for="agenda" class="form-label">Agenda de la Reunión</label>
              <textarea id="agenda" name="agenda" class="form-control form-textarea" 
                        rows="6" placeholder="Defina los puntos a tratar en la reunión" maxlength="2000"></textarea>
              <div class="form-help">Recomendado - Liste los temas a tratar. Máximo 2000 caracteres.</div>
            </div>

            <div class="form-group">
              <label for="notes" class="form-label">Notas Adicionales</label>
              <textarea id="notes" name="notes" class="form-control form-textarea" 
                        rows="3" placeholder="Información adicional o instrucciones especiales" maxlength="2000"></textarea>
              <div class="form-help">Opcional - Información complementaria. Máximo 2000 caracteres.</div>
            </div>
          </div>

          <!-- Recordatorios -->
          <div class="form-section">
            <h3 class="form-section-title">
              <i class="fas fa-bell"></i>
              Recordatorios
            </h3>
            
            <div class="form-group">
              <label class="form-label">Enviar recordatorios antes de la reunión:</label>
              <div class="checkbox-group">
                <div class="form-check">
                  <input type="checkbox" id="reminder15" name="reminders" value="15" class="form-check-input" checked>
                  <label for="reminder15" class="form-check-label">15 minutos antes</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="reminder60" name="reminders" value="60" class="form-check-input" checked>
                  <label for="reminder60" class="form-check-label">1 hora antes</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="reminder1440" name="reminders" value="1440" class="form-check-input">
                  <label for="reminder1440" class="form-check-label">1 día antes</label>
                </div>
              </div>
            </div>
          </div>
        </form>

        <!-- Estado de validación -->
        <div class="validation-summary" id="validationSummary" style="display: none;">
          <div class="alert alert-error">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <strong>Por favor corrija los siguientes errores:</strong>
              <ul id="validationList"></ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Configura eventos del formulario
   */
  setupEvents() {
    // Botones principales
    document.getElementById('saveMeeting').addEventListener('click', (e) => this.handleSave(e));
    document.getElementById('cancelForm').addEventListener('click', () => this.handleCancel());
    document.getElementById('previewMeeting').addEventListener('click', () => this.handlePreview());

    // Eventos de cambio para validación en tiempo real
    const form = document.getElementById('meetingForm');
    form.addEventListener('input', (e) => this.handleInput(e));
    form.addEventListener('change', (e) => this.handleChange(e));

    // Eventos específicos
    document.getElementById('startTime').addEventListener('change', () => this.updateEndTimeOptions());
    document.getElementById('endTime').addEventListener('change', () => this.calculateDuration());
    document.getElementById('type').addEventListener('change', () => this.handleTypeChange());

    // Detectar cambios para advertir sobre datos no guardados
    form.addEventListener('input', () => this.markAsDirty());
    form.addEventListener('change', () => this.markAsDirty());

    // Prevenir pérdida de datos
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = 'Tiene cambios sin guardar. ¿Desea continuar?';
      }
    });
  }

  /**
   * Configura valores por defecto
   */
  setDefaults() {
    const currentUser = this.authService.getCurrentUser();

    // Fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;

    // Si es nueva reunión, establecer fecha para mañana
    if (this.mode === 'create') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('date').value = tomorrow.toISOString().split('T')[0];

      // Prioridad por defecto
      document.getElementById('priority').value = PRIORITY_LEVELS.MEDIA;

      // Organizador por defecto
      if (currentUser && !currentUser.isAdmin()) {
        document.getElementById('organizer').value = currentUser.area;
        document.getElementById('organizer').disabled = true;
      }
    }
  }

  /**
   * Rellena el formulario con datos existentes (modo edición)
   */
  fillForm() {
    if (!this.currentMeeting) return;

    const meeting = this.currentMeeting;

    // Información básica
    document.getElementById('title').value = meeting.title || '';
    document.getElementById('description').value = meeting.description || '';
    document.getElementById('type').value = meeting.type || '';

    // Fecha y hora
    document.getElementById('date').value = meeting.date || '';
    document.getElementById('startTime').value = meeting.startTime || '';
    document.getElementById('endTime').value = meeting.endTime || '';
    document.getElementById('location').value = meeting.location || '';
    document.getElementById('priority').value = meeting.priority || '';

    // Organizador y asistentes
    document.getElementById('organizer').value = meeting.organizer || '';
    document.getElementById('attendees').value = meeting.attendees || '';
    document.getElementById('externalEmails').value = meeting.externalEmails || '';

    // Agenda y notas
    document.getElementById('agenda').value = meeting.agenda || '';
    document.getElementById('notes').value = meeting.notes || '';

    // Recordatorios
    const reminders = meeting.reminders || [];
    document.getElementById('reminder15').checked = reminders.includes(15);
    document.getElementById('reminder60').checked = reminders.includes(60);
    document.getElementById('reminder1440').checked = reminders.includes(1440);

    // Actualizar campos dependientes
    this.updateEndTimeOptions();
    this.calculateDuration();
  }

  /**
   * Maneja eventos de input
   */
  handleInput(e) {
    const field = e.target;
    this.clearFieldError(field.name);

    // Validaciones específicas en tiempo real
    if (field.name === 'title') {
      this.validateTitle(field.value);
    } else if (field.name === 'externalEmails') {
      this.validateExternalEmails(field.value);
    }
  }

  /**
   * Maneja eventos de change
   */
  handleChange(e) {
    const field = e.target;
    this.clearFieldError(field.name);

    // Validaciones específicas
    if (field.name === 'date') {
      this.validateDate(field.value);
    } else if (field.name === 'startTime' || field.name === 'endTime') {
      this.validateTimeRange();
    }
  }

  /**
   * Actualiza opciones de hora de fin basado en hora de inicio
   */
  updateEndTimeOptions() {
    const startTime = document.getElementById('startTime').value;
    const endTimeSelect = document.getElementById('endTime');

    if (!startTime) {
      endTimeSelect.innerHTML = '<option value="">Seleccionar hora</option>';
      return;
    }

    const startIndex = TIME_CONFIG.MEETING_SLOTS.indexOf(startTime);
    if (startIndex === -1) return;

    // Limpiar opciones
    endTimeSelect.innerHTML = '<option value="">Seleccionar hora</option>';

    // Agregar opciones válidas (después de la hora de inicio)
    for (let i = startIndex + 1; i < TIME_CONFIG.MEETING_SLOTS.length; i++) {
      const time = TIME_CONFIG.MEETING_SLOTS[i];
      const option = document.createElement('option');
      option.value = time;
      option.textContent = time;
      endTimeSelect.appendChild(option);
    }

    // Si había una hora de fin seleccionada, verificar si sigue siendo válida
    const currentEndTime = this.currentMeeting?.endTime;
    if (currentEndTime && TIME_CONFIG.MEETING_SLOTS.indexOf(currentEndTime) > startIndex) {
      endTimeSelect.value = currentEndTime;
    }

    this.calculateDuration();
  }

  /**
   * Calcula y muestra la duración de la reunión
   */
  calculateDuration() {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const displayElement = document.getElementById('durationDisplay');

    if (!startTime || !endTime) {
      displayElement.textContent = '--';
      return;
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes <= 0) {
      displayElement.textContent = '--';
      return;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    let duration = '';
    if (hours > 0) {
      duration += `${hours}h `;
    }
    if (minutes > 0) {
      duration += `${minutes}min`;
    }

    displayElement.textContent = duration.trim() || '--';
  }

  /**
   * Maneja cambios en el tipo de reunión
   */
  handleTypeChange() {
    const type = document.getElementById('type').value;
    const locationField = document.getElementById('location');

    if (type === MEETING_TYPES.VIRTUAL) {
      locationField.placeholder = 'Enlace de Teams (se generará automáticamente)';
      locationField.disabled = true;
    } else {
      locationField.disabled = false;
      locationField.placeholder = 'Especificar ubicación (opcional)';
    }
  }

  /**
   * Marca el formulario como sucio (con cambios)
   */
  markAsDirty() {
    this.isDirty = true;
  }

  /**
   * Maneja el guardado del formulario
   */
  async handleSave(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      this.showValidationSummary();
      return;
    }

    const saveBtn = document.getElementById('saveMeeting');
    const originalText = saveBtn.innerHTML;

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

      const formData = this.getFormData();

      let meeting;
      if (this.mode === 'edit') {
        meeting = await this.meetingService.update(this.meetingId, formData);
        this.showSuccessMessage('Reunión actualizada correctamente');
      } else {
        meeting = await this.meetingService.create(formData);
        this.showSuccessMessage('Reunión creada correctamente');
      }

      this.isDirty = false;

      // Redirigir después de un breve delay
      setTimeout(() => {
        if (window.app) {
          window.app.navigate('/meetings');
        }
      }, 1500);

    } catch (error) {
      console.error('Error al guardar reunión:', error);
      this.showErrorMessage(error.message || 'Error al guardar la reunión');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }

  /**
   * Obtiene los datos del formulario
   */
  getFormData() {
    const form = document.getElementById('meetingForm');
    const formData = new FormData(form);

    // Obtener recordatorios seleccionados
    const reminders = [];
    document.querySelectorAll('input[name="reminders"]:checked').forEach(checkbox => {
      reminders.push(parseInt(checkbox.value));
    });

    return {
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      date: formData.get('date'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      location: formData.get('location'),
      priority: formData.get('priority'),
      organizer: formData.get('organizer'),
      attendees: formData.get('attendees'),
      externalEmails: formData.get('externalEmails'),
      agenda: formData.get('agenda'),
      notes: formData.get('notes'),
      reminders: reminders
    };
  }

  /**
   * Valida todo el formulario
   */
  validateForm() {
    this.validationErrors = {};

    const formData = this.getFormData();

    // Validaciones requeridas
    if (!formData.title?.trim()) {
      this.validationErrors.title = 'El título es requerido';
    }

    if (!formData.type) {
      this.validationErrors.type = 'El tipo de reunión es requerido';
    }

    if (!formData.date) {
      this.validationErrors.date = 'La fecha es requerida';
    }

    if (!formData.startTime) {
      this.validationErrors.startTime = 'La hora de inicio es requerida';
    }

    if (!formData.endTime) {
      this.validationErrors.endTime = 'La hora de fin es requerida';
    }

    if (!formData.priority) {
      this.validationErrors.priority = 'La prioridad es requerida';
    }

    if (!formData.organizer) {
      this.validationErrors.organizer = 'El área organizadora es requerida';
    }

    if (!formData.attendees?.trim()) {
      this.validationErrors.attendees = 'Los asistentes son requeridos';
    }

    // Validaciones específicas
    this.validateTitle(formData.title);
    this.validateDate(formData.date);
    this.validateTimeRange();
    this.validateExternalEmails(formData.externalEmails);

    // Mostrar errores en campos
    Object.keys(this.validationErrors).forEach(field => {
      this.showFieldError(field, this.validationErrors[field]);
    });

    return Object.keys(this.validationErrors).length === 0;
  }

  /**
   * Valida el título
   */
  validateTitle(title) {
    if (title && title.length > 100) {
      this.validationErrors.title = 'El título no puede exceder 100 caracteres';
    }
  }

  /**
   * Valida la fecha
   */
  validateDate(date) {
    if (date) {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        this.validationErrors.date = 'No se pueden programar reuniones en el pasado';
      }
    }
  }

  /**
   * Valida el rango de tiempo
   */
  validateTimeRange() {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);

      if (start >= end) {
        this.validationErrors.endTime = 'La hora de fin debe ser posterior a la hora de inicio';
      } else {
        const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        if (diffMinutes < 15) {
          this.validationErrors.endTime = 'La duración mínima es 15 minutos';
        } else if (diffMinutes > 480) {
          this.validationErrors.endTime = 'La duración máxima es 8 horas';
        }
      }
    }
  }

  /**
   * Valida emails externos
   */
  validateExternalEmails(emails) {
    if (emails && emails.trim()) {
      const emailList = emails.split(',').map(email => email.trim()).filter(email => email);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const email of emailList) {
        if (!emailRegex.test(email)) {
          this.validationErrors.externalEmails = `Email inválido: ${email}`;
          break;
        }
      }
    }
  }

  /**
   * Muestra error en un campo específico
   */
  showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}-error`);

    if (field) {
      field.classList.add('error');
    }

    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  /**
   * Limpia error de un campo
   */
  clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}-error`);

    if (field) {
      field.classList.remove('error');
    }

    if (errorElement) {
      errorElement.textContent = '';
    }

    delete this.validationErrors[fieldName];
  }

  /**
   * Muestra resumen de errores de validación
   */
  showValidationSummary() {
    const summary = document.getElementById('validationSummary');
    const list = document.getElementById('validationList');

    if (Object.keys(this.validationErrors).length === 0) {
      summary.style.display = 'none';
      return;
    }

    list.innerHTML = '';
    Object.values(this.validationErrors).forEach(error => {
      const li = document.createElement('li');
      li.textContent = error;
      list.appendChild(li);
    });

    summary.style.display = 'block';
    summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Maneja la cancelación
   */
  handleCancel() {
    if (this.isDirty) {
      if (!confirm('Tiene cambios sin guardar. ¿Desea continuar?')) {
        return;
      }
    }

    if (window.app) {
      window.app.navigate('/meetings');
    }
  }

  /**
   * Maneja la vista previa
   */
  handlePreview() {
    if (!this.validateForm()) {
      this.showValidationSummary();
      return;
    }

    const formData = this.getFormData();
    const meeting = new Meeting(formData);

    const previewContent = this.generatePreviewHTML(meeting);

    if (window.app) {
      window.app.showModal(previewContent);
    }
  }

  /**
   * Genera HTML de vista previa
   */
  generatePreviewHTML(meeting) {
    return `
      <div class="preview-content">
        <h3><i class="fas fa-calendar-alt"></i> ${meeting.title}</h3>
        
        <div class="preview-section">
          <h4>Información General</h4>
          <p><strong>Tipo:</strong> ${MEETING_TYPE_LABELS[meeting.type]}</p>
          <p><strong>Fecha:</strong> ${formatDate(meeting.date, 'EEEE, d \'de\' MMMM \'de\' yyyy')}</p>
          <p><strong>Hora:</strong> ${meeting.startTime} - ${meeting.endTime}</p>
          <p><strong>Duración:</strong> ${meeting.getDurationMinutes()} minutos</p>
          <p><strong>Prioridad:</strong> ${meeting.priority.toUpperCase()}</p>
        </div>
        
        ${meeting.description ? `
          <div class="preview-section">
            <h4>Descripción</h4>
            <p>${meeting.description}</p>
          </div>
        ` : ''}
        
        <div class="preview-section">
          <h4>Asistentes</h4>
          <p><strong>Organizador:</strong> ${AREA_LABELS[meeting.organizer]}</p>
          <p><strong>Asistentes internos:</strong> ${meeting.attendees}</p>
          ${meeting.externalEmails ? `<p><strong>Invitados externos:</strong> ${meeting.externalEmails}</p>` : ''}
        </div>
        
        ${meeting.agenda ? `
          <div class="preview-section">
            <h4>Agenda</h4>
            <pre style="white-space: pre-wrap; font-family: inherit;">${meeting.agenda}</pre>
          </div>
        ` : ''}
        
        ${meeting.notes ? `
          <div class="preview-section">
            <h4>Notas</h4>
            <pre style="white-space: pre-wrap; font-family: inherit;">${meeting.notes}</pre>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Muestra mensaje de éxito
   */
  showSuccessMessage(message) {
    if (window.notifications) {
      window.notifications.show(message, 'success');
    } else {
      alert(message);
    }
  }

  /**
   * Muestra mensaje de error
   */
  showErrorMessage(message) {
    if (window.notifications) {
      window.notifications.show(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * Renderiza error
   */
  renderError(message) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="form-error-container">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle empty-state-icon text-error"></i>
          <h3 class="empty-state-title">Error al cargar el formulario</h3>
          <p class="empty-state-message">${message}</p>
          <button class="btn btn-primary" onclick="window.app.navigate('/meetings')">
            <i class="fas fa-arrow-left"></i>
            Volver a Reuniones
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Destructor del componente
   */
  destroy() {
    // Remover event listener de beforeunload
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);

    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default MeetingForm;