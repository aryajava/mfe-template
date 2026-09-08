# 03 — Module Federation & Webpack Config

> Fase 3 dari Jalur Belajar. Ini jantung mekanisme template. Dua file konfigurasi: `template-shell/webpack.config.cjs` (host) dan `template-mfe-child/webpack.config.cjs` (remote).

## Kenapa Modul Saja Cukup: Anatomi `remoteEntry.js`

Ketika child dinyalakan (`:5006`), webpack menyajikan file manifest kecil bernama `remoteEntry.js` (beberapa kilobyte, BUKAN seluruh bundle):
```ts
interface RemoteContainer {
  init: (shareScope: any) => Promise<void>;  // cocokkan dependensi singleton dari shell
  get: (module: string) => Promise<() => any>; // ambil factory komponen yang diekspos
}
```
Kode komponen sesungguhnya baru di-download **on-demand** saat `container.get('./Module')` dipanggil. Ini kenapa beberapa orang salah paham "remoteEntry berisi seluruh kode" — itu mitos (lihat [`14`](./14-ujian-dan-cheatsheet.md)).

## Kesamaan Kedua Konfigurasi

- `entry: './src/index.tsx'` → hanya `import('./bootstrap')` (pola **async boundary**, jelaskan di bawah).
- `devServer`: `historyApiFallback: true` (SPA routing), `hot: true`, header CORS `Access-Control-Allow-Origin: *` (**WAJIB** agar host bisa memuat remote cross-origin).
- `resolve`:
  ```js
  extensions: ['.tsx', '.ts', '.js', '.jsx'],
  modules: ['node_modules', path.resolve(__dirname, '../template-shared/src')],
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@template/shared': path.resolve(__dirname, '../template-shared/src'),
  },
  ```
  → `@template/shared` di-resolve ke **source**, bukan `dist` (tanpa build saat dev).
- `module.rules`:
  - `/\.tsx?$/` → `ts-loader` (shell pakai `transpileOnly: true`), exclude `/node_modules[\\\/](?!@template)/` (jangan kompilasi node_modules kecuali paket `@template`).
  - `/\.css$/` → `style-loader → css-loader → postcss-loader` (postcss = tailwind + autoprefixer).

## Host (`shell`) — port 5000

```js
output: { path: dist, filename: '[name].[contenthash].js', clean: true, publicPath: '/' }
optimization: { runtimeChunk: 'single', splitChunks: vendor (name: 'vendors', priority 10) }
plugins:
  new ModuleFederationPlugin({
    name: 'shell',
    filename: 'remoteEntry.js',
    remotes: {},           // kosong → remote dimuat dinamis oleh LazyMFE
    shared: {
      react: { singleton: true, requiredVersion: false, strictVersion: false, eager: true },
      'react-dom': { ... eager: true },
      'react/jsx-runtime': { ... eager: true },
      'react-router-dom': { ... eager: true },
      '@tanstack/react-query': { singleton: true, requiredVersion: false }, // tanpa eager
    },
  }),
  new HtmlWebpackPlugin({ template: './index.html' }),
  new CopyWebpackPlugin({ patterns: [{ from: 'public', to: '.', noErrorOnMissing: true }] }), // salin env.js
```
- `cache: { type: 'filesystem', cacheDirectory: '.webpack-cache' }` → build lebih cepat.

## Remote (`childMFE`) — port 5006

```js
output: { ..., publicPath: 'auto' }   // asset path ikut lokasi remote
plugins:
  new ModuleFederationPlugin({
    name: 'childMFE',
    filename: 'remoteEntry.js',
    exposes: { './Module': './src/Module.tsx' },   // satu-satunya entry yang diekspos
    shared: {
      react: { singleton: true, requiredVersion: '^18.3.1', strictVersion: false, eager: false },
      'react-dom': { ... requiredVersion: '^18.3.1', eager: false },
      'react/jsx-runtime': { ... eager: false },
      'react-router-dom': { singleton: true, requiredVersion: false, eager: false },
      '@tanstack/react-query': { singleton: true, requiredVersion: false },
    },
  }),
```
- Remote memakai `requiredVersion` konkret untuk React (^18.3.1), `eager: false` (menunggu di-share host).
- `publicPath: 'auto'` (remote) vs `publicPath: '/'` (shell): remote butuh `auto` agar chunk internal di-resolve relatif terhadap URL remoteEntry.

## Kenapa React Wajib `singleton: true`?

Hooks React (`useState`, `useEffect`, `useContext`) bergantung pada **Current Dispatcher** di variabel privat modul React. Jika ada 2 salinan React:
1. Shell memuat `React_A`, child mengunduh `React_B`.
2. Komponen child dirender di dalam virtual DOM milik `React_A`.
3. `useState()` di child mencari dispatcher dari `React_B`, padahal yang aktif `React_A`.
4. → runtime fatal: `Error: Invalid hook call. Hooks can only be called inside the body of a function component.`

Dengan `singleton: true`, Module Federation memastikan semua MFE memakai **satu pointer React yang sama** di memori.

## Kenapa `eager: true` Hanya di Shell?

```
index.tsx → import('./bootstrap')   // dynamic import
Cek cek: module federation perlu NEGOTIASI shared module secara async.
Jika shared deps TIDAK eager di shell:
  bootstrap mulai mount → "butuh React, tapi React belum ready (masih async)" → ERROR.
Dengan eager: true di shell:
  React, react-dom, react-router-dom tersedia sinkron → bootstrap bisa mount.
Child TIDAK perlu eager:
  Module.tsx di-load secara async oleh LazyMFE → sudah dalam konteks async, aman.
```

## Pola Penting: Async Bootstrap

`index.tsx` berisi `import('./bootstrap')` — **bukan** static import. Module Federation butuh waktu async untuk negotiate shared modules. Dynamic import memberi waktu itu sebelum React di-mount. Analogi: `await` semua dependency siap dulu, baru eksekusi.

## Catatan Detail Lain

- `requiredVersion: false` + `strictVersion: false` = fleksibel, versi tidak diperiksa ketat.
- **Redundansi ganda share scope**: selain config webpack, shell juga men-seed `window.__webpack_share_scopes__` manual via `initSharedDependencies()` (lihat [`04-shell-host.md`](./04-shell-host.md)) — memastikan share scope tersedia sebelum LazyMFE `container.init()`.
- `transpileOnly: true` (shell) = build cepat, TAPI **tidak menggantikan `pnpm typecheck`**.
- Untuk MFE tambahan: salin `template-mfe-child`, ganti `name` (scope unik), `port`, dan `exposes`.

---
Lanjut ke [**04. Shell / Host App**](./04-shell-host.md)