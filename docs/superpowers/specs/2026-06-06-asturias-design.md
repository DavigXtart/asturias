# Diseño — App del viaje a Asturias (casa rural)

**Fecha:** 2026-06-06
**Estado:** Aprobado (pendiente de revisión final del usuario)

## 1. Resumen

Aplicación web **mobile-first** (100% responsive) para organizar un viaje de ~21 amigos
a una casa rural en Asturias (10–17 de julio de 2026). Cada persona se incorpora los días
que puede. La app cubre cuatro áreas:

1. **Registro / asistencia** — quién va, desde dónde y qué días.
2. **Coches** — organización de trayectos de ida y vuelta (carpooling).
3. **Disfraces** — sorteo aleatorio de parejas con animación y privacidad.
4. **Distribución** — reparto de personas en habitaciones por día, sobre un plano de la casa.

Es además un proyecto para **aprender Spring Boot**.

## 2. Arquitectura

Tres capas separadas, desplegadas en Render + Supabase:

```
[ React + Vite + Tailwind ]  →  [ Spring Boot REST API ]  →  [ Supabase Postgres ]
   Render Static Site            Render Web Service            (vía JDBC)
```

- **Frontend:** React + Vite + Tailwind. Mobile-first. Animaciones (Framer Motion para
  el sorteo) y arrastrar-soltar móvil (dnd-kit) para habitaciones. Desplegado como
  *Static Site* en Render.
- **Backend:** Spring Boot (Java), API REST. Contiene toda la lógica (sorteo, validaciones,
  PIN admin). Desplegado como *Web Service* en Render.
- **BBDD:** Supabase usado **solo como Postgres** (conexión JDBC desde Spring Boot). No se
  usan Auth ni Realtime de Supabase.

### Identidad y permisos

- **Sin contraseñas.** El admin precarga la lista de ~21 nombres; cada persona elige el suyo.
- Se recuerda en `localStorage` qué `guest` eres (para no re-elegir cada vez).
- Si un nombre nunca se reclama, no pasa nada: no cuenta en sorteo, coches ni habitaciones.
- **Admin = solo el organizador**, identificado por un **PIN** que solo él conoce. Los
  endpoints protegidos exigen ese PIN (cabecera/token, validado en el backend; sin él → 403).
- **Acciones de admin:** configurar fechas del viaje, precargar nombres/ciudades/habitaciones,
  ajustar nº de camas, lanzar/relanzar el sorteo, mover/quitar gente de coches, ver todas las
  parejas del sorteo.
- **Acciones de cualquiera:** registrarse y editar sus datos, crear/unirse/salir de coches,
  revelar su pareja del sorteo, mover personas entre habitaciones.

### Tiempo real

No se usa websockets. La pantalla de **habitaciones** hace **polling cada 5 s** en segundo
plano para reflejar los cambios de otros.

## 3. Modelo de datos (Postgres)

| Tabla | Campos clave | Notas |
|---|---|---|
| `app_config` | `trip_start` (2026-07-10), `trip_end` (2026-07-17), `admin_pin_hash` | Fila única. Fechas configurables. PIN hasheado. |
| `cities` | `id`, `name` | Lista precargada por el admin. |
| `guests` | `id`, `full_name`, `city_id` (FK→cities, nullable), `city_other` (text, nullable), `arrival_date`, `departure_date`, `can_drive` (bool), `is_registered` (bool) | Nombre precargado por admin; el resto se rellena al registrarse. |
| `car_legs` | `id`, `driver_guest_id` (FK→guests), `direction` (`IDA`/`VUELTA`), `travel_date`, `place` (origen en ida / destino en vuelta), `passenger_seats` (int) | Un trayecto, en un sentido y un día. `passenger_seats` NO incluye al conductor. |
| `car_passengers` | `car_leg_id` (FK), `guest_id` (FK) | PK compuesta. Un guest no puede repetirse en la misma `direction`. |
| `costume_draw` | `id`, `status` (`OPEN`/`DONE`), `created_at` | El sorteo activo. Relanzar crea uno nuevo que reemplaza al anterior. |
| `costume_pairs` | `id`, `draw_id` (FK), `group_index`, `ball_color` | Cada pareja/trío con su color de bola. |
| `costume_pair_members` | `pair_id` (FK), `guest_id` (FK) | 2 miembros (o 3 si el grupo es impar). |
| `rooms` | `id`, `name`, `floor` (`PLANTA_1`/`PLANTA_2`/`PLANTA_3`/`HORREO`), `bed_count` (int), `position` | Habitaciones fijas. `bed_count` global y editable por admin. |
| `room_assignments` | `id`, `day` (date), `guest_id` (FK), `room_id` (FK) | Distribución **por día**. Único por `(day, guest_id)`. |

### Supuestos confirmados

- `passenger_seats` = plazas para pasajeros (sin contar al conductor).
- `bed_count` es propiedad global de la habitación (no varía por día).
- Las habitaciones las puede editar (mover gente) **cualquiera**; crearlas/configurarlas y
  ajustar camas, **solo admin**.

## 4. Funcionalidades

### 4.1 Registro / asistencia

