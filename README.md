# Sistema de Gestión de Reuniones

**Secretaría de Salud del Tolima**

Un sistema web moderno para la gestión, programación y seguimiento de reuniones institucionales.

[![Versión](https://img.shields.io/badge/versión-1.0.0-blue.svg)](https://github.com/saludtolima/meeting-management-system)
[![Licencia](https://img.shields.io/badge/licencia-MIT-green.svg)](LICENSE)
[![Estado](https://img.shields.io/badge/estado-producción-brightgreen.svg)]()

## 🚀 Características Principales

### 📅 Gestión de Reuniones
- **Creación intuitiva** de reuniones con formulario guiado
- **Múltiples tipos**: Presencial, Virtual, Oficina del Director, Despacho
- **Gestión de asistentes** internos y externos
- **Sistema de prioridades** (Baja, Media, Alta, Urgente)
- **Recordatorios automáticos** configurables

### 👥 Control de Usuarios
- **Autenticación segura** por área organizacional
- **Roles diferenciados**: Administrador, Director, Coordinador, Asistente
- **Permisos granulares** según el rol del usuario
- **Auditoría completa** de todas las acciones

### 📊 Reportes y Estadísticas
- **Dashboard ejecutivo** con métricas en tiempo real
- **Reportes personalizables** por período, área y estado
- **Gráficas interactivas** con Chart.js
- **Exportación** a PDF, Excel y CSV

### 📅 Calendario Integrado
- **Vista mensual, semanal y diaria**
- **Integración con Microsoft Outlook** (opcional)
- **Detección de conflictos** de horario
- **Navegación intuitiva** entre períodos

### 🔐 Seguridad y Auditoría
- **Log de auditoría** completo
- **Encriptación** de datos sensibles
- **Validación** de formularios del lado cliente y servidor
- **Control de sesiones** con timeout automático

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** semántico y accesible
- **CSS3** con variables personalizadas y Grid/Flexbox
- **JavaScript ES6+** modular con imports/exports
- **Chart.js** para visualización de datos
- **Font Awesome** para iconografía

### Arquitectura
- **Patrón MVC** con componentes reutilizables
- **Programación orientada a objetos**
- **LocalStorage** para persistencia (desarrollo)
- **Service Workers** para cache (próximamente)

### Herramientas de Desarrollo
- **ESLint** para calidad de código
- **Prettier** para formateo consistente
- **Jest** para testing unitario
- **Live Server** para desarrollo local
- **Scripts de construcción** personalizados

## 📦 Instalación y Configuración

### Requisitos Previos
- **Node.js** v16.0.0 o superior
- **npm** v8.0.0 o superior
- Navegador web moderno (Chrome 80+, Firefox 75+, Safari 13+)

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/saludtolima/meeting-management-system.git
cd meeting-management-system

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

El sistema estará disponible en `http://localhost:3000`

### Compilación para Producción

```bash
# Construir para producción
npm run build

# Servir archivos estáticos
npm run serve
```

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env` basado en `.env.example`:

```env
# Configuración de desarrollo
NODE_ENV=development
API_BASE_URL=http://localhost:3001/api
DEBUG=true

# Configuración de base de datos (futuro)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meeting_management

# Configuración de Microsoft Graph (opcional)
AZURE_CLIENT_ID=tu_client_id
AZURE_CLIENT_SECRET=tu_client_secret
AZURE_TENANT_ID=tu_tenant_id

# Configuración de email (futuro)
SMTP_HOST=smtp.saludtolima.gov.co
SMTP_PORT=587
SMTP_USER=sistema@saludtolima.gov.co
```

### Usuarios Predeterminados

En desarrollo, el sistema incluye usuarios de prueba:

| Email | Contraseña | Rol | Área |
|-------|------------|-----|------|
| `secretario@saludtolima.gov.co` | `admin123` | Administrador | Despacho |
| `admin@saludtolima.gov.co` | `admin123` | Director | Dir. Administrativa |
| `salud.publica@saludtolima.gov.co` | `salud123` | Director | Dir. Salud Pública |

## 🚀 Uso del Sistema

### Inicio de Sesión
1. Acceder a la URL del sistema
2. Ingresar email institucional y contraseña
3. Seleccionar área organizacional
4. Hacer clic en "Iniciar Sesión"

### Crear una Reunión
1. Navegar a "Reuniones" → "Nueva Reunión"
2. Completar información básica (título, descripción, tipo)
3. Configurar fecha, hora y ubicación
4. Agregar asistentes internos y externos
5. Incluir agenda y notas adicionales
6. Configurar recordatorios
7. Guardar o enviar invitaciones

### Generar Reportes
1. Ir a la sección "Reportes"
2. Configurar filtros (fechas, área, estado, prioridad)
3. Aplicar filtros y revisar estadísticas
4. Exportar en el formato deseado (PDF, Excel, CSV)

## 📁 Estructura del Proyecto

```
meeting-management-system/
├── public/                 # Archivos públicos
│   ├── css/               # Hojas de estilo
│   ├── js/                # JavaScript principal
│   ├── assets/            # Recursos estáticos
│   └── index.html         # Página principal
├── src/                   # Código fuente
│   ├── components/        # Componentes reutilizables
│   ├── models/           # Modelos de datos
│   ├── services/         # Servicios de negocio
│   ├── utils/            # Utilidades y helpers
│   └── config/           # Configuraciones
├── scripts/              # Scripts de construcción
├── tests/                # Pruebas unitarias
├── docs/                 # Documentación
└── dist/                 # Archivos compilados
```

### Componentes Principales

#### Modelos (`src/models/`)
- **User.js**: Gestión de usuarios y permisos
- **Meeting.js**: Lógica de reuniones y validaciones
- **AuditLog.js**: Registro de auditoría

#### Servicios (`src/services/`)
- **AuthService.js**: Autenticación y autorización
- **MeetingService.js**: CRUD de reuniones
- **NotificationService.js**: Sistema de notificaciones
- **OutlookService.js**: Integración con Microsoft Graph

#### Componentes UI (`src/components/`)
- **Dashboard.js**: Panel principal con estadísticas
- **MeetingForm.js**: Formulario de creación/edición
- **Calendar.js**: Vista de calendario
- **Reports.js**: Generación de reportes
- **Navigation.js**: Menú de navegación

## 🧪 Testing

### Ejecutar Pruebas

```bash
# Pruebas unitarias
npm test

# Pruebas con cobertura
npm run test:coverage

# Pruebas en modo watch
npm run test:watch

# Pruebas end-to-end (próximamente)
npm run test:e2e
```

### Estructura de Pruebas

```javascript
// Ejemplo de prueba unitaria
describe('Meeting Model', () => {
  test('should validate required fields', () => {
    const meeting = new Meeting({});
    const validation = meeting.validate();
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('El título es requerido');
  });
});
```

## 🔒 Seguridad

### Medidas Implementadas
- **Validación de entrada** tanto cliente como servidor
- **Sanitización** de datos HTML
- **Control de sesiones** con timeout automático
- **Auditoría completa** de acciones sensibles
- **Encriptación** de contraseñas (bcrypt en producción)

### Recomendaciones de Despliegue
- Usar HTTPS en producción
- Configurar CSP (Content Security Policy)
- Implementar rate limiting
- Configurar headers de seguridad
- Realizar backups regulares

## 🚀 Despliegue en Producción

### Servidor Web

```bash
# Construir para producción
npm run build:prod

# Los archivos están listos en ./dist/
# Servir con nginx, Apache, o servidor estático
```

### Nginx (Ejemplo de Configuración)

```nginx
server {
    listen 80;
    server_name reuniones.saludtolima.gov.co;
    
    root /var/www/meeting-system/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Docker (Opcional)

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contribución

### Flujo de Trabajo
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código
- Seguir las reglas de ESLint configuradas
- Usar Prettier para formateo consistente
- Escribir pruebas para nueva funcionalidad
- Documentar funciones y componentes importantes
- Usar commits semánticos (feat, fix, docs, etc.)

### Reportar Bugs
Usar el [sistema de issues](https://github.com/saludtolima/meeting-management-system/issues) con:
- Descripción clara del problema
- Pasos para reproducir
- Capturas de pantalla si aplica
- Información del navegador/sistema

## 📚 Documentación Adicional

### Guías Técnicas
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Setup Guide](docs/SETUP.md)

### Arquitectura
- [Componentes](docs/components.md)
- [Servicios](docs/services.md)
- [Modelos de Datos](docs/models.md)

## 🆕 Roadmap

### v1.1.0 (Próximo)
- [ ] Integración completa con Microsoft Graph
- [ ] Notificaciones push del navegador
- [ ] Modo offline con Service Workers
- [ ] Importación/exportación masiva de reuniones

### v1.2.0 (Futuro)
- [ ] API REST completa
- [ ] Aplicación móvil (PWA)
- [ ] Integración con Google Calendar
- [ ] Plantillas de reuniones predefinidas
- [ ] Sistema de votaciones en reuniones

### v2.0.0 (Largo Plazo)
- [ ] Videollamadas integradas
- [ ] IA para sugerencias de horarios
- [ ] Analytics avanzados
- [ ] Multi-tenencia

## 📞 Soporte

### Contacto Técnico
- **Email**: proyectosSST@outlook.com
- **Teléfono**: +57 304 652 4356
- **Horario**: Lunes a Viernes, 8:00 AM - 4:00 PM

### Enlaces Útiles
- [Manual de Usuario](docs/user-manual.pdf)
- [FAQ](docs/FAQ.md)
- [Videos Tutoriales](https://videos.saludtolima.gov.co/reuniones)

## 📄 Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE).

---

**Desarrollado con ❤️ para la Secretaría de Salud del Tolima**

*Sistema de Gestión de Reuniones v1.0.0*