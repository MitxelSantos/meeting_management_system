/**
 * Componente de navegación
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { PERMISSIONS } from '../utils/constants.js';

/**
 * Componente de navegación principal
 */
export class Navigation {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.menuItems = [];

        this.init();
    }

    /**
     * Inicializa el componente
     */
    init() {
        this.setupMenuItems();
        this.render();
        this.setupEvents();
    }

    /**
     * Configura los elementos del menú según permisos
     */
    setupMenuItems() {
        const currentUser = this.app.authService.getCurrentUser();
        if (!currentUser) return;

        this.menuItems = [
            {
                id: 'dashboard',
                label: 'Panel Principal',
                icon: 'fas fa-tachometer-alt',
                route: '/dashboard',
                permission: null // Todos pueden ver el dashboard
            },
            {
                id: 'meetings',
                label: 'Reuniones',
                icon: 'fas fa-calendar-alt',
                route: '/meetings',
                permission: PERMISSIONS.VIEW_MEETING,
                submenu: [
                    {
                        id: 'meetings-list',
                        label: 'Ver Reuniones',
                        route: '/meetings',
                        permission: PERMISSIONS.VIEW_MEETING
                    },
                    {
                        id: 'meetings-create',
                        label: 'Nueva Reunión',
                        route: '/meetings/create',
                        permission: PERMISSIONS.CREATE_MEETING
                    }
                ]
            },
            {
                id: 'calendar',
                label: 'Calendario',
                icon: 'fas fa-calendar',
                route: '/calendar',
                permission: PERMISSIONS.VIEW_MEETING
            },
            {
                id: 'reports',
                label: 'Reportes',
                icon: 'fas fa-chart-bar',
                route: '/reports',
                permission: PERMISSIONS.VIEW_REPORTS
            },
            {
                id: 'audit',
                label: 'Auditoría',
                icon: 'fas fa-history',
                route: '/audit',
                permission: PERMISSIONS.VIEW_AUDIT
            }
        ];

        // Filtrar elementos según permisos
        this.menuItems = this.menuItems.filter(item => {
            if (!item.permission) return true;
            return currentUser.hasPermission(item.permission);
        });

        // Filtrar submenús
        this.menuItems.forEach(item => {
            if (item.submenu) {
                item.submenu = item.submenu.filter(subitem => {
                    if (!subitem.permission) return true;
                    return currentUser.hasPermission(subitem.permission);
                });
            }
        });
    }

    /**
     * Renderiza la navegación
     */
    render() {
        if (!this.container) return;

        const html = this.menuItems.map(item => {
            if (item.submenu && item.submenu.length > 0) {
                return this.renderDropdownItem(item);
            } else {
                return this.renderMenuItem(item);
            }
        }).join('');

        this.container.innerHTML = html;
    }

    /**
     * Renderiza un elemento de menú simple
     * @param {Object} item - Elemento del menú
     * @returns {string}
     */
    renderMenuItem(item) {
        return `
      <a href="#${item.route}" 
         class="nav-item" 
         data-route="${item.route}"
         data-id="${item.id}">
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `;
    }

    /**
     * Renderiza un elemento de menú con dropdown
     * @param {Object} item - Elemento del menú
     * @returns {string}
     */
    renderDropdownItem(item) {
        const submenuHtml = item.submenu.map(subitem => `
      <a href="#${subitem.route}" 
         class="dropdown-item" 
         data-route="${subitem.route}"
         data-id="${subitem.id}">
        ${subitem.label}
      </a>
    `).join('');

        return `
      <div class="dropdown nav-item" data-id="${item.id}">
        <button class="nav-item dropdown-toggle" 
                type="button" 
                data-toggle="dropdown">
          <i class="${item.icon}"></i>
          <span>${item.label}</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="dropdown-menu">
          ${submenuHtml}
        </div>
      </div>
    `;
    }

    /**
     * Configura eventos de navegación
     */
    setupEvents() {
        if (!this.container) return;

        // Clicks en elementos de navegación
        this.container.addEventListener('click', (e) => {
            const target = e.target.closest('[data-route]');
            if (target) {
                e.preventDefault();
                const route = target.getAttribute('data-route');
                this.app.navigate(route);
            }
        });

        // Dropdowns
        this.container.addEventListener('click', (e) => {
            const dropdownToggle = e.target.closest('.dropdown-toggle');
            if (dropdownToggle) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown(dropdownToggle.parentElement);
            }
        });

        // Cerrar dropdowns al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.closeAllDropdowns();
            }
        });

        // Cerrar dropdowns con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });
    }

    /**
     * Alterna el estado de un dropdown
     * @param {Element} dropdown - Elemento dropdown
     */
    toggleDropdown(dropdown) {
        const isOpen = dropdown.classList.contains('show');

        // Cerrar todos los dropdowns
        this.closeAllDropdowns();

        // Abrir el dropdown actual si estaba cerrado
        if (!isOpen) {
            dropdown.classList.add('show');
        }
    }

    /**
     * Cierra todos los dropdowns
     */
    closeAllDropdowns() {
        const dropdowns = this.container.querySelectorAll('.dropdown.show');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    /**
     * Establece el elemento activo en la navegación
     * @param {string} route - Ruta actual
     */
    setActive(route) {
        if (!this.container) return;

        // Remover clase activa de todos los elementos
        const navItems = this.container.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        // Encontrar y activar el elemento correspondiente
        const activeItem = this.findActiveItem(route);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * Encuentra el elemento activo basado en la ruta
     * @param {string} route - Ruta actual
     * @returns {Element|null}
     */
    findActiveItem(route) {
        // Buscar coincidencia exacta
        let activeItem = this.container.querySelector(`[data-route="${route}"]`);

        if (activeItem) {
            return activeItem.closest('.nav-item');
        }

        // Buscar coincidencia parcial (para subrutas)
        const routeParts = route.split('/').filter(Boolean);
        if (routeParts.length > 1) {
            const baseRoute = '/' + routeParts[0];
            activeItem = this.container.querySelector(`[data-route="${baseRoute}"]`);

            if (activeItem) {
                return activeItem.closest('.nav-item');
            }
        }

        return null;
    }

    /**
     * Actualiza la navegación (útil cuando cambian permisos)
     */
    update() {
        this.setupMenuItems();
        this.render();
        this.setupEvents();
    }

    /**
     * Obtiene información de breadcrumbs para la ruta actual
     * @param {string} route - Ruta actual
     * @returns {Array}
     */
    getBreadcrumbs(route) {
        const breadcrumbs = [
            { label: 'Inicio', route: '/dashboard' }
        ];

        const routeParts = route.split('/').filter(Boolean);

        if (routeParts.length === 0 || routeParts[0] === 'dashboard') {
            return breadcrumbs;
        }

        // Encontrar el elemento del menú
        const menuItem = this.findMenuItemByRoute('/' + routeParts[0]);
        if (menuItem) {
            breadcrumbs.push({
                label: menuItem.label,
                route: menuItem.route
            });

            // Si hay subruta, buscar en submenú
            if (routeParts.length > 1 && menuItem.submenu) {
                const subRoute = '/' + routeParts.join('/');
                const subMenuItem = menuItem.submenu.find(sub => sub.route === subRoute);

                if (subMenuItem) {
                    breadcrumbs.push({
                        label: subMenuItem.label,
                        route: subMenuItem.route
                    });
                }
            }
        }

        return breadcrumbs;
    }

    /**
     * Encuentra un elemento del menú por ruta
     * @param {string} route - Ruta a buscar
     * @returns {Object|null}
     */
    findMenuItemByRoute(route) {
        return this.menuItems.find(item => item.route === route);
    }

    /**
     * Renderiza breadcrumbs
     * @param {string} route - Ruta actual
     * @returns {string}
     */
    renderBreadcrumbs(route) {
        const breadcrumbs = this.getBreadcrumbs(route);

        return `
      <nav class="breadcrumb" aria-label="breadcrumb">
        <ol class="breadcrumb-list">
          ${breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            if (isLast) {
                return `
                <li class="breadcrumb-item active" aria-current="page">
                  ${crumb.label}
                </li>
              `;
            } else {
                return `
                <li class="breadcrumb-item">
                  <a href="#${crumb.route}">${crumb.label}</a>
                </li>
              `;
            }
        }).join('')}
        </ol>
      </nav>
    `;
    }

    /**
     * Agrega estilos específicos para la navegación
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
      .dropdown {
        position: relative;
      }
      
      .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 160px;
        padding: 0.5rem 0;
        margin: 0.125rem 0 0;
        background-color: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all var(--transition-fast);
      }
      
      .dropdown.show .dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      
      .dropdown-toggle::after {
        margin-left: 0.5rem;
        transition: transform var(--transition-fast);
      }
      
      .dropdown.show .dropdown-toggle::after {
        transform: rotate(180deg);
      }
      
      .breadcrumb {
        margin-bottom: 1rem;
      }
      
      .breadcrumb-list {
        display: flex;
        flex-wrap: wrap;
        padding: 0;
        margin-bottom: 0;
        list-style: none;
        gap: 0.5rem;
      }
      
      .breadcrumb-item + .breadcrumb-item::before {
        content: "/";
        color: var(--text-muted);
        margin-right: 0.5rem;
      }
      
      .breadcrumb-item.active {
        color: var(--text-muted);
      }
    `;

        if (!document.getElementById('navigation-styles')) {
            style.id = 'navigation-styles';
            document.head.appendChild(style);
        }
    }

    /**
     * Destructor del componente
     */
    destroy() {
        this.closeAllDropdowns();

        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default Navigation;