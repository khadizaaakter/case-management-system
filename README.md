# Case Management System — Estate & Legal Affairs

A minimalistic React prototype for tracking legal cheque-recovery cases: dashboard,
case management, case creation/editing, reporting with export, analytics, and settings.
This is a **prototype** — data is stored in the browser's `localStorage`, no backend.

## Stack

- **React 19 + TypeScript + Vite**
- **react-router-dom** — client-side routing across the six sections
- **recharts** — dashboard & analytics charts
- **lucide-react** — icons
- **xlsx** + **jspdf** / **jspdf-autotable** — Excel & PDF export

## Getting started

```bash
pnpm install
pnpm dev        # start dev server
pnpm build      # type-check + production build
pnpm preview    # preview the production build
```

## Structure

```
src/
  main.tsx            App entry — Router + Store + Toast providers
  App.tsx             Route definitions
  store.tsx           localStorage-backed app data (Context)
  toast.tsx           Toast notifications
  types.ts            Domain types (Case, MasterData, AuditEntry…)
  data.ts             Sample cases, master data, dashboard fallback stats
  utils.ts            Formatting helpers (Lakh/Crore, dates, priority)
  components/
    Layout.tsx        Sidebar + top bar shell (Outlet)
    CaseModal.tsx     Case detail + audit log modal
    ui.tsx            StatCard, StatusPill, SectionCard
  pages/
    Dashboard.tsx     Stats, charts, upcoming hearings, KPIs, filters
    Cases.tsx         Search/filter, paginated table, view/edit
    CreateCase.tsx    Create & edit form (?edit=<id>)
    Reporting.tsx     Filtered report + Excel/PDF export
    Analytics.tsx     Aging analysis, depot performance, KPIs
    Settings.tsx      Master-data CRUD + audit log
```

## Routes

| Path         | Page        |
| ------------ | ----------- |
| `/`          | Dashboard   |
| `/cases`     | Cases       |
| `/create`    | Create Case |
| `/reporting` | Reporting   |
| `/analytics` | Analytics   |
| `/settings`  | Settings    |

Editing a case links to `/create?edit=<id>`, which pre-fills the form.
