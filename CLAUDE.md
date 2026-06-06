# Asturias 2026 - Trip Planning App

## Project Overview
App para organizar un viaje grupal a Asturias en julio 2026. Backend REST API con Spring Boot + frontend SPA con React/Vite. Diseño mobile-first, tema oscuro con glassmorphism.

## Tech Stack

### Backend
- **Java 21** + **Spring Boot 3.3.4**
- **PostgreSQL** (Supabase) con Hibernate `ddl-auto: update` (sin Flyway)
- **Spring Data JPA** para persistencia
- **BCrypt** para hash del PIN de admin
- Puerto: 8080 (configurable via `PORT`)

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4** (tema oscuro custom: surface-*, brand-*, accent-*, glass-border)
- **TanStack React Query** para data fetching y cache
- **Framer Motion** para animaciones
- **@dnd-kit** para drag & drop (habitaciones)
- **Axios** con interceptors para headers `X-Guest-Id` y `X-Admin-Pin`

## Architecture

```
backend/src/main/java/com/asturias2026/
├── car/          # Coches: tramos IDA/VUELTA, pasajeros
├── city/         # Ciudades de origen
├── config_/      # Configuración del viaje (fechas, PIN admin)
├── costume/      # Sorteo disfraces: parejas, bolas, parejas forzadas
├── guest/        # Invitados y registro
├── kitchen/      # Grupos de cocina
├── room/         # Habitaciones, camas por día, asignaciones
├── common/       # ApiException, handler global
└── config/       # CORS, WebConfig, AdminPinInterceptor

frontend/src/
├── pages/        # AttendancePage, CarsPage, CostumePage, RoomsPage, etc.
├── components/   # Header, BottomNav, Modal, Skeleton, ErrorMessage
├── hooks/        # useGuests, useRooms, useCostume, useCars, useConfig
└── lib/          # api.ts, identity.ts, types.ts, dates.ts, queryClient.ts
```

## Key Patterns

### Authentication
- **Guest identity**: `X-Guest-Id` header (UUID guardado en localStorage)
- **Admin**: `X-Admin-Pin` header, validado por `AdminPinInterceptor` en rutas `/api/admin/**`
- PIN actual: `0075` (hash BCrypt en tabla `app_config`)

### Per-Day Bed Configuration
- Cada habitación tiene camas configuradas **por día** (tabla `beds` con columna `day`)
- Si un día no tiene config, se usa `room.bedCount` como fallback
- Endpoint `POST /api/admin/rooms/copy-beds` para replicar config de un día a otros

### Costume Draw (Sorteo de disfraces)
- Acepta `excludeGuestIds` para excluir participantes
- Acepta `forcedPairs` para garantizar parejas específicas (Paula+Vigara, Tota+Elsa)
- Cada persona tiene un color de bola único (25 colores hex)
- Temática fija: "Heroes y villanos"

### Room Assignments
- Drag & drop para asignar invitados a habitaciones
- Distribución por día con conteo de camas individuales y matrimonio
- Cualquier usuario puede editar camas (no solo admin)
- Botón "Limpiar todo" para desasignar todos los invitados de un día

## API Endpoints

### Public (requieren X-Guest-Id)
```
GET  /api/config                    # Fechas del viaje
GET  /api/guests                    # Lista de invitados
PUT  /api/guests/{id}/register      # Registrarse
GET  /api/cities                    # Ciudades disponibles
GET  /api/cars                      # Tramos de coches
POST /api/cars                      # Crear tramo
POST /api/cars/{id}/join            # Unirse a coche
DEL  /api/cars/{id}/leave           # Salir de coche
GET  /api/rooms                     # Lista habitaciones
PUT  /api/rooms/{id}                # Editar habitación (camas por día)
GET  /api/rooms/{id}/beds?day=      # Camas de una habitación en un día
GET  /api/rooms/distribution?day=   # Distribución del día
PUT  /api/rooms/assign              # Asignar invitado a habitación
DEL  /api/rooms/assign              # Desasignar
GET  /api/costume/me                # Mi pareja de disfraz
GET  /api/costume/balls             # Vista de bolas (animación)
GET  /api/kitchen/groups            # Grupos de cocina
```

### Admin (requieren X-Admin-Pin)
```
POST /api/admin/guests              # Crear invitado
DEL  /api/admin/guests/{id}         # Eliminar invitado
POST /api/admin/rooms               # Crear habitación
DEL  /api/admin/rooms/{id}          # Eliminar habitación
POST /api/admin/rooms/copy-beds     # Copiar camas de un día a otros
POST /api/admin/costume/draw        # Lanzar sorteo (body: excludeGuestIds, forcedPairs)
GET  /api/admin/costume/pairs       # Ver todas las parejas
PUT  /api/admin/config              # Actualizar config
```

## Deployment

| Service  | Platform | URL |
|----------|----------|-----|
| Backend  | Render   | https://asturias-backed.onrender.com |
| Frontend | Vercel   | https://asturias-iota.vercel.app |
| Database | Supabase | PostgreSQL (aws-0-eu-west-1.pooler.supabase.com) |
| Repo     | GitHub   | https://github.com/DavigXtart/asturias.git (branch: main) |

### Environment Variables (Render)
- `DB_URL`, `DB_USER`, `DB_PASSWORD` - conexión Supabase
- `FRONTEND_ORIGIN` - URL de Vercel para CORS
- `ADMIN_PIN` - PIN inicial (seed)
- `PORT` - puerto del servidor

### Environment Variables (Vercel)
- `VITE_API_URL` - URL del backend en Render

## Development

```bash
# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm run dev
```

## Frontend Routes
| Path     | Page             | Bottom Nav |
|----------|------------------|------------|
| /        | AttendancePage   | Asistencia |
| /cars    | CarsPage         | Coches     |
| /groups  | GroupsPage (tabs) | Grupos    |
| /rooms   | RoomsPage        | Casa       |

## Database Tables
`app_config`, `guests`, `cities`, `car_legs`, `car_passengers`, `rooms`, `beds`, `room_assignments`, `costume_draw`, `costume_pairs`, `costume_pair_members`, `kitchen_members`

## UI Design
- Mobile-first, tema oscuro
- Colores: `surface-0/50/100/200/300`, `brand-300/400/500/600`, `accent-green/amber/purple/pink`
- Bordes: `glass-border` (blanco semitransparente)
- Tipografía: system font stack
- Animaciones: Framer Motion (springs, delays escalonados)
- Touch targets: mínimo 44x44px
- Bottom nav con safe-area para notch/gesture bar
