/**
 * Modelo de Usuario
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import {
    USER_ROLES,
    PERMISSIONS,
    ORGANIZATIONAL_AREAS,
    AREA_LABELS
} from '../utils/constants.js';
import { validateEmail } from '../utils/helpers.js';

/**
 * Clase User - Representa un usuario del sistema
 */
export class User {
    /**
     * Constructor del usuario
     * @param {Object} data - Datos del usuario
     */
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.email = data.email || '';
        this.name = data.name || '';
        this.area = data.area || '';
        this.role = data.role || USER_ROLES.ASISTENTE;
        this.permissions = data.permissions || [];
        this.password = data.password || '';
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.lastLogin = data.lastLogin || null;
        this.loginCount = data.loginCount || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.profilePicture = data.profilePicture || null;
        this.phone = data.phone || '';
        this.position = data.position || '';
    }

    /**
     * Genera un ID único para el usuario
     * @returns {string}
     */
    generateId() {
        return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Obtiene el nombre del área del usuario
     * @returns {string}
     */
    getAreaName() {
        return AREA_LABELS[this.area] || this.area;
    }

    /**
     * Verifica si el usuario tiene un permiso específico
     * @param {string} permission - Permiso a verificar
     * @returns {boolean}
     */
    hasPermission(permission) {
        return this.permissions.includes(PERMISSIONS.ALL) ||
            this.permissions.includes(permission);
    }

    /**
     * Verifica si el usuario es administrador
     * @returns {boolean}
     */
    isAdmin() {
        return this.role === USER_ROLES.ADMIN;
    }

    /**
     * Verifica si el usuario es director
     * @returns {boolean}
     */
    isDirector() {
        return this.role === USER_ROLES.DIRECTOR;
    }

    /**
     * Obtiene el nombre completo con el cargo
     * @returns {string}
     */
    getFullDisplayName() {
        return this.position ? `${this.name} - ${this.position}` : this.name;
    }

    /**
     * Verifica si el usuario puede crear reuniones
     * @returns {boolean}
     */
    canCreateMeetings() {
        return this.hasPermission(PERMISSIONS.CREATE_MEETING);
    }

    /**
     * Verifica si el usuario puede ver reportes
     * @returns {boolean}
     */
    canViewReports() {
        return this.hasPermission(PERMISSIONS.VIEW_REPORTS);
    }

    /**
     * Actualiza la información del usuario
     * @param {Object} data - Nuevos datos
     */
    update(data) {
        const allowedFields = [
            'name', 'area', 'role', 'permissions', 'isActive',
            'phone', 'position', 'profilePicture'
        ];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                this[field] = data[field];
            }
        });

        this.updatedAt = new Date().toISOString();
    }

    /**
     * Actualiza la última fecha de login
     */
    updateLastLogin() {
        this.lastLogin = new Date().toISOString();
        this.loginCount += 1;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Desactiva el usuario
     */
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Activa el usuario
     */
    activate() {
        this.isActive = true;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Valida los datos del usuario
     * @returns {Object} - {isValid: boolean, errors: Array<string>}
     */
    validate() {
        const errors = [];

        // Validaciones requeridas
        if (!this.name?.trim()) {
            errors.push('El nombre es requerido');
        }

        if (!this.email?.trim()) {
            errors.push('El email es requerido');
        } else if (!validateEmail(this.email)) {
            errors.push('Formato de email inválido');
        }

        if (!this.area) {
            errors.push('El área es requerida');
        }

        if (!Object.values(USER_ROLES).includes(this.role)) {
            errors.push('Rol inválido');
        }

        if (!Object.values(ORGANIZATIONAL_AREAS).includes(this.area)) {
            errors.push('Área organizacional inválida');
        }

        // Validar permisos según el rol
        if (this.role === USER_ROLES.ADMIN && !this.hasPermission(PERMISSIONS.ALL)) {
            errors.push('El administrador debe tener todos los permisos');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Convierte el usuario a objeto plano para serialización
     * @param {boolean} includePassword - Si incluir la contraseña
     * @returns {Object}
     */
    toJSON(includePassword = false) {
        const data = {
            id: this.id,
            email: this.email,
            name: this.name,
            area: this.area,
            role: this.role,
            permissions: this.permissions,
            isActive: this.isActive,
            lastLogin: this.lastLogin,
            loginCount: this.loginCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            profilePicture: this.profilePicture,
            phone: this.phone,
            position: this.position
        };

        if (includePassword) {
            data.password = this.password;
        }

        return data;
    }

    /**
     * Crea un usuario desde un objeto plano
     * @param {Object} data - Datos del usuario
     * @returns {User}
     */
    static fromJSON(data) {
        return new User(data);
    }

    /**
     * Crea una copia del usuario
     * @returns {User}
     */
    clone() {
        return User.fromJSON(this.toJSON(true));
    }

    /**
     * Obtiene los permisos por defecto según el rol
     * @param {string} role - Rol del usuario
     * @returns {Array<string>}
     */
    static getDefaultPermissions(role) {
        switch (role) {
            case USER_ROLES.ADMIN:
                return [PERMISSIONS.ALL];

            case USER_ROLES.DIRECTOR:
                return [
                    PERMISSIONS.CREATE_MEETING,
                    PERMISSIONS.EDIT_MEETING,
                    PERMISSIONS.VIEW_MEETING,
                    PERMISSIONS.VIEW_REPORTS
                ];

            case USER_ROLES.COORDINADOR:
                return [
                    PERMISSIONS.CREATE_MEETING,
                    PERMISSIONS.VIEW_MEETING,
                    PERMISSIONS.EDIT_MEETING
                ];

            case USER_ROLES.ASISTENTE:
                return [
                    PERMISSIONS.VIEW_MEETING
                ];

            default:
                return [PERMISSIONS.VIEW_MEETING];
        }
    }
}

export default User;