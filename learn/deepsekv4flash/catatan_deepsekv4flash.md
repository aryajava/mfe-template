# Catatan DeepSeek V4 Flash — Template MFE

> Dokumentasi pengetahuan lengkap yang digali dari template `mfe-template` (Micro-Frontend berbasis Webpack Module Federation + React 18 + pnpm monorepo).
> File ini adalah **induk / daftar isi (TOC)**. Detail setiap topik ada di file potongan (`NN-*.md`) di folder yang sama.

## Cara Menggunakan

- Baca file induk ini untuk memahami peta pengetahuan & struktur.
- Untuk detail mendalam tiap topik, buka file potongan sesuai daftar isi.
- Setiap file potongan bersifat mandiri (self-contained) agar mudah dimuat per-konteks (mis. sebagai context LLM).

---

## Daftar Isi (TOC)

| # | Topik | File Potongan |
|---|-------|---------------|
| 1 | Overview & Arsitektur MFE | [`01-overview-dan-arsitektur.md`](./01-overview-dan-arsitektur.md) |
| 2 | Struktur Proyek & Scripts (pnpm) | [`02-struktur-proyek-dan-scripts.md`](./02-struktur-proyek-dan-scripts.md) |
| 3 | Module Federation & Webpack Config | [`03-module-federation-webpack.md`](./03-module-federation-webpack.md) |
| 4 | Shell / Host App | [`04-shell-host.md`](./04-shell-host.md) |
| 5 | Child MFE / Remote | [`05-child-mfe-remote.md`](./05-child-mfe-remote.md) |
| 6 | Shared Library (`@template/shared`) | [`06-shared-library.md`](./06-shared-library.md) |
| 7 | Auth, Routing & Event Bus | [`07-auth-routing-eventbus.md`](./07-auth-routing-eventbus.md) |
| 8 | Environment / Konfigurasi Runtime | [`08-environment-config-runtime.md`](./08-environment-config-runtime.md) |
| 9 | Migrasi Monolith → MFE | [`09-migrasi-monolith-ke-mfe.md`](./09-migrasi-monolith-ke-mfe.md) |
| 10 | Referensi Cepat (Port, Pitfall, Checklist) | [`10-referensi-cepat.md`](./10-referensi-cepat.md) |

---

## Ringkasan Arsitektur (30 Detik)

```
┌─────────────────────────────────────────────────────────────┐
│  SHELL / HOST  (port 5000)  — @template/shell               │
│  Login, Dashboard, Layout(Sidebar+Topbar), LazyMFE loader,  │
│  AuthContext, Module Federation HOST (shared deps)          │
└───────────────┬─────────────────────────────────────────────┘
                │  load remoteEntry.js secara dinamis (LazyMFE)
                ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│  CHILD MFE  (port 5006)     │   │  @template/shared         │
│  @template/mfe-child        │   │  library bersama:         │
│  exposes ./Module           │   │  UI components, contexts, │
│  standalone + MFE mode      │   │  hooks, lib(api, env,     │
│                             │   │  eventBus, utils), types  │
└─────────────────────────────┘   └───────────────────────────┘
```

**Konsep kunci:**
- **Module Federation**: Shell men-download `remoteEntry.js` dari Child, lalu memuat komponen `./Module` dari scope `childMFE` secara lazy.
- **Dependensi bersama (singleton)**: `react`, `react-dom`, `react/jsx-runtime`, `react-router-dom`, `@tanstack/react-query` di-share agar tidak ada duplikasi React.
- **Dual mode Child MFE**: berjalan mandiri via `App.tsx`/`bootstrap.tsx`, atau dirender shell via `Module.tsx`.
- **Alias dev tanpa build**: webpack alias `@template/shared` → `../template-shared/src`, jadi tidak perlu build shared saat development.

---

## Peta File Lengkap Template

