# Documento de Arquitectura de Software (SAD)
## Proyecto: GeoSentinel
**Versión:** 0.9.1
**Autor:** Julián Alva
**Fecha:** Abril 2026

---

## 1. Introducción

### 1.1 Propósito
Este documento describe la arquitectura de software del sistema **GeoSentinel**, proporcionando una visión integral de las decisiones arquitectónicas.

### 1.2 Alcance
GeoSentinel es una plataforma cliente-servidor orientada a la seguridad en expediciones. El sistema incluye una aplicación móvil multiplataforma para el excursionista y una API en la nube que procesa la telemetría, aplica reglas de negocio espaciales y gestiona temporizadores de emergencia.

---

## 2. Representación Arquitectónica

El sistema utiliza un estilo arquitectónico **Cliente-Servidor de N Capas** con soporte para comunicación asíncrona bidireccional.

* **Patrón de Comunicación principal:** API RESTful (solicitudes de estado, inicio de viaje).
* **Patrón de Comunicación en Tiempo Real:** WebSockets (emisión de alertas instantáneas y tracking en vivo).
* **Patrón de Estado Móvil:** Offline-First (Priorización de caché local antes de sincronizar con el servidor).

---

## 3. Pila Tecnológica (Tech Stack)

### 3.1 Frontend Móvil / Web (El Cliente)
* **Framework:** Flutter (Dart).
* **Gestión de Estado:** BLoC.
* **Persistencia Local (Offline):** Isar Database.
* **Mapas:** `flutter_map` (Leaflet para Flutter) para visualización táctica.

### 3.2 Backend (La API)
* **Entorno de Ejecución:** Node.js.
* **Framework:** Express.js.
* **Tiempo Real:** Socket.io.
* **Tareas en Segundo Plano:** BullMQ (Respaldado por Redis).

### 3.3 Persistencia y Base de Datos (El Almacén)
* **Base de Datos Principal:** PostgreSQL alojado en Supabase.
* **Extensión Espacial:** PostGIS.
* **Caché:** Redis.

---

## 4. Vista Lógica (Capas del Sistema)

### 4.1 Capa de Presentación (Flutter)
Contiene la Interfaz de Usuario (UI). Se divide en:
* `RescueDashboardView`: Vista web/tablet para el monitor de la agencia.
* `ExpeditionView`: Vista móvil con el botón "Hito/Pánico" para el usuario en campo.

### 4.2 Capa de Dominio / Negocio (Node.js)
El corazón de GeoSentinel. Implementa los Casos de Uso:
* `SyncEngineService`: Recibe un lote de *checkpoints*, los ordena por el *timestamp* local del dispositivo y los inserta en BD resolviendo colisiones.
* `GeofencingService`: Valida la coordenada entrante de PostGIS para saber si el usuario está fuera de la ruta.
* `AlertManager`: Despacha notificaciones de emergencia al WebSocket.

### 4.3 Capa de Acceso a Datos
Interfaces que abstraen las sentencias SQL y se comunican con Supabase a través del SDK o mediante queries directos.

---

## 5. Diseño de Datos (Modelo Entidad-Relación Base)

| Entidad         | Descripción                 | Campos Críticos                                                                                   |
| :-------------- | :-------------------------- | :------------------------------------------------------------------------------------------------ |
| **Users**       | Usuarios del sistema.       | `id` (UUID), `name`, `role` (explorer, monitor).                                                  |
| **Expeditions** | Representa un viaje activo. | `id`, `user_id`, `expected_end_time` (Timestamp), `status` (active, delayed, critical, finished). |
| **Checkpoints** | Registros geolocalizados.   | `id`, `expedition_id`, `geom` (Point Geometría PostGIS), `device_timestamp`, `is_panic_button`.   |

---

## 6. Metas y Atributos de Calidad

1.  **Resiliencia Offline:** La app Flutter debe ser capaz de almacenar hasta 50 *checkpoints* locales si el dispositivo pierde la señal, y enviarlos automáticamente en un "batch request" al servidor una vez que recupere la red.
2.  **Seguridad (Privacy by Design):** Los datos geográficos precisos de los excursionistas deben anonimizarse o eliminarse tras un TTL (Time To Live) de 24 horas tras finalizar el viaje, cumpliendo lineamientos GDPR y los requerimientos de la matriz OhtliAni.
3.  **Observabilidad:** El backend debe exponer *logs* claros cada vez que el "Worker" de tiempos máximos entra en acción o cuando un dispositivo se desconecta.

---

## 7. Flujo de Secuencia Clave: El "Dead Man's Switch"

1.  El Excursionista (Flutter) inicia una ruta e indica que llegará en 2 horas.
2.  La App Móvil hace un `POST /api/expedition/start` a Node.js.
3.  Node.js guarda la expedición en PostgreSQL y programa una tarea diferida (Worker/Cron) para exactamente 2 horas y 1 minuto en el futuro.
4.  El excursionista pierde señal y no puede reportar su fin de viaje.
5.  Pasan 2 horas. El servidor Node.js ejecuta el Worker. Verifica en la BD si la expedición tiene estatus "finished".
6.  Como no está finalizada, Node.js cambia el estatus a "CRÍTICO" y emite un evento `EMERGENCY_ALERT` vía WebSockets.
7.  El Rescue Dashboard (Flutter Web) recibe el WebSocket y muestra la alerta.
