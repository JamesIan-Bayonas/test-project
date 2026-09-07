# FoodSearch Pro — Packaged Food Nutrition Finder

A production-grade full-stack food product search engine built with **Next.js 16 (App Router)**, **Express 5**, **Prisma ORM**, **MySQL 8**, **Open Food Facts API**, and **Stripe Subscriptions (Test Mode)**.

The application allows users to find packaged food products worldwide across four supported languages (**English**, **Dutch**, **German**, and **French**). Basic metadata (product name, brand, image, barcode, categories, and ingredients) is accessible to all users. Detailed nutritional metrics are strictly server-side wire gated until the seeded demo user activates a monthly Stripe subscription.

---

## 1. System Architecture & Topology

```text
[ Next.js 16 Client (Port 3000) ]
        │
        │  REST (Search, Subscription State, Checkout Initiation)
        ▼
[ Express 5 API Server (Port 5000) ]
   ├── GET  /api/health         (Liveness probe and environment check)
   ├── POST /api/webhook        (express.raw() buffer -> HMAC signature check)
   ├── GET  /api/search         (Zod validation -> OFF upstream query -> Wire gating)
   ├── GET  /api/search/history (MySQL-persisted recent searches for demo user)
   └── POST /api/subscription/* (Stripe Checkout sessions & status synchronization)
        │
        ├── [ MySQL 8.0 Container (Host: 3307, Port: 3306) via Prisma ]
        │    ├── User (email, stripeCustomerId, subscriptionStatus, etc.)
        │    ├── SearchQuery (userId, query, language, createdAt)
        │    └── StripeEvent (id [evt_xxx], userId, type, processedAt)
        │
        └── [ Upstream Integrations ]
             ├── Open Food Facts API (Search ingestion & locale prioritization)
             └── Stripe Subscriptions API (Checkout sessions & webhooks)

```

(Architecture derived from repository modules)

---

## 2. Setup & Installation Instructions

### Prerequisites

* **Node.js**: v20+
* **Docker & Docker Compose**: For containerized MySQL 8


* **Stripe CLI**: For local webhook listener forwarding



---

### Step 1: Start MySQL Database

Launch the MySQL 8 container in the background:

```bash
docker compose up -d

```

Host port `3307` is mapped to container port `3306` (`food_search_db`) to avoid collisions with any local MySQL instances.

---

### Step 2: Configure & Start Backend API

1. Navigate to the backend directory and install dependencies:


```bash
cd backend
npm install

```


2. Provision the environment file:


```bash
cp ../.env.example .env

```


Verify configuration values in `backend/.env`:


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


3. Run migrations and seed the initial demo account:


```bash
npx prisma migrate deploy
npm run prisma:seed

```


Seeds `demo@foodsearch.io` with an `INACTIVE` subscription tier.


4. Start the Express development server:


```bash
npm run dev

```


Server listens on `http://localhost:5000`.


5. **30-Second Smoke Test:**
Confirm database and upstream API connectivity via cURL:
```bash
curl -s "http://localhost:5000/api/health"
curl -s "http://localhost:5000/api/search?q=nutella&lang=en"

```



---

### Step 3: Configure & Start Frontend

1. Open a new terminal session, navigate to the frontend, and install dependencies:


```bash
cd frontend
npm install

```


2. Provision the client environment file:
```bash
echo 'NEXT_PUBLIC_BACKEND_URL="http://localhost:5000/api"' > .env.local

```


3. Start the Next.js development server:


```bash
npm run dev

```


Application accessible at `http://localhost:3000`.



---

### Step 4: Stripe Local Webhook Forwarding

1. Forward Stripe events to the Express endpoint:


```bash
stripe listen --forward-to localhost:5000/api/webhook

```


