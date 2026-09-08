# Bagian 02 — Module Federation & Mekanisme Loading

## Konsep

Shell TIDAK mendeklarasikan `remotes:` di webpack config (dibiarkan `{}`).
Remote dimuat **dinamis saat runtime** oleh komponen `LazyMFE` — sehingga URL MFE
bisa berasal dari `env.js` dan bisa berubah tanpa rebuild shell.

## Konfigurasi Shell (host) — `template-shell/webpack.config.cjs`

```js
new ModuleFederationPlugin({
  name: 'shell',
  filename: 'remoteEntry.js',
  remotes: {},                        // dinamis via LazyMFE
  shared: {
    react:              { singleton: true, requiredVersion: false, strictVersion: false, eager: true },
    'react-dom':        { singleton: true, requiredVersion: false, strictVersion: false, eager: true },
    'react/jsx-runtime':{ singleton: true, requiredVersion: false, strictVersion: false, eager: true },
    'react-router-dom': { singleton: true, requiredVersion: false, strictVersion: false, eager: true },
    '@tanstack/react-query': { singleton: true, requiredVersion: false },
  },
})
```

Poin penting:
- Host pakai `eager: true` (React dimasukkan ke bundle awal host).
- `requiredVersion: false` + `strictVersion: false` → hindari error mismatch versi.

## Konfigurasi Child (remote) — `template-mfe-child/webpack.config.cjs`

```js
new ModuleFederationPlugin({
  name: 'childMFE',                   // harus unik per MFE (jadi global scope)
  filename: 'remoteEntry.js',
  exposes: { './Module': './src/Module.tsx' },
  shared: {
    react:               { singleton: true, requiredVersion: '^18.3.1', eager: false },
    'react-dom':         { singleton: true, requiredVersion: '^18.3.1', eager: false },
    'react/jsx-runtime': { singleton: true, requiredVersion: '^18.3.1', eager: false },
    'react-router-dom':  { singleton: true, requiredVersion: false, eager: false },
    '@tanstack/react-query': { singleton: true, requiredVersion: false },
  },
})
```

- Remote pakai `eager: false` (chunk async) + `output.publicPath: 'auto'`.
- devServer child mengirim header `Access-Control-Allow-Origin: *` (wajib untuk cross-origin fetch remoteEntry.js).

## LazyMFE — dynamic remote loader (`template-shell/src/components/LazyMFE.tsx`)

Props: `scope`, `module`, `url`, `version?`, `fallback?`, `basePath?`, `subRoute?`.

Alur kerja:
1. **Cache komponen** di `Map` module-level dengan key `scope::module(::version)` — remote hanya di-load sekali per sesi.
2. **Cache-busting dev**: jika hostname localhost, URL ditambah `?_t=Date.now()`; jika ada `version`, ditambah `?v=...`.
3. `loadRemoteContainer()`:
   - Cek `window[scope]` (atau `window[scope_vX]`) — kalau ada, pakai ulang.
   - Kalau tidak, inject `<script src=url async>` ke `document.head`.
   - Setelah load, ambil container = `window[scope]`.
   - Init share scope: `container.init(window.__webpack_share_scopes__.default)`, dengan validasi bahwa `react` & `react-dom` sudah ada di share scope (kalau tidak → throw).
   - Tandai `container._initialized = true` agar tidak double-init.
4. `container.get(module)` → factory → resolve komponen dengan fallback berlapis:
   function langsung → `.default` → `.Module` (esModule) → key function pertama.
5. Render dalam `<Suspense>` dengan props `basePath` & `subRoute`.
6. Error → tampilkan panel kuning "{scope} Not Available" (dev hint: cek dev server MFE jalan/tidak).
7. Loading → `<PageLoader />` dari shared.

## sharedDependencies.ts — seeding share scope (shell)

`initSharedDependencies()` dipanggil paling awal di `bootstrap.tsx` shell:
- Set `window.React` & `window.ReactDOM`.
- Jika `window.__webpack_share_scopes__` belum ada, buat `{ default: {} }`.
- Registrasi manual react 18.3.1, react-dom, react/jsx-runtime, react-router-dom 6.28.1, @tanstack/react-query 5.0.0 ke share scope dengan shape `{ get: () => Promise.resolve(() => module), loaded: true, from: 'shell', eager: true }`.
- Ini menjamin remote yang di-init manual (bukan lewat webpack runtime) tetap dapat singleton React dari shell.

## Pendaftaran route MFE di shell (`routes/routes.tsx`)

```tsx
<Route
  path="/child/*"                                  {/* '/*' = pass-through ke child */}
  element={
    <MFEErrorBoundary mfeName="Child MFE">
      <LazyMFE
        scope="childMFE"                           {/* = name di MF plugin child */}
        module="./Module"                          {/* = key di exposes */}
        url="http://localhost:5006/remoteEntry.js"
        basePath="/child"
      />
    </MFEErrorBoundary>
  }
/>
```

## Async boundary pattern

`index.tsx` (shell & child) hanya berisi `import('./bootstrap')` — dynamic import
wajib agar webpack MF sempat menegosiasikan shared modules sebelum React di-render.
