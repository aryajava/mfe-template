# 05 — Child MFE / Remote

> Fase 4 dari Jalur Belajar. Lanjut ke remote yang dimuat shell.

Package: `template-mfe-child` (`@template/mfe-child`), port **5006**, scope Module Federation: **`childMFE`**.

## Dua Mode Operasi

```
Standalone Mode:
  index.tsx → bootstrap.tsx → BrowserRouter → App.tsx → routes standalone

Federated Mode (dimuat shell):
  remoteEntry.js → container.get('./Module') → Module.tsx → SharedProvider → ModuleContent
```

## Entry & Bootstrap (`src/index.tsx` → `src/bootstrap.tsx`)

- `index.tsx`: `import('./bootstrap')` (async boundary Module Federation).
- `bootstrap.tsx` membangun:
  ```
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <LoadingProvider>
          <App />
          <GlobalLoadingOverlay />
        </LoadingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
  ```
- Perhatikan: standalone **tidak** punya AuthProvider/SharedProvider dengan auth — child mengandalkan shared context saat dimuat shell. (Pattern lebih lengkap: child membungkus dengan `SharedProvider` — lihat `Module.tsx`.)

## Module.tsx — Entry Point Saat Dimuat Shell

```tsx
interface ModuleProps { basePath?: string; subRoute?: string; }
```

- `ModuleContent`:
  - `basePath` default `'/child'` (harus cocok dengan route shell).
  - Gunakan `useLocation()` (React Router) untuk membaca `location.pathname`.
  - Jika `subRoute` diberikan → tambahkan penanganan sub-route di sini (contoh komentar: `if (subRoute === 'settings') return <Settings />`).
  - **Path-based fallback**: hitung `relativePath = currentPath.replace(basePath, '').replace(/^\//, '')`; kosong → `<Home />`; selain itu `<NotFound />`. Tambahkan pencocokan lain mis. `relativePath.startsWith('settings')`.
- `Module` membungkus `ModuleContent` dengan:
  ```tsx
  <SharedProvider>
    <LoadingProvider>
      <ModuleContent {...props} />
      <GlobalLoadingOverlay />
    </LoadingProvider>
  </SharedProvider>
  ```
  → Child memakai `SharedProvider` untuk mendapat queryClient baru, apiBaseUrl, dan eventBus.
  ⚠️ **Perhatikan:** `SharedProvider` di sini dibuat **TANPA props** → `authContext` memakai default kosong. Artinya auth shell **TIDAK otomatis mengalir** ke child. Bila child butuh user/permission shell, `authContext` harus di-inject eksplisit (lihat [`12-risiko-dan-gap-produksi.md`](./12-risiko-dan-gap-produksi.md)).

## App.tsx — Route Standalone

```tsx
<Routes>
  <Route index element={<Home />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```
Route relatif terhadap base (tidak diawali `/child`).

## Halaman

- **Home** (`pages/Home.tsx`): kartu Analytics / Documents / Settings + panduan quick start (tambah pages, route di App.tsx, sub-route di Module.tsx, service di services/, daftarkan di shell).
- **NotFound** (`pages/NotFound.tsx`): layar 404 dalam modul.

## Contoh Service (`src/services/api.ts`)

```ts
import { createApiClient, getApiUrl } from '@template/shared';
import { storage } from '../utils/sastStorage';

export const getApiClient = () => {
  const token = storage.retrieve('token');
  return createApiClient({
    baseUrl: getApiUrl('auth'),
    getToken: () => token,
    onUnauthorized: () => {
      storage.remove('token');
      storage.remove('authenticated');
      window.location.href = '/login';
    },
  });
};

export const api = {
  getUsers: async () => (await getApiClient()).get<any>('/users'),
  getUserById: async (id: string) => (await getApiClient()).get<any>(`/users/${id}`),
};
```
- Mengambil token dari `sastStorage` (localStorage).
- Saat 401 → hapus sesi + redirect ke `/login` (di-configure lewat `onUnauthorized`).
- `sastStorage` di child identik dengan di shell.

## Global CSS (`src/global.css`)

- Import font Inter, `@tailwind base/components/utilities`, tema HSL light (warna sama dengan shell: primary oranye 24 95% 53%, radius 0.5rem), `* { @apply border-border; }`, body `bg-background text-foreground` font Inter.

## Tailwind Config (`tailwind.config.ts`)

- `content`: `./src/**/*`, `./index.html`, `../template-shared/src/**/*` (agar kelas shared ikut ter-compile).
- Theme extend: warna shadcn (border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card), radius, keyframes accordion, plugin `tailwindcss-animate`.

## Konfigurasi TS (`tsconfig.json`)

- `strict: false`, `noImplicitAny: false`, `moduleResolution: bundler`, `jsx: react-jsx`, target ES2020.
- `paths`: `@/* → ./src/*`, `@template/shared → ../template-shared/src`.

## Panduan Menambah MFE Baru (copy child ini)
1. Salin folder `template-mfe-child`.
2. Ganti nama package & scope Module Federation (`name`), `port` devServer, `basePath` default.
3. Tulis pages & services di `src/pages/`, `src/services/`.
4. Atur routing di `Module.tsx` (mode MFE) dan `App.tsx` (standalone).
5. Daftarkan di shell: route `/xxx/*` + `LazyMFE` + tambah item Layout.
