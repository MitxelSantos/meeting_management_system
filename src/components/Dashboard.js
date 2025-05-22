/**
 * Componente Dashboard
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { formatDate, formatTime, isToday, isTomorrow } from '../utils/dateUtils.js';
import { MEETING_STATUS, PRIORITY_LEVELS } from '../utils/constants.js';

/**
 * Componente del panel principal (Dashboard)
 */
export class Dashboard {
    constructor(authService, meetingService) {
        this.authService = authService;
        this.meetingService = meetingService;
        this.container = null;
        this.refreshInterval = null;
        this.charts = {};
    }

    /**
     * Renderiza el dashboard
     * @param {Element} container - Contenedor donde renderizar
     */
    async render(container) {
        this.container = container;

        try {
            // Obtener datos
            const [stats, upcomingMeetings, recentMeetings] = await Promise.all([
                this.meetingService.getStats(),
                this.meetingService.getUpcoming(7),
                this.meetingService.getAll({ limit: 5 })
            ]);

            const currentUser = this.authService.getCurrentUser();

            // Renderizar HTML
            const html = `
        <div class="dashboard">
          ${this.renderHeader(currentUser)}
          ${this.renderStats(stats)}
          ${this.renderQuickActions(currentUser)}
          ${this.renderContent(upcomingMeetings, recentMeetings, stats)}
        </div>
      `;

            this.container.innerHTML = html;

            // Configurar eventos y gráficas
            this.setupEvents();
            this.renderCharts(stats);

            // Configurar actualización automática
            this.setupAutoRefresh();

        } catch (error) {
            console.error('Error al renderizar dashboard:', error);
            this.renderError();
        }
    }

