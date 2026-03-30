# HK Photo Lounge

Modern photography portfolio and booking platform: **React (Vite) + Tailwind + Framer Motion** on the frontend, **Express + SQLite + JWT + Multer** on the API, with an **admin dashboard** for content and inquiries.

## Project structure

```
HK_Photo_Lounge/
├── backend/                 # Express REST API
│   ├── db/
│   │   └── schema.sql       # Reference SQL (mirrors runtime migrations)
│   ├── src/
│   │   ├── config/
│   │   ├── db/              # SQLite (better-sqlite3), initSchema
│   │   ├── middleware/      # JWT auth, Multer uploads
│   │   ├── routes/          # auth, categories, portfolio, services, testimonials, inquiries, settings, home, uploads
│   │   ├── utils/
│   │   └── server.js
│   ├── uploads/             # Local image storage (gitignored)
│   └── package.json
├── frontend/                # Vite + React
│   ├── public/
│   ├── src/
│   │   ├── api/             # fetch client
│   │   ├── contexts/        # Auth (JWT in localStorage)
│   │   ├── layouts/         # Public + Admin shells
│   │   ├── pages/           # Public site + admin CRUD
│   │   ├── components/
│   │   │   └── ui/          # shadcn-style primitives (e.g. hero-button-expendable.tsx)
│   │   ├── lib/             # utils.ts (cn), assets helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── components.json      # shadcn CLI config (aliases → @/components, @/lib/utils)
│   ├── tsconfig.json
│   └── package.json
├── package.json             # Optional: run API + web together
└── README.md
```

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Backend**

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run seed
   npm run dev
   ```

   Default admin (change after first login): `admin@hkphotolounge.com` / `changeme123`  
   Override with `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars when running `npm run seed`.

2. **Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Dev server uses Vite proxy to `http://localhost:5000` for `/api` and `/uploads`.

### Frontend: TypeScript, shadcn-style paths, Tailwind

- **TypeScript** is enabled for new files (`tsconfig.json`, `src/vite-env.d.ts`). Existing pages remain `.jsx`; you can migrate incrementally.
- **Path alias `@/`** maps to `src/` in both Vite (`vite.config.js`) and TypeScript. Example: `import Hero from '@/components/ui/hero-button-expendable'`.
- **Default UI folder:** `src/components/ui/` is the conventional location for shadcn-generated primitives. **`components.json`** points aliases there so `npx shadcn@latest add …` drops files in the expected place and imports stay consistent with the ecosystem.
- **Utilities:** `src/lib/utils.ts` exports `cn()` (`clsx` + `tailwind-merge`) for class merging when you add shadcn components.
- **Tailwind:** This app uses **Tailwind CSS v3** (PostCSS). Prompts that use `@import "tailwindcss"` and `@theme` target **Tailwind v4**; those were not applied wholesale to avoid breaking the build. shadcn-compatible **CSS variables** live in `src/index.css` (`:root` / `.dark`).
- **Init shadcn on a fresh Vite+TS project:** from `frontend/`, run `npx shadcn@latest init` and follow prompts (it reads or creates `components.json`). Then `npx shadcn@latest add button` (etc.).

3. **Optional — single command from repo root**

   ```bash
   npm install
   npm run install:all
   npm run dev
   ```

## Database

SQLite file path defaults to `backend/data/hk_photo.db`. Tables:

| Table | Purpose |
| --- | --- |
| `users` | Admin accounts (bcrypt passwords) |
| `categories` | Portfolio categories |
| `portfolio_items` | Projects (slug, cover, featured flags, publish) |
| `portfolio_images` | Per-project gallery rows |
| `services` | Service offerings |
| `testimonials` | Client quotes (optional homepage feature) |
| `inquiries` | Contact/booking form submissions |
| `site_settings` | Key/value (hero copy, contact, social) |

Authoritative reference: `backend/db/schema.sql` (same as `initSchema()` in code).

## API overview

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password }` → JWT |
| GET | `/api/auth/me` | Bearer token |
| CRUD | `/api/categories` | Auth for writes |
| GET | `/api/portfolio` | Query: `category`, `featured`, `admin` |
| GET | `/api/portfolio/slug/:slug` | Public detail + gallery |
| CRUD | `/api/portfolio` | Auth; gallery via `POST /api/portfolio/:id/images` |
| DELETE | `/api/portfolio/images/:imageId` | Auth |
| GET | `/api/services`, `/api/services/slug/:slug` | Public list/detail |
| GET | `/api/testimonials` | Query: `featured`, `admin` |
| POST | `/api/inquiries` | Public booking form |
| GET/PATCH/DELETE | `/api/inquiries/...` | Auth |
| GET | `/api/home` | Featured portfolio, testimonials, services preview, public settings |
| GET | `/api/settings/public` | Public-safe keys only |
| GET/PUT | `/api/settings` | Auth for full settings |
| POST | `/api/uploads` | Auth, `multipart/form-data` field `file` |
| GET | `/uploads/*` | Static files |

## Production notes

- Set strong `JWT_SECRET`, restrict `CLIENT_ORIGIN`, and serve the SPA behind HTTPS.
- Point `VITE_API_URL` at the public API origin if the frontend is not proxied.
- Move uploads to object storage when scaling; keep the same URL shape or adjust `assetUrl()` in the frontend.

## License

See [LICENSE](LICENSE).
