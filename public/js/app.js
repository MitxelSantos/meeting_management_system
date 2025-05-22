/**
 * Aplicación principal del Sistema de Gestión de Reuniones
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import config from '../src/config/app.config.js';
import AuthService from '../src/services/AuthService.js';
import MeetingService from '../src/services/MeetingService.js';
import NotificationService from '../src/services/NotificationService.js';
import Navigation from '../src/components/Navigation.js';
import Dashboard from '../src/components/Dashboard.js';
import MeetingForm from '../src/components/MeetingForm.js';
import Calendar from '../src/components/Calendar.js';
import Reports from '../src/components/Reports.js';
import AuditLog from '../src/components/AuditLog.js';

/**
 * Clase principal de la aplicación
 */
class App {
    constructor() {
        this.currentView = null;
        this.isInitialized = false;

        // Servicios
        this.authService = new AuthService();
        this.meetingService = new MeetingService();
        this.notificationService = new NotificationService();

        // Componentes
        this.components = {
            navigation: null,
            dashboard: null,
            meetingForm: null,
            calendar: null,
            reports: null,
            auditLog: null
        };

        // Referencias del DOM
        this.elements = {
            loginScreen: null,
            mainApp: null,
            mainContent: null,
            loginForm: null,
            loginAlert: null,
            loadingSpinner: null,
            previewModal: null
        };

        // Estado de la aplicación
        this.state = {
            isAuthenticated: false,
            currentUser: null,
            currentRoute: '/',
            isLoading: false
        };

        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        try {
            console.log('🚀 Inicializando Sistema de Gestión de Reuniones...');

            // Obtener referencias del DOM
            this.getDOMReferences();

            // Configurar eventos globales
            this.setupGlobalEvents();

            // Intentar restaurar sesión
            await this.restoreSession();

            // Configurar enrutamiento
            this.setupRouting();

            // Marcar como inicializado
            this.isInitialized = true;

            console.log('✅ Aplicación inicializada correctamente');

        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            this.handleError('Error al inicializar la aplicación', error);
        }
    }