    /**
     * Renderiza el encabezado del dashboard
     * @param {Object} currentUser - Usuario actual
     * @returns {string}
     */
    renderHeader(currentUser) {
        const greeting = this.getGreeting();
        const today = new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
      <div class="dashboard-header">
        <div class="dashboard-welcome">
          <h1>${greeting}, ${currentUser.name}</h1>
          <p class="dashboard-date">
            <i class="fas fa-calendar"></i>
            ${today}
          </p>
        </div>
        <div class="dashboard-summary">
          <div class="quick-info">
            <i class="fas fa-building"></i>
            <span>${currentUser.getAreaName()}</span>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza las estadísticas principales
     * @param {Object} stats - Estadísticas
     * @returns {string}
     */
    renderStats(stats) {
        return `
      <div class="dashboard-stats">
        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-card-header">
              <div class="stat-card-icon">
                <i class="fas fa-calendar-alt"></i>
              </div>
              <h3 class="stat-card-title">Total Reuniones</h3>
            </div>
            <div class="stat-card-value">${stats.total}</div>
            <div class="stat-card-change">
              <i class="fas fa-chart-line"></i>
              <span>Este mes</span>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-card-header">
              <div class="stat-card-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <h3 class="stat-card-title">Programadas</h3>
            </div>
            <div class="stat-card-value">${stats.programadas}</div>
            <div class="stat-card-change">
              <i class="fas fa-arrow-up"></i>
              <span>Activas</span>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-card-header">
              <div class="stat-card-icon">
                <i class="fas fa-clock"></i>
              </div>
              <h3 class="stat-card-title">Próximas Hoy</h3>
            </div>
            <div class="stat-card-value">${stats.proximasHoy}</div>
            <div class="stat-card-change">
              <i class="fas fa-bell"></i>
              <span>Requieren atención</span>
            </div>
          </div>

          <div class="stat-card error">
            <div class="stat-card-header">
              <div class="stat-card-icon">
                <i class="fas fa-times-circle"></i>
              </div>
              <h3 class="stat-card-title">Canceladas</h3>
            </div>
            <div class="stat-card-value">${stats.canceladas}</div>
            <div class="stat-card-change">
              <i class="fas fa-arrow-down"></i>
              <span>Este mes</span>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza acciones rápidas
     * @param {Object} currentUser - Usuario actual
     * @returns {string}
     */
    renderQuickActions(currentUser) {
        const canCreate = currentUser.hasPermission('create_meeting');
        const canViewReports = currentUser.hasPermission('view_reports');

        return `
      <div class="dashboard-actions">
        <h2><i class="fas fa-bolt"></i> Acciones Rápidas</h2>
        <div class="actions-grid">
          ${canCreate ? `
            <button class="action-card" onclick="app.navigate('/meetings/create')">
              <div class="action-icon">
                <i class="fas fa-plus-circle"></i>
              </div>
              <div class="action-content">
                <h3>Nueva Reunión</h3>
                <p>Programar una nueva reunión</p>
              </div>
            </button>
          ` : ''}
          
          <button class="action-card" onclick="app.navigate('/calendar')">
            <div class="action-icon">
              <i class="fas fa-calendar"></i>
            </div>
            <div class="action-content">
              <h3>Ver Calendario</h3>
              <p>Revisar cronograma de reuniones</p>
            </div>
          </button>

          ${canViewReports ? `
            <button class="action-card" onclick="app.navigate('/reports')">
              <div class="action-icon">
                <i class="fas fa-chart-bar"></i>
              </div>
              <div class="action-content">
                <h3>Generar Reporte</h3>
                <p>Crear reportes y estadísticas</p>
              </div>
            </button>
          ` : ''}

          <button class="action-card" onclick="dashboard.refreshData()">
            <div class="action-icon">
              <i class="fas fa-sync-alt"></i>
            </div>
            <div class="action-content">
              <h3>Actualizar</h3>
              <p>Refrescar información</p>
            </div>
          </button>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza el contenido principal
     * @param {Array} upcomingMeetings - Reuniones próximas
     * @param {Array} recentMeetings - Reuniones recientes
     * @param {Object} stats - Estadísticas
     * @returns {string}
     */
    renderContent(upcomingMeetings, recentMeetings, stats) {
        return `
      <div class="dashboard-content">
        <div class="dashboard-row">
          <div class="dashboard-col">
            ${this.renderUpcomingMeetings(upcomingMeetings)}
          </div>
          <div class="dashboard-col">
            ${this.renderChartContainer()}
          </div>
        </div>
        <div class="dashboard-row">
          <div class="dashboard-col">
            ${this.renderRecentActivity(recentMeetings)}
          </div>
          <div class="dashboard-col">
            ${this.renderAreaStats(stats)}
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza reuniones próximas
     * @param {Array} meetings - Reuniones
     * @returns {string}
     */
    renderUpcomingMeetings(meetings) {
        const upcomingToday = meetings.filter(m => isToday(m.date));
        const upcomingTomorrow = meetings.filter(m => isTomorrow(m.date));
        const upcomingLater = meetings.filter(m => !isToday(m.date) && !isTomorrow(m.date));

        return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-calendar-day"></i>
            Próximas Reuniones
          </h3>
          <button class="btn btn-outline btn-sm" onclick="app.navigate('/meetings')">
            Ver Todas
          </button>
        </div>
        <div class="card-body">
          ${upcomingToday.length > 0 ? `
            <div class="meeting-group">
              <h4 class="meeting-group-title">
                <i class="fas fa-circle text-error"></i>
                Hoy (${upcomingToday.length})
              </h4>
              ${this.renderMeetingList(upcomingToday)}
            </div>
          ` : ''}
          
          ${upcomingTomorrow.length > 0 ? `
            <div class="meeting-group">
              <h4 class="meeting-group-title">
                <i class="fas fa-circle text-warning"></i>
                Mañana (${upcomingTomorrow.length})
              </h4>
              ${this.renderMeetingList(upcomingTomorrow)}
            </div>
          ` : ''}
          
          ${upcomingLater.length > 0 ? `
            <div class="meeting-group">
              <h4 class="meeting-group-title">
                <i class="fas fa-circle text-info"></i>
                Próximos Días (${upcomingLater.length})
              </h4>
              ${this.renderMeetingList(upcomingLater.slice(0, 3))}
            </div>
          ` : ''}
          
          ${meetings.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-calendar-check empty-state-icon"></i>
              <h4 class="empty-state-title">No hay reuniones próximas</h4>
              <p class="empty-state-message">¡Perfecto! No tienes reuniones programadas para los próximos días.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    }

    /**
     * Renderiza lista de reuniones
     * @param {Array} meetings - Reuniones
     * @returns {string}
     */
    renderMeetingList(meetings) {
        return `
      <div class="meeting-list-compact">
        ${meetings.map(meeting => `
          <div class="meeting-item-compact priority-${meeting.priority}" 
               onclick="app.navigate('/meetings/edit/${meeting.id}')">
            <div class="meeting-time">
              <strong>${meeting.startTime}</strong>
              <span>${meeting.endTime}</span>
            </div>
            <div class="meeting-details">
              <h5 class="meeting-title">${meeting.title}</h5>
              <div class="meeting-meta">
                <span class="meeting-location">
                  <i class="fas fa-map-marker-alt"></i>
                  ${meeting.getLocationText()}
                </span>
                <span class="badge badge-${meeting.priority}">${meeting.priority}</span>
              </div>
            </div>
            <div class="meeting-actions">
              <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); dashboard.joinMeeting('${meeting.id}')">
                <i class="fas fa-video"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    }

    /**
     * Renderiza el contenedor de gráficas
     * @returns {string}
     */
    renderChartContainer() {
        return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-chart-pie"></i>
            Distribución de Reuniones
          </h3>
        </div>
        <div class="card-body">
          <canvas id="meetingsChart" width="400" height="200"></canvas>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza actividad reciente
     * @param {Array} meetings - Reuniones recientes
     * @returns {string}
     */
    renderRecentActivity(meetings) {
        const recentMeetings = meetings
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);

        return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-history"></i>
            Actividad Reciente
          </h3>
        </div>
        <div class="card-body">
          ${recentMeetings.length > 0 ? `
            <div class="activity-list">
              ${recentMeetings.map(meeting => `
                <div class="activity-item">
                  <div class="activity-icon">
                    <i class="fas fa-calendar-alt"></i>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">${meeting.title}</div>
                    <div class="activity-meta">
                      <span>${formatDate(meeting.date)} - ${meeting.startTime}</span>
                      <span class="badge badge-${meeting.status}">${meeting.status}</span>
                    </div>
                  </div>
                  <div class="activity-time">
                    ${this.getRelativeTime(meeting.updatedAt)}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <i class="fas fa-history empty-state-icon"></i>
              <p class="empty-state-message">No hay actividad reciente</p>
            </div>
          `}
        </div>
      </div>
    `;
    }

    /**
     * Renderiza estadísticas por área
     * @param {Object} stats - Estadísticas
     * @returns {string}
     */
    renderAreaStats(stats) {
        const areaStats = Object.entries(stats.porArea || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-building"></i>
            Reuniones por Área
          </h3>
        </div>
        <div class="card-body">
          ${areaStats.length > 0 ? `
            <div class="stats-list">
              ${areaStats.map(([area, count]) => `
                <div class="stats-item">
                  <div class="stats-label">${this.getAreaLabel(area)}</div>
                  <div class="stats-bar">
                    <div class="stats-fill" style="width: ${(count / stats.total) * 100}%"></div>
                  </div>
                  <div class="stats-value">${count}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <i class="fas fa-chart-bar empty-state-icon"></i>
              <p class="empty-state-message">No hay datos de áreas</p>
            </div>
          `}
        </div>
      </div>
    `;
    }

    /**
     * Renderiza las gráficas
     * @param {Object} stats - Estadísticas
     */
    renderCharts(stats) {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está disponible');
            return;
        }

        const ctx = document.getElementById('meetingsChart');
        if (!ctx) return;

        // Limpiar gráfica anterior
        if (this.charts.meetings) {
            this.charts.meetings.destroy();
        }

        // Datos para la gráfica de pie
        const data = {
            labels: ['Programadas', 'Finalizadas', 'Canceladas'],
            datasets: [{
                data: [stats.programadas, stats.finalizadas, stats.canceladas],
                backgroundColor: [
                    '#38a169', // Verde
                    '#3182ce', // Azul
                    '#e53e3e'  // Rojo
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };

        this.charts.meetings = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    /**
     * Configura eventos del dashboard
     */
    setupEvents() {
        // Exponer el dashboard globalmente para los onclick
        window.dashboard = this;
    }

    /**
     * Configura actualización automática
     */
    setupAutoRefresh() {
        // Actualizar cada 5 minutos
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
    }

    /**
     * Actualiza los datos del dashboard
     */
    async refreshData() {
        if (!this.container) return;

        try {
            // Mostrar indicador de carga
            const refreshBtn = this.container.querySelector('.action-card .fa-sync-alt');
            if (refreshBtn) {
                refreshBtn.classList.add('fa-spin');
            }

            // Re-renderizar el dashboard
            await this.render(this.container);

        } catch (error) {
            console.error('Error al actualizar dashboard:', error);
        }
    }

    /**
     * Renderiza estado de error
     */
    renderError() {
        if (!this.container) return;

        this.container.innerHTML = `
      <div class="dashboard-error">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle empty-state-icon text-error"></i>
          <h3 class="empty-state-title">Error al cargar el dashboard</h3>
          <p class="empty-state-message">Ha ocurrido un error al cargar la información. Por favor intente nuevamente.</p>
          <button class="btn btn-primary" onclick="dashboard.refreshData()">
            <i class="fas fa-sync-alt"></i>
            Reintentar
          </button>
        </div>
      </div>
    `;
    }

    /**
     * Obtiene el saludo según la hora
     * @returns {string}
     */
    getGreeting() {
        const hour = new Date().getHours();

        if (hour < 12) {
            return 'Buenos días';
        } else if (hour < 18) {
            return 'Buenas tardes';
        } else {
            return 'Buenas noches';
        }
    }

    /**
     * Obtiene tiempo relativo
     * @param {string} timestamp - Timestamp
     * @returns {string}
     */
    getRelativeTime(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours} h`;
        return `${diffDays} días`;
    }

    /**
     * Obtiene etiqueta del área
     * @param {string} area - Código del área
     * @returns {string}
     */
    getAreaLabel(area) {
        const labels = {
            'despacho': 'Despacho',
            'direccion-administrativa': 'Dir. Administrativa',
            'direccion-salud-publica': 'Dir. Salud Pública',
            'direccion-aseguramiento': 'Dir. Aseguramiento',
            'direccion-prestacion': 'Dir. Prestación',
            'direccion-juridica': 'Dir. Jurídica',
            'sistemas': 'Sistemas'
        };

        return labels[area] || area;
    }

    /**
     * Método para unirse a una reunión
     * @param {string} meetingId - ID de la reunión
     */
    async joinMeeting(meetingId) {
        try {
            const meeting = await this.meetingService.getById(meetingId);
            if (!meeting) {
                throw new Error('Reunión no encontrada');
            }

            if (meeting.type === 'virtual') {
                // Aquí se abriría el enlace de Teams u otra plataforma
                window.open('#', '_blank');
            } else {
                // Para reuniones presenciales, mostrar información de ubicación
                alert(`Reunión presencial en: ${meeting.getLocationText()}`);
            }
        } catch (error) {
            console.error('Error al unirse a reunión:', error);
            alert('Error al unirse a la reunión');
        }
    }

    /**
     * Pausa las actualizaciones automáticas
     */
    pause() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Reanuda las actualizaciones automáticas
     */
    resume() {
        if (!this.refreshInterval) {
            this.setupAutoRefresh();
        }
    }

    /**
     * Maneja cambios de tamaño de ventana
     */
    handleResize() {
        // Re-dimensionar gráficas
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    /**
     * Destructor del componente
     */
    destroy() {
        // Limpiar intervalos
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Destruir gráficas
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        // Limpiar referencias globales
        if (window.dashboard === this) {
            delete window.dashboard;
        }

        // Limpiar contenedor
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default Dashboard;