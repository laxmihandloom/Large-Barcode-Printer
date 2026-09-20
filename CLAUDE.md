# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps
npm run dev          # Vite dev server at http://localhost:3000
npm run build        # tsc --noEmit, then Vite build into dist/
npm test             # Vitest, single run
npm run test:watch   # Vitest watch mode
npm run typecheck    # tsc --noEmit on its own
npm test -- src/common/barcode.test.ts     # one file
npm test -- -t "encodes the year and month" # one case
npm run deploy       # manual gh-pages publish of dist/ (CI deploys on push to main)
```

Vite 5 + Vitest + TypeScript 5, `strict: true`. **No linter is configured** — the CRA `eslintConfig` went away with `react-scripts`, so the `react-hooks/exhaustive-deps` warnings that used to appear on build no longer run. CI (`.github/workflows/ci.yml`) runs typecheck, test and build.

`vite.config.ts` sets `base` conditionally: `/` in dev so the app sits at exactly `http://localhost:3000` (the registered OAuth redirect URI), `/Large-Barcode-Printer/` for the build. Dev port is pinned with `strictPort` for the same reason — a fallback port would break login.

## Environment

A local `.env` (gitignored) is required; the app is useless without it:

- `VITE_CLIENT_ID` — Zoho Books OAuth client id
- `VITE_ORGANIZATION_ID` — Zoho Books org id, sent as a query param on every API call
- `VITE_REDIRECT_URI` — OAuth redirect target; must match the URL the app is served from

`.env` (gitignored) holds all three for dev. `.env.production` is **committed** and overrides only `VITE_REDIRECT_URI` for builds — CRA-style layering still applies under Vite. Vars are read via `import.meta.env`, not `process.env`.

Zoho's API console must also list the calling origin under **JavaScript Domain** (origin only, no path) or every request fails CORS, and the redirect URI (full URL, with path) under **Authorized Redirect URIs**. That field only exists on Client-based Applications.

Zoho endpoints are hardcoded to the **`.in` data center** (`accounts.zoho.in`, `www.zohoapis.in`) in `APIConstants`. A user in another DC needs those changed.

## Architecture

Single-page app, no router, no global state library. Everything hangs off `App` → `Dashboard` (chrome) → `Items` (the only page).

**Auth** is Zoho OAuth *implicit* flow. [App.tsx](src/App.tsx) redirects to Zoho and parses the token out of the URL **hash**; session storage and expiry live in [auth.ts](src/common/auth.ts). There is no refresh flow (`handleRefresh` is stubbed out). [api.ts](src/api/api.ts) calls `requireAccessToken()`, which throws `SessionExpiredError` rather than sending a dead token; [Items.tsx](src/pages/Items.tsx) catches that (and bare 401s) and calls `onSessionExpired`, which returns the user to the login screen. Tokens are treated as expired `EXPIRY_SKEW_MS` (60s) early so a request cannot die in flight.

**Data flow for printing** — this is the core of the app and spans four files:

1. [Items.tsx](src/pages/Items.tsx) owns all state. It fetches Zoho items (server-side pagination via `paginationModel`, search via the debounced `searchText` from [useDebounce](src/hooks/useDebounce.tsx)) and feeds [ItemsDataGrid](src/components/ItemsDataGrid.tsx).
2. Row selection is mapped into `BarcodeMetadata[]` — one entry per *selected item*, carrying editable fields (quantity, size, age, year, month). Zoho's `cf_mrp` custom field becomes `mrp`; `sku` is the barcode `value`.
3. [PrintBarcodeDialog](src/components/PrintBarcodeDialog.tsx) is a two-step dialog (`settingsTab` boolean toggles settings vs. preview). It calls `buildLabels` from [barcode.ts](src/common/barcode.ts) to collapse `BarcodeMetadata[]` into `LabelDesign[]` — one entry per *item*, carrying a `copies` count rather than repeating the design.
4. [BarcodeTemplate1](src/components/barcodeTemplates/BarcodeTemplate1.tsx) renders one label as a fixed **400×600px** DOM node with a JsBarcode CODE128 SVG.

**PDF generation** (`createPDF`) is deliberately DOM-dependent: each *design* must be rendered in the preview tab, wrapped in a `#barcode-{index}` Box. It walks those nodes by id, rasterizes the *first child* with html2canvas at `CAPTURE_SCALE`, rotates the canvas 270° on a scratch canvas, and adds it as one page per copy, then `autoPrint()` + opens a blob URL (with a download fallback for popup blockers). Consequences to respect when editing:

- **One capture per design, reused across copies.** This is the whole performance strategy: html2canvas clones the entire document on every call, so capturing per label was quadratic. It only holds because copies of an item are pixel-identical — which is why the product code is per-item, not per-label. Reintroducing per-copy variation silently reverts the optimisation.
- Repeated pages share one embedded image via a stable jsPDF `alias`.
- `TEMPLATE_WIDTH_PX` / `TEMPLATE_HEIGHT_PX` must match `BarcodeTemplate1`'s fixed size.
- `CAPTURE_SCALE` is 2 deliberately: on 75×50mm stock that is already past what a thermal printer resolves.
- Labels cannot be generated without mounting the preview; don't move this into a headless path without rewriting the capture.
- The rotation exists because the template is portrait and the label stock is landscape.

**Per-item taxonomy** lives in `SIZE_MAPPING` in [barcode.ts](src/common/barcode.ts): `"Kids · 12 (L)" → ["12 (L)", "6–9 months"]`, i.e. label → `[sizeCode, ageDescription]`. Picking a size auto-fills age; the Age dropdown offers the deduped set of all ages. The template shows the part of the label after `·`, not the code — a key without `·` renders blank on a physical tag, which a test guards.

`uniqueCode` format is `[3 random uppercase letters]Y[YY]M[MM]` (e.g. `PTUY25M09`). Despite the name it is **not unique and not an identifier** — it encodes only the purchase month/year so staff can date a tag, and is generated **once per item** so every copy matches. It is printed above the barcode; the `sku` prints below it, and the barcode itself encodes the SKU.

**Pure logic lives in [barcode.ts](src/common/barcode.ts) and [auth.ts](src/common/auth.ts)** precisely so it can be tested without a DOM — that is where new logic belongs, not inside the dialog component.

## Conventions and known rough edges

- Component props are typed `({ ... }: any)` almost everywhere; shared shapes (`Barcode`, `BarcodeMetadata`, `SnackbarAlert`) live in [constants.ts](src/common/constants.ts).
- Errors surface through a single `setAlert` callback threaded down from `App` into a MUI Snackbar; message strings belong in `LogConstants`.
- Selection is capped at 25 items in [BulkActionsButton](src/components/BulkActionsButton.tsx).
- `React.StrictMode` is disabled in [index.tsx](src/index.tsx) (double-rendering interferes with the barcode/canvas effects).
- `BarcodeTemplate1` hides the MRP line and discount badge entirely when `cf_mrp` is absent, and auto-fits the item-name font size so long names don't overflow the fixed-width label.
- `handleNext` builds a `generatePayload()` object and only `console.log`s it — it is a hook for a future API call, not dead code to delete silently.
- Selection state is lost if the session expires mid-job; nothing is persisted across the re-login redirect.
