/**
 * Componente de calendario
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import {
    formatDate,
    formatTime,
    addMonths,
    addDays,
    getFirstDayOfMonth,
    getLastDayOfMonth,
    isToday,
    isWeekend,
    DAYS,
    DAYS_SHORT
} from '../utils/dateUtils.js';
import { MEETING_STATUS } from '../utils/constants.js';

/**
 * Componente de calendario para mostrar reuniones
 */
export class Calendar {
    constructor(meetingService) {
        this.meetingService = meetingService;
        this.container = null;
        this.currentDate = new Date();
        this.currentView = 'month'; // 'month', 'week', 'day'
        this.meetings = [];
        this.selectedDate = null;
    }

    /**
     * Renderiza el calendario
     * @param {Element} container - Contenedor
     */
    async render(container) {
        this.container = container;

        try {
            // Cargar reuniones del mes actual
            await this.loadMeetingsForCurrentPeriod();

            // Renderizar HTML
            const html = this.generateHTML();
            this.container.innerHTML = html;

            // Configurar eventos
            this.setupEvents();

            // Renderizar vista actual
            this.renderCurrentView();

        } catch (error) {
            console.error('Error al renderizar calendario:', error);
            this.renderError();
        }
    }

    /**
     * Genera el HTML base del calendario
     * @returns {string}
     */
    generateHTML() {
        return `
      <div class="calendar-container">
        <div class="calendar-header">
          <div class="calendar-nav">
            <button class="calendar-nav-btn" id="prevPeriod">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="calendar-nav-btn" id="today">Hoy</button>
            <button class="calendar-nav-btn" id="nextPeriod">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <h2 class="calendar-title" id="calendarTitle">
            ${this.getTitle()}
          </h2>
          
          <div class="calendar-views">
            <button class="calendar-view-btn ${this.currentView === 'month' ? 'active' : ''}" 
                    data-view="month">Mes</button>
            <button class="calendar-view-btn ${this.currentView === 'week' ? 'active' : ''}" 
                    data-view="week">Semana</button>
            <button class="calendar-view-btn ${this.currentView === 'day' ? 'active' : ''}" 
                    data-view="day">Día</button>
          </div>
        </div>

        <div class="calendar-body" id="calendarBody">
          <!-- El contenido se generará según la vista -->
        </div>

        <div class="calendar-legend">
          <div class="legend-item">
            <span class="legend-color" style="background-color: var(--primary-color);"></span>
            <span>Programada</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: var(--success-color);"></span>
            <span>En curso</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: var(--warning-color);"></span>
            <span>Alta prioridad</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: var(--error-color);"></span>
            <span>Urgente</span>
          </div>
        </div>
      </div>

      <!-- Modal de detalles de reunión -->
      <div id="meetingDetailsModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fas fa-calendar-alt"></i> Detalles de la Reunión</h3>
            <button class="modal-close" id="closeMeetingDetails">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" id="meetingDetailsBody">
            <!-- Contenido del modal -->
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="editMeetingFromCalendar">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-primary" id="closeMeetingModal">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Configura eventos del calendario
     */
    setupEvents() {
        // Navegación
        document.getElementById('prevPeriod').addEventListener('click', () => this.navigatePrevious());
        document.getElementById('nextPeriod').addEventListener('click', () => this.navigateNext());
        document.getElementById('today').addEventListener('click', () => this.goToToday());

        // Cambio de vista
        document.querySelectorAll('.calendar-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeView(e.target.dataset.view);
            });
        });

        // Modal de detalles
        document.getElementById('closeMeetingDetails').addEventListener('click', () => this.hideDetailsModal());
        document.getElementById('closeMeetingModal').addEventListener('click', () => this.hideDetailsModal());
        document.getElementById('editMeetingFromCalendar').addEventListener('click', () => this.editSelectedMeeting());

        // Cerrar modal al hacer clic fuera
        document.getElementById('meetingDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'meetingDetailsModal') {
                this.hideDetailsModal();
            }
        });
    }

    /**
     * Carga reuniones para el período actual
     */
    async loadMeetingsForCurrentPeriod() {
        try {
            let startDate, endDate;

            switch (this.currentView) {
                case 'month':
                    startDate = getFirstDayOfMonth(this.currentDate);
                    endDate = getLastDayOfMonth(this.currentDate);
                    // Extender para mostrar días de meses anteriores/siguientes
                    startDate = addDays(startDate, -7);
                    endDate = addDays(endDate, 7);
                    break;

                case 'week':
                    startDate = this.getWeekStart(this.currentDate);
                    endDate = addDays(startDate, 6);
                    break;

                case 'day':
                    startDate = new Date(this.currentDate);
                    endDate = new Date(this.currentDate);
                    break;
            }

            this.meetings = await this.meetingService.getByDateRange(
                formatDate(startDate, 'yyyy-MM-dd'),
                formatDate(endDate, 'yyyy-MM-dd')
            );

        } catch (error) {
            console.error('Error al cargar reuniones:', error);
            this.meetings = [];
        }
    }

    /**
     * Renderiza la vista actual
     */
    async renderCurrentView() {
        await this.loadMeetingsForCurrentPeriod();

        const calendarBody = document.getElementById('calendarBody');
        const title = document.getElementById('calendarTitle');

        title.textContent = this.getTitle();

        switch (this.currentView) {
            case 'month':
                calendarBody.innerHTML = this.renderMonthView();
                break;
            case 'week':
                calendarBody.innerHTML = this.renderWeekView();
                break;
            case 'day':
                calendarBody.innerHTML = this.renderDayView();
                break;
        }

        // Configurar eventos de los días/reuniones
        this.setupViewEvents();
    }

    /**
     * Renderiza vista mensual
     * @returns {string}
     */
    renderMonthView() {
        const firstDay = getFirstDayOfMonth(this.currentDate);
        const lastDay = getLastDayOfMonth(this.currentDate);

        // Ajustar para empezar en lunes
        const startDate = new Date(firstDay);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        // Generar 6 semanas (42 días)
        const days = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return `
      <div class="calendar-grid">
        <!-- Encabezados de días -->
        ${DAYS_SHORT.slice(1).concat(DAYS_SHORT[0]).map(day => `
          <div class="calendar-day-header">${day}</div>
        `).join('')}
        
        <!-- Días del mes -->
        ${days.map(date => this.renderMonthDay(date)).join('')}
      </div>
    `;
    }

    /**
     * Renderiza un día en la vista mensual
     * @param {Date} date - Fecha del día
     * @returns {string}
     */
    renderMonthDay(date) {
        const dayMeetings = this.getMeetingsForDate(date);
        const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
        const isTodayDate = isToday(date);
        const isWeekendDay = isWeekend(date);

        let classes = 'calendar-day';
        if (!isCurrentMonth) classes += ' other-month';
        if (isTodayDate) classes += ' today';
        if (isWeekendDay) classes += ' weekend';
        if (dayMeetings.length > 0) classes += ' has-events';

        return `
      <div class="${classes}" data-date="${formatDate(date, 'yyyy-MM-dd')}">
        <div class="calendar-day-number">${date.getDate()}</div>
        <div class="calendar-events">
          ${dayMeetings.slice(0, 3).map(meeting => `
            <div class="calendar-event priority-${meeting.priority} status-${meeting.status}" 
                 data-meeting-id="${meeting.id}"
                 title="${meeting.title} - ${meeting.startTime}">
              ${meeting.startTime} ${meeting.title}
            </div>
          `).join('')}
          ${dayMeetings.length > 3 ? `
            <div class="calendar-event-more">
              +${dayMeetings.length - 3} más
            </div>
          ` : ''}
        </div>
      </div>
    `;
    }

    /**
     * Renderiza vista semanal
     * @returns {string}
     */
    renderWeekView() {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekDays = [];

        for (let i = 0; i < 7; i++) {
            const day = addDays(weekStart, i);
            weekDays.push(day);
        }

        return `
      <div class="calendar-week">
        <div class="week-header">
          ${weekDays.map(day => `
            <div class="week-day-header ${isToday(day) ? 'today' : ''}">
              <div class="day-name">${DAYS_SHORT[(day.getDay() + 6) % 7]}</div>
              <div class="day-number">${day.getDate()}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="week-body">
          ${weekDays.map(day => `
            <div class="week-day ${isToday(day) ? 'today' : ''}" data-date="${formatDate(day, 'yyyy-MM-dd')}">
              ${this.renderDayEvents(day)}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    }

    /**
     * Renderiza vista diaria
     * @returns {string}
     */
    renderDayView() {
        return `
      <div class="calendar-day-view">
        <div class="day-header">
          <h3>${formatDate(this.currentDate, 'EEEE, d \'de\' MMMM \'de\' yyyy')}</h3>
        </div>
        
        <div class="day-timeline">
          ${this.renderTimeSlots()}
        </div>
        
        <div class="day-events">
          ${this.renderDayEvents(this.currentDate, true)}
        </div>
      </div>
    `;
    }

    /**
     * Renderiza eventos de un día
     * @param {Date} date - Fecha
     * @param {boolean} detailed - Si mostrar detalles
     * @returns {string}
     */
    renderDayEvents(date, detailed = false) {
        const dayMeetings = this.getMeetingsForDate(date);

        if (dayMeetings.length === 0) {
            return detailed ? `
        <div class="no-events">
          <i class="fas fa-calendar-check"></i>
          <p>No hay reuniones programadas para este día</p>
        </div>
      ` : '';
        }

        return dayMeetings.map(meeting => `
      <div class="day-event priority-${meeting.priority} status-${meeting.status}" 
           data-meeting-id="${meeting.id}">
        <div class="event-time">
          <strong>${meeting.startTime}</strong> - ${meeting.endTime}
        </div>
        <div class="event-title">${meeting.title}</div>
        ${detailed ? `
          <div class="event-details">
            <div class="event-location">
              <i class="fas fa-map-marker-alt"></i>
              ${meeting.getLocationText()}
            </div>
            <div class="event-organizer">
              <i class="fas fa-user"></i>
              ${meeting.getOrganizerName()}
            </div>
            <div class="event-priority">
              <span class="badge badge-${meeting.priority}">${meeting.priority}</span>
              <span class="badge badge-outline">${meeting.status}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `).join('');
    }

    /**
     * Renderiza slots de tiempo para vista diaria
     * @returns {string}
     */
    renderTimeSlots() {
        const slots = [];

        for (let hour = 7; hour < 19; hour++) {
            // Saltar hora de almuerzo
            if (hour >= 12 && hour < 14) continue;

            slots.push(`
        <div class="time-slot" data-hour="${hour}">
          <div class="time-label">${String(hour).padStart(2, '0')}:00</div>
          <div class="time-content"></div>
        </div>
      `);
        }

        return slots.join('');
    }

    /**
     * Configura eventos específicos de la vista
     */
    setupViewEvents() {
        // Clicks en días
        document.querySelectorAll('.calendar-day, .week-day').forEach(day => {
            day.addEventListener('click', (e) => {
                if (!e.target.closest('.calendar-event, .day-event')) {
                    const date = e.currentTarget.dataset.date;
                    this.selectDate(date);
                }
            });
        });

        // Clicks en eventos
        document.querySelectorAll('.calendar-event, .day-event').forEach(event => {
            event.addEventListener('click', (e) => {
                e.stopPropagation();
                const meetingId = e.currentTarget.dataset.meetingId;
                this.showMeetingDetails(meetingId);
            });
        });
    }

    /**
     * Obtiene reuniones para una fecha específica
     * @param {Date} date - Fecha
     * @returns {Array}
     */
    getMeetingsForDate(date) {
        const dateStr = formatDate(date, 'yyyy-MM-dd');
        return this.meetings.filter(meeting => meeting.date === dateStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    /**
     * Obtiene el primer día de la semana (lunes)
     * @param {Date} date - Fecha de referencia
     * @returns {Date}
     */
    getWeekStart(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = result.getDate() - day + (day === 0 ? -6 : 1);
        result.setDate(diff);
        return result;
    }

    /**
     * Obtiene el título según la vista y fecha actual
     * @returns {string}
     */
    getTitle() {
        switch (this.currentView) {
            case 'month':
                return formatDate(this.currentDate, 'MMMM yyyy');
            case 'week':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = addDays(weekStart, 6);
                return `${formatDate(weekStart, 'dd MMM')} - ${formatDate(weekEnd, 'dd MMM yyyy')}`;
            case 'day':
                return formatDate(this.currentDate, 'EEEE, d \'de\' MMMM \'de\' yyyy');
            default:
                return '';
        }
    }

    /**
     * Navega al período anterior
     */
    async navigatePrevious() {
        switch (this.currentView) {
            case 'month':
                this.currentDate = addMonths(this.currentDate, -1);
                break;
            case 'week':
                this.currentDate = addDays(this.currentDate, -7);
                break;
            case 'day':
                this.currentDate = addDays(this.currentDate, -1);
                break;
        }

        await this.renderCurrentView();
    }

    /**
     * Navega al período siguiente
     */
    async navigateNext() {
        switch (this.currentView) {
            case 'month':
                this.currentDate = addMonths(this.currentDate, 1);
                break;
            case 'week':
                this.currentDate = addDays(this.currentDate, 7);
                break;
            case 'day':
                this.currentDate = addDays(this.currentDate, 1);
                break;
        }

        await this.renderCurrentView();
    }

    /**
     * Va a la fecha actual
     */
    async goToToday() {
        this.currentDate = new Date();
        await this.renderCurrentView();
    }

    /**
     * Cambia la vista del calendario
     * @param {string} view - Nueva vista
     */
    async changeView(view) {
        this.currentView = view;

        // Actualizar botones de vista
        document.querySelectorAll('.calendar-view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        await this.renderCurrentView();
    }

    /**
     * Selecciona una fecha
     * @param {string} dateStr - Fecha en formato YYYY-MM-DD
     */
    selectDate(dateStr) {
        this.selectedDate = dateStr;

        // Highlight fecha seleccionada
        document.querySelectorAll('.calendar-day, .week-day').forEach(day => {
            day.classList.toggle('selected', day.dataset.date === dateStr);
        });

        // Si no hay reuniones, permitir crear una nueva
        const dayMeetings = this.meetings.filter(m => m.date === dateStr);
        if (dayMeetings.length === 0) {
            this.offerCreateMeeting(dateStr);
        }
    }

    /**
     * Ofrece crear una nueva reunión
     * @param {string} dateStr - Fecha seleccionada
     */
    offerCreateMeeting(dateStr) {
        const date = new Date(dateStr);
        const formattedDate = formatDate(date, 'EEEE, d \'de\' MMMM');

        if (confirm(`No hay reuniones programadas para ${formattedDate}. ¿Desea crear una nueva reunión?`)) {
            if (window.app) {
                // Navegar al formulario con fecha prellenada
                window.app.navigate(`/meetings/create?date=${dateStr}`);
            }
        }
    }

    /**
     * Muestra detalles de una reunión
     * @param {string} meetingId - ID de la reunión
     */
    async showMeetingDetails(meetingId) {
        try {
            const meeting = await this.meetingService.getById(meetingId);
            if (!meeting) {
                throw new Error('Reunión no encontrada');
            }

            const modalBody = document.getElementById('meetingDetailsBody');
            modalBody.innerHTML = this.generateMeetingDetailsHTML(meeting);

            const modal = document.getElementById('meetingDetailsModal');
            modal.classList.add('show');
            modal.style.display = 'flex';

            // Configurar botón de editar
            const editBtn = document.getElementById('editMeetingFromCalendar');
            editBtn.onclick = () => {
                this.hideDetailsModal();
                if (window.app) {
                    window.app.navigate(`/meetings/edit/${meetingId}`);
                }
            };

        } catch (error) {
            console.error('Error al cargar detalles:', error);
            alert('Error al cargar los detalles de la reunión');
        }
    }

    /**
     * Genera HTML de detalles de reunión
     * @param {Object} meeting - Reunión
     * @returns {string}
     */
    generateMeetingDetailsHTML(meeting) {
        return `
      <div class="meeting-details">
        <div class="detail-section">
          <h4><i class="fas fa-info-circle"></i> Información General</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <strong>Título:</strong>
              <span>${meeting.title}</span>
            </div>
            <div class="detail-item">
              <strong>Tipo:</strong>
              <span>${meeting.getTypeLabel()}</span>
            </div>
            <div class="detail-item">
              <strong>Prioridad:</strong>
              <span class="badge badge-${meeting.priority}">${meeting.priority}</span>
            </div>
            <div class="detail-item">
              <strong>Estado:</strong>
              <span class="badge badge-outline">${meeting.status}</span>
            </div>
          </div>
          ${meeting.description ? `
            <div class="detail-item full-width">
              <strong>Descripción:</strong>
              <p>${meeting.description}</p>
            </div>
          ` : ''}
        </div>

        <div class="detail-section">
          <h4><i class="fas fa-calendar-alt"></i> Fecha y Hora</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <strong>Fecha:</strong>
              <span>${formatDate(meeting.date, 'EEEE, d \'de\' MMMM \'de\' yyyy')}</span>
            </div>
            <div class="detail-item">
              <strong>Horario:</strong>
              <span>${meeting.startTime} - ${meeting.endTime}</span>
            </div>
            <div class="detail-item">
              <strong>Duración:</strong>
              <span>${meeting.getDurationMinutes()} minutos</span>
            </div>
            <div class="detail-item">
              <strong>Ubicación:</strong>
              <span>${meeting.getLocationText()}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4><i class="fas fa-users"></i> Participantes</h4>
          <div class="detail-item">
            <strong>Organizador:</strong>
            <span>${meeting.getOrganizerName()}</span>
          </div>
          <div class="detail-item">
            <strong>Asistentes:</strong>
            <p>${meeting.attendees}</p>
          </div>
          ${meeting.externalEmails ? `
            <div class="detail-item">
              <strong>Invitados externos:</strong>
              <p>${meeting.externalEmails}</p>
            </div>
          ` : ''}
        </div>

        ${meeting.agenda ? `
          <div class="detail-section">
            <h4><i class="fas fa-list"></i> Agenda</h4>
            <div class="agenda-content">
              ${meeting.agenda.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

        ${meeting.notes ? `
          <div class="detail-section">
            <h4><i class="fas fa-sticky-note"></i> Notas</h4>
            <div class="notes-content">
              ${meeting.notes.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    }

    /**
     * Oculta el modal de detalles
     */
    hideDetailsModal() {
        const modal = document.getElementById('meetingDetailsModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    /**
     * Edita la reunión seleccionada
     */
    editSelectedMeeting() {
        // Se maneja en showMeetingDetails
    }

    /**
     * Renderiza estado de error
     */
    renderError() {
        if (!this.container) return;

        this.container.innerHTML = `
      <div class="calendar-error">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle empty-state-icon text-error"></i>
          <h3 class="empty-state-title">Error al cargar el calendario</h3>
          <p class="empty-state-message">Ha ocurrido un error al cargar las reuniones.</p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i>
            Reintentar
          </button>
        </div>
      </div>
    `;
    }

    /**
     * Maneja cambios de tamaño
     */
    handleResize() {
        // Reorganizar vista si es necesario
        if (window.innerWidth < 768 && this.currentView === 'week') {
            this.changeView('day');
        }
    }

    /**
     * Destructor del componente
     */
    destroy() {
        this.hideDetailsModal();

        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default Calendar;