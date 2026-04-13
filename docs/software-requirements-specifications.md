# Software Requirements Specification
## Proyecto: GeoSentinel
**Versión:** 0.9.1
**Autor:** Julián Alva
**Fecha:** Abril 2026

---

## 1. Introducción

### 1.1 Propósito
El propósito de este documento es definir las especificaciones de software para el sistema "GeoSentinel". Este sistema servirá como un Producto Mínimo Viable (MVP).

### 1.2 Alcance del Proyecto
"GeoSentinel" es una plataforma web y API móvil diseñada para excursionistas y agencias de monitoreo. Permite a los usuarios registrar hitos ("Checkpoints") durante una ruta, alertar automáticamente en caso de inactividad prolongada ("Dead Man's Switch") y proveer un panel táctico en tiempo real para el equipo de rescate.

### 1.3 Definiciones, Acrónimos y Abreviaturas
* **API:** Application Programming Interface.
* **COO:** Cobertura Operacional Offline (Capacidad de sincronizar datos tras perder conexión).
* **Geofencing:** Perímetro geográfico virtual.
* **PostGIS:** Extensión espacial para la base de datos PostgreSQL.
* **WebSocket:** Protocolo de comunicación bidireccional en tiempo real.
* **Worker:** Proceso en segundo plano del servidor.

---

## 2. Descripción General

### 2.1 Perspectiva del Producto
El sistema opera bajo una arquitectura cliente-servidor.
1.  **Cliente Móvil:** Dispositivo del excursionista que envía coordenadas y fotos.
2.  **Backend (API):** Servidor central que procesa la lógica de negocio, reglas espaciales y temporizadores.
3.  **Frontend (Rescue Dashboard):** Aplicación web consumida por el monitor/agente para ver el mapa en tiempo real.

### 2.2 Funciones del Producto
* Registro de ubicación y eventos con soporte de marcas de tiempo (timestamps) asíncronas.
* Validación de perímetros geográficos (Geofencing).
* Ejecución de temporizadores de seguridad en el servidor.
* Transmisión de eventos de emergencia en tiempo real hacia paneles de control.

### 2.3 Características de los Usuarios
* **Excursionista (Usuario):** Requiere interacciones mínimas y rápidas (ej. presionar un botón). Conectividad intermitente.
* **Agente de Rescate (Administrador):** Requiere baja latencia en la recepción de alertas, interfaz clara y libre de ruido visual.

---

## 3. Requerimientos Específicos

### 3.1 Módulo 1: "Checkpoint Digital" (Registro y Geofencing)
**Descripción:** Permite al excursionista enviar su ubicación actual y un estado para registrar su progreso en la ruta.
* **REQ-1.1:** El sistema debe exponer un endpoint `POST /api/checkpoints` que acepte latitud, longitud, timestamp local del dispositivo, ID de usuario y mensaje.
* **REQ-1.2:** El backend debe utilizar PostGIS para calcular si la coordenada recibida se encuentra dentro de un radio de 500 metros de la ruta planificada.
* **REQ-1.3 (Simulación COO):** Si el payload incluye un array de eventos pasados (offline), el sistema debe insertarlos cronológicamente basándose en el timestamp original, no en el momento de recepción.

### 3.2 Módulo 2: "Dead Man's Switch" (Lógica de Seguridad)
**Descripción:** Un temporizador de cuenta regresiva gestionado por el servidor que dispara una alerta si el excursionista no se reporta a tiempo.
* **REQ-2.1:** El usuario debe poder iniciar una expedición definiendo un Tiempo Máximo Estimado.
* **REQ-2.2:** El backend debe registrar un "Worker" programado para ejecutarse al cumplirse el TME.
* **REQ-2.3:** Si el excursionista no envía un Checkpoint de "Fin de Ruta" antes del TME, el Worker debe cambiar el estado de la expedición a "CRÍTICO" y emitir un evento de emergencia.

### 3.3 Módulo 3: "Rescue Dashboard" (Monitoreo en Tiempo Real)
**Descripción:** Interfaz táctica para el agente de rescate.
* **REQ-3.1:** El cliente web debe mantener una conexión persistente con el servidor vía WebSockets.
* **REQ-3.2:** Cuando un usuario envíe un nuevo Checkpoint, el servidor debe emitir el evento a todos los clientes web conectados instantáneamente.
* **REQ-3.3:** Cuando el "Dead Man's Switch" se active, el servidor debe emitir un evento que dispare una notificación visual y sonora en el Dashboard.

---

## 4. Requerimientos de Interfaz Externa

### 4.1 Interfaces de Usuario (UI)
* **Dashboard Web:** Debe incluir un mapa interactivo ocupando el 70% de la pantalla, y un panel lateral (30%) con la bitácora de eventos y alertas.

### 4.2 Interfaces de Software
* **Base de Datos:** PostgreSQL version 14+ con extensión PostGIS habilitada.
* **Caché / Colas:** Redis.

---

## 5. Requerimientos No Funcionales

### 5.1 Rendimiento
* El endpoint de Checkpoints debe responder en menos de 200ms para asegurar un rápido desahogo de peticiones de los dispositivos móviles.
* La latencia del WebSocket desde que se detecta la emergencia hasta que llega al Dashboard no debe superar los 500ms.

### 5.2 Seguridad y Privacidad
* **REQ-SEC-1:** Las ubicaciones exactas de los excursionistas deben eliminarse de la base de datos operativa (Soft-delete o Hard-delete) 24 horas después de finalizada la expedición con éxito, conservando solo metadatos estadísticos.

### 5.3 Resiliencia
* Si el servicio de WebSockets cae, el Rescue Dashboard debe intentar reconectarse automáticamente con una estrategia de "Exponential Backoff".
