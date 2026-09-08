# Bagian 06 — Build, Tooling & Environment

## Skrip root (`package.json`)

| Script | Isi / Catatan |
|--------|---------------|
| `start` / `start:all` | `pnpm install && pnpm dev` |
| `dev` | `concurrently --names "shell,child" --prefix-colors "yellow,cyan"` menjalankan dev shell + child paralel |
| `dev:shell` / `dev:child` | `pnpm --filter @template/<pkg> dev` |
| `build` | `build:shared` → build shell → build child (shared SELALU didahulukan) |
| `build:shared` | `pnpm --filter @template/shared build` = `tsc && node scripts/fix-imports.cjs` |
| `build:shell` / `build:child` | build shared dulu, lalu webpack production (child juga `tsc --noEmit` sebelum webpack) |
| `typecheck` | `pnpm -r typecheck` (tsc --noEmit semua package) |
| `clean` | `pnpm -r exec rm -rf dist node_modules .webpack-cache` |

Quick start: `start.sh` (cek pnpm terinstall → install deps kalau `node_modules`
tidak ada → `pnpm dev`) dan `start.ps1` (ekuivalen Windows).

## Webpack — detail yang layak dicontoh

**Shell** (`template-shell/webpack.config.cjs`):
- Function config `(env, argv) => ...`, mode dari `argv.mode`.
- `devtool`: dev `eval-source-map`, prod `source-map`.
- `cache: { type: 'filesystem', cacheDirectory: .webpack-cache }` → rebuild dev cepat.
- devServer: port 5000, `historyApiFallback: true` (SPA routing), `hot: true`,
  header CORS `*`.
- output: `[name].[contenthash].js`, `clean: true`, `publicPath: '/'`.
- optimization: `runtimeChunk: 'single'` + `splitChunks` cacheGroup `vendors`
  (semua node_modules) → caching jangka panjang.
- `CopyWebpackPlugin`: copy `public/` → dist (`noErrorOnMissing: true`),
  dipakai untuk `env.js` override.

**Child** (`template-mfe-child/webpack.config.cjs`):
- Mirip tapi: `publicPath: 'auto'` (WAJIB untuk remote MF agar asset URL
  relatif terhadap origin remote, bukan shell), tanpa splitChunks/runtimeChunk,
  tanpa filesystem cache.

**ts-loader**: shell pakai `transpileOnly: true` (cepat, typecheck terpisah via
`tsc --noEmit`); child tanpa transpileOnly. Keduanya exclude node_modules
kecuali `@template`.

## Tailwind

- `tailwind.config.ts` di shell & child; `content` mencakup
  `'../template-shared/src/**/*.{ts,tsx}'` → class Tailwind yang dipakai
  komponen shared ikut ter-generate di tiap app.
- `darkMode: ['class']`, plugin `tailwindcss-animate`, container center padding 2rem.
- PostCSS: `postcss.config.cjs` (tailwindcss + autoprefixer).
- CSS diproses via `style-loader → css-loader → postcss-loader` (inline di JS,
  cocok untuk MFE dev; tidak ada CSS extraction terpisah).

## TypeScript

- Per-package `tsconfig.json`; shared emit ESM ke `dist/` + declaration.
- `paths`/alias `@/*` → `src/*` dan `@template/shared` disamakan antara
  tsconfig (untuk editor/typecheck) dan webpack alias (untuk bundling).
- Typecheck adalah gate terpisah (`pnpm typecheck`), build dev tidak type-check.

## Runtime environment (window._env)

Desain "config after build":
1. `template-shell/env.js` (dev, di root package) — IIFE set `window._env`
   lengkap: MODE, API_BASE_URL, MARQUEE, ALLOWED_DOMAINS, APP_NAME, VERSION,
   helper `getApiUrl(service)` (dari MICROSERVICE_PORTS), `getMfeUrl(name)`
   (dari MFE_ROUTES). Property didefinisikan dengan getter lalu `Object.freeze`.
2. `index.html` memuat `<script src="/env.js">` sebelum bundle → nilai tersedia
   sebelum kode app jalan.
3. `public/env.js` = stub (`window._env = window._env || {}`) yang di-copy ke
   `dist/` → di produksi, ops mengganti file ini per environment TANPA rebuild.
4. Konsumen: `lib/env.ts` di shared (getApiUrl/getApiBaseUrl/getEnvMode/...)
   dengan fallback hard-coded bila `_env` tidak ada (aman untuk standalone child).

Untuk produksi: ubah URL di MFE_ROUTES/API_URLS ke host ter-deploy.

## pnpm workspace

- `pnpm-workspace.yaml`: 3 package. Protokol `workspace:*` untuk dependency
  internal (`@template/shared`).
- Shared dipublish-style: `exports` map subpath, `files: ["dist"]`,
  `prepublishOnly: build` — siap diangkat jadi package npm privat bila perlu.

## Hal yang TIDAK ada di template (perlu ditambah sendiri)

- Testing (tidak ada test framework sama sekali).
- ESLint config fisik (script `lint` ada, tapi tidak ada `.eslintrc` di repo).
- CI/CD pipeline.
- CSS extraction untuk produksi (masih style-loader).
- Auth refresh token / route `/unauthorized` (direferensikan ProtectedRoute tapi tidak didefinisikan).
