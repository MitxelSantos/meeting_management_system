/**
 * Componente de reportes y estadísticas
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { formatDate, addMonths, addDays } from '../utils/dateUtils.js';
import { MEETING_STATUS, PRIORITY_LEVELS, AREA_LABELS } from '../utils/constants.js';
import { calculatePercentage, formatNumber } from '../utils/helpers.js';

/**
 * Componente para generar reportes y estadísticas
 */
export class Reports {
    constructor(meetingService, authService) {
        this.meetingService = meetingService;
        this.authService = authService;
        this.container = null;
        this.currentFilters = {
            dateFrom: null,
            dateTo: null,
            area: '',
            status: '',
            priority: ''
        };
        this.charts = {};
        this.reportData = null;
    }

    /**
     * Renderiza el componente de reportes
     * @param {Element} container - Contenedor
     */
    async render(container) {
        this.container = container;

        try {
            // Establecer fechas por defecto (último mes)
            this.setDefaultDateRange();

            // Generar HTML
            const html = this.generateHTML();
            this.container.innerHTML = html;

            // Configurar eventos
            this.setupEvents();

            // Cargar datos iniciales
            await this.loadReportData();

        } catch (error) {
            console.error('Error al renderizar reportes:', error);
            this.renderError();
        }
    }

    /**
     * Establece el rango de fechas por defecto
     */
    setDefaultDateRange() {
        const today = new Date();
        const lastMonth = addMonths(today, -1);

        this.currentFilters.dateFrom = formatDate(lastMonth, 'yyyy-MM-dd');
        this.currentFilters.dateTo = formatDate(today, 'yyyy-MM-dd');
    }