    /**
     * Obtiene las referencias del DOM
     */
    getDOMReferences() {
        this.elements = {
            loginScreen: document.getElementById('loginScreen'),
            mainApp: document.getElementById('mainApp'),
            mainContent: document.getElementById('mainContent'),
            navigationMenu: document.getElementById('navigationMenu'),
            loginForm: document.getElementById('loginForm'),
            loginAlert: document.getElementById('loginAlert'),
            loginMessage: document.getElementById('loginMessage'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            previewModal: document.getElementById('previewModal'),
            userName: document.getElementById('userName'),
            userArea: document.getElementById('userArea'),
            notificationBtn: document.getElementById('notificationBtn'),
            notificationBadge: document.getElementById('notificationBadge'),
            logoutBtn: document.getElementById('logoutBtn')
        };

        // Verificar elementos críticos
        const criticalElements = ['loginScreen', 'mainApp', 'mainContent', 'loginForm'];
        for (const elementName of criticalElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Elemento crítico no encontrado: ${elementName}`);
            }
        }
    }

    /**
     * Configura eventos globales
     */
    setupGlobalEvents() {
        // Evento de login
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Evento de logout
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Evento de notificaciones
        if (this.elements.notificationBtn) {
            this.elements.notificationBtn.addEventListener('click', () => this.showNotifications());
        }

        // Eventos del modal de preview
        this.setupModalEvents();

        // Eventos de teclado globales
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

        // Evento de visibilidad de la página (para pausar/reanudar)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // Evento de cambio de tamaño de ventana
        window.addEventListener('resize', () => this.handleResize());

        // Evento de error global
        window.addEventListener('error', (e) => this.handleError('Error JavaScript', e.error));

        // Evento de error de promesas no capturadas
        window.addEventListener('unhandledrejection', (e) => {
            this.handleError('Error de promesa no capturada', e.reason);
        });
    }

    /**
     * Configura eventos del modal
     */
    setupModalEvents() {
        if (this.elements.previewModal) {
            // Cerrar modal al hacer clic en el fondo
            this.elements.previewModal.addEventListener('click', (e) => {
                if (e.target === this.elements.previewModal) {
                    this.hideModal();
                }
            });

            // Botón de cerrar
            const closeBtn = this.elements.previewModal.querySelector('#closePreview');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideModal());
            }

            // Botón de editar
            const editBtn = this.elements.previewModal.querySelector('#editMeeting');
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editMeetingFromPreview());
            }

            // Botón de confirmar
            const confirmBtn = this.elements.previewModal.querySelector('#confirmSend');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => this.confirmSendMeeting());
            }
        }
    }

    /**
     * Maneja eventos de teclado globales
     */
    handleGlobalKeydown(e) {
        // Escape para cerrar modales
        if (e.key === 'Escape') {
            this.hideModal();
        }

        // Ctrl+S para guardar (prevenir comportamiento por defecto)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (this.currentView === 'meeting-form') {
                this.components.meetingForm?.save();
            }
        }

        // Renovar sesión en cualquier actividad
        if (this.state.isAuthenticated) {
            this.authService.renewSession();
        }
    }

    /**
     * Maneja cambios de visibilidad de la página
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Página oculta - pausar actualizaciones
            this.pauseUpdates();
        } else {
            // Página visible - reanudar actualizaciones
            this.resumeUpdates();

            // Renovar sesión si está autenticado
            if (this.state.isAuthenticated) {
                this.authService.renewSession();
            }
        }
    }

    /**
     * Maneja cambios de tamaño de ventana
     */
    handleResize() {
        // Notificar a componentes sobre cambio de tamaño
        Object.values(this.components).forEach(component => {
            if (component && typeof component.handleResize === 'function') {
                component.handleResize();
            }
        });
    }

    /**
     * Pausa actualizaciones automáticas
     */
    pauseUpdates() {
        Object.values(this.components).forEach(component => {
            if (component && typeof component.pause === 'function') {
                component.pause();
            }
        });
    }

    /**
     * Reanuda actualizaciones automáticas
     */
    resumeUpdates() {
        Object.values(this.components).forEach(component => {
            if (component && typeof component.resume === 'function') {
                component.resume();
            }
        });
    }

    /**
     * Intenta restaurar la sesión existente
     */
    async restoreSession() {
        try {
            if (this.authService.restoreSession()) {
                const currentUser = this.authService.getCurrentUser();
                if (currentUser) {
                    await this.loginSuccess(currentUser);
                    return true;
                }
            }
        } catch (error) {
            console.warn('No se pudo restaurar la sesión:', error);
            this.authService.logout();
        }

        this.showLoginScreen();
        return false;
    }

    /**
     * Maneja el evento de login
     */
    async handleLogin(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('loginEmail')?.trim();
        const password = formData.get('loginPassword')?.trim();
        const area = formData.get('loginArea')?.trim();

        if (!email || !password || !area) {
            this.showLoginAlert('Por favor complete todos los campos', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const result = await this.authService.login(email, password, area);

            if (result.success) {
                await this.loginSuccess(result.user);
                this.notificationService.show('Bienvenido al sistema', 'success');
            } else {
                this.showLoginAlert(result.message, 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showLoginAlert('Error interno del sistema', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Maneja el login exitoso
     */
    async loginSuccess(user) {
        this.state.isAuthenticated = true;
        this.state.currentUser = user;

        // Actualizar interfaz de usuario
        this.updateUserInfo(user);

        // Inicializar componentes
        await this.initializeComponents();

        // Mostrar aplicación principal
        this.showMainApp();

        // Navegar al dashboard
        this.navigate('/dashboard');
    }

    /**
     * Maneja el logout
     */
    handleLogout() {
        this.authService.logout();
        this.state.isAuthenticated = false;
        this.state.currentUser = null;

        // Limpiar componentes
        this.cleanupComponents();

        // Mostrar pantalla de login
        this.showLoginScreen();

        this.notificationService.show('Sesión cerrada correctamente', 'info');
    }

    /**
     * Inicializa los componentes principales
     */
    async initializeComponents() {
        try {
            // Navegación
            this.components.navigation = new Navigation(this.elements.navigationMenu, this);

            // Dashboard
            this.components.dashboard = new Dashboard(this.authService, this.meetingService);

            // Formulario de reuniones
            this.components.meetingForm = new MeetingForm(this.meetingService, this.authService);

            // Calendario
            this.components.calendar = new Calendar(this.meetingService);

            // Reportes
            this.components.reports = new Reports(this.meetingService, this.authService);

            // Log de auditoría
            this.components.auditLog = new AuditLog(this.authService);

            console.log('✅ Componentes inicializados');

        } catch (error) {
            console.error('❌ Error al inicializar componentes:', error);
            throw error;
        }
    }

    /**
     * Limpia los componentes
     */
    cleanupComponents() {
        Object.keys(this.components).forEach(key => {
            const component = this.components[key];
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
            this.components[key] = null;
        });
    }

    /**
     * Configura el enrutamiento
     */
    setupRouting() {
        // Escuchar cambios en el hash de la URL
        window.addEventListener('hashchange', () => this.handleRouteChange());

        // Manejar la ruta inicial
        this.handleRouteChange();
    }

    /**
     * Maneja cambios de ruta
     */
    handleRouteChange() {
        if (!this.state.isAuthenticated) return;

        const hash = window.location.hash.slice(1) || '/dashboard';
        this.navigate(hash, false);
    }

    /**
     * Navega a una ruta específica
     */
    async navigate(route, updateHash = true) {
        if (!this.state.isAuthenticated && route !== '/') {
            this.showLoginScreen();
            return;
        }

        // Actualizar hash si es necesario
        if (updateHash && window.location.hash.slice(1) !== route) {
            window.location.hash = route;
            return; // El evento hashchange manejará la navegación
        }

        this.state.currentRoute = route;
        this.showLoading(true);

        try {
            // Limpiar contenido actual
            this.clearMainContent();

            // Actualizar navegación activa
            if (this.components.navigation) {
                this.components.navigation.setActive(route);
            }

            // Renderizar vista correspondiente
            await this.renderView(route);

        } catch (error) {
            console.error('Error al navegar:', error);
            this.handleError('Error de navegación', error);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Renderiza la vista según la ruta
     */
    async renderView(route) {
        const [path, ...params] = route.split('/').filter(Boolean);

        switch (path) {
            case 'dashboard':
                this.currentView = 'dashboard';
                await this.components.dashboard.render(this.elements.mainContent);
                break;

            case 'meetings':
                if (params[0] === 'create') {
                    this.currentView = 'meeting-form';
                    await this.components.meetingForm.render(this.elements.mainContent, 'create');
                } else if (params[0] === 'edit' && params[1]) {
                    this.currentView = 'meeting-form';
                    await this.components.meetingForm.render(this.elements.mainContent, 'edit', params[1]);
                } else {
                    this.currentView = 'meetings';
                    await this.renderMeetingsList();
                }
                break;

            case 'calendar':
                this.currentView = 'calendar';
                await this.components.calendar.render(this.elements.mainContent);
                break;

            case 'reports':
                this.currentView = 'reports';
                await this.components.reports.render(this.elements.mainContent);
                break;

            case 'audit':
                this.currentView = 'audit';
                await this.components.auditLog.render(this.elements.mainContent);
                break;

            default:
                this.currentView = 'dashboard';
                await this.components.dashboard.render(this.elements.mainContent);
                break;
        }
    }

    /**
     * Renderiza la lista de reuniones
     */
    async renderMeetingsList() {
        const meetings = await this.meetingService.getAll();

        const html = `
      <div class="meetings-container">
        <div class="page-header">
          <h2><i class="fas fa-calendar-alt"></i> Gestión de Reuniones</h2>
          <button class="btn btn-primary" onclick="app.navigate('/meetings/create')">
            <i class="fas fa-plus"></i> Nueva Reunión
          </button>
        </div>
        
        <div class="meetings-filters">
          <input type="text" id="meetingSearch" class="search-input" placeholder="Buscar reuniones...">
          <select id="statusFilter" class="form-control">
            <option value="">Todos los estados</option>
            <option value="programada">Programadas</option>
            <option value="en_curso">En Curso</option>
            <option value="finalizada">Finalizadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
        
        <div class="meetings-list" id="meetingsList">
          ${this.renderMeetingItems(meetings)}
        </div>
      </div>
    `;

        this.elements.mainContent.innerHTML = html;

        // Configurar eventos de filtros
        this.setupMeetingFilters();
    }

    /**
     * Renderiza elementos de reuniones
     */
    renderMeetingItems(meetings) {
        if (!meetings || meetings.length === 0) {
            return `
        <div class="empty-state">
          <i class="fas fa-calendar-times empty-state-icon"></i>
          <h3 class="empty-state-title">No hay reuniones</h3>
          <p class="empty-state-message">Comience creando su primera reunión</p>
          <button class="btn btn-primary" onclick="app.navigate('/meetings/create')">
            <i class="fas fa-plus"></i> Crear Reunión
          </button>
        </div>
      `;
        }

        return meetings.map(meeting => `
      <div class="meeting-item priority-${meeting.priority} status-${meeting.status}" 
           onclick="app.viewMeeting('${meeting.id}')">
        <div class="meeting-header">
          <h3 class="meeting-title">${meeting.title}</h3>
          <div class="meeting-actions">
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); app.editMeeting('${meeting.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); app.deleteMeeting('${meeting.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="meeting-info">
          <div class="meeting-info-item">
            <i class="fas fa-calendar"></i>
            <span>${this.formatDate(meeting.date)}</span>
          </div>
          <div class="meeting-info-item">
            <i class="fas fa-clock"></i>
            <span>${meeting.startTime} - ${meeting.endTime}</span>
          </div>
          <div class="meeting-info-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${meeting.getLocationText()}</span>
          </div>
          <div class="meeting-info-item">
            <i class="fas fa-user"></i>
            <span>${meeting.getOrganizerName()}</span>
          </div>
        </div>
        
        <div class="meeting-badges">
          <span class="badge badge-${meeting.priority}">${meeting.priority}</span>
          <span class="badge badge-outline">${meeting.status}</span>
        </div>
      </div>
    `).join('');
    }

    /**
     * Configura filtros de reuniones
     */
    setupMeetingFilters() {
        const searchInput = document.getElementById('meetingSearch');
        const statusFilter = document.getElementById('statusFilter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterMeetings(e.target.value, statusFilter?.value);
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterMeetings(searchInput?.value, e.target.value);
            });
        }
    }

    /**
     * Filtra reuniones
     */
    async filterMeetings(search = '', status = '') {
        const meetings = await this.meetingService.getAll();
        let filtered = meetings;

        if (search) {
            filtered = filtered.filter(meeting =>
                meeting.title.toLowerCase().includes(search.toLowerCase()) ||
                meeting.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (status) {
            filtered = filtered.filter(meeting => meeting.status === status);
        }

        const listElement = document.getElementById('meetingsList');
        if (listElement) {
            listElement.innerHTML = this.renderMeetingItems(filtered);
        }
    }

    /**
     * Actualiza información del usuario en la interfaz
     */
    updateUserInfo(user) {
        if (this.elements.userName) {
            this.elements.userName.textContent = user.name;
        }

        if (this.elements.userArea) {
            this.elements.userArea.textContent = user.getAreaName();
        }
    }

    /**
     * Muestra/oculta pantalla de login
     */
    showLoginScreen() {
        this.elements.loginScreen.style.display = 'flex';
        this.elements.mainApp.style.display = 'none';

        // Limpiar formulario
        if (this.elements.loginForm) {
            this.elements.loginForm.reset();
        }

        // Ocultar alerta
        this.hideLoginAlert();
    }

    /**
     * Muestra/oculta aplicación principal
     */
    showMainApp() {
        this.elements.loginScreen.style.display = 'none';
        this.elements.mainApp.style.display = 'flex';
    }

    /**
     * Muestra alerta en login
     */
    showLoginAlert(message, type = 'error') {
        if (this.elements.loginAlert && this.elements.loginMessage) {
            this.elements.loginMessage.textContent = message;
            this.elements.loginAlert.className = `alert alert-${type}`;
            this.elements.loginAlert.style.display = 'flex';

            // Auto-ocultar después de 5 segundos
            setTimeout(() => this.hideLoginAlert(), 5000);
        }
    }

    /**
     * Oculta alerta de login
     */
    hideLoginAlert() {
        if (this.elements.loginAlert) {
            this.elements.loginAlert.style.display = 'none';
        }
    }

    /**
     * Muestra/oculta spinner de carga
     */
    showLoading(show = true) {
        this.state.isLoading = show;
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Limpia el contenido principal
     */
    clearMainContent() {
        if (this.elements.mainContent) {
            this.elements.mainContent.innerHTML = '';
        }
    }

    /**
     * Muestra modal
     */
    showModal(content) {
        if (this.elements.previewModal) {
            const modalBody = this.elements.previewModal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = content;
            }

            this.elements.previewModal.classList.add('show');
            this.elements.previewModal.style.display = 'flex';
        }
    }

    /**
     * Oculta modal
     */
    hideModal() {
        if (this.elements.previewModal) {
            this.elements.previewModal.classList.remove('show');
            setTimeout(() => {
                this.elements.previewModal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Formatea fecha para mostrar
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Maneja errores globales
     */
    handleError(message, error = null) {
        console.error(`❌ ${message}:`, error);

        // Log del error
        if (this.authService) {
            this.authService.logActivity('system_error', `${message}: ${error?.message || 'Error desconocido'}`);
        }

        // Mostrar notificación al usuario
        this.notificationService?.show(
            'Ha ocurrido un error inesperado',
            'error'
        );

        // En desarrollo, mostrar detalles
        if (config.ENV.DEVELOPMENT) {
            console.group('🔍 Detalles del error:');
            console.log('Mensaje:', message);
            console.log('Error:', error);
            console.log('Stack trace:', error?.stack);
            console.groupEnd();
        }
    }

    // Métodos públicos para interacción con reuniones

    async viewMeeting(meetingId) {
        // Implementar vista de reunión
        console.log('Ver reunión:', meetingId);
    }

    async editMeeting(meetingId) {
        this.navigate(`/meetings/edit/${meetingId}`);
    }

    async deleteMeeting(meetingId) {
        if (confirm('¿Está seguro de que desea eliminar esta reunión?')) {
            try {
                await this.meetingService.delete(meetingId);
                this.notificationService.show('Reunión eliminada correctamente', 'success');
                // Recargar lista
                if (this.currentView === 'meetings') {
                    await this.renderMeetingsList();
                }
            } catch (error) {
                this.handleError('Error al eliminar reunión', error);
            }
        }
    }

    editMeetingFromPreview() {
        // Implementar edición desde preview
        this.hideModal();
    }

    async confirmSendMeeting() {
        // Implementar confirmación de envío
        this.hideModal();
    }

    showNotifications() {
        // Implementar panel de notificaciones
        console.log('Mostrar notificaciones');
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Exportar para uso en otros módulos
export default App;