- Pantalla inicial: lista de **nombres precargados**; eliges el tuyo (los no reclamados se
  muestran como "sin confirmar").
- Formulario: **ciudad** (desplegable de `cities` + opción "otro" → `city_other`),
  **día de llegada** y **día de salida** (dentro del 10–17 jul, llegada ≤ salida),
  **¿puedes llevar coche?** (sí/no).
- Al guardar → `is_registered = true`; se recuerda el `guest` en `localStorage`. Editable
  después.
- **Vista de asistencia:** timeline de los 8 días con una barra por persona (quién está cada día).

### 4.2 Coches

- Dos secciones independientes: **IDA** y **VUELTA**.
- Un trayecto muestra: conductor, **día**, **lugar** (origen en ida / destino en vuelta),
  plazas y pasajeros apuntados con los **huecos libres**.
- **Cualquiera** puede **crear un coche** (dirección, día, lugar, nº de plazas) y
  **apuntarse/salirse** de uno con hueco. Una persona solo puede ir en un coche por dirección.
- Lista de **gente sin coche** por dirección.
- **Admin:** mover/quitar gente y borrar coches.

### 4.3 Sorteo de disfraces

- **Admin** (con PIN): botón **"Hacer sorteo"** cuando ya está todo el mundo registrado.
- **Algoritmo (backend):** toma los `guests` registrados, los baraja, forma **parejas
  aleatorias**; si el número es impar, **un trío**. Asigna a cada pareja un **color de bola**.
  Persiste `costume_draw` (DONE) + `costume_pairs` + `costume_pair_members`.
- **Cada usuario:** en su sección ve **su bola** y un botón **"revelar"** → animación de bolas
  moviéndose y la suya **juntándose con la de su pareja**, revelando nombre(s).
- **Privacidad:** la API solo devuelve a cada persona **su** pareja; las demás nunca salen del
  backend. El admin puede ver todas.
- El admin puede **relanzar** el sorteo (rehace todo, reemplaza el anterior).

### 4.4 Distribución de habitaciones

- Vista **vistosa de la casa**: 3 plantas + hórreo, con las habitaciones dibujadas y su nº de
  camas.
- **Selector de día** (10–17 jul). Al elegir día: las personas presentes ese día
  (`arrival_date ≤ día ≤ departure_date`) sin asignar aparecen en una **bandeja**; las
  asignadas, en sus habitaciones.
- **Arrastrar y soltar** (móvil) personas a habitaciones. **Aviso** (no bloqueo) si se superan
  las camas.
- **Polling cada 5 s** para ver cambios de otros. **Cada día guarda su propia distribución.**
- **Cualquiera** mueve gente; **admin** configura habitaciones y ajusta camas (+/–).

## 5. Manejo de errores y casos límite

- **Validación en el backend** (frontera): fechas dentro de rango (llegada ≤ salida), campos
  obligatorios, etc. Mensajes claros en español.
- **Concurrencia coches:** el servidor comprueba hueco antes de apuntar; si dos pulsan a la vez,
  el segundo recibe "coche lleno". Sin duplicados por dirección.
- **Concurrencia habitaciones:** asignación por `(día, persona)`, **última escritura gana**; el
  polling reconcilia. Aviso (no bloqueo) al superar camas.
- **Acciones admin:** endpoints protegidos exigen PIN; sin él → 403.
- **Sorteo:** la API filtra para que cada persona solo reciba su pareja.

## 6. Testing (TDD)

- **Backend (JUnit + Spring Boot Test):**
  - Unitarios del **algoritmo del sorteo**: empareja a todos, impar→trío, aleatoriedad,
    nadie se repite, filtro de privacidad.
  - Unitarios de **plazas de coche** y **asignación por día**.
  - Integración de los endpoints REST con Postgres de test (**Testcontainers**).
- **Frontend (Vitest + React Testing Library):** componentes y flujos clave (registro,
  apuntarse a coche, revelar pareja, mover a habitación).

## 7. Despliegue

- **Supabase:** proyecto Postgres → cadena de conexión. Migraciones con **Flyway** (esquema +
  datos semilla iniciales).
- **Spring Boot:** *Web Service* en Render (Docker o Java nativo); variables de entorno para URL
  de BBDD y PIN admin. **CORS** para el dominio del front.
- **React:** *Static Site* en Render; build con Vite y variable de entorno con la URL de la API.
- **Aviso plan gratis Render:** los servicios inactivos se duermen → la primera carga puede
  tardar ~30 s. Mitigable con un ping periódico o asumible para uso entre amigos.

## 8. Fuera de alcance (YAGNI)

- Login real con email/contraseña, OAuth o Supabase Auth.
- Tiempo real con websockets (se usa polling de 5 s donde hace falta).
- Notificaciones push, emails, app nativa.
- Gestión de gastos, comida, actividades u otras áreas no mencionadas.
- Huecos en la estancia (la asistencia es un rango continuo llegada→salida).

## 9. Datos pendientes de aportar por el usuario

- Lista de los ~21 nombres.
- Lista de ciudades habituales del grupo.
- Habitaciones reales: nombre, planta (incl. hórreo) y nº de camas de cada una.
