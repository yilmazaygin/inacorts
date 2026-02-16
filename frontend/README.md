# INACORTS Frontend

React single-page application for the INACORTS business management system.

---

## License

This project is licensed under the **GNU General Public License v3.0 or later**.
See the [LICENSE](../LICENSE) file for details.

> **This frontend was AI-generated** using GitHub Copilot and Claude, with
> manual review and refinement throughout the codebase.

---

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Opens at **http://localhost:5173**. Requires the backend running at `http://localhost:8000`.

---

## Tech Stack

| Technology | Version | Purpose |
| --- | --- | --- |
| React | 18.3.1 | UI framework |
| TypeScript | 5.2.2 | Type safety |
| Vite | 5.3.1 | Build tool & dev server |
| Tailwind CSS | 3.4.4 | Utility-first styling |
| React Router | 6.23.1 | Client-side routing |
| Axios | 1.7.2 | HTTP client |
| i18next | 25.8.8 | Internationalisation |
| react-i18next | 16.5.4 | React i18n bindings |
| date-fns | 3.6.0 | Date formatting |

---

## Features

- **Dark / Light Theme** — system-aware toggle, persisted in localStorage
- **Turkish & English (TR / EN)** — runtime language switch via i18next
- **JWT Authentication** — login, token management, protected routes
- **Responsive Layout** — sidebar navigation, mobile-friendly
- **11 Page Modules** — full CRUD interfaces for every entity
- **Reusable Components** — 13 common UI components + layout system
- **Compact Currency** — locale-aware formatting (₺1.2M, ₺450K)

---

## Project Structure

```
frontend/
├── index.html                # HTML entry point
├── package.json              # Dependencies & scripts
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite build config
├── postcss.config.js         # PostCSS (Tailwind)
├── .env.example              # Environment variable template
│
└── src/
    ├── main.tsx              # React DOM entry
    ├── App.tsx               # Root component (router + providers)
    ├── index.css             # Global styles & Tailwind imports
    ├── vite-env.d.ts         # Vite type declarations
    │
    ├── api/                  # Axios service modules
    │   ├── client.ts             # Axios instance with interceptors
    │   ├── auth.ts               # Login, me
    │   ├── customers.ts          # Customer CRUD
    │   ├── contacts.ts           # Contact CRUD
    │   ├── categories.ts         # Category CRUD
    │   ├── products.ts           # Product CRUD
    │   ├── stockMovements.ts     # Stock movement queries
    │   ├── orders.ts             # Order CRUD
    │   ├── orderDeliveries.ts    # Delivery records
    │   ├── payments.ts           # Payment CRUD
    │   ├── expenses.ts           # Expense CRUD
    │   ├── notes.ts              # Notes CRUD
    │   └── tags.ts               # Tags CRUD
    │
    ├── components/
    │   ├── common/           # Reusable UI components
    │   │   ├── Badge.tsx
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── DropdownMenu.tsx
    │   │   ├── ErrorMessage.tsx
    │   │   ├── Input.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   ├── Modal.tsx
    │   │   ├── NotesPanel.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── Select.tsx
    │   │   ├── Table.tsx
    │   │   └── TextArea.tsx
    │   └── layout/           # App shell
    │       ├── AppLayout.tsx
    │       ├── Header.tsx
    │       └── Navigation.tsx
    │
    ├── contexts/             # React context providers
    │   ├── AuthContext.tsx        # JWT auth state
    │   └── ThemeContext.tsx       # Dark / light mode
    │
    ├── i18n/                 # Internationalisation
    │   ├── index.ts              # i18next initialisation
    │   └── locales/
    │       ├── tr.json           # Turkish (default)
    │       └── en.json           # English
    │
    ├── pages/                # Route page components
    │   ├── auth/                 # Login page
    │   ├── dashboard/            # Dashboard with KPIs
    │   ├── customers/            # Customer list & detail
    │   ├── contacts/             # Contact management
    │   ├── categories/           # Product categories
    │   ├── products/             # Product list & detail
    │   ├── stock/                # Stock movement log
    │   ├── orders/               # Order list & detail
    │   ├── payments/             # Payment list
    │   ├── expenses/             # Expense management
    │   └── financials/           # Financial overview
    │
    ├── types/                # TypeScript definitions
    │   ├── entities.ts           # Entity interfaces
    │   ├── enums.ts              # Enum constants
    │   └── api.ts                # API response types
    │
    └── utils/
        └── format.ts             # formatCurrency, formatDate, etc.
```

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server (Vite HMR) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

---

## Theming

The app supports **dark and light modes**:

- Theme preference is detected from the OS (`prefers-color-scheme`)
- Users can toggle manually via the header button
- Selection is persisted in `localStorage`
- All components use Tailwind's `dark:` variant classes

---

## Internationalisation (i18n)

- **Turkish** is the default language
- **English** is fully supported
- Language switch is available in the header
- All UI strings are externalised in `src/i18n/locales/*.json`
- Dates and currency use locale-aware formatting via `date-fns` and `Intl`
