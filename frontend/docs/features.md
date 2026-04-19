# Handy Tools — Feature Documentation

## Architecture Overview

The frontend is a **Next.js 16 App Router** application with Tailwind CSS v4. All interactive features are implemented as React client components (`"use client"`) mounted inside server-rendered route pages. Three React Contexts provide in-memory state shared across the app.

```
src/
├── app/                        # Next.js route pages (server components)
│   ├── page.tsx                → /
│   ├── finances/page.tsx       → /finances
│   ├── documents/page.tsx      → /documents
│   ├── stock-market/page.tsx   → /stock-market
│   └── tools/
│       ├── page.tsx            → /tools
│       └── [id]/page.tsx       → /tools/:id
├── components/
│   ├── layout/                 # AppShell, Sidebar, TopBar
│   ├── dashboard/              # Dashboard
│   ├── documents/              # DocumentsPage
│   ├── finances/               # FinancesPage
│   ├── stock-market/           # StockMarketPage
│   ├── tools/                  # ToolsPage + individual tool components
│   └── settings/               # SettingsModal
└── context/
    ├── DocumentsContext.tsx
    ├── FinancesContext.tsx
    └── StockMarketContext.tsx
```

---

## Layout

### Sidebar (`components/layout/Sidebar.tsx`)
Persistent left navigation with collapsible Tools submenu. Uses Next.js `Link` for client-side navigation and `usePathname()` to highlight the active route.

### TopBar (`components/layout/TopBar.tsx`)
Displays the current page title derived from the pathname, a search button placeholder, and a settings gear that opens the Settings modal.

### Settings Modal (`components/settings/SettingsModal.tsx`)
Slide-in modal accessible from the TopBar. Contains:
- **Theme selector** — Light / Dark / System (CSS variable toggle)
- **Auto-save toggle** — persists preference in component state
- **Export / Clear data** — placeholder actions for future persistence layer
- **About section** — version info and a disk-usage progress bar

---

## Dashboard (`/`)

An at-a-glance overview with three tiles:

| Tile | Data source | Description |
|------|-------------|-------------|
| Balance | FinancesContext | Total PLN balance from the most recent finance report, with month-over-month trend indicator |
| Recent Documents | DocumentsContext | Last 10 documents sorted by `added` date |
| Pinned Tools | Static | Three frequently-used tools with direct links |

---

## Documents (`/documents`)

Full-featured document library backed by `DocumentsContext`.

**Features:**
- **Sortable table** — sort by Name, Date Added, Size (MB), Pages
- **Pagination** — configurable page size (10 / 25 / 50)
- **Multi-select** — checkbox per row + select-all; bulk download and bulk delete
- **Confirm dialogs** — deletion requires confirmation
- **Seed data** — 12 pre-populated documents for demo purposes

The context stores each document's `ArrayBuffer` in memory, enabling downstream PDF operations without re-uploading.

---

## Finances (`/finances`)

Two-tab financial reporting tool backed by `FinancesContext`.

### Summary tab
- **Total Balance card** — aggregated PLN value of the most recent report with per-section breakdown and percentage bars
- **Monthly Total Balance chart** — recharts `LineChart` showing PLN total across all 12 months of the selected year
- **Monthly Change by Section chart** — recharts `BarChart` showing month-over-month delta per section, with a zero reference line
- **Year navigation** — arrows to browse historical years
- **Exchange Rates button** — opens the rate configuration modal

### Reports tab
- **Reports sidebar** — grouped by year, shows month name and approximate total in thousands of PLN
- **Month navigator** — arrow buttons to move between months; shows "Saved" or "Editing" badge
- **Report editor** — add, edit, delete named sections; each section has a name, optional description, amount, and currency
- **Import from previous month** — copies the prior month's sections as a starting point
- **Total Balance summary** — live PLN total while editing

### Exchange Rate Modal
Configures PLN conversion rates for USD, EUR, GBP, CHF, JPY, CAD, AUD. Rates are stored in context and applied to all currency conversions. Includes reset-to-defaults.

### Data model
```ts
interface ReportSection { id; name; description; amount; currency }
interface FinanceReport  { id; year; month; sections; savedAt }
interface ExchangeRates  { USD; EUR; GBP; CHF; JPY; CAD; AUD; PLN }
```

---

## Stock Market (`/stock-market`)

Portfolio tracker with four asset classes, all backed by `StockMarketContext`.

