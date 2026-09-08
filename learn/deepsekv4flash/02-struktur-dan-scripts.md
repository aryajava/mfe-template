# 02 — Struktur Proyek & Scripts (pnpm)

> Fase 2 dari Jalur Belajar. Setelah paham konsep (`01`), kenali peta proyek ini.

## Konvensi Port

| Port | Proyek |
|------|--------|
| 5000 | Shell |
| 5001 | (reserved) |
| 5002–5005 | (reserved untuk services) |
| 5006 | Child MFE 1 (admin/contoh) |
| 5007 | Child MFE 2 |
| 5008 | Child MFE 3 |
| 5009–5010 | Child MFE 4–5 |

**Port microservice** (fallback di `template-shared/src/lib/env.ts`):
`auth` 5139 · `workflow` 5224 · `rules` 5227 · `dedup` 5084 · `portfolio` 5091 · `screening` 5291 · `partnership`/`common` 5062.

## Kenapa pnpm Workspace? (Pedagogi)

- Dependency di-hoist/disimpan sekali, tidak duplikat per package → hemat disk.
- `pnpm --filter <nama>` menjalankan script pada package tertentu (lihat script root).
- `workspace:*` pada `@template/shared` → package selalu merujuk versi lokal, bukan npm registry.

## Workspace Root

**`pnpm-workspace.yaml`** — mendefinisikan semua package:
```yaml
packages:
  - 'template-shared'
  - 'template-shell'
  - 'template-mfe-child'
```

**`package.json` (root)** — script agregat (memakai `pnpm --filter` dan `concurrently`):

| Command | Deskripsi |
|---------|-----------|
| `pnpm install` / `install:all` | Install semua dependency |
| `pnpm start` | `pnpm install && pnpm dev` |
| `pnpm dev` | Jalankan shell + child bersamaan (`concurrently`) |
| `pnpm dev:shell` | Shell saja |
| `pnpm dev:child` | Child saja |
| `pnpm build:shared` | Build shared library |
| `pnpm build:shell` | build shared dulu, lalu shell |
| `pnpm build:child` | build shared dulu, lalu child |
| `pnpm build` | build shared + shell + child |
| `pnpm typecheck` | `tsc --noEmit` semua package (`pnpm -r`) |
| `pnpm clean` | Hapus `dist`, `node_modules`, `.webpack-cache` |

Contoh dev script:
```json
"dev": "concurrently --names \"shell,child\" --prefix-colors \"yellow,cyan\" \
  \"pnpm --filter @template/shell dev\" \"pnpm --filter @template/mfe-child dev\""
```

## Quick Start

```bash
pnpm install
pnpm dev            # atau .\start.ps1 / ./start.sh
```
- Shell: http://localhost:5000
- Child (standalone): http://localhost:5006

`start.sh` / `start.ps1` hanya cek keberadaan pnpm, install bila belum ada `node_modules`, lalu jalankan `pnpm dev`.

## Struktur Package Per Aplikasi

| Package | Nama | Port | Script utama |
|---------|------|------|--------------|
| `template-shell` | `@template/shell` | 5000 | `webpack serve --mode development` |
| `template-mfe-child` | `@template/mfe-child` | 5006 | `webpack serve --mode development` |
| `template-shared` | `@template/shared` | — | `tsc && node scripts/fix-imports.cjs` |

Catatan:
- `template-shared` bertipe **ESM** (`"type": "module"`), `main/module/types` menunjuk ke `dist/index.js`.
- `exports` map sub-path: `.`, `./components`, `./components/ui`, `./hooks`, `./contexts`, `./lib`, `./types`.
- Child build menambah `tsc --noEmit` sebelum webpack; shell build tidak.
- Semua package `private: true`.

## Dependency Penting

- **Shell**: react, react-dom, react-router-dom, @tanstack/react-query (+devtools), sonner, lucide-react, `@template/shared` (workspace).
- **Child**: sama minus devtools & sonner (sonner di shell).
- **Shared**: peerDeps `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`; deps `@radix-ui/*` (dropdown-menu, label, slot, tooltip), `class-variance-authority`, `clsx`, `lucide-react`, `sonner`, `tailwind-merge`.
- **Dev umum**: webpack 5, webpack-cli, webpack-dev-server, ts-loader, typescript, tailwindcss 3.4, tailwindcss-animate, autoprefixer, postcss(-loader), css-loader, style-loader, html-webpack-plugin, copy-webpack-plugin (shell).
