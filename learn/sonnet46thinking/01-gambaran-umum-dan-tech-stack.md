# 01. Gambaran Umum & Tech Stack
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

Template ini adalah **monorepo micro-frontend (MFE)** berbasis Webpack Module Federation. Dirancang sebagai titik awal untuk membangun aplikasi React multi-tim dengan deployment terpisah per modul.

---

## Tech Stack Utama

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Framework | React + TypeScript | React 18 |
| Bundler | Webpack 5 | — |
| Federation | Webpack ModuleFederationPlugin | built-in |
| Package Manager | pnpm Workspaces | >= 8 |
| Data Fetching | TanStack Query (React Query) | v5 |
| Routing | React Router DOM | v6 |
| Styling | Tailwind CSS + shadcn/ui | — |
| Toast | Sonner | — |
| Dev Tooling | concurrently, ts-loader | — |

## Prasyarat

```bash
# Node.js >= 18
node --version

# Install pnpm secara global
npm install -g pnpm
pnpm --version  # >= 8
```

## Kapan Template Ini Digunakan?

Template ini tepat digunakan ketika:
- **Multiple tim** bekerja paralel di feature berbeda
- Perlu **independent deployment** — satu modul bisa deploy tanpa menyentuh yang lain
- **Bundle size** sudah terlalu besar, load awal lambat
- **Release cadence** berbeda-beda antar modul
- Perlu **isolasi kegagalan** — satu MFE down tidak crash seluruh aplikasi

## Tiga Package dalam Monorepo

| Package | Nama npm | Port | Peran |
|---------|----------|------|-------|
| `template-shell` | `@template/shell` | 5000 | Host / orchestrator |
| `template-mfe-child` | `@template/mfe-child` | 5006 | Remote MFE contoh |
| `template-shared` | `@template/shared` | — | Library bersama |

---
*Lanjut → [02. Struktur Monorepo](./02-struktur-monorepo-pnpm-workspaces.md)*
