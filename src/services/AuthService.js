/**
 * Servicio de Autenticación
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { 
  USER_ROLES, 
  PERMISSIONS, 
  ORGANIZATIONAL_AREAS,
  STORAGE_KEYS,
  SYSTEM_MESSAGES,
  AUDIT_ACTIONS 
} from '../utils/constants.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { validateEmail, hashPassword } from '../utils/helpers.js';
import config from '../config/app.config.js';

/**
 * Servicio de autenticación y gestión de usuarios
 */
export class AuthService {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.loginAttempts = new Map(); // Control de intentos de login
    this.sessionTimeout = config.AUTH.SESSION_TIMEOUT;
    this.sessionTimer = null;
  }

  /**
   * Carga los usuarios desde el almacenamiento
   * @returns {Map<string, User>}
   */
  loadUsers() {
    // En desarrollo: usuarios por defecto
    const defaultUsers = this.getDefaultUsers();
    
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) {
      const userData = JSON.parse(stored);
      const users = new Map();
      
      Object.entries(userData).forEach(([email, data]) => {
        users.set(email, User.fromJSON(data));
      });
      
      return users;
    }
    
    return defaultUsers;
  }

  /**
   * Obtiene los usuarios por defecto para desarrollo
   * @returns {Map<string, User>}
   */
  getDefaultUsers() {
    const users = new Map();
    
    // Usuario administrador (Secretario)
    users.set('secretario@saludtolima.gov.co', new User({
      email: 'secretario@saludtolima.gov.co',
      name: 'Dr. Juan Carlos Pérez',
      area: ORGANIZATIONAL_AREAS.DESPACHO,
      role: USER_ROLES.ADMIN,
      permissions: [PERMISSIONS.ALL],
      password: this.hashPassword('admin123'), // En producción usar hash real
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString()
    }));

    // Director Administrativo
    users.set('admin@saludtolima.gov.co', new User({
      email: 'admin@saludtolima.gov.co',
      name: 'María García Rodríguez',
      area: ORGANIZATIONAL_AREAS.DIRECCION_ADMINISTRATIVA,
      role: USER_ROLES.DIRECTOR,
      permissions: [
        PERMISSIONS.CREATE_MEETING,
        PERMISSIONS.EDIT_MEETING,
        PERMISSIONS.VIEW_MEETING,
        PERMISSIONS.VIEW_REPORTS
      ],
      password: this.hashPassword('admin123'),
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString()
    }));

    // Director de Salud Pública
    users.set('salud.publica@saludtolima.gov.co', new User({
      email: 'salud.publica@saludtolima.gov.co',
      name: 'Dr. Ana Rodríguez López',
      area: ORGANIZATIONAL_AREAS.DIRECCION_SALUD_PUBLICA,
      role: USER_ROLES.DIRECTOR,
      permissions: [
        PERMISSIONS.CREATE_MEETING,
        PERMISSIONS.EDIT_MEETING,
        PERMISSIONS.VIEW_MEETING,
        PERMISSIONS.VIEW_REPORTS
      ],
      password: this.hashPassword('salud123'),
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString()
    }));

    // Director de Aseguramiento
    users.set('aseguramiento@saludtolima.gov.co', new User({
      email: 'aseguramiento@saludtolima.gov.co',
      name: 'Ing. Carlos Mendoza',
      area: ORGANIZATIONAL_AREAS.DIRECCION_ASEGURAMIENTO,
      role: USER_ROLES.DIRECTOR,
      permissions: [
        PERMISSIONS.CREATE_MEETING,
        PERMISSIONS.EDIT_MEETING,
        PERMISSIONS.VIEW_MEETING
      ],
      password: this.hashPassword('aseg123'),
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString()
    }));

    // Director de Prestación
    users.set('prestacion@saludtolima.gov.co', new User({
      email: 'prestacion@saludtolima.gov.co',
      name: 'Dra. Patricia Vásquez',
      area: ORGANIZATIONAL_AREAS.DIRECCION_PRESTACION,
      role: USER_ROLES.DIRECTOR,
      permissions: [
        PERMISSIONS.CREATE_MEETING,
        PERMISSIONS.EDIT_MEETING,
        PERMISSIONS.VIEW_MEETING
      ],
      password: this.hashPassword('prest123'),
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString()
    }));

    return users;
  }

  /**
   * Guarda los usuarios en el almacenamiento
   */
  saveUsers() {
    const userData = {};
    this.users.forEach((user, email) => {
      userData[email] = user.toJSON();
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(userData));
  }

  /**
   * Hash simple para desarrollo (EN PRODUCCIÓN USAR bcrypt o similar)
   * @param {string} password 
   * @returns {string}
   */
  hashPassword(password) {
    // NOTA: En desarrollo usamos un hash simple
    // EN PRODUCCIÓN debe usar bcrypt, scrypt o similar
    return btoa(password); // Base64 simple para desarrollo
  }

  /**
   * Verifica una contraseña
   * @param {string} password 
   * @param {string} hash 
   * @returns {boolean}
   */
  verifyPassword(password, hash) {
    // NOTA: En desarrollo comparación simple
    // EN PRODUCCIÓN debe usar la verificación correspondiente al hash
    return btoa(password) === hash;
  }

  /**
   * Intenta iniciar sesión
   * @param {string} email 
   * @param {string} password 
   * @param {string} area 
   * @returns {Promise<{success: boolean, message: string, user?: User}>}
   */
  async login(email, password, area) {
    try {
      // Validar formato de email
      if (!validateEmail(email)) {
        return {
          success: false,
          message: 'Formato de email inválido'
        };
      }

      // Verificar intentos de login
      const attempts = this.loginAttempts.get(email) || 0;
      if (attempts >= config.AUTH.MAX_LOGIN_ATTEMPTS) {
        this.logActivity(AUDIT_ACTIONS.LOGIN, `Cuenta bloqueada por intentos excesivos: ${email}`, null, 'system');
        return {
          success: false,
          message: 'Cuenta temporalmente bloqueada por intentos excesivos'
        };
      }

      // Buscar usuario
      const user = this.users.get(email);
      if (!user) {
        this.incrementLoginAttempts(email);
        return {
          success: false,
          message: SYSTEM_MESSAGES.LOGIN_FAILED
        };
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        return {
          success: false,
          message: 'Usuario desactivado. Contacte al administrador'
        };
      }

      // Verificar contraseña
      if (!this.verifyPassword(password, user.password)) {
        this.incrementLoginAttempts(email);
        this.logActivity(AUDIT_ACTIONS.LOGIN, `Intento de login fallido: ${email}`, null, user.area);
        return {
          success: false,
          message: SYSTEM_MESSAGES.LOGIN_FAILED
        };
      }

      // Verificar área
      if (user.area !== area) {
        this.incrementLoginAttempts(email);
        return {
          success: false,
          message: 'El área seleccionada no coincide con el usuario'
        };
      }

      // Login exitoso
      this.currentUser = user;
      user.lastLogin = new Date().toISOString();
      user.loginCount = (user.loginCount || 0) + 1;

      // Limpiar intentos de login
      this.loginAttempts.delete(email);

      // Guardar sesión
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user.toJSON()));
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, user.lastLogin);

      // Configurar timeout de sesión
      this.setupSessionTimeout();

      // Log de auditoría
      this.logActivity(AUDIT_ACTIONS.LOGIN, `Inicio de sesión exitoso: ${user.name}`, user);

      // Guardar usuarios actualizados
      this.saveUsers();

      return {
        success: true,
        message: SYSTEM_MESSAGES.LOGIN_SUCCESS,
        user: user
      };

    } catch (error) {
      console.error('Error en login:', error);
      this.logActivity(AUDIT_ACTIONS.SYSTEM_ERROR, `Error en login: ${error.message}`, null, 'system');
      return {
        success: false,
        message: 'Error interno del sistema'
      };
    }
  }

  /**
   * Incrementa los intentos de login fallidos
   * @param {string} email 
   */
  incrementLoginAttempts(email) {
    const attempts = this.loginAttempts.get(email) || 0;
    this.loginAttempts.set(email, attempts + 1);
    
    // Limpiar después de 15 minutos
    setTimeout(() => {
      this.loginAttempts.delete(email);
    }, 15 * 60 * 1000);
  }

  /**
   * Cierra la sesión actual
   */
  logout() {
    if (this.currentUser) {
      this.logActivity(AUDIT_ACTIONS.LOGOUT, `Cierre de sesión: ${this.currentUser.name}`, this.currentUser);
    }

    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    
    // Limpiar timeout de sesión
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Obtiene el usuario actual
   * @returns {User|null}
   */
  getCurrentUser() {
    if (!this.currentUser) {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          this.currentUser = User.fromJSON(userData);
          this.setupSessionTimeout();
        } catch (error) {
          console.error('Error al cargar usuario:', error);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
      }
    }
    return this.currentUser;
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permission 
   * @returns {boolean}
   */
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return user.permissions.includes(PERMISSIONS.ALL) || 
           user.permissions.includes(permission);
  }

  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string} role 
   * @returns {boolean}
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  /**
   * Configura el timeout de sesión
   */
  setupSessionTimeout() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  /**
   * Maneja el timeout de sesión
   */
  handleSessionTimeout() {
    if (this.currentUser) {
      this.logActivity(AUDIT_ACTIONS.LOGOUT, `Sesión expirada: ${this.currentUser.name}`, this.currentUser);
      alert(SYSTEM_MESSAGES.SESSION_EXPIRED);
      this.logout();
      window.location.reload();
    }
  }

  /**
   * Renueva la sesión
   */
  renewSession() {
    if (this.isAuthenticated()) {
      this.setupSessionTimeout();
    }
  }

  /**
   * Cambia la contraseña del usuario actual
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async changePassword(currentPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Usuario no autenticado'
      };
    }

    // Verificar contraseña actual
    if (!this.verifyPassword(currentPassword, user.password)) {
      return {
        success: false,
        message: 'Contraseña actual incorrecta'
      };
    }

    // Validar nueva contraseña
    if (newPassword.length < config.AUTH.PASSWORD_MIN_LENGTH) {
      return {
        success: false,
        message: `La contraseña debe tener al menos ${config.AUTH.PASSWORD_MIN_LENGTH} caracteres`
      };
    }

    // Cambiar contraseña
    user.password = this.hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();

    // Actualizar en el mapa de usuarios
    this.users.set(user.email, user);
    this.saveUsers();

    // Log de auditoría
    this.logActivity(AUDIT_ACTIONS.SYSTEM_ERROR, 'Cambio de contraseña', user);

    return {
      success: true,
      message: 'Contraseña cambiada exitosamente'
    };
  }

  /**
   * Registra una actividad en el log de auditoría
   * @param {string} action 
   * @param {string} description 
   * @param {User} user 
   * @param {string} area 
   */
  logActivity(action, description, user = null, area = null) {
    const currentUser = user || this.getCurrentUser();
    
    const logEntry = new AuditLog({
      action,
      description,
      userId: currentUser?.id || null,
      userName: currentUser?.name || 'Sistema',
      userArea: area || currentUser?.area || 'sistema',
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(), // En desarrollo será null
      userAgent: navigator.userAgent
    });

    // Obtener log actual
    const auditLog = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOG) || '[]');
    
    // Agregar nueva entrada
    auditLog.unshift(logEntry.toJSON());
    
    // Mantener solo las últimas 1000 entradas
    if (auditLog.length > 1000) {
      auditLog.splice(1000);
    }
    
    // Guardar
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLog));

    // En desarrollo, también log a consola
    if (config.DEBUG) {
      console.log('🔍 Audit Log:', {
        action,
        description,
        user: currentUser?.name || 'Sistema',
        timestamp: new Date().toLocaleString()
      });
    }
  }

  /**
   * Obtiene la IP del cliente (mock para desarrollo)
   * @returns {string|null}
   */
  getClientIP() {
    // En desarrollo retorna null
    // En producción se obtendría del servidor
    return null;
  }

  /**
   * Obtiene estadísticas de login
   * @returns {Object}
   */
  getLoginStats() {
    const users = Array.from(this.users.values());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      todayLogins: users.filter(u => {
        if (!u.lastLogin) return false;
        const loginDate = new Date(u.lastLogin);
        return loginDate >= today;
      }).length,
      neverLoggedIn: users.filter(u => !u.lastLogin).length
    };
  }

  /**
   * Reactiva la sesión si existe
   */
  restoreSession() {
    const user = this.getCurrentUser();
    if (user) {
      this.setupSessionTimeout();
      return true;
    }
    return false;
  }
}

export default AuthService;