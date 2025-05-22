/**
 * Servicio de gestión de reuniones
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { Meeting } from '../models/Meeting.js';
import { STORAGE_KEYS, MEETING_STATUS, AUDIT_ACTIONS } from '../utils/constants.js';
import { generateId, sortByProperty } from '../utils/helpers.js';
import { getCurrentTimestamp } from '../utils/dateUtils.js';
import config from '../config/app.config.js';

/**
 * Servicio para gestionar reuniones
 */
export class MeetingService {
    constructor(authService = null) {
        this.authService = authService;
        this.meetings = new Map();
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.loadMeetings();
    }

    /**
     * Carga las reuniones desde el almacenamiento
     */
    loadMeetings() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.MEETINGS);
            if (stored) {
                const meetingsData = JSON.parse(stored);

                // Convertir objeto a Map de instancias Meeting
                Object.entries(meetingsData).forEach(([id, data]) => {
                    this.meetings.set(id, Meeting.fromJSON(data));
                });

                console.log(`📅 ${this.meetings.size} reuniones cargadas`);
            } else {
                // Crear reuniones de ejemplo en desarrollo
                if (config.ENV.DEVELOPMENT) {
                    this.createSampleMeetings();
                }
            }
        } catch (error) {
            console.error('Error al cargar reuniones:', error);
            this.meetings.clear();
        }
    }

    /**
     * Guarda las reuniones en el almacenamiento
     */
    saveMeetings() {
        try {
            const meetingsData = {};
            this.meetings.forEach((meeting, id) => {
                meetingsData[id] = meeting.toJSON();
            });

            localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetingsData));

            // Limpiar caché
            this.clearCache();

        } catch (error) {
            console.error('Error al guardar reuniones:', error);
            throw new Error('No se pudieron guardar las reuniones');
        }
    }

    /**
     * Crea reuniones de ejemplo para desarrollo
     */
    createSampleMeetings() {
        const sampleMeetings = [
            {
                title: 'Reunión de Coordinación Semanal',
                description: 'Revisión de avances y planificación semanal',
                type: 'presencial',
                date: '2024-12-15',
                startTime: '08:00',
                endTime: '09:30',
                location: 'Sala de Juntas Principal',
                organizer: 'despacho',
                attendees: 'Directores, Coordinadores',
                agenda: 'Revisión de indicadores\nAvances de proyectos\nPlanificación próxima semana',
                priority: 'alta',
                status: 'programada'
            },
            {
                title: 'Capacitación en Nuevos Protocolos',
                description: 'Capacitación sobre actualizaciones en protocolos de salud',
                type: 'virtual',
                date: '2024-12-16',
                startTime: '14:00',
                endTime: '16:00',
                location: '',
                organizer: 'direccion-salud-publica',
                attendees: 'Todo el personal técnico',
                agenda: 'Nuevos protocolos COVID-19\nActualización sistemas de información\nPreguntas y respuestas',
                priority: 'media',
                status: 'programada'
            },
            {
                title: 'Revisión Presupuestal Q4',
                description: 'Análisis de ejecución presupuestal del cuarto trimestre',
                type: 'oficina-director',
                date: '2024-12-17',
                startTime: '10:00',
                endTime: '12:00',
                location: 'Oficina Director Administrativo',
                organizer: 'direccion-administrativa',
                attendees: 'Equipo financiero, Secretario',
                agenda: 'Ejecución presupuestal\nProyecciones 2025\nAjustes necesarios',
                priority: 'urgente',
                status: 'programada'
            }
        ];

        sampleMeetings.forEach(data => {
            const meeting = new Meeting({
                ...data,
                createdBy: 'system',
                createdAt: getCurrentTimestamp()
            });
            this.meetings.set(meeting.id, meeting);
        });

        this.saveMeetings();
        console.log('📅 Reuniones de ejemplo creadas');
    }

    /**
     * Obtiene todas las reuniones
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<Array<Meeting>>}
     */
    async getAll(filters = {}) {
        const cacheKey = `meetings_all_${JSON.stringify(filters)}`;

        // Verificar caché
        if (this.isValidCache(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            let meetings = Array.from(this.meetings.values());

            // Aplicar filtros
            if (filters.status) {
                meetings = meetings.filter(m => m.status === filters.status);
            }

            if (filters.organizer) {
                meetings = meetings.filter(m => m.organizer === filters.organizer);
            }

            if (filters.dateFrom) {
                meetings = meetings.filter(m => m.date >= filters.dateFrom);
            }

            if (filters.dateTo) {
                meetings = meetings.filter(m => m.date <= filters.dateTo);
            }

            if (filters.priority) {
                meetings = meetings.filter(m => m.priority === filters.priority);
            }

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                meetings = meetings.filter(m =>
                    m.title.toLowerCase().includes(searchLower) ||
                    m.description.toLowerCase().includes(searchLower) ||
                    m.agenda.toLowerCase().includes(searchLower)
                );
            }

            // Ordenar por fecha y hora
            meetings = sortByProperty(meetings, 'date', false);
            meetings = meetings.sort((a, b) => {
                if (a.date === b.date) {
                    return a.startTime.localeCompare(b.startTime);
                }
                return 0;
            });

            // Guardar en caché
            this.setCache(cacheKey, meetings);

            return meetings;

        } catch (error) {
            console.error('Error al obtener reuniones:', error);
            throw error;
        }
    }

    /**
     * Obtiene una reunión por ID
     * @param {string} id - ID de la reunión
     * @returns {Promise<Meeting|null>}
     */
    async getById(id) {
        const cacheKey = `meeting_${id}`;

        if (this.isValidCache(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const meeting = this.meetings.get(id);
        if (meeting) {
            this.setCache(cacheKey, meeting);
        }

        return meeting || null;
    }

    /**
     * Crea una nueva reunión
     * @param {Object} data - Datos de la reunión
     * @returns {Promise<Meeting>}
     */
    async create(data) {
        try {
            // Crear instancia de reunión
            const meeting = new Meeting({
                ...data,
                createdBy: this.authService?.getCurrentUser()?.id || 'system',
                createdAt: getCurrentTimestamp()
            });

            // Validar datos
            const validation = meeting.validate();
            if (!validation.isValid) {
                throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
            }

            // Verificar conflictos de horario
            await this.checkConflicts(meeting);

            // Guardar reunión
            this.meetings.set(meeting.id, meeting);
            this.saveMeetings();

            // Log de auditoría
            this.logActivity(AUDIT_ACTIONS.CREATE_MEETING, `Reunión creada: ${meeting.title}`, meeting);

            console.log(`✅ Reunión creada: ${meeting.title}`);
            return meeting;

        } catch (error) {
            console.error('Error al crear reunión:', error);
            throw error;
        }
    }

    /**
     * Actualiza una reunión existente
     * @param {string} id - ID de la reunión
     * @param {Object} data - Nuevos datos
     * @returns {Promise<Meeting>}
     */
    async update(id, data) {
        try {
            const meeting = this.meetings.get(id);
            if (!meeting) {
                throw new Error('Reunión no encontrada');
            }

            // Verificar permisos
            if (!this.canModify(meeting)) {
                throw new Error('No tiene permisos para modificar esta reunión');
            }

            // Crear copia para validación
            const updatedMeeting = meeting.clone();
            updatedMeeting.update(data);

            // Validar datos actualizados
            const validation = updatedMeeting.validate();
            if (!validation.isValid) {
                throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
            }

            // Verificar conflictos si cambió fecha/hora
            if (data.date || data.startTime || data.endTime) {
                await this.checkConflicts(updatedMeeting, id);
            }

            // Aplicar cambios
            meeting.update(data);
            this.saveMeetings();

            // Log de auditoría
            this.logActivity(AUDIT_ACTIONS.EDIT_MEETING, `Reunión actualizada: ${meeting.title}`, meeting);

            console.log(`✅ Reunión actualizada: ${meeting.title}`);
            return meeting;

        } catch (error) {
            console.error('Error al actualizar reunión:', error);
            throw error;
        }
    }

    /**
     * Elimina una reunión
     * @param {string} id - ID de la reunión
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        try {
            const meeting = this.meetings.get(id);
            if (!meeting) {
                throw new Error('Reunión no encontrada');
            }

            // Verificar permisos
            if (!this.canModify(meeting)) {
                throw new Error('No tiene permisos para eliminar esta reunión');
            }

            // Eliminar reunión
            this.meetings.delete(id);
            this.saveMeetings();

            // Log de auditoría
            this.logActivity(AUDIT_ACTIONS.DELETE_MEETING, `Reunión eliminada: ${meeting.title}`, meeting);

            console.log(`🗑️ Reunión eliminada: ${meeting.title}`);
            return true;

        } catch (error) {
            console.error('Error al eliminar reunión:', error);
            throw error;
        }
    }

    /**
     * Cancela una reunión
     * @param {string} id - ID de la reunión
     * @param {string} reason - Razón de cancelación
     * @returns {Promise<Meeting>}
     */
    async cancel(id, reason = '') {
        try {
            const meeting = this.meetings.get(id);
            if (!meeting) {
                throw new Error('Reunión no encontrada');
            }

            // Verificar permisos
            if (!this.canModify(meeting)) {
                throw new Error('No tiene permisos para cancelar esta reunión');
            }

            // Cancelar reunión
            meeting.cancel(reason);
            this.saveMeetings();

            // Log de auditoría
            this.logActivity(AUDIT_ACTIONS.EDIT_MEETING, `Reunión cancelada: ${meeting.title}. Razón: ${reason}`, meeting);

            console.log(`❌ Reunión cancelada: ${meeting.title}`);
            return meeting;

        } catch (error) {
            console.error('Error al cancelar reunión:', error);
            throw error;
        }
    }

    /**
     * Verifica conflictos de horario
     * @param {Meeting} meeting - Reunión a verificar
     * @param {string} excludeId - ID a excluir de la verificación
     * @returns {Promise<void>}
     */
    async checkConflicts(meeting, excludeId = null) {
        const conflicts = [];
        const meetingStart = meeting.getStartDateTime();
        const meetingEnd = meeting.getEndDateTime();

        if (!meetingStart || !meetingEnd) {
            return; // No se puede verificar sin fechas válidas
        }

        for (const [id, existingMeeting] of this.meetings) {
            // Saltar la reunión actual en edición
            if (id === excludeId) continue;

            // Solo verificar reuniones programadas
            if (existingMeeting.status !== MEETING_STATUS.PROGRAMADA) continue;

            const existingStart = existingMeeting.getStartDateTime();
            const existingEnd = existingMeeting.getEndDateTime();

            if (!existingStart || !existingEnd) continue;

            // Verificar solapamiento
            if (meetingStart < existingEnd && meetingEnd > existingStart) {
                // Verificar si hay conflicto de ubicación o asistentes
                if (this.hasLocationConflict(meeting, existingMeeting) ||
                    this.hasAttendeeConflict(meeting, existingMeeting)) {
                    conflicts.push(existingMeeting);
                }
            }
        }

        if (conflicts.length > 0) {
            const conflictMessages = conflicts.map(c =>
                `"${c.title}" (${c.date} ${c.startTime}-${c.endTime})`
            );
            throw new Error(`Conflicto de horario detectado con: ${conflictMessages.join(', ')}`);
        }
    }

    /**
     * Verifica conflicto de ubicación
     * @param {Meeting} meeting1 
     * @param {Meeting} meeting2 
     * @returns {boolean}
     */
    hasLocationConflict(meeting1, meeting2) {
        // Si ambas son virtuales, no hay conflicto de ubicación
        if (meeting1.type === 'virtual' && meeting2.type === 'virtual') {
            return false;
        }

        // Si tienen el mismo tipo y ubicación física
        return meeting1.type === meeting2.type &&
            meeting1.location === meeting2.location;
    }

    /**
     * Verifica conflicto de asistentes
     * @param {Meeting} meeting1 
     * @param {Meeting} meeting2 
     * @returns {boolean}
     */
    hasAttendeeConflict(meeting1, meeting2) {
        const attendees1 = meeting1.getAttendeesList();
        const attendees2 = meeting2.getAttendeesList();

        // Verificar si hay asistentes en común
        return attendees1.some(attendee =>
            attendees2.some(other =>
                attendee.toLowerCase().trim() === other.toLowerCase().trim()
            )
        );
    }

    /**
     * Verifica si el usuario puede modificar una reunión
     * @param {Meeting} meeting 
     * @returns {boolean}
     */
    canModify(meeting) {
        const currentUser = this.authService?.getCurrentUser();
        if (!currentUser) return false;

        // Administradores pueden modificar cualquier reunión
        if (currentUser.isAdmin()) return true;

        // Organizadores pueden modificar sus propias reuniones
        if (meeting.organizer === currentUser.area) return true;

        // Creadores pueden modificar sus reuniones
        if (meeting.createdBy === currentUser.id) return true;

        return false;
    }

    /**
     * Obtiene reuniones por rango de fechas
     * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
     * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
     * @returns {Promise<Array<Meeting>>}
     */
    async getByDateRange(startDate, endDate) {
        return this.getAll({
            dateFrom: startDate,
            dateTo: endDate
        });
    }

    /**
     * Obtiene reuniones próximas
     * @param {number} days - Días hacia adelante
     * @returns {Promise<Array<Meeting>>}
     */
    async getUpcoming(days = 7) {
        const today = new Date();
        const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));

        return this.getByDateRange(
            today.toISOString().split('T')[0],
            futureDate.toISOString().split('T')[0]
        );
    }

    /**
     * Obtiene estadísticas de reuniones
     * @returns {Promise<Object>}
     */
    async getStats() {
        const meetings = await this.getAll();
        const now = new Date();

        return {
            total: meetings.length,
            programadas: meetings.filter(m => m.status === MEETING_STATUS.PROGRAMADA).length,
            finalizadas: meetings.filter(m => m.status === MEETING_STATUS.FINALIZADA).length,
            canceladas: meetings.filter(m => m.status === MEETING_STATUS.CANCELADA).length,
            proximasHoy: meetings.filter(m => {
                const meetingDate = new Date(m.date);
                return meetingDate.toDateString() === now.toDateString() &&
                    m.status === MEETING_STATUS.PROGRAMADA;
            }).length,
            porArea: this.getStatsByArea(meetings),
            porPrioridad: this.getStatsByPriority(meetings)
        };
    }

    /**
     * Obtiene estadísticas por área
     * @param {Array<Meeting>} meetings 
     * @returns {Object}
     */
    getStatsByArea(meetings) {
        const stats = {};
        meetings.forEach(meeting => {
            if (!stats[meeting.organizer]) {
                stats[meeting.organizer] = 0;
            }
            stats[meeting.organizer]++;
        });
        return stats;
    }

    /**
     * Obtiene estadísticas por prioridad
     * @param {Array<Meeting>} meetings 
     * @returns {Object}
     */
    getStatsByPriority(meetings) {
        const stats = {};
        meetings.forEach(meeting => {
            if (!stats[meeting.priority]) {
                stats[meeting.priority] = 0;
            }
            stats[meeting.priority]++;
        });
        return stats;
    }

    /**
     * Busca reuniones
     * @param {string} query - Término de búsqueda
     * @returns {Promise<Array<Meeting>>}
     */
    async search(query) {
        return this.getAll({ search: query });
    }

    /**
     * Verifica si una entrada de caché es válida
     * @param {string} key - Clave de caché
     * @returns {boolean}
     */
    isValidCache(key) {
        if (!this.cache.has(key)) return false;

        const expiry = this.cacheExpiry.get(key);
        if (!expiry || Date.now() > expiry) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Establece una entrada en caché
     * @param {string} key - Clave
     * @param {any} value - Valor
     * @param {number} ttl - Tiempo de vida en ms
     */
    setCache(key, value, ttl = config.CACHE.STRATEGIES.MEETINGS) {
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }

    /**
     * Limpia el caché
     */
    clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }

    /**
     * Registra actividad de auditoría
     * @param {string} action - Acción realizada
     * @param {string} description - Descripción
     * @param {Meeting} meeting - Reunión relacionada
     */
    logActivity(action, description, meeting = null) {
        if (this.authService) {
            this.authService.logActivity(action, description, null, meeting?.organizer);
        }
    }

    /**
     * Limpia reuniones antiguas
     * @param {number} days - Días de antigüedad
     * @returns {Promise<number>}
     */
    async cleanup(days = 90) {
        const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
        let cleanedCount = 0;

        for (const [id, meeting] of this.meetings) {
            const meetingDate = new Date(meeting.date);
            if (meetingDate < cutoffDate && meeting.status === MEETING_STATUS.FINALIZADA) {
                this.meetings.delete(id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.saveMeetings();
            console.log(`🧹 ${cleanedCount} reuniones antiguas eliminadas`);
        }

        return cleanedCount;
    }
}

export default MeetingService;