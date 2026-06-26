# DSCF Mobile 2 — Sprint 1 Task Breakdown (Onboarding + Catalogue)

> **For**: Mobile Team | **Date**: 12 June 2026 | **App**: dscf-mobile2 (Expo SDK 54)
> **Updated**: Cross-referenced against full requirements document — added missing profile management, business info, Supplier onboarding, and Customer role tasks.

---

## App Overview

**dscf-mobile2** (branded "KeGebeya") is the multi-role mobile app for the DSCF marketplace platform. Built with Expo SDK 54, Expo Router, React Native, and axios. Supports 3 roles (Agent, Retailer, Customer) with a map-based onboarding flow. Backend APIs served by the `dscf-marketplace` Rails engine and `dscf-core`.

---

## Current State (What Exists NOW)

| Feature | Status | File(s) |
|---|---|---|
| Welcome splash | ✅ | `app/welcome.tsx` |
| Login | ✅ | `app/login.tsx` |
| Signup (receives onboarding params) | ✅ | `app/signup.tsx` |
| Role selection (Agent/Retailer/Customer) | ✅ | `app/onboarding/role.tsx` |
| Agent onboarding form (FAYDA field) | ✅ | `app/onboarding/agent.tsx` |
| Retailer onboarding form (doc upload) | ✅ | `app/onboarding/retailor.tsx` |
| Dropoff location map (tap-pin + GPS) | ✅ | `app/onboarding/dropoff.tsx` |
| Auth infrastructure (SDK, token, secure store) | ✅ | `lib/sdk/`, `lib/secureStore.ts` |
| Discover/Home (API listings, search, chips) | ✅ | `app/(tabs)/index.tsx` |
| Categories (hardcoded) | ⚠️ | `app/(tabs)/categories.tsx` |
| Cart + CartProvider context | ✅ | `app/(tabs)/cart.tsx` |
| Checkout shipping form | ✅ | `app/checkout.tsx` |
| Checkout payment | ⛔ Placeholder | `app/checkout/payment.tsx` |
| Orders (mock data) | ⚠️ | `app/(tabs)/orders.tsx` |
| Order detail | ⚠️ | `app/orders/[id].tsx` |
| API client (axios) | ✅ | `lib/api/clients.ts` |
| Components (ProductCard, SearchBar, etc.) | ✅ | `components/` |
| Menu modal (5 dead routes) | ⚠️ | `components/ui/menu-modal.tsx` |

**Bottom tabs**: Discover | Categories | Cart | Orders (single-role, no role detection)

**Onboarding flow (built)**:
```
welcome → onboarding/role → onboarding/agent  → signup
                           → onboarding/retailor → onboarding/dropoff → signup
                           → onboarding/dropoff (customer) → signup
```

**Missing from onboarding**: Supplier role — role.tsx has Agent/Retailor/Customer but no Supplier card.

---

## Sprint 1 Requirements Cross-Reference

### ✅ Covered by Existing Plan or Already Built