    /**
     * Genera el HTML del componente
     * @returns {string}
     */
    generateHTML() {
        const currentUser = this.authService.getCurrentUser();
        const canViewAll = currentUser.hasPermission('view_reports');

        return `
      <div class="reports-container">
        <div class="reports-header">
          <h2><i class="fas fa-chart-bar"></i> Reportes y Estadísticas</h2>
          <div class="reports-actions">
            <button class="btn btn-outline" id="refreshReports">
              <i class="fas fa-sync-alt"></i> Actualizar
            </button>
            <button class="btn btn-success" id="exportReport" disabled>
              <i class="fas fa-download"></i> Exportar
            </button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters-container">
          <div class="filters-header">
            <h3 class="filters-title">
              <i class="fas fa-filter"></i>
              Filtros de Reporte
            </h3>
            <button class="filters-toggle" id="toggleFilters">
              <span>Mostrar filtros</span>
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
          
          <div class="filters-content" id="filtersContent">
            <div class="form-row">
              <div class="form-group">
                <label for="dateFromFilter" class="form-label">Fecha Desde</label>
                <input type="date" id="dateFromFilter" class="form-control" 
                       value="${this.currentFilters.dateFrom}">
              </div>
              
              <div class="form-group">
                <label for="dateToFilter" class="form-label">Fecha Hasta</label>
                <input type="date" id="dateToFilter" class="form-control" 
                       value="${this.currentFilters.dateTo}">
              </div>
            </div>

            <div class="form-row">
              ${canViewAll ? `
                <div class="form-group">
                  <label for="areaFilter" class="form-label">Área</label>
                  <select id="areaFilter" class="form-control form-select">
                    <option value="">Todas las áreas</option>
                    ${Object.entries(AREA_LABELS).map(([value, label]) =>
            `<option value="${value}">${label}</option>`
        ).join('')}
                  </select>
                </div>
              ` : ''}
              
              <div class="form-group">
                <label for="statusFilter" class="form-label">Estado</label>
                <select id="statusFilter" class="form-control form-select">
                  <option value="">Todos los estados</option>
                  <option value="${MEETING_STATUS.PROGRAMADA}">Programadas</option>
                  <option value="${MEETING_STATUS.FINALIZADA}">Finalizadas</option>
                  <option value="${MEETING_STATUS.CANCELADA}">Canceladas</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="priorityFilter" class="form-label">Prioridad</label>
                <select id="priorityFilter" class="form-control form-select">
                  <option value="">Todas las prioridades</option>
                  ${Object.entries(PRIORITY_LEVELS).map(([key, value]) =>
            `<option value="${value}">${key}</option>`
        ).join('')}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <button class="btn btn-primary" id="applyFilters">
                  <i class="fas fa-search"></i> Aplicar Filtros
                </button>
                <button class="btn btn-secondary" id="clearFilters">
                  <i class="fas fa-times"></i> Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido de reportes -->
        <div class="reports-content" id="reportsContent">
          <div class="loading-placeholder">
            <div class="spinner"></div>
            <p>Cargando datos del reporte...</p>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Configura eventos
     */
    setupEvents() {
        // Botones principales
        document.getElementById('refreshReports').addEventListener('click', () => this.loadReportData());
        document.getElementById('exportReport').addEventListener('click', () => this.exportReport());

        // Filtros
        document.getElementById('toggleFilters').addEventListener('click', () => this.toggleFilters());
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        // Cambios en fechas
        document.getElementById('dateFromFilter').addEventListener('change', (e) => {
            this.currentFilters.dateFrom = e.target.value;
        });

        document.getElementById('dateToFilter').addEventListener('change', (e) => {
            this.currentFilters.dateTo = e.target.value;
        });
    }

    /**
     * Alterna la visibilidad de filtros
     */
    toggleFilters() {
        const content = document.getElementById('filtersContent');
        const toggle = document.getElementById('toggleFilters');
        const icon = toggle.querySelector('i');
        const text = toggle.querySelector('span');

        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.className = 'fas fa-chevron-down';
            text.textContent = 'Ocultar filtros';
        } else {
            content.classList.add('collapsed');
            icon.className = 'fas fa-chevron-right';
            text.textContent = 'Mostrar filtros';
        }
    }

    /**
     * Aplica los filtros seleccionados
     */
    async applyFilters() {
        // Obtener valores de filtros
        const areaFilter = document.getElementById('areaFilter');
        const statusFilter = document.getElementById('statusFilter');
        const priorityFilter = document.getElementById('priorityFilter');

        this.currentFilters.area = areaFilter ? areaFilter.value : '';
        this.currentFilters.status = statusFilter.value;
        this.currentFilters.priority = priorityFilter.value;

        // Validar fechas
        if (this.currentFilters.dateFrom > this.currentFilters.dateTo) {
            alert('La fecha de inicio no puede ser mayor que la fecha de fin');
            return;
        }

        // Recargar datos
        await this.loadReportData();
    }

    /**
     * Limpia todos los filtros
     */
    async clearFilters() {
        this.setDefaultDateRange();

        // Resetear campos
        document.getElementById('dateFromFilter').value = this.currentFilters.dateFrom;
        document.getElementById('dateToFilter').value = this.currentFilters.dateTo;

        const areaFilter = document.getElementById('areaFilter');
        if (areaFilter) areaFilter.value = '';

        document.getElementById('statusFilter').value = '';
        document.getElementById('priorityFilter').value = '';

        this.currentFilters = {
            ...this.currentFilters,
            area: '',
            status: '',
            priority: ''
        };

        await this.loadReportData();
    }

    /**
     * Carga los datos del reporte
     */
    async loadReportData() {
        try {
            const meetings = await this.meetingService.getAll(this.currentFilters);
            this.reportData = this.processReportData(meetings);

            this.renderReportContent();
            this.renderCharts();

            // Habilitar exportación
            document.getElementById('exportReport').disabled = false;

        } catch (error) {
            console.error('Error al cargar datos del reporte:', error);
            this.showError('Error al cargar los datos del reporte');
        }
    }

    /**
     * Procesa los datos para el reporte
     * @param {Array} meetings - Reuniones
     * @returns {Object}
     */
    processReportData(meetings) {
        const data = {
            total: meetings.length,
            byStatus: {},
            byPriority: {},
            byArea: {},
            byMonth: {},
            byDayOfWeek: {},
            avgDuration: 0,
            totalDuration: 0,
            topAreas: [],
            trends: {}
        };

        // Inicializar contadores
        Object.values(MEETING_STATUS).forEach(status => {
            data.byStatus[status] = 0;
        });

        Object.values(PRIORITY_LEVELS).forEach(priority => {
            data.byPriority[priority] = 0;
        });

        Object.keys(AREA_LABELS).forEach(area => {
            data.byArea[area] = 0;
        });

        // Procesar cada reunión
        let totalMinutes = 0;
        meetings.forEach(meeting => {
            // Por estado
            data.byStatus[meeting.status]++;

            // Por prioridad
            data.byPriority[meeting.priority]++;

            // Por área
            if (data.byArea[meeting.organizer] !== undefined) {
                data.byArea[meeting.organizer]++;
            }

            // Por mes
            const monthKey = formatDate(meeting.date, 'yyyy-MM');
            data.byMonth[monthKey] = (data.byMonth[monthKey] || 0) + 1;

            // Por día de la semana
            const dayOfWeek = new Date(meeting.date).getDay();
            data.byDayOfWeek[dayOfWeek] = (data.byDayOfWeek[dayOfWeek] || 0) + 1;

            // Duración
            const duration = meeting.getDurationMinutes();
            totalMinutes += duration;
        });

        // Calcular promedios
        data.totalDuration = totalMinutes;
        data.avgDuration = meetings.length > 0 ? Math.round(totalMinutes / meetings.length) : 0;

        // Top áreas
        data.topAreas = Object.entries(data.byArea)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([area, count]) => ({
                area,
                label: AREA_LABELS[area] || area,
                count,
                percentage: calculatePercentage(count, data.total)
            }));

        return data;
    }

    /**
     * Renderiza el contenido del reporte
     */
    renderReportContent() {
        const content = document.getElementById('reportsContent');

        content.innerHTML = `
      <div class="report-summary">
        ${this.renderSummaryCards()}
      </div>
      
      <div class="report-charts">
        <div class="charts-grid">
          <div class="chart-section">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">
                  <i class="fas fa-chart-pie"></i>
                  Distribución por Estado
                </h3>
              </div>
              <div class="card-body">
                <canvas id="statusChart" width="400" height="300"></canvas>
              </div>
            </div>
          </div>
          
          <div class="chart-section">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">
                  <i class="fas fa-chart-bar"></i>
                  Reuniones por Área
                </h3>
              </div>
              <div class="card-body">
                <canvas id="areaChart" width="400" height="300"></canvas>
              </div>
            </div>
          </div>
          
          <div class="chart-section">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">
                  <i class="fas fa-chart-line"></i>
                  Tendencia Mensual
                </h3>
              </div>
              <div class="card-body">
                <canvas id="trendChart" width="400" height="300"></canvas>
              </div>
            </div>
          </div>
          
          <div class="chart-section">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">
                  <i class="fas fa-calendar-week"></i>
                  Distribución Semanal
                </h3>
              </div>
              <div class="card-body">
                <canvas id="weekChart" width="400" height="300"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="report-details">
        ${this.renderDetailedTables()}
      </div>
    `;
    }

    /**
     * Renderiza las tarjetas de resumen
     * @returns {string}
     */
    renderSummaryCards() {
        const { total, byStatus, avgDuration, totalDuration } = this.reportData;

        return `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="summary-content">
            <h3 class="summary-value">${formatNumber(total)}</h3>
            <p class="summary-label">Total de Reuniones</p>
          </div>
        </div>
        
        <div class="summary-card success">
          <div class="summary-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="summary-content">
            <h3 class="summary-value">${formatNumber(byStatus[MEETING_STATUS.FINALIZADA] || 0)}</h3>
            <p class="summary-label">Reuniones Finalizadas</p>
          </div>
        </div>
        
        <div class="summary-card warning">
          <div class="summary-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="summary-content">
            <h3 class="summary-value">${formatNumber(byStatus[MEETING_STATUS.PROGRAMADA] || 0)}</h3>
            <p class="summary-label">Reuniones Programadas</p>
          </div>
        </div>
        
        <div class="summary-card info">
          <div class="summary-icon">
            <i class="fas fa-stopwatch"></i>
          </div>
          <div class="summary-content">
            <h3 class="summary-value">${avgDuration}min</h3>
            <p class="summary-label">Duración Promedio</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-icon">
            <i class="fas fa-hourglass-half"></i>
          </div>
          <div class="summary-content">
            <h3 class="summary-value">${Math.round(totalDuration / 60)}h</h3>
            <p class="summary-label">Tiempo Total</p>
          </div>
        </div>
        
        <div class="summary-card error">
          <div class="summary-icon">
            <i class="fas fa-times-circle"></i>
          </div>
          <div class="summary-content">
            <h3 class="summary-value">${formatNumber(byStatus[MEETING_STATUS.CANCELADA] || 0)}</h3>
            <p class="summary-label">Reuniones Canceladas</p>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza tablas detalladas
     * @returns {string}
     */
    renderDetailedTables() {
        return `
      <div class="details-grid">
        <div class="detail-table-section">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-building"></i>
                Top Áreas por Reuniones
              </h3>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Área</th>
                      <th>Reuniones</th>
                      <th>Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.reportData.topAreas.map(area => `
                      <tr>
                        <td>${area.label}</td>
                        <td>${formatNumber(area.count)}</td>
                        <td>
                          <div class="progress-bar">
                            <div class="progress-fill" style="width: ${area.percentage}%"></div>
                            <span class="progress-text">${area.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-table-section">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-flag"></i>
                Distribución por Prioridad
              </h3>
            </div>
            <div class="card-body">
              <div class="priority-stats">
                ${Object.entries(this.reportData.byPriority).map(([priority, count]) => `
                  <div class="priority-stat priority-${priority}">
                    <div class="priority-label">${priority.toUpperCase()}</div>
                    <div class="priority-count">${formatNumber(count)}</div>
                    <div class="priority-percentage">
                      ${calculatePercentage(count, this.reportData.total)}%
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza las gráficas
     */
    renderCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está disponible');
            return;
        }

        this.renderStatusChart();
        this.renderAreaChart();
        this.renderTrendChart();
        this.renderWeekChart();
    }

    /**
     * Renderiza gráfica de estados
     */
    renderStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        if (this.charts.status) {
            this.charts.status.destroy();
        }

        const data = {
            labels: ['Programadas', 'Finalizadas', 'Canceladas'],
            datasets: [{
                data: [
                    this.reportData.byStatus[MEETING_STATUS.PROGRAMADA] || 0,
                    this.reportData.byStatus[MEETING_STATUS.FINALIZADA] || 0,
                    this.reportData.byStatus[MEETING_STATUS.CANCELADA] || 0
                ],
                backgroundColor: ['#3182ce', '#38a169', '#e53e3e'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };

        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Renderiza gráfica por áreas
     */
    renderAreaChart() {
        const ctx = document.getElementById('areaChart');
        if (!ctx) return;

        if (this.charts.area) {
            this.charts.area.destroy();
        }

        const sortedAreas = Object.entries(this.reportData.byArea)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a);

        const data = {
            labels: sortedAreas.map(([area]) => AREA_LABELS[area] || area),
            datasets: [{
                label: 'Reuniones',
                data: sortedAreas.map(([, count]) => count),
                backgroundColor: '#667eea',
                borderColor: '#4299e1',
                borderWidth: 1
            }]
        };

        this.charts.area = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    /**
     * Renderiza gráfica de tendencia
     */
    renderTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        const sortedMonths = Object.entries(this.reportData.byMonth)
            .sort(([a], [b]) => a.localeCompare(b));

        const data = {
            labels: sortedMonths.map(([month]) => {
                const date = new Date(month + '-01');
                return date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
            }),
            datasets: [{
                label: 'Reuniones por Mes',
                data: sortedMonths.map(([, count]) => count),
                borderColor: '#38a169',
                backgroundColor: 'rgba(56, 161, 105, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * Renderiza gráfica semanal
     */
    renderWeekChart() {
        const ctx = document.getElementById('weekChart');
        if (!ctx) return;

        if (this.charts.week) {
            this.charts.week.destroy();
        }

        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const weekData = days.map((_, index) => this.reportData.byDayOfWeek[index] || 0);

        const data = {
            labels: days,
            datasets: [{
                label: 'Reuniones por Día',
                data: weekData,
                backgroundColor: '#f093fb',
                borderColor: '#f5576c',
                borderWidth: 1
            }]
        };

        this.charts.week = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    /**
     * Exporta el reporte
     */
    async exportReport() {
        try {
            const format = await this.selectExportFormat();
            if (!format) return;

            const exportBtn = document.getElementById('exportReport');
            const originalText = exportBtn.innerHTML;

            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';

            switch (format) {
                case 'pdf':
                    await this.exportToPDF();
                    break;
                case 'excel':
                    await this.exportToExcel();
                    break;
                case 'csv':
                    await this.exportToCSV();
                    break;
            }

        } catch (error) {
            console.error('Error al exportar:', error);
            alert('Error al exportar el reporte');
        } finally {
            const exportBtn = document.getElementById('exportReport');
            exportBtn.disabled = false;
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar';
        }
    }

    /**
     * Selecciona formato de exportación
     * @returns {Promise<string>}
     */
    selectExportFormat() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.style.display = 'flex';
            modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Seleccionar Formato de Exportación</h3>
          </div>
          <div class="modal-body">
            <div class="export-options">
              <button class="btn btn-outline export-option" data-format="pdf">
                <i class="fas fa-file-pdf"></i>
                <span>PDF</span>
              </button>
              <button class="btn btn-outline export-option" data-format="excel">
                <i class="fas fa-file-excel"></i>
                <span>Excel</span>
              </button>
              <button class="btn btn-outline export-option" data-format="csv">
                <i class="fas fa-file-csv"></i>
                <span>CSV</span>
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancelExport">Cancelar</button>
          </div>
        </div>
      `;

            document.body.appendChild(modal);

            // Eventos
            modal.querySelectorAll('.export-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    const format = btn.dataset.format;
                    document.body.removeChild(modal);
                    resolve(format);
                });
            });

            document.getElementById('cancelExport').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
        });
    }

    /**
     * Exporta a CSV
     */
    async exportToCSV() {
        const meetings = await this.meetingService.getAll(this.currentFilters);

        const headers = [
            'Fecha', 'Título', 'Tipo', 'Hora Inicio', 'Hora Fin',
            'Duración (min)', 'Organizador', 'Prioridad', 'Estado'
        ];

        const rows = meetings.map(meeting => [
            meeting.date,
            meeting.title,
            meeting.getTypeLabel(),
            meeting.startTime,
            meeting.endTime,
            meeting.getDurationMinutes(),
            meeting.getOrganizerName(),
            meeting.priority,
            meeting.status
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        this.downloadFile(csvContent, 'reporte-reuniones.csv', 'text/csv');
    }

    /**
     * Exporta a Excel (simulado como CSV con formato)
     */
    async exportToExcel() {
        // Para una implementación completa se usaría una librería como SheetJS
        await this.exportToCSV();
    }

    /**
     * Exporta a PDF (simulado)
     */
    async exportToPDF() {
        // Para una implementación completa se usaría una librería como jsPDF
        alert('Funcionalidad de exportación a PDF en desarrollo');
    }

    /**
     * Descarga un archivo
     * @param {string} content - Contenido del archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} type - Tipo MIME
     */
    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * Muestra un error
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        const content = document.getElementById('reportsContent');
        content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle empty-state-icon text-error"></i>
        <h3 class="empty-state-title">Error</h3>
        <p class="empty-state-message">${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          <i class="fas fa-sync-alt"></i>
          Reintentar
        </button>
      </div>
    `;
    }

    /**
     * Renderiza estado de error
     */
    renderError() {
        if (!this.container) return;

        this.container.innerHTML = `
      <div class="reports-error">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle empty-state-icon text-error"></i>
          <h3 class="empty-state-title">Error al cargar reportes</h3>
          <p class="empty-state-message">Ha ocurrido un error al cargar los reportes.</p>
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
        // Destruir gráficas
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default Reports;