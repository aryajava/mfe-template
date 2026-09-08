# 02. Struktur Monorepo pnpm Workspaces
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## Struktur Folder

```
mfe-template/
├── package.json              ← root workspace, scripts global
├── pnpm-workspace.yaml       ← mendaftarkan semua packages
├── start.ps1                 ← Windows one-command start
├── start.sh                  ← Linux/Mac one-command start
├── GETTING-STARTED.md
├── MIGRATION-GUIDE.md
├── AGENTS.md                 ← panduan untuk AI agents
├── docs/agents/              ← domain docs, issue tracker, triage labels
│
├── template-shared/          ← @template/shared
│   └── src/
│       ├── components/ui/    ← Button, Card, Input, Label, dll.
│       ├── components/common/← LoadingSpinner, ErrorFallback
│       ├── contexts/         ← SharedContext, LoadingContext
│       ├── hooks/            ← useAuth, useEventBus
│       ├── lib/              ← utils, eventBus, api client, env
│       └── types/
│
├── template-shell/           ← @template/shell (port 5000)
│   ├── webpack.config.cjs    ← Module Federation HOST config
│   ├── env.js                ← Runtime environment config
│   └── src/
│       ├── routes/routes.tsx ← Tambah MFE baru di sini
│       ├── components/       ← Layout, LazyMFE, ErrorBoundary
│       └── pages/            ← Login, Dashboard, NotFound
│
└── template-mfe-child/       ← @template/mfe-child (port 5006)
    ├── webpack.config.cjs    ← Module Federation REMOTE config
    └── src/
        ├── Module.tsx        ← Entry point Federation (di-expose)
        ├── App.tsx           ← Standalone mode routes
        └── pages/            ← Halaman-halaman MFE ini
```

## pnpm-workspace.yaml

```yaml
packages:
  - 'template-shared'
  - 'template-shell'
  - 'template-mfe-child'
  # tambah MFE baru di sini
```

Dengan konfigurasi ini, `@template/shared` bisa langsung di-import dari package manapun **tanpa publish ke npm registry**.

## Trick: Webpack Alias ke Source Langsung

Di `webpack.config.cjs` setiap package:
```javascript
alias: {
  '@template/shared': path.resolve(__dirname, '../template-shared/src'),
}
```

**Efek:** Import `from '@template/shared'` langsung resolve ke source TypeScript.  
**Manfaat:** Tidak perlu build step saat development. Edit shared → langsung terlihat tanpa restart.

## root package.json — Scripts Global

```json
{
  "scripts": {
    "start":         "pnpm install && pnpm dev",
    "dev":           "concurrently --names \"shell,child\" ...",
    "dev:shell":     "pnpm --filter @template/shell dev",
    "dev:child":     "pnpm --filter @template/mfe-child dev",
    "build":         "pnpm run build:shared && pnpm --filter @template/shell build && ...",
    "build:shared":  "pnpm --filter @template/shared build",
    "typecheck":     "pnpm -r typecheck",
    "clean":         "pnpm -r exec rm -rf dist node_modules .webpack-cache"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

**Catatan penting:**
- `pnpm -r` = recursive, jalankan di semua packages
- `pnpm --filter @template/xxx` = jalankan hanya di package tertentu
- `build` selalu dimulai dari `build:shared` karena packages lain depend padanya

---
*Lanjut → [03. Arsitektur Module Federation](./03-arsitektur-module-federation.md)*
