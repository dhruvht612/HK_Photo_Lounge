# HK Photo Lounge

Photography portfolio and booking site built with **React (Vite)**, **Tailwind CSS**, and **Framer Motion**. Content and inquiries are stored in the browser (localStorage) via a built-in mock API — no separate server required.

## Project structure

```
HK_Photo_Lounge/
├── src/
│   ├── api/              # Mock API (client, store, seed data)
│   ├── contexts/         # Auth (token in localStorage)
│   ├── layouts/          # Public + Admin shells
│   ├── pages/            # Public site + admin CRUD
│   ├── components/
│   └── lib/
├── public/
├── package.json
└── vite.config.js
```

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Admin login

Default credentials (demo only):

- Email: `admin@hkphotolounge.com`
- Password: `changeme123`

Admin data persists in `localStorage` under the key `hk-photo-lounge-data-v1`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

## TypeScript, paths, Tailwind

- **Path alias `@/`** maps to `src/` in Vite and TypeScript.
- **UI components** live in `src/components/ui/` (shadcn-style).
- **Tailwind CSS v3** with CSS variables in `src/index.css`.

## License

See [LICENSE](LICENSE).
