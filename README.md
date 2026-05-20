# HK Photo Lounge

Photography portfolio and booking site built with **React (Vite)**, **Tailwind CSS**, and **Framer Motion**.

- **Default:** mock API + localStorage for content and admin auth (no server required)
- **Optional:** Supabase for auth (Phase 1); content migration to Supabase in later phases

## Project structure

```
HK_Photo_Lounge/
├── src/
│   ├── api/              # Mock API (localStorage)
│   ├── supabase/         # Supabase client + auth helpers
│   ├── contexts/         # Auth (mock or Supabase via flag)
│   ├── layouts/
│   ├── pages/
│   └── components/
├── supabase/migrations/  # SQL to run in Supabase dashboard
└── docs/                 # Implementation phases
```

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
cp .env.example .env   # optional — see below
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Mock mode (default)

Leave `VITE_USE_SUPABASE=false` in `.env` (or omit `.env`).

**Admin login:** `admin@hkphotolounge.com` / `changeme123`

### Supabase mode

1. Follow [supabase/README.md](supabase/README.md) to create the project, run migrations, and seed the admin profile.
2. Set in `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_USE_SUPABASE=true
```

3. Sign in at `/admin/login` with the Supabase admin user you created.

Admin CRUD (portfolio, services, etc.) still uses the mock API until later phases migrate data to Supabase.

### Client portal (Phase 2)

Requires `VITE_USE_SUPABASE=true`.

| URL | Purpose |
| --- | --- |
| `/portal/login` | Client sign in |
| `/portal/register` | Create client account |
| `/portal/reset-password` | Password reset email |
| `/portal/dashboard` | Client dashboard (protected) |

Run [`supabase/migrations/004_link_inquiries.sql`](supabase/migrations/004_link_inquiries.sql) after Phase 1 migrations so registration links past inquiries by email.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

## Implementation phases

See [docs/phase-01-foundation/README.md](docs/phase-01-foundation/README.md) and [docs/PRD.md](docs/PRD.md).

## License

See [LICENSE](LICENSE).