2. Copy the printed webhook signing secret (`whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in `backend/.env`. Restart the backend process to reload environment variables.


3. **Stripe Test Card Credentials:**
When testing subscription checkout flows:
* **Card Number:** `4242 •••• •••• 4242`
* **Expiration Date:** Any valid future date (e.g., `12/30`)
* **CVC:** Any 3 digits (e.g., `123`)
* **Billing Email:** `demo@foodsearch.io`




---

## 3. Automated Testing Suite

The backend automated test suite covers payload parsing, wire gating enforcement, and webhook signature verification:

```bash
cd backend
npm test

```

| Test File | Test Scope & Assertions |
| :--- | :--- |
| `tests/search.dto.test.ts` | Validates Zod input boundaries, 4-language fallback resolution, and defensive nutrient sanitization. |
| `tests/search.gating.test.ts` | Asserts that `nutriments` evaluates to `null` over the network for `INACTIVE` users and returns full macro data for `ACTIVE` users. |
| `tests/subscription.webhook.test.ts` | Asserts HMAC signature validation, malformed payload rejection, and duplicate event deduplication. |

---

## 4. Key Technical Decisions

* **Strict Server-Side Wire Gating (Zero Wire Leaks):**
Nutritional metrics are never serialized over the network to unsubscribed clients. When the demo user subscription status is `INACTIVE`, `nutriments` is set to `null` before HTTP JSON transmission, and `isNutritionLocked` is marked `true`. This eliminates client-side bypasses via browser DevTools or inspected network packets.


* **Raw Webhook Stream Boundary:**
Stripe webhook signature validation requires raw, unmutated byte buffers. The `/api/webhook` route mounts `express.raw({ type: 'application/json' })` strictly before global `express.json()` middleware, preventing corrupted HMAC signatures.


* **Webhook Idempotency via Primary Key Deduplication:**
Stripe operates on at-least-once delivery semantics. The handler checks incoming Stripe event IDs (`evt_xxx`) against the `StripeEvent` table before executing database transactions. Repeated webhook events return HTTP 200 immediately without executing redundant writes.


* **Fallback Dynamic Inline Checkout Pricing:**
When `STRIPE_PRICE_ID` is set to `price_monthly_dummy`, the backend builds an inline €4.99/mo recurring price object (`price_data`) directly into the session payload. Reviewers can test checkout without pre-creating products or prices in their Stripe Dashboard.


* **Defensive Upstream Parsing & Retries:**
Open Food Facts API responses often contain irregular data types (strings inside numeric fields, partial objects, missing keys). Helper functions defensively cast numbers, round metrics to two decimal places, and catch failures with an automated retry after 1000ms.



---

## 5. Internationalization (i18n) Approach

The application delivers full interface and data localization across **English (`en`)**, **Dutch (`nl`)**, **German (`de`)**, and **French (`fr`)**:

1. **Upstream Query Prioritization:**
The search service appends `lc=${lang}` to upstream Open Food Facts queries, prompting the external engine to prioritize language-specific taxonomy in its returned document set.


2. **Deterministic Locale Fallback Cascade:**
   Localized product fields resolve through a deterministic 4-stage hierarchy:

   `Requested Locale (field_{lang})` → `English Variant (field_en)` → `Generic Root (field)` → `Fallback String`

   If a German product lacks German ingredient text, it defaults to the English description before falling back to the untagged base record.


3. **Reactive UI Dictionary Registry:**
All buttons, placeholders, nutrient labels, paywall modals, and toast messages are bound to a typed dictionary map (`frontend/src/lib/i18n.ts`) that re-renders dynamically when switching the header language dropdown.



---

## 6. Known Limitations & Simplifications

* **Single Demo User Pattern:** The application operates against a single seeded demo user (`demo@foodsearch.io`) without multi-tenant authentication or JWT sessions, as explicitly specified in the assignment requirements.


* **Upstream Latency & Caching:** Open Food Facts is a public community service subject to periodic throttling and latency. While a timeout-and-retry policy is enforced, production readiness would require an in-memory caching tier (e.g., Redis) for high-frequency queries.


* **Stripe Hosted Checkout:** Checkout is handled via Stripe-hosted redirection rather than custom embedded Elements to keep PCI compliance minimal and prioritize webhook-driven database synchronization.