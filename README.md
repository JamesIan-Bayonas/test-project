
# FoodSearch Pro — Packaged Food Nutrition Finder

A production-grade full-stack food product search engine built with **Next.js 16 (App Router)**, **Express 5**, **Prisma ORM**, **MySQL 8**, **Open Food Facts API**, and **Stripe Subscriptions (Test Mode)**.

The application allows users to find packaged food products worldwide across four supported languages (**English**, **Dutch**, **German**, and **French**). Basic information (product name, brand, image, barcode, and ingredients) is accessible to all users. Detailed nutritional metrics are strictly server-side wire gated until the demo user activates an active monthly Stripe subscription.

---

## 1. System Architecture & Topology

```text
[ Next.js 16 Client (Port 3000) ]
        │
        │  REST (Search, Subscription State, Checkout Initiation)
        ▼
[ Express 5 API Server (Port 5000) ]
   ├── POST /api/webhook        (express.raw() buffer -> HMAC signature check)
   ├── GET  /api/search         (Zod validation -> OFF upstream query -> Wire gating)
   ├── GET  /api/search/history (MySQL-persisted recent searches for demo user)
   └── POST /api/subscription/* (Stripe Checkout sessions & status synchronization)
        │
        ├── [ MySQL 8.0 Container (Host: 3307, Port: 3306) via Prisma ]
        │     ├── User (email, stripeCustomerId, subscriptionStatus, etc.)
        │     ├── SearchQuery (userId, query, language, createdAt)
        │     └── StripeEvent (id [evt_xxx], userId, type, processedAt)
        │
        └── [ Upstream Integrations ]
              ├── Open Food Facts API (Search ingestion & locale prioritization)
              └── Stripe Subscriptions API (Checkout sessions & webhooks)

```

---

## 2. Setup & Installation Instructions

### Prerequisites

* **Node.js**: v20+
* **Docker & Docker Compose**: For local containerized MySQL
* **Stripe CLI**: For local test webhook forwarding

---

### Step 1: Start MySQL Database

Start the MySQL 8 container in the background:

```bash
docker compose up -d

```

*Host port `3307` is mapped to container port `3306` (`food_search_db`).*

---

### Step 2: Configure & Start the Backend API

1. Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install

```


2. Populate environment variables:
```bash
cp .env.example .env

```


Verify keys in `backend/.env`:
```dotenv
PORT=5000
NODE_ENV=development
DEMO_USER_EMAIL="demo@foodsearch.io"
FRONTEND_URL="http://localhost:3000"
DATABASE_URL="mysql://app_user:app_password@localhost:3307/food_search_db"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_monthly_dummy"

```


3. Run Prisma migrations and seed the initial demo user:
```bash
npx prisma migrate deploy
# or
npm run prisma:migrate

npm run prisma:seed

```


4. Start the backend development server:
```bash
npm run dev

```


*Express runs at `http://localhost:5000`.*

---

### Step 3: Configure & Start the Frontend

1. Open a new terminal session, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install

```


2. Populate environment variables:
```bash
cp ../.env.example .env.local

```


Verify `frontend/.env.local`:
```dotenv
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000/api"

```


3. Start the Next.js development server:
```bash
npm run dev

```


*Open `http://localhost:3000` in your browser.*

---

### Step 4: Stripe Local Webhook Forwarding

To process payments and subscription lifecycle updates locally, forward incoming Stripe webhook events to your Express endpoint:

```bash
stripe listen --forward-to localhost:5000/api/webhook

```

Copy the webhook signing secret printed in your terminal (`whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in `backend/.env`.

---

## 3. Automated Testing Suite

The backend test suite verifies payload extraction, server-side nutritional wire gating, and webhook signature verification/idempotency:

```bash
cd backend
npm test

```

* `tests/search.dto.test.ts`: Validates Zod input validation and defensive nutrient parsing.
* `tests/search.gating.test.ts`: Verifies that `nutriments` are stripped (`null`) on the wire for `INACTIVE` users and returned for `ACTIVE` users.
* `tests/subscription.webhook.test.ts`: Validates HMAC signature enforcement and idempotency guards against duplicate webhook deliveries.

---

## 4. Key Technical Decisions

* **Strict Server-Side Wire Gating (Zero Wire Leaks):**
Nutritional metrics are not masked on the client with CSS. When the demo user holds an inactive subscription, the backend sets `nutriments` to `null` before sending JSON responses. Unsubscribed users cannot access nutrition metrics through devtools or network inspection.
* **Raw Webhook Stream Boundary:**
Stripe webhook signature validation requires raw byte payloads. The `/api/webhook` route uses `express.raw({ type: 'application/json' })` before `express.json()` is mounted, ensuring HMAC signatures remain valid.
* **Webhook Idempotency Persistence:**
Stripe delivers events with at-least-once semantics. Every incoming event ID (`evt_xxx`) is recorded in the `StripeEvent` table. Duplicate deliveries are identified and acknowledged immediately with HTTP 200 without re-running database mutations.
* **Fallback Inline Checkout Pricing:**
If `STRIPE_PRICE_ID` is set to `price_monthly_dummy`, the backend dynamically generates an inline recurring price item (€4.99/mo) using `price_data`, allowing Stripe Checkout to operate without manual product catalog creation in the Stripe Dashboard.

---

## 5. Internationalization (i18n) Approach

The system supports four languages: **English (`en`)**, **Dutch (`nl`)**, **German (`de`)**, and **French (`fr`)**.

1. **Upstream Ingestion Prioritization:**
The backend appends `lc=${lang}` to Open Food Facts queries to prioritize results and taxonomy for the requested locale directly from the upstream index.
2. **Deterministic Locale Fallback Cascade:**
Product fields resolve through a multi-tier fallback chain:
`Localized Field (field_lang)` -> `English Field (field_en)` -> `Base Field (field)` -> `Default String`
If a German translation is unavailable for a product, the backend falls back to English before returning the base unlocalized string.
3. **Client Interface Localization:**
UI text, form controls, nutrient labels, and paywall banners are served from typed dictionary mappings (`frontend/src/lib/i18n.ts`), updating in real time when changing the language selector.

---

## 6. Known Limitations & Simplifications

* **Single Demo User Scope:** Built for a single seeded demo user (`demo@foodsearch.io`) without multi-tenant JWT/session authentication, per assignment requirements.
* **Upstream Latency & Rate Limits:** Open Food Facts is a public community service that can experience intermittent slowdowns. The backend uses an 8-second timeout with an automatic retry attempt to safeguard against upstream failures.
* **Search History Limit:** Recent searches are persisted in MySQL per user, with the frontend fetching the latest 6 unique queries upon initial load.