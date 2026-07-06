# Notificaciones — BP Security

Se utiliza Firebase Cloud Messaging (FCM) únicamente para notificaciones push. No se usa Firebase Authentication, Firestore ni Realtime Database — toda la información se almacena en PostgreSQL.

## Eventos que deben notificar

- Se active un botón de pánico.
- Se publique un reporte.
- Se envíe un mensaje en el chat.
- Se comparta una ubicación.
- Una solicitud sea aceptada.
- Una solicitud sea rechazada.

## Pendiente de definir en planificación

- Estrategia eficiente de envío (throttling, agrupación de notificaciones, prioridad de canal para botón de pánico vs. resto).
- Alcance de cada notificación (a quién llega: solo líder, toda la comunidad, administrador, etc.) por cada evento.
