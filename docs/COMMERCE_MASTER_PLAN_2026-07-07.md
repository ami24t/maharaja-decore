# Maharaja Decor — Commerce Master Plan (Full Inventory + Payments)

**Date:** 2026-07-07 · **Status:** v2 — DECIDED, building
**Goal:** turn the static storefront into a full e-commerce operation: the shop's ENTIRE
inventory online, a production-grade stock/orders admin, and a complete Pix + cartão
payment flow — on infrastructure the owner fully controls and can scale/reuse.

---

## Locked decisions (deliberated 2026-07-07)

| # | Decision | Choice |
|---|---|---|
| D1 | Backend | **Self-hosted Medusa v2** (MIT, TypeScript) on the user's Railway account. Own backend without hand-rolling commerce primitives. NOT Supabase, NOT SaaS shop platforms. |
| D2 | Payments | **Mercado Pago** (Pix + cartão). Community Medusa plugins exist — explicit vetting gate at P3; fallback is writing our own payment provider against Medusa's interface. |
| D3 | Catalog | **Full inventory, two-tier**: existing 8 editorial "hero" pieces keep rich pages/scenes/3D; everything else is standard catalog (photo, price, qty, category). 3D (`model` field) is optional per product. |
| D4 | Admin | **Medusa Admin dashboard** (built-in at `/app`) — no custom admin build. Products, inventory quantities, orders, promotions out of the box. |
| D5 | Checkout | Medusa cart natively; storefront v1 exposes **"Comprar" buy-now** (1-item cart) + custom checkout page. Multi-item cart UI later if wanted. |
| D6 | Money | BRL, integer centavos semantics; prices come from the backend, never from client code. |
| D7 | Storefront | The static site stays the storefront (headless). It consumes the Medusa Store API with the same **fail-open** pattern as today's `stock.js`. |

## Architecture

```
maharaja-decor/          ← this repo: static storefront (unchanged identity)
  assets/js/catalog.js   ← NEW: Store API client (fail-open → stock.json fallback)
  loja/                  ← NEW: full-catalog grid + product template page
maharaja-backend/        ← NEW sibling repo: Medusa v2 app
  Railway (prod): medusa server+worker · Postgres · Redis · bucket storage
  Local (dev):    Docker Postgres + Redis
```

## Phases

| Phase | Deliverable | Verify ("done" signal) |
|---|---|---|
| **P0. Foundation (local)** | Medusa v2 scaffolded in `maharaja-backend/`; Docker Postgres+Redis; admin user; the 8 existing products seeded from `product-data.js` (BRL, images, categories, inventory qty) | Admin dashboard lists all 8 with stock; Store API returns the catalog with a publishable key |
| **P1. Storefront read path** | `catalog.js` fetches products/stock/prices from Store API; existing badges & new price display driven by it; `stock.json` fallback kept | Kill the backend → site renders exactly as today (fail-open test) |
| **P2. Full catalog UI** | `loja/` grid (categories, search, pagination) + single product template rendering any SKU; hero pieces keep their handcrafted pages | Add a brand-new product in admin → appears on site with zero code changes |
| **P3. Payments** | Vet MP plugins (marcosgomesneto / NicolasGorga / qbk) → adopt or write own provider; buy-now → checkout page → Pix QR + cartão (sandbox) | Sandbox Pix AND card payment complete end-to-end; order visible in admin; webhook idempotent (replay test decrements stock exactly once) |
| **P4. Deploy** | Railway prod (server, worker, Postgres, Redis, storage), domain, GitHub CI/CD (Consórcio ops pattern) | Prod smoke: catalog reads + sandbox payment on the live URL |
| **P5. Inventory ingestion** | Bulk-add workflow for the whole shop stock (CSV import + phone-photo flow), owner walkthrough doc (pt-BR); IG stock-sync cron retired or rewired via Admin API | Owner adds a product unassisted; full inventory live |
| **P6. Shipping** | Flat-rate + retirada na loja at checkout; Melhor Envio CEP quotes later | Test order totals include correct frete |

## Owner inputs (never invented)

Real prices per piece, shipping rates, Mercado Pago production credentials (CNPJ/MEI),
and inventory counts. Sandbox/test values are clearly marked until provided.

## Risks & gates

- **MP plugin quality** (community-maintained): P3 opens with a code-level vetting pass
  (signature verification, idempotency, amount handling). Fallback: own provider (~1 wk).
- **Data entry is the real bottleneck** for full inventory — P5 treats the owner
  workflow as a first-class deliverable, not an afterthought.
- **Windows local dev**: Postgres/Redis via Docker; if Docker friction appears, dev DB
  can point at a Railway dev database instead.