### Tabs
| Tab | Asset | Key fields |
|-----|-------|------------|
| Shares | Equities | ticker, sector, exchange, sharesOwned, avgBuyPrice, dividendYield |
| ETFs | Exchange-traded funds | ticker, indexTracked, provider, TER |
| Bonds | Fixed income | issuer, couponRate, maturityDate, faceValue, rating |
| Metals | Precious/industrial metals | metal type, weight, unit (oz/g/kg), purity |

### Cards
Each asset type renders in a `CardShell` that provides:
- **Asset details** — type-specific rows (P&L, coupon rate, YTM, etc.)
- **1W / 1Y % change** — computed from 52-week seeded history
- **Sparkline** — recharts `AreaChart` with gradient fill; green for gains, red for losses
- **Starting point pin** — set a reference date + price + quantity; the card then shows total P&L from that point

### Starting Point
Click the pin icon on any card to open the Set Starting Point modal. Provide:
- Date — the reference date
- Price per unit at that date
- Quantity held

The banner below the sparkline then shows % change per unit and total value change.

### Summary Bar
Above the grid, shows: total positions count, gaining/losing counts (1W), best and worst % performers.

### Add Modals
Each tab has a type-specific Add modal with validation. Required fields are marked `*`.

### Seed data
Four shares (AAPL, MSFT, NVDA, TSLA), three ETFs (SPY, QQQ, VTI), three bonds (US Treasury, EU Corp, PL Gov), four metals (gold, silver, platinum, copper). All history is generated with a seeded deterministic RNG for reproducibility.

---

## Tools (`/tools` and `/tools/:id`)

### Tool listing (`/tools`)
Grid of tool cards grouped by category. Each card shows the tool icon, name, category badge, and description.

### Individual tool (`/tools/:id`)
Header breadcrumb (← All Tools | icon | name | category badge) with the tool rendered below.

### Available tools

#### JSON Formatter (`/tools/json-formatter`)
- Paste or type JSON into the left pane
- **Format** button pretty-prints with configurable indent (1 / 2 / 4 spaces)
- **Minify** button collapses to a single line
- Inline error display for invalid JSON
- Copy output button

#### Password Generator (`/tools/password-gen`)
- Length slider (6–64 characters)
- Character type checkboxes: uppercase, lowercase, numbers, symbols
- Uses `crypto.getRandomValues` for cryptographic randomness
- Strength indicator — Weak / Fair / Strong with colour-coded bars and shield icon
- Generate / copy / regenerate controls
- Last 5 generated passwords panel with individual copy buttons

#### Word Counter (`/tools/word-counter`)
Real-time stats as you type:
- Words, Characters, Characters (no spaces), Sentences, Paragraphs, Estimated reading time
- Most frequent characters panel (top 10)
- Load example / Clear buttons

#### Unit Converter (`/tools/unit-converter`)
Three categories — Length, Weight, Temperature. Each category has:
- From / To unit selects
- Numeric input
- Swap button
- Quick reference grid — 1 unit of the "From" type expressed in every other unit

#### PDF Converter (`/tools/pdf-converter`)
Four modes selectable via a tab bar:

| Mode | Description |
|------|-------------|
| **Split** | Extracts every page of a PDF into separate downloadable files |
| **Merge** | Combines two or more PDFs in a user-defined order |
| **Edit Metadata** | Reads and rewrites title, author, subject, creator, producer, creation/modification dates |
| **Encrypt** | Password-protects a PDF (sets both user and owner password) |

All operations run in the browser using **pdf-lib**. Files can be sourced either by uploading from disk (drag-and-drop or file picker) or by selecting from the Documents library. Uploaded files are automatically added to the library.

---

## State Management

All state is in-memory (React Context, no persistence). On page refresh all data resets to seed values.

| Context | Provides |
|---------|---------|
| `DocumentsContext` | `documents[]`, `addDocuments()`, `removeDocument()` |
| `FinancesContext` | `reports[]`, `rates`, `saveReport()`, `setRates()` + helpers `toPLN`, `sectionsTotalPLN`, `fmtPLN` |
| `StockMarketContext` | `shares[]`, `etfs[]`, `bonds[]`, `metals[]`, CRUD operations, `set*StartPoint()` |

Contexts are instantiated in `Providers.tsx` (a `"use client"` wrapper) and wrapped around the `AppShell` in the root layout.
