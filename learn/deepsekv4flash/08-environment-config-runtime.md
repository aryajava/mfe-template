# 08 — Environment / Konfigurasi Runtime

## Konsep: Runtime Env via `window._env`

Konfigurasi environment **tidak** dibuild ke bundle (bukan `process.env.*` di build-time), melainkan di-*inject* ke browser lewat file `env.js` yang dipanggil sebelum bundle app.

### Shell: `template-shell/env.js` (sumber konfigurasi utama)

IIFE yang mendefinisikan dan membekukan `window._env`:

```js
(function () {
  const MODE = "local";

  const MARQUEE = { enabled: false, message: "This is a development environment" };
  const ALLOWED_DOMAINS = ["localhost"];

  const MICROSERVICE_PORTS = { auth: 5139 };

  const API_URLS = {
    local: `http://localhost:${MICROSERVICE_PORTS.auth}/api`,
  };

  const MFE_ROUTES = {
    childMfe: "http://localhost:5006/remoteEntry.js",
  };

  const _actualEnv = {
    MODE,
    API_BASE_URL: API_URLS[MODE] || API_URLS.local,
    MARQUEE,
    ALLOWED_DOMAINS,
    APP_NAME: "Template MFE Shell",
    VERSION: "1.0.0",
    getApiUrl(serviceName) { /* port dari MICROSERVICE_PORTS, default 5000 */ },
    getMfeUrl(mfeName) { return MFE_ROUTES[mfeName] || null; },
    MFE_ROUTES,
  };

  Object.defineProperty(window, '_env', { get() { return _actualEnv; } });
  Object.freeze(window._env);
  console.log("[ENV] Mode:", MODE);
})();
```

Poin penting:
- `Object.freeze` → runtime config **tidak bisa diubah** dari console/kode lain.
- `getApiUrl(serviceName)` → `http://localhost:<port>/api`.
- `getMfeUrl(mfeName)` → URL remoteEntry dari `MFE_ROUTES`.
- `APP_NAME`, `VERSION`, `MARQUEE`, `ALLOWED_DOMAINS` untuk keperluan shell.

### Shell: `public/env.js` (override runtime kosong)

```js
(function () { window._env = window._env || {}; })();
```
- Disalin ke output oleh `CopyWebpackPlugin` (dari `public/`).
- `index.html` memuat `<script src="/env.js">` di `<head>` → env tersedia sebelum bundle.
- Untuk deploy produksi, cukup ganti nilai di `env.js` (atau file override per environment) tanpa rebuild.

## Helper Akses di `@template/shared/src/lib/env.ts`

Semua helper **fallback ke nilai default** bila `window._env` tidak ada:

| Fungsi | Sumber | Fallback |
|--------|--------|----------|
| `getApiUrl(service)` | `window._env.getApiUrl` | map port hardcoded (auth 5139, workflow 5224, rules 5227, dedup 5084, portfolio 5091, screening 5291, partnership 5062, common 5062), default 5000 |
| `getAllApiUrls()` | `window._env.API_URLS` | objek dari `getApiUrl` tiap service |
| `getApiBaseUrl()` | `window._env.API_BASE_URL` | `http://localhost:5139/api` |
| `getEnvMode()` | `window._env.MODE` | `'local'` |
| `getEnvConfig()` | `window._env` | `{ MODE:'local', API_BASE_URL:'http://localhost:5000/api' }` |

## Cara Menambah MFE / Service Baru

1. **MFE baru** → tambah di `env.js`:
   ```js
   const MFE_ROUTES = {
     childMfe: "http://localhost:5006/remoteEntry.js",
     adminMfe: "http://localhost:5007/remoteEntry.js",
   };
   ```
   Lalu pakai `window._env.getMfeUrl('adminMfe')` atau daftar route shell.
2. **Service API baru** → tambah di `MICROSERVICE_PORTS`:
   ```js
   const MICROSERVICE_PORTS = { auth: 5139, workflow: 5224 };
   ```
   Akses via `getApiUrl('workflow')`.

## Catatan Produksi

- Ganti `MODE` & `API_URLS` sesuai environment (staging/prod).
- Update `MFE_ROUTES` ke URL deployed remoteEntry.
- `ALLOWED_DOMAINS` bisa dipakai untuk memfilter domain yang diizinkan.
- Karena `Object.freeze`, pastikan semua nilai sudah benar sebelum deploy.
