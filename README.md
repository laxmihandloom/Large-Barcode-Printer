# Large Barcode Printer

A React app for generating and printing large garment barcode labels from
[Zoho Books](https://www.zoho.com/books/) inventory items.

Zoho's own label templates cannot read custom fields (`cf_mrp`) or compute
values, so they cannot produce the label this shop needs — one showing size,
age, MRP, a computed discount and a sale price. This app renders that label
itself and prints it to 75×50 mm stock.

**Live app:** https://laxmihandloom.github.io/Large-Barcode-Printer/

## Requirements

- Node.js 20 or newer
- A Zoho Books account with API access, in the **`.in` data centre**
  (endpoints are hardcoded to `accounts.zoho.in` / `zohoapis.in`)

## Setup

```bash
git clone https://github.com/laxmihandloom/Large-Barcode-Printer.git
cd Large-Barcode-Printer
npm install
```

Create a `.env` file in the project root:

```env
VITE_CLIENT_ID="your_zoho_client_id"
VITE_ORGANIZATION_ID="your_zoho_organization_id"
VITE_REDIRECT_URI="http://localhost:3000"
```

`.env` is gitignored. `.env.production` is committed and supplies the
production redirect URI; it contains no secrets.

| Variable | Purpose |
| --- | --- |
| `VITE_CLIENT_ID` | OAuth client ID from the Zoho API console |
| `VITE_ORGANIZATION_ID` | Zoho Books organisation ID, sent with every API call |
| `VITE_REDIRECT_URI` | Where Zoho sends the user back after login. Must match the app's own URL **and** the value registered with Zoho |

Then:

```bash
npm run dev      # http://localhost:3000
```

## Zoho API console configuration

Both of these must be set on the OAuth client, or login and data loading fail
in ways that look like app bugs.

Open [api-console.zoho.com](https://api-console.zoho.com), select the client
matching `VITE_CLIENT_ID`, and set:

**Authorized Redirect URIs** — full URLs, including the path:

```
http://localhost:3000
https://laxmihandloom.github.io/Large-Barcode-Printer/
```

**JavaScript Domain** — origins only, no path, comma separated:

```
http://localhost:3000,https://laxmihandloom.github.io
```

The JavaScript Domain is what Zoho uses for its CORS check. If the calling
origin is not listed, `zohoapis.in` returns no `Access-Control-Allow-Origin`
header and the browser blocks every API call with a CORS error. This field
only exists on clients registered as **Client-based Applications**, which is
also the client type the implicit flow this app uses requires.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Vite dev server on port 3000 (pinned — the port is part of the registered redirect URI) |
| `npm run build` | Typechecks, then builds to `dist/` |
| `npm test` | Runs the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run preview` | Serves the production build locally |
| `npm run deploy` | Manual publish of `dist/` to the `gh-pages` branch |

Run a single test file with `npm test -- src/common/barcode.test.ts`, or a
single case with `npm test -- -t "encodes the year and month"`.

## How it works

Login uses Zoho's OAuth **implicit flow**: the app redirects to Zoho, which
returns an access token in the URL hash. The token is stored in
`localStorage` and is valid for one hour. There is no refresh token — when it
expires the app returns you to the login screen.

Printing runs in four stages:

1. **[`Items`](src/pages/Items.tsx)** fetches items from Zoho with server-side
   pagination and debounced search, and renders them in a data grid. Selecting
   rows builds `BarcodeMetadata[]` — one entry per selected item.
2. **[`PrintBarcodeDialog`](src/components/PrintBarcodeDialog.tsx)** collects
   per-item size, age, year, month and copy count, then calls
   [`buildLabels`](src/common/barcode.ts) to produce one *label design* per
   item, carrying a copy count rather than repeating the design.
3. **[`BarcodeTemplate1`](src/components/barcodeTemplates/BarcodeTemplate1.tsx)**
   renders one label as a fixed 400×600px node with a CODE128 barcode
   encoding the SKU.
4. **`createPDF`** rasterises each design once with html2canvas, rotates it to
   landscape, and adds it as one 75×50 mm page per copy, reusing the same
   embedded image. It then opens the PDF with print dialog triggered.

Because copies of an item are identical, the number of expensive rasterisation
passes is the number of *items*, not the number of labels. Selection is capped
at 25 items per job.

The code printed above the barcode (`PTUY25M09`) encodes only the purchase
month and year, so staff can read a tag's age at the counter. It is not an
identifier and is not unique.

## Tests

Vitest with jsdom. The suite covers the pure logic that a silent regression
would turn into a run of misprinted physical tags:

- `src/common/barcode.test.ts` — product code format, size/age mapping
  integrity, and the metadata → label-design expansion
- `src/common/auth.test.ts` — token expiry, including the skew that expires a
  token early rather than letting a request fail mid-flight
- `src/components/barcodeTemplates/BarcodeTemplate1.test.ts` — the font-size
  auto-fit that keeps long item names inside the label

## Deployment

Pushing to `main` runs [`ci.yml`](.github/workflows/ci.yml) (typecheck, test,
build) and [`deploy.yml`](.github/workflows/deploy.yml), which publishes
`dist/` to GitHub Pages.

The deploy workflow needs two repository secrets — `VITE_CLIENT_ID` and
`VITE_ORGANIZATION_ID` — under *Settings → Secrets and variables → Actions*,
and *Settings → Pages → Source* must be set to **GitHub Actions**.

`npm run deploy` still works as a manual fallback, but it publishes to the
`gh-pages` branch, which the Actions-based deployment does not use.

## Known limitations

- No token refresh; sessions end after an hour.
- `handleNext` builds a payload and only logs it — a placeholder for a future
  API call, not dead code.
- PDF generation depends on the preview being mounted, since it captures the
  rendered DOM. Drawing the label with jsPDF vector primitives instead would
  make it faster still and independent of the DOM.
