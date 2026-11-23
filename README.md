# FOODIEHUB

A full-stack food delivery web application: React (Vite) + TypeScript frontend, Spring Boot 3 backend, MySQL + Flyway, JWT auth, Razorpay (optional), and role-based dashboards for customers, admins, restaurant owners, and delivery partners.

## Features

- **Customer**: signup/login, restaurant discovery (search, cuisine, rating, sort, pagination), menus with veg/non-veg + bestsellers, cart (single-restaurant rule), coupons, address book, COD or Razorpay checkout, order history, live-style tracking (simulated), profile & password management, offers page.
- **Admin**: platform stats, user enable/disable, restaurant CRUD, food availability, order status oversight.
- **Restaurant owner**: kitchen order flow (placed → confirmed → preparing → ready), menu availability, restaurant profile, revenue stats.
- **Delivery partner**: available jobs, accept, out-for-delivery, mark delivered.
- **Integrations**: Nominatim geocoding, TheMealDB inspiration, OpenStreetMap + Leaflet map, Razorpay HMAC verification (when keys configured).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite 6, React Router 7, axios, lucide-react, Leaflet, Vitest + RTL |
| Backend | Java 21, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, Flyway, springdoc-openapi, Lombok |
| Database | MySQL 8 (prod/dev), H2 (tests) |

## Project layout

```
foodiehub/
  frontend/          # Vite React SPA (port 5173, proxies /api → :8080)
  backend/           # Spring Boot app (port 8080)
    src/main/resources/db/migration/   # V1 schema + V2–V4 seed data
```

## Prerequisites

- JDK 21+, Maven 3.9+
- Node 20+ / npm
- MySQL 8 running on `localhost:3306`

## Database setup

```sql
CREATE DATABASE foodiehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- default dev credentials: root / empty password
```

Flyway migrations create tables and seed reference data on first boot.

## Run backend

```bash
cd backend
mvn spring-boot:run
```

Optional env vars: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `DELIVERY_CHARGE`, `FREE_DELIVERY_THRESHOLD`, `TAX_RATE_PERCENT`.

Swagger UI: http://localhost:8080/swagger-ui.html

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Customer | demo@foodiehub.com | Demo@123 |
| Admin | admin@foodiehub.com | Admin@123 |
| Owner | owner1@foodiehub.com | Owner@123 |
| Rider | rider@foodiehub.com | Rider@123 |

Coupons: `WELCOME50`, `FOODIE20`, `HUNGRY100`, `SAVE15`.

## Tests

```bash
# Backend (JUnit + Mockito + MockMvc + H2)
cd backend && mvn test

# Frontend (Vitest + Testing Library)
cd frontend && npm test

# Production build
cd frontend && npm run build
```

## Key business rules

- Cart holds items from **one restaurant** only (`409 RESTAURANT_MISMATCH`).
- Pricing, coupon validation, and tax/delivery fees are computed **server-side**.
- Order statuses: `ORDER_PLACED → CONFIRMED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED` (cancel only before preparing).
- Razorpay signatures verified with HMAC-SHA256; empty keys → COD only (`RAZORPAY_NOT_CONFIGURED`).
- Tracking progress is **simulated** (not live GPS).

## Environment variables

See `backend/.env.example` and `frontend/.env.example`.
