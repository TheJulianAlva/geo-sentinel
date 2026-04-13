# GeoSentinel

GeoSentinel es una plataforma web y API móvil diseñada para proporcionar seguridad a excursionistas y agilizar las operaciones de las agencias de rescate y monitoreo. A través del registro de hitos, temporizadores de seguridad y un panel de control en tiempo real, GeoSentinel busca optimizar los tiempos de respuesta ante emergencias.

## Características Principales

- **Checkpoint Digital:** Registro asíncrono de ubicaciones y eventos con soporte offline (Cobertura Operacional Offline) y validación de desvíos de ruta mediante *Geofencing*.
- **Dead Man's Switch:** Temporizadores de seguridad manejados por el servidor que emiten alertas automáticas si un excursionista no reporta el fin de su expedición dentro del Tiempo Máximo Estimado (TME).
- **Rescue Dashboard:** Panel web táctico en tiempo real para agentes de rescate, alimentado por WebSockets para una notificación y visualización instantánea de alertas en el mapa.

## 🏗️ Arquitectura y Stack Tecnológico

El sistema opera bajo una arquitectura cliente-servidor:
- **Cliente Móvil:** Interfaz rápida de bajo consumo para excursionistas, diseñada para requerir la mínima interacción y tolerar la conectividad intermitente.
- **Backend (API):** Servidor centralizado responsable de la lógica de negocio, validaciones geoespaciales y gestión de *workers* para los temporizadores.
- **Frontend (Dashboard):** Cliente web optimizado con vista de mapa y bitácora de eventos, priorizando la baja latencia.

### Tecnologías Clave

- **Base de Datos:** PostgreSQL 14+ con la extensión **PostGIS** para cálculos y requerimientos espaciales.
- **Caché y Colas de Tareas:** **Redis** para la ejecución de procesos en segundo plano.
- **Tiempo Real:** **WebSockets** para enviar datos y alertas instantáneas al panel de rescate.

## Privacidad y Seguridad

Priorizamos la privacidad del usuario: las ubicaciones exactas de los excursionistas son purgadas del sistema (eliminación operativa) 24 horas después de haber concluido exitosamente una expedición, conservando únicamente datos estadísticos y metadatos no sensibles.

## Roles de Usuario

1. **Excursionista:** Establece parámetros iniciales (ej. TME), interactúa de manera rápida mediante interacciones simples como presionar un botón durante la ruta.
2. **Agente de Rescate:** Usuario administrador del Dashboard, recibe notificaciones libres de ruido visual y de fácil interpretación para accionar un rescate si es necesario.

## Desarrollo y Configuración Local

*(Instrucciones en construcción dependientes del entorno de programación específico)*

### Prerrequisitos
- Instalar PostgreSQL (versión >= 14) y habilitar su extensión PostGIS.
- Instalar y ejecutar el servidor Redis.

---

**Autor:** Julián Alva  
**Versión Inicial:** 1.0 (MVP)