```
mfe-template/
├── package.json              # Workspace root, script agregat
├── pnpm-workspace.yaml       # Daftar package
├── pnpm-lock.yaml
├── start.ps1 / start.sh      # Quick start Windows / Linux-Mac
├── GETTING-STARTED.md        # Panduan mulai
├── MIGRATION-GUIDE.md        # Panduan migrasi monolith → MFE
│
├── template-shared/          # @template/shared (ESM, build tsc)
│   ├── scripts/fix-imports.cjs   # Perbaiki ekstensi .js di dist
│   ├── src/
│   │   ├── index.ts               # Re-export semua
│   │   ├── components/
│   │   │   ├── ui/        button, card, input, label,
│   │   │   │              tooltip, dropdown-menu, sonner
│   │   │   └── common/    LoadingSpinner(+PageLoader),
│   │   │                  GlobalLoadingOverlay, ErrorFallback(+MFEErrorFallback)
│   │   ├── contexts/      SharedContext, LoadingContext
│   │   ├── hooks/         useAuth, useEventBus(+useEventSubscription)
│   │   ├── lib/           utils(cn,format,timer), eventBus(+MFE_EVENTS),
│   │   │                  api(createApiClient), env(getApiUrl,dsb)
│   │   ├── types/         PaginatedResponse, ApiResponse, dsb
│   │   └── styles/globals.css  # Tema HSL (light/dark)
│   └── tsconfig.json
│
├── template-shell/          # @template/shell — Host (port 5000)
│   ├── webpack.config.cjs   # ModuleFederationPlugin HOST
│   ├── env.js               # Konfigurasi runtime (window._env)
│   ├── public/env.js        # Override runtime kosong
│   └── src/
│       ├── index.tsx → bootstrap.tsx   # Provider chain
│       ├── App.tsx → routes/routes.tsx
│       ├── routes/          routes.tsx, ProtectedRoute.tsx
│       ├── components/      LazyMFE, MFENotAvailable,
│       │                    Layout/, ErrorBoundary/
│       ├── contexts/        AuthContext.tsx
│       ├── pages/           Login, Dashboard, NotFound
│       ├── types/           remotes.d.ts (deklarasi remote)
│       └── utils/           sharedDependencies.ts, sastStorage.ts
│
└── template-mfe-child/      # @template/mfe-child — Remote (port 5006)
    ├── webpack.config.cjs   # ModuleFederationPlugin REMOTE (exposes ./Module)
    └── src/
        ├── index.tsx → bootstrap.tsx   # Standalone mode
        ├── App.tsx         # Route standalone
        ├── Module.tsx      # Entry point saat dimuat shell
        ├── pages/          Home, NotFound
        ├── services/       api.ts (contoh API client)
        └── utils/          sastStorage.ts
```

---

## Aturan Emas (Ringkasan)

1. **Singleton React wajib** di semua webpack MF config, `eager: true` di shell agar MFE langsung dapat share scope saat remote di-load.
2. **LazyMFE** memuat remote secara dinamis: `scope`, `module`, `url` (bisa `version`), + cache per `version`.
3. **Auth mengalir** dari shell ke child melalui `SharedProvider` yang membungkus `authContext` (AuthContext shell).
4. **Port convention**: 5000 shell, 5006 child pertama, dst (5007, 5008, ...).
5. **Route shell** untuk MFE pakai `path="/child/*"` agar sub-route diteruskan; Child melakukan path-matching relatif terhadap `basePath`.
6. **Storage** memakai `sastStorage` (wrapper obfuscated `localStorage`) — token & sesi di `localStorage`.
7. **Runtime env** via `window._env` (objek dibekukan `Object.freeze`), bukan env build-time.
8. **Shared library build** butuh `node scripts/fix-imports.cjs` karena TS ESM harus eksplisit ekstensi `.js` di import.

---

## Konvensi Nama Scope & Remote

| Scope (Module Federation) | Package | Port | Entry |
|---------------------------|---------|------|-------|
| `shell` | `@template/shell` | 5000 | host (remotes kosong, dinamis) |
| `childMFE` | `@template/mfe-child` | 5006 | exposes `./Module` → `src/Module.tsx` |

---

## Tech Stack

- **React 18.3.x** + TypeScript 5.9, React Router 6.30
- **TanStack React Query 5** (query client + devtools di shell)
- **Webpack 5** + Module Federation + `ts-loader` + dev-server
- **Tailwind CSS 3.4** + `tailwindcss-animate` (shadcn-style, Radix UI primitives)
- **pnpm workspace** + `concurrently`
- UI: lucide-react icons, sonner (toast), Radix (dropdown, label, slot, tooltip)
