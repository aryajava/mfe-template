# 04 — Shell / Host App

Package: `template-shell` (`@template/shell`), port **5000**.

## Bootstrap & Provider Chain (`src/bootstrap.tsx`)

Urutan render (dari luar ke dalam):

```
<React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>                      // AuthContext shell (auth domain)
        <SharedAuthProvider>              // SharedProvider + authContext dari shell
          <LoadingProvider>
            <TooltipProvider>
              <App />
              <SonnerToaster />
              <GlobalLoadingOverlay />
            </TooltipProvider>
          </LoadingProvider>
        </SharedAuthProvider>
      </AuthProvider>
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
</React.StrictMode>
```

- `initSharedDependencies()` dipanggil di awal (lihat di bawah).
- `SharedAuthProvider` mengambil `authContext` dari `useAuth()` (AuthContext shell) lalu meneruskan ke `SharedProvider` — **inilah jalur auth mengalir ke seluruh app dan child MFE**.
- QueryClient dikonfigurasi: `staleTime: 5m`, `gcTime: 30m`, `retry` (4xx → false, selain itu max 3), `refetchOnWindowFocus: false`, mutation `retry: false`.

## Routing (`src/routes/routes.tsx`)

- Public: `/login` → `<Login />`.
- Protected (dibungkus `ProtectedRoute` + `Layout` + `<Outlet/>`):
  - `/` → redirect ke `/dashboard`
  - `/dashboard` → `<Dashboard />`
  - **`/child/*`** → `MFEErrorBoundary` + `LazyMFE`:
    ```tsx
    <LazyMFE scope="childMFE" module="./Module"
             url="http://localhost:5006/remoteEntry.js" basePath="/child" />
    ```
- Catch-all `*`: jika authenticated → `NotFound`, jika tidak → redirect `/login`.

## ProtectedRoute (`src/routes/ProtectedRoute.tsx`)

- Saat `isLoading` → tampilkan `PageLoader`.
- Jika belum auth → `<Navigate to="/login" state={{ from: location }} replace />`.
- Opsional prop `permission`: jika user tidak punya permission → redirect `/unauthorized`.
- Sisa → render children.

## Layout (`src/components/Layout/Layout.tsx`)

- **Sidebar** (fixed, collapsible `w-64` ⇄ `w-20`), state `sidebarExpanded` disimpan ke `localStorage` via `storage` (key `sidebarExpanded`).
- Navigasi statis: `Dashboard` (/dashboard), `Child MFE` (/child). Untuk menambah MFE, tambah item di array `navigation` + route di `routes.tsx`.
- Item aktif bila `location.pathname === href` atau dimulai `href + "/"`.
- **Top bar**: tombol toggle sidebar, avatar + nama user (`user?.name`), tombol logout.
- Styling Tailwind dengan aksen oranye.

## LazyMFE (`src/components/LazyMFE.tsx`) — Inti Loader Remote

Props: `scope`, `module`, `url`, `version?`, `fallback?`, `basePath?`, `subRoute?`.

Alur:
1. **Cache** `componentCache` (Map) dengan key `scope::module[::version]` → hindari muat ulang.
2. Jika belum di-cache, `loadRemoteContainer(scope, versionedUrl, version)`:
   - Dev (`localhost`/`127.0.0.1`): tambah query `_t=<timestamp>` ke URL (cache-busting untuk hot reload).
   - Produksi + ada `version`: tambah `?v=<version>` (cache-busting versi).
   - Buat elemen `<script src=url>` async, append ke `document.head`.
   - Ambil `window[scope]`, verifikasi `_initialized`, cek share scope (`window.__webpack_share_scopes__.default`) mengandung `react` & `react-dom`, lalu `container.init(shareScope)`.
   - Simpan container di `window[scope_v<version>]` untuk reuse.
3. `container.get(module)` → factory → ambil komponen. Normalisasi:
   - fungsi → langsung
   - `Module.default` → pakai default
   - `Module.__esModule && Module.Module` → pakai Module
   - cari kunci yang nilainya fungsi
   - selain itu → throw "No valid React component found".
4. Simpan ke cache, set state, render `<Component basePath subRoute />` dibungkus `<Suspense>`.

Error handling: tampilkan panel kuning "`{scope}` Not Available" dengan pesan dev (MFE tidak jalan / port salah).

> Container di-cache agar tidak double-load; `_initialized` mencegah `init()` dua kali.

## MFEErrorBoundary (`src/components/ErrorBoundary/MFEErrorBoundary.tsx`)

- Class component error boundary: `getDerivedStateFromError` → set `hasError` + `error`; `componentDidCatch` log ke console.
- Render fallback `MFEErrorFallback` dari `@template/shared` dengan `mfeName`, tombol "Try Again" (reset state).

## MFENotAvailable (`src/components/MFENotAvailable.tsx`)

- Komponen UI statis "module unavailable" (panel kuning) — fallback terpisah dari error boundary.

## sharedDependencies (`src/utils/sharedDependencies.ts`)

- `sharedModules`: map nama → modul (`react`, `react-dom`, `react/jsx-runtime`, `react-router-dom`, `@tanstack/react-query`).
- `initSharedDependencies()`:
  - Set `window.React`, `window.ReactDOM` bila belum ada.
  - Buat `window.__webpack_share_scopes__.default = {}` bila belum ada.
  - `registerModule(name, version, module)` — mengisi share scope dengan `get: () => Promise.resolve(() => module)`, `loaded: true`, `from: 'shell'`, `eager: true`.
  - Versi terdaftar: react 18.3.1, react-dom 18.3.1, react/jsx-runtime 18.3.1, react-router-dom 6.28.1, @tanstack/react-query 5.0.0.
- `getSharedModule(name)` → ambil dari map.
- Fungsinya: **menjamin share scope tersedia** sebelum LazyMFE meng-init container remote.

## sastStorage (`src/utils/sastStorage.ts`)

Wrapper localStorage dengan nama method/properti diobfuskasi via string concat (`'local'+'Storage'['get'+'Item']`) — pola anti-detect tooling/scan. API: `retrieve`, `store`, `remove`, `clear`.

## Tipe Remote (`src/types/remotes.d.ts`)

```ts
declare module 'childMFE/Module' {
  const Module: React.ComponentType<{ basePath?: string; subRoute?: string }>;
  export default Module;
}
```
Memberi type ke remote module agar TypeScript tidak error saat import (meski di template ini remote dimuat dinamis via LazyMFE, deklarasi ini untuk static imports bila diperlukan).

## Halaman Shell

- **Login** (`pages/Login.tsx`): form email/password, toggle show/hide password, tombol submit memanggil `login()` dari AuthContext, latar gradien oranye.
- **Dashboard** (`pages/Dashboard.tsx`): sapaan + kartu info (Getting Started, Child MFEs di `/child`, Shared Library).
- **NotFound** (`pages/NotFound.tsx`): layar 404 dengan tombol kembali ke dashboard.