| Req | Requirement | Plan Task | Status |
|-----|-----------|-----------|--------|
| 1.1.1 | Supplier KYC verification | — | **Admin/orchestrator feature**. Supplier sees "waiting for approval" only. Correctly excluded. |
| 1.1.2 | Agent registration approval | — | **Admin/orchestrator feature**. Agent sees "waiting for approval" after register. Correctly excluded. |
| 1.1.3 | Account activation/suspension | — | **Admin feature**. Not mobile. Correctly excluded. |
| 1.2.1 | Master product catalogue | T2, T6 | Browse catalogue (✅), product detail (T2) |
| 1.2.2 | Product inclusion from suppliers | T11 | Supplier submits (T11), admin reviews (orchestrator) |
| 1.3 | Sub-supplier network | — | **Admin feature**. Not mobile. Correctly excluded. |
| 1.4.1 | Listing approval workflow | — | **Admin feature**. Suppliers see own listing status in T10. |
| 1.4.2 | View aggregator listings | — | **Admin feature**. Suppliers see own via T10. |
| 2.1.1 | Supplier onboarding (registration) | T9 | Multi-step wizard planned |
| 2.2.1 | Product catalogue inclusion request | T11 | Supplier submits via mobile |
| 2.2.2 | Product listing (supplier self-service) | T10 | Add/remove/update price/quantity |
| 3.1.1 | Agent registration | T13 | Form built ✅, API call ❌ |
| 3.2.1 | Retailer onboarding (by agent) | T14 | Agent adds retailer with details |
| 4.1 | Retailer registration & onboarding | T1 | Form built ✅, API call ❌ |
| 4.2 | Product discovery (retailer) | T6 | Browse, search, product detail |
| 4.3 | Direct purchase (cart/order) | — | Partially built (cart ✅, checkout ⚠️, orders mock ⚠️) |
| 4.4 | RFQ management (retailer) | T7 | Create RFQ, review quotations |
| 4.5 | Order tracking (retailer) | T8 | Real API, filter, invoice |
| 4.6 | Delivery management | — | Beyond Sprint 1 scope |
| 4.7 | Payment management | — | Placeholder only; payment gateway NOT in Sprint 1 |

### 🔴 Gaps — Requirements NOT Covered in Current Plan

| Req | Requirement | Gap |
|-----|-----------|-----|
| 2.1.2 | **Supplier profile management** | Supplier views details, changes password. No profile screen for supplier role. |
| 2.1.3 | **Business information maintenance** | Supplier adds additional documents after onboarding. Not covered. |
| 3.1.2 | **Agent profile management** | Agent views details, changes password. No agent-specific profile. Generic profile (T4) covers basics. |
| 4.2 | **Product comparison** | Compare products side-by-side. Not covered. |
| — | **Supplier role in onboarding** | `onboarding/role.tsx` missing Supplier card. Must add. |

---

## Task Breakdown

### ✅ COMPLETED (by the team)

| Task | What was built | Remaining work |
|------|---------------|----------------|
| Role selection | `onboarding/role.tsx` — 3 role cards (Agent, Retailer, Customer) | **Add Supplier card** |
| Agent onboarding form | `onboarding/agent.tsx` — code, name, phone, service area, FAYDA | **Wire API**: POST /marketplace/agents/register + POST /core/fayda/verify |
| Retailer onboarding form | `onboarding/retailor.tsx` — shop, contact, phone, category, city, license upload, TIN | **Wire API**: POST /core/auth/signup with role=retailer |
| Dropoff location | `onboarding/dropoff.tsx` — map, tap-pin, GPS | **Pass location to signup** params |
| Signup receives params | `app/signup.tsx` — reads role, name, phone, etc. from route params | **Send role to backend** on signup |

---

### PHASE 1 — Foundation (Week 1-2)

#### T1: Add Supplier role to onboarding + wire all registration APIs
**Modified**: `app/onboarding/role.tsx`, `app/onboarding/agent.tsx`, `app/onboarding/retailor.tsx`, `app/signup.tsx`
**New**: `app/onboarding/supplier.tsx`

- Add `{ key: "supplier", title: "Supplier", description: "Supply products to the marketplace", icon: "inventory" }` to ROLE_CARDS in role.tsx
- Create Supplier onboarding form: Business Name, Contact Person, Phone, TIN, Business License upload (reuse `expo-document-picker` pattern from retailor.tsx)
- Supplier flow: role → supplier onboarding → dropoff → signup
- Wire Agent form: on continue → POST /marketplace/agents/register → redirect to login with "waiting for approval"
- Wire Retailer form: on signup → POST /core/auth/signup with role=retailer
- Wire Supplier form: on signup → POST /marketplace/suppliers/register (multipart)
- Handle "waiting for approval" state on login for supplier/agent roles

**APIs**: `POST /marketplace/agents/register`, `POST /marketplace/suppliers/register`, `POST /core/auth/signup`
**Depends on**: Backend Tasks 21, 23
**Effort**: 4 days

---

#### T2: Product detail screen
**New screen**: `app/product/[id].tsx`

