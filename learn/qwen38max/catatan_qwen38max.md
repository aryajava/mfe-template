# Catatan Analisa Template MFE — qwen38max

> Repo: `mfe-template` — Template Micro-Frontend (Module Federation) berbasis pnpm monorepo.
> Tanggal analisa: 2026-09-08

## Ringkasan Eksekutif

Template ini adalah **monorepo pnpm** berisi 3 package untuk arsitektur Micro-Frontend (MFE):

| Package | Nama npm | Peran | Port |
|---------|----------|-------|------|
| `template-shell/` | `@template/shell` | Host app (login, layout, routing, loader MFE) | 5000 |
| `template-mfe-child/` | `@template/mfe-child` | Remote MFE contoh (exposes `./Module`) | 5006 |
| `template-shared/` | `@template/shared` | Shared library (UI, hooks, contexts, utils, api) | — |

Stack inti: **React 18 + TypeScript + Webpack 5 (Module Federation) + Tailwind CSS + React Router 6 + TanStack React Query 5 + Radix UI + shadcn-style components**.

Prinsip utama:
1. Shell memuat remote MFE **secara dinamis saat runtime** via komponen `LazyMFE` (bukan `remotes:` statis di webpack) — `remotes: {}` kosong.
2. React/ReactDOM/React Router/React Query di-share sebagai **singleton** antar shell & child.
3. Child MFE bisa jalan **standalone** (via `App.tsx` + `bootstrap.tsx`) maupun **di dalam shell** (via `Module.tsx`).
4. `@template/shared` di-resolve ke **source code** saat dev via webpack alias (tanpa build step); untuk produksi di-build dengan `tsc` + script `fix-imports.cjs`.
5. Konfigurasi environment runtime lewat `window._env` (`env.js` yang di-load via `<script>` di HTML, bisa di-override tanpa rebuild).

## Daftar Isi (potongan catatan)

1. [Arsitektur & Struktur Repo](./bagian-01-arsitektur.md)
2. [Module Federation & Mekanisme Loading (LazyMFE)](./bagian-02-module-federation.md)
3. [Shared Library (@template/shared)](./bagian-03-shared-library.md)
4. [Shell (Host App)](./bagian-04-shell.md)
5. [Child MFE (Remote)](./bagian-05-child-mfe.md)
6. [Build, Tooling & Environment](./bagian-06-build-tooling.md)
7. [Panduan Migrasi Monolith → MFE & Common Pitfalls](./bagian-07-migrasi-dan-pitfalls.md)

## Perintah Penting

```bash
pnpm install        # install semua
pnpm start          # install + dev (shell + child concurrently)
pnpm dev            # shell (5000) + child (5006) paralel via concurrently
pnpm build          # build shared → shell → child
pnpm typecheck      # tsc --noEmit di semua package
pnpm clean          # hapus dist/node_modules/.webpack-cache
```
