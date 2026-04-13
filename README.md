# GeoSentinel

GeoSentinel es una plataforma web y API móvil diseñada para proporcionar seguridad a excursionistas y agilizar las operaciones de las agencias de rescate y monitoreo. A través del registro de hitos, temporizadores de seguridad y un panel de control en tiempo real, GeoSentinel busca optimizar los tiempos de respuesta ante emergencias.

## Características Principales

- **Checkpoint Digital:** Registro asíncrono de ubicaciones y eventos con soporte offline (Cobertura Operacional Offline) y validación de desvíos de ruta mediante *Geofencing*.
- **Dead Man's Switch:** Temporizadores de seguridad manejados por el servidor que emiten alertas automáticas si un excursionista no reporta el fin de su expedición dentro del Tiempo Máximo Estimado (TME).
- **Rescue Dashboard:** Panel web táctico en tiempo real para agentes de rescate, alimentado por WebSockets para una notificación y visualización instantánea de alertas en el mapa.

## Arquitectura y Stack Tecnológico

El sistema opera bajo una arquitectura **Cliente-Servidor de N Capas**, adoptando una estrategia *Offline-First* y comunicación asíncrona bidireccional. 

- **Capa de Presentación:** Controlada por interfaces separadas de acuerdo al rol de usuario.
- **Capa de Dominio (Node.js):** Centraliza la lógica de negocio a través de servicios como sincronización de estado, validaciones de rutas y la gestión de alertas de emergencias.
- **Capa de Gestión de Datos:** Provee interfaces a la base de datos PostgreSQL/PostGIS.

### Tecnologías Clave

- **Frontend (Móvil y Web):** Construido con **Flutter** (con el lenguaje Dart). Se apoya en **BLoC** para el aislamiento del estado, **Isar Database** para conservar localmente los registros ('checkpoints') como estrategia *Offline*, y **`flutter_map`** para la visualización geoespacial.
- **Backend (API Central):** App **Node.js** implementada sobre **Express.js**. Maneja alertas de tiempo real usando **Socket.io** y procesa el temporizador de emergencias ("Dead Man's Switch") a través de **BullMQ**.
- **Almacén Principal:** **PostgreSQL** alojado bajo el ecosistema de **Supabase**, nutriéndose explícitamente de la funcionalidad y precisión que provee el motor **PostGIS**.
- **Caché y Memoria Rápida:** Servidores **Redis** de respaldo para las colas en segundo plano.

## Privacidad y Seguridad

Priorizamos la privacidad del usuario: las ubicaciones exactas de los excursionistas son purgadas del sistema (eliminación operativa) 24 horas después de haber concluido exitosamente una expedición, conservando únicamente datos estadísticos y metadatos no sensibles.

## Roles de Usuario

1. **Excursionista:** Establece parámetros iniciales, interactúa de manera rápida mediante interacciones simples como presionar un botón durante la ruta.
2. **Agente de Rescate:** Usuario administrador del Dashboard, recibe notificaciones libres de ruido visual y de fácil interpretación para accionar un rescate si es necesario.

## Desarrollo y Configuración Local

*(Instrucciones de instalación sujetas a cada componente de la plataforma)*

### Prerrequisitos Comunes
- Instalar el **SDK de Flutter** para inicializar los clientes.
- Disponer del runtime **Node.js**.
- Acceso a una base de datos **PostgreSQL** con la extensión **PostGIS** (se recomienda usar **Supabase** según el estándar del proyecto).
- Instalar y ejecutar el gestor de caché temporal **Redis**.

---

**Autor:** Julián Alva  
**Versión Inicial:** 0.9.1