Full product view. Image gallery, name/SKU/description, price (ETB), category/unit, supplier info, add to cart with quantity selector, similar products section. Navigate from ProductCard tap on Discover.

**APIs**: `GET /marketplace/products/:id`
**Effort**: 2 days

---

#### T3: Listing detail screen
**New screen**: `app/listing/[id].tsx`

Listing detail from Discover tap. Product info, supplier name/business type, price, available quantity, add to cart / create RFQ buttons. Similar listings.

**APIs**: Listing data from visible listings feed (already fetched)
**Effort**: 1.5 days

---

#### T4: Profile screen (all roles)
**New screen**: `app/profile/index.tsx`

User profile accessible from side menu. Display: name, email, phone, role. Edit profile fields. Change password. Role-specific sections (retailer: location/TIN, supplier: business name/documents, agent: service area/FAYDA ID).

**Also serves**: Supplier profile management (req 2.1.2), Agent profile management (req 3.1.2), Retailer profile (req 4.x).

**APIs**: `GET /core/auth/me`, `PATCH /core/users/:id`
**Effort**: 2 days

---

#### T5: Multi-role navigation structure
**Modified**: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`

Detect user role from `GET /core/auth/me` response. Render different tab layouts:
- **Retailer**: Discover | Categories | Cart | Orders (current, no change)
- **Supplier**: Dashboard | Listings | Orders | Requests (_new route group_)
- **Agent**: Dashboard | Retailers | Commissions (_new route group_)
- **Customer**: Discover | Categories | Cart | Orders (same as retailer)

Store role in SDK context. Redirect to correct tab group on login.

**Effort**: 2 days

---

### PHASE 2 — Buyer (Retailer + Customer) Features (Week 2-3)

#### T6: Enhanced product discovery
**Modified**: `app/(tabs)/index.tsx`

Real search via API: `GET /marketplace/listings/visible?q[name_cont]=...`. Category filter chips from `GET /marketplace/categories`. Sort: price low-high, price high-low, newest. Infinite scroll pagination. Pull-to-refresh. Error retry with "Try Again".

**APIs**: `GET /marketplace/listings/visible`, `GET /marketplace/categories`
**Effort**: 2 days

---

#### T7: RFQ creation flow
**New screens**: `app/rfq/create.tsx`, `app/rfq/index.tsx`, `app/rfq/[id].tsx`

Create RFQ for bulk purchases. Product search + select, set quantities per item, add notes → submit. My RFQs list with status (draft/sent/responded/selected/closed). RFQ detail: items, received quotations, accept quotation → auto-creates order. Quotation comparison view (req 4.4 quotation comparison).

**APIs**: `GET /marketplace/request_for_quotations/my_rfqs`, `POST /marketplace/request_for_quotations`, `GET /marketplace/request_for_quotations/:id`, `POST /marketplace/request_for_quotations/:id/respond`, `POST /marketplace/quotations/:id/accept`
**Effort**: 4 days

---

#### T8: Order tracking enhancement
**Modified**: `app/(tabs)/orders.tsx`, `app/orders/[id].tsx`

Replace mock data with real API. Status timeline (pending → confirmed → processing → completed). Delivery tracking link. Invoice download button. Cancel order (if status allows). Filter by status (All/Confirmed/Processing/Completed). Repeat ordering button (reorder same items).

**APIs**: `GET /marketplace/orders/my_orders`, `POST /marketplace/orders/:id/cancel`, `GET /marketplace/orders/:id/invoice`
**Effort**: 2.5 days

---

#### T9: Fix 5 dead menu routes + payment placeholder
**New screens**: `app/favorites.tsx`, `app/contact.tsx`, `app/settings.tsx`
**Modified**: `components/ui/menu-modal.tsx`

Current menu has 5 routes that crash (profile ✅ T4, favorites ❌, contact ❌, chatbot ❌, settings ❌). Build placeholder screens for each with "Coming Soon" message or basic functionality. Hide Chatbot if not in Sprint 1 scope.

For payment: `/checkout/payment` placeholder → show order summary with "Order Placed" confirmation (no real payment gateway in Sprint 1).

**Effort**: 1.5 days

---

### PHASE 3 — Supplier Features (Week 3-4)

#### T10: Supplier registration wizard
**New screen**: `app/onboarding/supplier.tsx` (extends T1)

Multi-step supplier onboarding: Business Info (name, contact, phone, TIN) → Documents (license upload via expo-document-picker) → Location (dropoff map from onboarding/dropoff.tsx pattern) → Review → Submit. Progress indicator. Each step validates independently. Submit → POST /marketplace/suppliers/register (multipart). Show "waiting for approval" on completion.

**APIs**: `POST /marketplace/suppliers/register`
**Effort**: 3 days (reduced from 4 — leverages existing dropoff.tsx and document upload patterns)

---

#### T11: Supplier dashboard + listing management
**New screens**: `app/(supplier)/index.tsx`, `app/(supplier)/listings.tsx`, `app/(supplier)/products.tsx`

Supplier KPIs: active listings, pending orders, fulfillment rate. My Listings: active listings with status, add/remove (toggle), update price/quantity. Add product to listing: search catalogue, set price + quantity → POST /marketplace/listings. My Supplier Products: manage with status (active/inactive), stock updates.

**APIs**: `GET /marketplace/supplier_products/my_products`, `POST /marketplace/listings`, `PATCH /marketplace/listings/:id`, `POST /marketplace/listings/:id/pause`, `POST /marketplace/listings/:id/activate`, `POST /marketplace/listings/:id/sold_out`
**Effort**: 5 days

---

#### T12: Product inclusion request (supplier-side)
**New screen**: `app/(supplier)/request-product.tsx`

Submit new product for catalogue inclusion. Form: product name, description, unit of measure, product images (camera/gallery). My requests list with status (pending/approved/modified/declined). View request detail + reviewer comments. Edit/resubmit pending or modified requests.

**APIs**: `POST /marketplace/product_inclusion_requests`, `GET /marketplace/product_inclusion_requests?q[supplier_id_eq]=...`, `PATCH /marketplace/product_inclusion_requests/:id`
**Effort**: 3 days

---

#### T13: Order fulfillment (supplier-side)
**New screens**: `app/(supplier)/orders.tsx`, `app/(supplier)/orders/[id].tsx`

Incoming orders with status filter. Order detail: items, quantities, delivery preference. Accept/Reject order with optional reason. Fulfillment status updates (preparing → ready → handed off). Product hand-off confirmation.

**APIs**: `GET /marketplace/orders/my_orders` (incoming filter), `POST /marketplace/orders/:id/confirm`, `POST /marketplace/orders/:id/cancel`, `POST /marketplace/orders/:id/complete`
**Effort**: 3.5 days

---

#### T14: Business information maintenance
**New screen**: `app/(supplier)/business-info.tsx`

Supplier views business details (name, TIN, contact, status). View attached documents (business license, income proof). Add additional documents via expo-document-picker. Delete existing documents.

**Covers**: Requirement 2.1.3 (Business information maintenance).

**APIs**: `GET /core/businesses/my_business`, `PATCH /core/businesses/:id`, ActiveStorage upload for documents
**Effort**: 1.5 days

---

### PHASE 4 — Agent Features (Week 4-5)

#### T15: Agent registration completion
**Modified**: `app/onboarding/agent.tsx`

Already built ✅. Remaining: wire "Continue to sign up" to call `POST /marketplace/agents/register` before navigating to signup. Add FAYDA verification step: call `POST /core/fayda/verify` with entered FAYDA number → display verified person details → confirm → proceed. Handle verification failure (invalid FAYDA number).

**APIs**: `POST /marketplace/agents/register`, `POST /core/fayda/verify` (stub)
**Effort**: 2 days (reduced from 3 — form already built)

---

#### T16: Retailer onboarding by agent
**New screens**: `app/(agent)/index.tsx`, `app/(agent)/retailers.tsx`, `app/(agent)/retailers/add.tsx`

Agent dashboard: acquired retailers count, recent activity. Retailer list: all retailers onboarded by this agent with status. Add retailer form: name, phone, TIN, location (map picker from dropoff.tsx pattern), password. On submit → creates retailer account linked to agent.

**Covers**: Requirement 3.2.1 (Retailer onboarding by agent).

**APIs**: `POST /marketplace/retailers`, `GET /marketplace/retailers/my_retailers`
**Effort**: 4 days

---

#### T17: Agent commissions (placeholder)
**New screen**: `app/(agent)/commissions.tsx`

Commission summary (total, pending, paid). Commission history list. Individual commission detail. **Backend not in Sprint 1 scope** — build UI with placeholder/mock data. Real data when commission endpoint ships.

**Effort**: 1.5 days

---

### PHASE 5 — Polish & Cross-Cutting (Week 5)

#### T18: Notification support
**Modified**: `app/(tabs)/_layout.tsx` (AppHeader)
**New screen**: `app/notifications.tsx`

Bell icon in AppHeader with unread count badge. Notification list: all notifications for current user with read/unread status. Click notification → mark read + navigate to related screen (order detail, listing, etc.). Poll every 30s.

**APIs**: `GET /core/notifications`, `PATCH /core/notifications/:id`
**Effort**: 2 days

---

#### T19: Loading & error states (consistency pass)
**All screens**: Add loading skeletons to all list/detail pages. Error states with "Try Again" retry button. Empty states with illustrations. Offline detection banner. Network error handling.

**Effort**: 2 days

---

## Execution Plan

```
Week 1-2 (Phase 1): T1 (supplier role + API wiring) + T5 (role nav) + T2 (product detail) + T3 (listing detail) + T4 (profile)
Week 2-3 (Phase 2): T6 (discovery) + T7 (RFQ) + T8 (orders) + T9 (dead routes fix)
Week 3-4 (Phase 3): T10 (supplier wizard) + T11 (supplier dashboard) + T12 (PIR) + T13 (fulfillment) + T14 (business info)
Week 4-5 (Phase 4): T15 (agent API wiring) + T16 (retailer onboarding) + T17 (commissions)
Week 5 (Phase 5):   T18 (notifications) + T19 (loading states)
```

**Total**: 19 tasks, ~47 days (1 dev), ~4-5 weeks (2 devs in parallel)

## Completion Status

| Status | Count | Tasks |
|--------|-------|-------|
| ✅ Done | — | 4 screens built (onboarding flow), API client, auth |
| ⚠️ Partial | 3 | T1 (missing supplier role), T15 (form built, API ❌), T8 (mock data) |
| ❌ Todo | 16 | All remaining |

## Key APIs Reference

| API | Purpose | Status |
|-----|---------|--------|
| `POST /core/auth/signup` | Generic signup | ✅ Exists |
| `GET /core/auth/me` | Current user | ✅ Exists |
| `GET /marketplace/listings/visible` | Product feed | ✅ Exists |
| `GET /marketplace/products/:id` | Product detail | ✅ Exists |
| `GET /marketplace/categories` | Category list | ✅ Exists |
| `GET /marketplace/orders/my_orders` | Order list | ✅ Exists |
| `GET /marketplace/request_for_quotations/*` | RFQ CRUD | ✅ Exists |
| `POST /marketplace/quotations/:id/accept` | Accept quote | ✅ Exists |
| `POST /marketplace/suppliers/register` | Supplier reg | 🔴 Backend Task 21 |
| `POST /marketplace/agents/register` | Agent reg | 🔴 Backend Task 23 |
| `POST /core/fayda/verify` | FAYDA verify | 🔴 Backend Task 4 |
| `POST /marketplace/product_inclusion_requests` | PIR submit | 🔴 Backend Task 13 |
| `POST /marketplace/retailers` | Retailer create | 🔴 Backend Task 15 |
| `GET /core/notifications` | Notification list | 🔴 Backend Task 2 |
| `GET /core/businesses/my_business` | Business info | ✅ Exists |
