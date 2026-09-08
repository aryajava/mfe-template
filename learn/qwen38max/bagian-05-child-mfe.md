# Bagian 05 — Child MFE (Remote)

## Dua mode operasi

| Mode | Entry | Router | Kapan |
|------|-------|--------|-------|
| Standalone | `index.tsx` → `bootstrap.tsx` → `App.tsx` | BrowserRouter sendiri (routes relatif) | dev di port 5006 langsung |
| Federated | shell load `Module.tsx` via remoteEntry.js | ikut router shell; routing manual berbasis path | di dalam shell `/child/*` |

`index.tsx` = `import('./bootstrap')` (async boundary wajib untuk MF).

## Module.tsx — entry yang di-expose

```tsx
const Module: React.FC<ModuleProps> = (props) => (
  <SharedProvider>            {/* auth/query dari shell jika di-inject */}
    <LoadingProvider>
      <ModuleContent {...props} />
      <GlobalLoadingOverlay />
    </LoadingProvider>
  </SharedProvider>
);
```

- Props: `basePath?` (default `/child`) dan `subRoute?` — dikirim LazyMFE shell.
- `ModuleContent` melakukan **routing manual**:
  1. Jika `subRoute` ada → match ke page tertentu (contoh dikomentari: settings/details).
  2. Fallback: hitung `relativePath = currentPath.replace(basePath,'').replace(/^\//,'')`
     dari `useLocation()` — `''` → `<Home/>`, selain itu → `<NotFound/>`.
- Tidak pakai `<Routes>` di dalam shell — cukup if/else berbasis path
  (menghindari konflik nested router; shell yang pegang history).
- Ada `console.log` debug path — pola untuk troubleshooting routing MFE.

## App.tsx — routes standalone

```tsx
<Routes>
  <Route index element={<Home />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

## bootstrap.tsx — provider stack standalone

```
StrictMode > QueryClientProvider (QueryClient polos) > BrowserRouter
  > LoadingProvider > App + GlobalLoadingOverlay
```

Perbedaan vs shell: tidak ada AuthProvider (auth jadi no-op lewat
defaultAuthContext di SharedContext), tidak ada SharedProvider di level ini
(karena Module.tsx yang membungkusnya saat federated; untuk standalone,
komponen shared tetap aman karena useSharedContext punya fallback).

## services/api.ts — pola konsumsi API di child

```ts
export const getApiClient = () => {
  const token = storage.retrieve('token');          // token milik shell (localStorage sama, origin sama saat dev? lihat catatan)
  return createApiClient({
    baseUrl: getApiUrl('auth'),                     // dari window._env / fallback
    getToken: () => token,
    onUnauthorized: () => {                          // 401 → bersihkan + paksa ke /login
      storage.remove('token'); storage.remove('authenticated');
      window.location.href = '/login';
    },
  });
};
export const api = { getUsers, getUserById };
```

## Struktur yang disarankan saat membuat MFE baru (dari MIGRATION-GUIDE)

1. Copy `template-mfe-child/` → ganti nama package & folder.
2. `webpack.config.cjs`: ubah `name` MF (unik, mis. `adminMFE`) dan `port` devServer.
3. `Module.tsx`: sesuaikan `basePath` default + logika sub-route ke page kamu.
4. Pindahkan pages ke `src/pages/`, API calls ke `src/services/`.
5. Ganti import monolith dengan `@template/shared`.
6. Registrasi di shell: route `path="/xxx/*"` + LazyMFE (scope = name MF),
   `env.js` MFE_ROUTES, item navigasi Layout, `pnpm-workspace.yaml`, script `dev` root.

## Checklist kualitas (dari guide)

- [ ] Jalan standalone di port sendiri
- [ ] Jalan saat dimuat shell
- [ ] Tidak ada duplikat React (singleton)
- [ ] Auth context mengalir dari shell
- [ ] Navigasi antar MFE tanpa full page reload
- [ ] Error boundary menangkap kegagalan load
