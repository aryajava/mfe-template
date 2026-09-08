# Bagian 01 — Arsitektur & Struktur Repo

## Topologi

```
┌──────────────────────────────────────────────────────────┐
│                SHELL (Host) :5000                        │
│  Login · Dashboard · Layout (Sidebar) · LazyMFE loader   │
└──────────────┬───────────────────────────────────────────┘
               │ Module Federation (runtime, remoteEntry.js)
               ▼
┌──────────────────────────┐
│  Child MFE :5006         │   (bisa ditambah: 5007, 5008, ...)
│  scope: childMFE         │
│  exposes: ./Module       │
└──────────────┬───────────┘
               │
     ┌─────────┴──────────┐
     │  @template/shared  │  UI, hooks, contexts, utils,
     │  (shared library)  │  api client, eventBus, types
     └────────────────────┘
```

## Struktur Folder

```
mfe-template/
├── package.json              # root workspace scripts (concurrently)
├── pnpm-workspace.yaml       # 3 package: shared, shell, mfe-child
├── start.ps1 / start.sh      # quick start Windows / Linux-Mac
├── GETTING-STARTED.md        # docs setup
├── MIGRATION-GUIDE.md        # docs split monolith → MFE
│
├── template-shared/          # @template/shared
│   ├── scripts/fix-imports.cjs   # post-build: tambah ekstensi .js di import ESM
│   └── src/
│       ├── components/ui/    # button, card, input, label, dropdown-menu, tooltip, sonner
│       ├── components/common/# LoadingSpinner, ErrorFallback, GlobalLoadingOverlay
│       ├── contexts/         # SharedContext, LoadingContext
│       ├── hooks/            # useAuth, useEventBus, useEventSubscription
│       ├── lib/              # utils(cn, format*, debounce), eventBus, api client, env
│       ├── styles/globals.css
│       └── types/
│
├── template-shell/           # @template/shell (host, port 5000)
│   ├── webpack.config.cjs    # MF host, remotes: {} (kosong, dinamis)
│   ├── env.js                # konfigurasi runtime window._env
│   ├── public/env.js         # override stub (di-copy ke dist)
│   └── src/
│       ├── index.tsx         # import('./bootstrap') — async boundary MF
│       ├── bootstrap.tsx     # provider stack + initSharedDependencies()
│       ├── routes/routes.tsx # route statis, daftarkan MFE di sini
│       ├── routes/ProtectedRoute.tsx
│       ├── components/LazyMFE.tsx        # dynamic remote loader
│       ├── components/MFENotAvailable.tsx
│       ├── components/ErrorBoundary/MFEErrorBoundary.tsx
│       ├── components/Layout/Layout.tsx  # sidebar + topbar
│       ├── contexts/AuthContext.tsx      # auth shell (login/profile/logout)
│       ├── pages/          # Login, Dashboard, NotFound
│       ├── utils/sastStorage.ts          # wrapper localStorage (SAST-friendly)
│       ├── utils/sharedDependencies.ts   # seed __webpack_share_scopes__
│       └── types/remotes.d.ts            # deklarasi modul 'childMFE/Module'
│
└── template-mfe-child/       # @template/mfe-child (remote, port 5006)
    ├── webpack.config.cjs    # MF remote: name childMFE, exposes ./Module
    └── src/
        ├── index.tsx         # import('./bootstrap')
        ├── bootstrap.tsx     # mode standalone
        ├── App.tsx           # routes standalone
        ├── Module.tsx        # entry federation (dipakai shell)
        ├── pages/            # Home, NotFound
        ├── services/api.ts   # contoh api client
        └── utils/sastStorage.ts
```

## Konvensi Port

| Port | Untuk |
|------|-------|
| 5000 | Shell |
| 5001–5005 | reserved / microservices backend |
| 5006 | Child MFE 1 |
| 5007, 5008, ... | Child MFE berikutnya |
| 5139 | microservice auth (backend) |

## Workspace & Dependency

- `pnpm-workspace.yaml` → 3 package; shell & child depend `"@template/shared": "workspace:*"`.
- Shared pakai **peerDependencies** (react, react-dom, react-router-dom, @tanstack/react-query) supaya tidak duplikat React.
- Versi kunci: React `^18.3.1`, React Router `^6.30.1`, React Query `^5.84.2`, TypeScript `^5.9.2`, Webpack `^5.105.0`, Tailwind `^3.4.17`.
