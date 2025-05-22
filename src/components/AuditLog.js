/**
 * Componente de log de auditoría
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { AuditLog } from '../models/AuditLog.js';
import { STORAGE_KEYS, AUDIT_ACTIONS, PERMISSIONS } from '../utils/constants.js';
import { formatDate, formatTime, formatRelative } from '../utils/dateUtils.js';
import { sortByProperty, groupBy } from '../utils/helpers.js';

/**
 * Componente para visualizar y gestionar logs de auditoría
 */
export class AuditLogComponent {
    constructor(authService) {
        this.authService = authService;
        this.container = null;
        this.logs = [];
        this.filteredLogs = [];
        this.currentFilters = {
            action: '',
            user: '',
            dateFrom: '',
            dateTo: '',
            severity: ''
        };
        this.currentPage = 1;
        this.itemsPerPage = 20;
    }

    /**
     * Renderiza el componente
     * @param {Element} container - Contenedor
     */
    async render(container) {
        this.container = container;

        // Verificar permisos
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || !currentUser.hasPermission(PERMISSIONS.VIEW_AUDIT)) {
            this.renderAccessDenied();
            return;
        }

        try {
            // Cargar logs
            await this.loadAuditLogs();

            // Renderizar HTML
            const html = this.generateHTML();
            this.container.innerHTML = html;

            // Configurar eventos
            this.setupEvents();

            // Aplicar filtros iniciales
            this.applyFilters();

        } catch (error) {
            console.error('Error al renderizar audit log:', error);
            this.renderError();
        }
    }

    /**
     * Carga los logs de auditoría
     */
    async loadAuditLogs() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
            const logData = stored ? JSON.parse(stored) : [];

            this.logs = logData.map(data => AuditLog.fromJSON(data))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        } catch (error) {
            console.error('Error al cargar logs:', error);
            this.logs = [];
        }
    }

    /**
     * Genera el HTML del componente
     * @returns {string}
     */
    generateHTML() {
        return `
      <div class="audit-log-container">
        <div class="audit-header">
          <h2><i class="fas fa-history"></i> Registro de Auditoría</h2>
          <div class="audit-actions">
            <button class="btn btn-outline" id="refreshAudit">
              <i class="fas fa-sync-alt"></i> Actualizar
            </button>
            <button class="btn btn-secondary" id="exportAudit">
              <i class="fas fa-download"></i> Exportar
            </button>
            <button class="btn btn-error" id="clearAudit">
              <i class="fas fa-trash"></i> Limpiar
            </button>
          </div>
        </div>

        <!-- Filtros -->
        ${this.renderFilters()}

        <!-- Estadísticas rápidas -->
        ${this.renderQuickStats()}

        <!-- Lista de logs -->
        <div class="audit-content">
          <div class="audit-list" id="auditList">
            ${this.renderLogList()}
          </div>
          
          <!-- Paginación -->
          ${this.renderPagination()}
        </div>
      </div>
    `;
    }

    /**
     * Renderiza los filtros
     * @returns {string}
     */
    renderFilters() {
        const users = [...new Set(this.logs.map(log => log.userName))].filter(Boolean);

        return `
      <div class="filters-container">
        <div class="filters-header">
          <h3 class="filters-title">
            <i class="fas fa-filter"></i>
            Filtros
          </h3>
          <button class="filters-toggle" id="toggleAuditFilters">
            <span>Mostrar filtros</span>
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
        
        <div class="filters-content collapsed" id="auditFiltersContent">
          <div class="form-row">
            <div class="form-group">
              <label for="actionFilter" class="form-label">Acción</label>
              <select id="actionFilter" class="form-control form-select">
                <option value="">Todas las acciones</option>
                ${Object.entries(this.getActionLabels()).map(([value, label]) =>
            `<option value="${value}">${label}</option>`
        ).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="userFilter" class="form-label">Usuario</label>
              <select id="userFilter" class="form-control form-select">
                <option value="">Todos los usuarios</option>
                ${users.map(user =>
            `<option value="${user}">${user}</option>`
        ).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="severityFilter" class="form-label">Severidad</label>
              <select id="severityFilter" class="form-control form-select">
                <option value="">Todas las severidades</option>
                <option value="info">Información</option>
                <option value="warning">Advertencia</option>
                <option value="error">Error</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dateFromFilter" class="form-label">Fecha Desde</label>
              <input type="date" id="dateFromFilter" class="form-control">
            </div>
            
            <div class="form-group">
              <label for="dateToFilter" class="form-label">Fecha Hasta</label>
              <input type="date" id="dateToFilter" class="form-control">
            </div>
            
            <div class="form-group">
              <div class="filter-actions">
                <button class="btn btn-primary" id="applyAuditFilters">
                  <i class="fas fa-search"></i> Aplicar
                </button>
                <button class="btn btn-secondary" id="clearAuditFilters">
                  <i class="fas fa-times"></i> Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza estadísticas rápidas
     * @returns {string}
     */
    renderQuickStats() {
        const stats = this.calculateStats();

        return `
      <div class="audit-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-list"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">${stats.total}</h3>
              <p class="stat-label">Total de Registros</p>
            </div>
          </div>
          
          <div class="stat-item info">
            <div class="stat-icon">
              <i class="fas fa-info-circle"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">${stats.info}</h3>
              <p class="stat-label">Información</p>
            </div>
          </div>
          
          <div class="stat-item warning">
            <div class="stat-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">${stats.warning}</h3>
              <p class="stat-label">Advertencias</p>
            </div>
          </div>
          
          <div class="stat-item error">
            <div class="stat-icon">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">${stats.error}</h3>
              <p class="stat-label">Errores</p>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza la lista de logs
     * @returns {string}
     */
    renderLogList() {
        if (this.filteredLogs.length === 0) {
            return `
        <div class="empty-state">
          <i class="fas fa-history empty-state-icon"></i>
          <h3 class="empty-state-title">No hay registros de auditoría</h3>
          <p class="empty-state-message">
            ${this.hasActiveFilters() ?
                    'No se encontraron registros que coincidan con los filtros aplicados.' :
                    'No hay actividad registrada en el sistema.'
                }
          </p>
        </div>
      `;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredLogs.slice(startIndex, endIndex);

        return pageItems.map(log => this.renderLogItem(log)).join('');
    }

    /**
     * Renderiza un elemento de log
     * @param {AuditLog} log - Log de auditoría
     * @returns {string}
     */
    renderLogItem(log) {
        return `
      <div class="audit-item severity-${log.severity}" data-log-id="${log.id}">
        <div class="audit-icon">
          <i class="${log.getActionIcon()}"></i>
        </div>
        
        <div class="audit-content">
          <div class="audit-header">
            <h4 class="audit-action">${log.getActionName()}</h4>
            <span class="audit-time" title="${formatDate(log.timestamp, 'EEEE, d \'de\' MMMM \'de\' yyyy HH:mm:ss')}">
              ${formatRelative(log.timestamp)}
            </span>
          </div>
          
          <p class="audit-description">${log.description}</p>
          
          <div class="audit-meta">
            <div class="audit-user">
              <i class="fas fa-user"></i>
              <span>${log.userName}</span>
              ${log.userArea ? `<span class="user-area">(${log.userArea})</span>` : ''}
            </div>
            
            ${log.ipAddress ? `
              <div class="audit-ip">
                <i class="fas fa-globe"></i>
                <span>${log.ipAddress}</span>
              </div>
            ` : ''}
            
            <div class="audit-severity">
              <span class="badge badge-${log.severity}">${log.severity}</span>
            </div>
          </div>
          
          ${Object.keys(log.additionalData).length > 0 ? `
            <div class="audit-details">
              <button class="btn btn-sm btn-ghost audit-details-toggle" data-log-id="${log.id}">
                <i class="fas fa-chevron-down"></i>
                Ver detalles
              </button>
              <div class="audit-additional-data" id="details-${log.id}" style="display: none;">
                <pre>${JSON.stringify(log.additionalData, null, 2)}</pre>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    }

    /**
     * Renderiza la paginación
     * @returns {string}
     */
    renderPagination() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);

        if (totalPages <= 1) return '';

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Botón anterior
        if (this.currentPage > 1) {
            pages.push(`
        <button class="pagination-item" data-page="${this.currentPage - 1}">
          <i class="fas fa-chevron-left"></i>
        </button>
      `);
        }

        // Primera página
        if (startPage > 1) {
            pages.push(`<button class="pagination-item" data-page="1">1</button>`);
            if (startPage > 2) {
                pages.push(`<span class="pagination-ellipsis">...</span>`);
            }
        }

        // Páginas visibles
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
        <button class="pagination-item ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `);
        }

        // Última página
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(`<span class="pagination-ellipsis">...</span>`);
            }
            pages.push(`<button class="pagination-item" data-page="${totalPages}">${totalPages}</button>`);
        }

        // Botón siguiente
        if (this.currentPage < totalPages) {
            pages.push(`
        <button class="pagination-item" data-page="${this.currentPage + 1}">
          <i class="fas fa-chevron-right"></i>
        </button>
      `);
        }

        return `
      <div class="pagination-container">
        <div class="pagination-info">
          Mostrando ${(this.currentPage - 1) * this.itemsPerPage + 1} - 
          ${Math.min(this.currentPage * this.itemsPerPage, this.filteredLogs.length)} 
          de ${this.filteredLogs.length} registros
        </div>
        <div class="pagination">
          ${pages.join('')}
        </div>
      </div>
    `;
    }

    /**
     * Configura eventos
     */
    setupEvents() {
        // Botones principales
        document.getElementById('refreshAudit').addEventListener('click', () => this.refresh());
        document.getElementById('exportAudit').addEventListener('click', () => this.exportLogs());
        document.getElementById('clearAudit').addEventListener('click', () => this.clearLogs());

        // Filtros
        document.getElementById('toggleAuditFilters').addEventListener('click', () => this.toggleFilters());
        document.getElementById('applyAuditFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearAuditFilters').addEventListener('click', () => this.clearFilters());

        // Paginación
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.pagination-item')) {
                const page = parseInt(e.target.closest('.pagination-item').dataset.page);
                if (page) {
                    this.goToPage(page);
                }
            }
        });

        // Toggle de detalles
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.audit-details-toggle')) {
                const logId = e.target.closest('.audit-details-toggle').dataset.logId;
                this.toggleDetails(logId);
            }
        });

        // Auto-refresh cada 30 segundos
        setInterval(() => this.refresh(), 30000);
    }

    /**
     * Alterna la visibilidad de filtros
     */
    toggleFilters() {
        const content = document.getElementById('auditFiltersContent');
        const toggle = document.getElementById('toggleAuditFilters');
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
     * Aplica los filtros
     */
    applyFilters() {
        // Obtener valores de filtros
        this.currentFilters.action = document.getElementById('actionFilter').value;
        this.currentFilters.user = document.getElementById('userFilter').value;
        this.currentFilters.severity = document.getElementById('severityFilter').value;
        this.currentFilters.dateFrom = document.getElementById('dateFromFilter').value;
        this.currentFilters.dateTo = document.getElementById('dateToFilter').value;

        // Filtrar logs
        this.filteredLogs = this.logs.filter(log => {
            // Filtro por acción
            if (this.currentFilters.action && log.action !== this.currentFilters.action) {
                return false;
            }

            // Filtro por usuario
            if (this.currentFilters.user && log.userName !== this.currentFilters.user) {
                return false;
            }

            // Filtro por severidad
            if (this.currentFilters.severity && log.severity !== this.currentFilters.severity) {
                return false;
            }

            // Filtro por fecha desde
            if (this.currentFilters.dateFrom) {
                const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                if (logDate < this.currentFilters.dateFrom) {
                    return false;
                }
            }

            // Filtro por fecha hasta
            if (this.currentFilters.dateTo) {
                const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                if (logDate > this.currentFilters.dateTo) {
                    return false;
                }
            }

            return true;
        });

        // Resetear página
        this.currentPage = 1;

        // Re-renderizar lista
        this.updateList();
    }

    /**
     * Limpia los filtros
     */
    clearFilters() {
        this.currentFilters = {
            action: '',
            user: '',
            dateFrom: '',
            dateTo: '',
            severity: ''
        };

        // Limpiar campos
        document.getElementById('actionFilter').value = '';
        document.getElementById('userFilter').value = '';
        document.getElementById('severityFilter').value = '';
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';

        this.applyFilters();
    }

    /**
     * Actualiza la lista sin recargar toda la página
     */
    updateList() {
        const listElement = document.getElementById('auditList');
        if (listElement) {
            listElement.innerHTML = this.renderLogList();
        }

        // Actualizar paginación
        const paginationContainer = this.container.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.outerHTML = this.renderPagination();
        }

        // Reconfigurar eventos de paginación
        this.setupPaginationEvents();
    }

    /**
     * Configura eventos de paginación
     */
    setupPaginationEvents() {
        this.container.querySelectorAll('.pagination-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page) {
                    this.goToPage(page);
                }
            });
        });
    }

    /**
     * Va a una página específica
     * @param {number} page - Número de página
     */
    goToPage(page) {
        this.currentPage = page;
        this.updateList();
    }

    /**
     * Alterna detalles de un log
     * @param {string} logId - ID del log
     */
    toggleDetails(logId) {
        const detailsElement = document.getElementById(`details-${logId}`);
        const toggleButton = document.querySelector(`[data-log-id="${logId}"]`);
        const icon = toggleButton.querySelector('i');

        if (detailsElement.style.display === 'none') {
            detailsElement.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
            toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i> Ocultar detalles';
        } else {
            detailsElement.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
            toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i> Ver detalles';
        }
    }

    /**
     * Refresca los logs
     */
    async refresh() {
        await this.loadAuditLogs();
        this.applyFilters();
    }

    /**
     * Exporta los logs filtrados
     */
    exportLogs() {
        const csvContent = this.generateCSV();
        this.downloadFile(csvContent, 'audit-log.csv', 'text/csv');
    }

    /**
     * Genera contenido CSV
     * @returns {string}
     */
    generateCSV() {
        const headers = [
            'Fecha/Hora', 'Acción', 'Descripción', 'Usuario',
            'Área', 'Severidad', 'IP', 'Detalles Adicionales'
        ];

        const rows = this.filteredLogs.map(log => [
            formatDate(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
            log.getActionName(),
            log.description,
            log.userName,
            log.userArea,
            log.severity,
            log.ipAddress || '',
            JSON.stringify(log.additionalData)
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Descarga un archivo
     * @param {string} content - Contenido
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
     * Limpia los logs (solo administradores)
     */
    async clearLogs() {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || !currentUser.isAdmin()) {
            alert('Solo los administradores pueden limpiar el log de auditoría');
            return;
        }

        if (!confirm('¿Está seguro de que desea limpiar todo el registro de auditoría? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));

            // Registrar la acción de limpieza
            this.authService.logActivity(
                AUDIT_ACTIONS.SYSTEM_ERROR,
                'Log de auditoría limpiado por administrador'
            );

            await this.refresh();
            alert('Registro de auditoría limpiado exitosamente');
        } catch (error) {
            console.error('Error al limpiar logs:', error);
            alert('Error al limpiar el registro de auditoría');
        }
    }

    /**
     * Calcula estadísticas
     * @returns {Object}
     */
    calculateStats() {
        return {
            total: this.filteredLogs.length,
            info: this.filteredLogs.filter(log => log.severity === 'info').length,
            warning: this.filteredLogs.filter(log => log.severity === 'warning').length,
            error: this.filteredLogs.filter(log => log.severity === 'error').length,
            critical: this.filteredLogs.filter(log => log.severity === 'critical').length
        };
    }

    /**
     * Obtiene etiquetas de acciones
     * @returns {Object}
     */
    getActionLabels() {
        return {
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
    }

    /**
     * Verifica si hay filtros activos
     * @returns {boolean}
     */
    hasActiveFilters() {
        return Object.values(this.currentFilters).some(value => value !== '');
    }

    /**
     * Renderiza acceso denegado
     */
    renderAccessDenied() {
        this.container.innerHTML = `
      <div class="access-denied">
        <div class="empty-state">
          <i class="fas fa-lock empty-state-icon text-error"></i>
          <h3 class="empty-state-title">Acceso Denegado</h3>
          <p class="empty-state-message">
            No tiene permisos para ver el registro de auditoría.
          </p>
        </div>
      </div>
    `;
    }

    /**
     * Renderiza error
     */
    renderError() {
        this.container.innerHTML = `
      <div class="audit-error">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle empty-state-icon text-error"></i>
          <h3 class="empty-state-title">Error al cargar el registro</h3>
          <p class="empty-state-message">
            Ha ocurrido un error al cargar el registro de auditoría.
          </p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i>
            Reintentar
          </button>
        </div>
      </div>
    `;
    }

    /**
     * Destructor del componente
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default AuditLogComponent;