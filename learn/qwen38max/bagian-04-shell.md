# Bagian 04 — Shell (Host App)

## Tanggung jawab shell
1. Halaman login + manajemen auth (AuthContext).
2. Layout global (sidebar + top bar).
3. Routing statis dan pemuatan child MFE (LazyMFE + MFEErrorBoundary).
4. Menyediakan shared dependencies (React dsb.) ke semua remote.

## Provider stack (`src/bootstrap.tsx`)

Urutan render (luar → dalam):

```
React.StrictMode
└─ QueryClientProvider (queryClient custom)
   └─ BrowserRouter
      └─ AuthProvider                      # auth asli shell
         └─ SharedAuthProvider             # bridge: inject authContext ke SharedProvider
            └─ LoadingProvider
               └─ TooltipProvider
                  ├─ App
                  ├─ SonnerToaster
                  └─ GlobalLoadingOverlay
   └─ ReactQueryDevtools (initialIsOpen=false)
```

- `initSharedDependencies()` dipanggil SEBELUM render (seed `__webpack_share_scopes__`).
- Bridge pattern: `SharedAuthProvider` = `useAuth()` (shell) → diteruskan sebagai
  prop `authContext` ke `SharedProvider` → child MFE bisa `useAuth()` dari shared.

## QueryClient default (keputusan penting)
- `staleTime: 5 menit`, `gcTime: 30 menit`
- `retry`: JANGAN retry untuk status 4xx (`failureCount < 3` hanya non-4xx)
- `refetchOnWindowFocus: false`; mutations: `retry: false`

## AuthContext (`src/contexts/AuthContext.tsx`)
- State: `user {id,email,name,roles[],permissions[]}`, `isLoading`.
- Init (mount): baca `token` dari storage → `GET {authApi}/Auth/profile` → set user;
  kalau gagal, bersihkan token.
- `login(email,password)`: `POST {authApi}/Auth/login` → simpan `token` +
  `authenticated` → fetch profile → navigate `/dashboard`.
  **Catatan**: ada *demo fallback* di catch — kalau API gagal, login tetap sukses
  sebagai "Demo Admin" (roles admin, permissions `*`) dengan token `demo-token`.
  Ini untuk kenyamanan template; harus dihapus di proyek nyata.
- `logout()`: hapus token/authenticated/user dari storage → navigate `/login`.
- `hasPermission(p)`: true kalau permissions berisi `*` atau p.
- `hasRole(r)`: true kalau roles berisi r ATAU berisi `admin` (admin bypass).
- `useAuth()` shell THROW kalau di luar provider (beda dengan shared yang fallback).

## Routing (`src/routes/routes.tsx`)
- `/login` → publik.
- Protected group: `ProtectedRoute` → `Layout` → `Outlet`; berisi
  `/` (redirect `/dashboard`), `/dashboard`, dan route MFE `/child/*`.
- Catch-all `*`: authenticated → `NotFound`; belum → redirect `/login`.
- `AppRoutes` sendiri render `PageLoader` selama `isLoading` auth.

## ProtectedRoute (`src/routes/ProtectedRoute.tsx`)
- isLoading → PageLoader; !isAuthenticated → `<Navigate to="/login" state={{from}}>`;
- prop opsional `permission` → kalau gagal, redirect `/unauthorized`.

## MFEErrorBoundary (`src/components/ErrorBoundary/MFEErrorBoundary.tsx`)
- Class component: `getDerivedStateFromError` + `componentDidCatch` (log).
- Fallback: `MFEErrorFallback` dari shared dengan tombol reset
  (`resetErrorBoundary` clear state). Isolasi: satu MFE crash tidak menjatuhkan shell.

## Layout (`src/components/Layout/Layout.tsx`)
- Array `navigation: NavigationItem[] {id,name,href,icon(lucide)}` —
  **tambah item di sini untuk MFE baru** (contoh: Dashboard `/dashboard`, Child MFE `/child`).
- Sidebar collapsible (w-64 ↔ w-20), state `sidebarExpanded` dipersist di storage.
- Top bar: info user + tombol logout.

## env.js (runtime config, di-root shell & copy `public/env.js`)
- IIFE yang set `window._env` (via getter + `Object.freeze`):
  `MODE`, `API_BASE_URL`, `MARQUEE {enabled,message}`, `ALLOWED_DOMAINS`,
  `APP_NAME`, `VERSION`, `getApiUrl(service)`, `getMfeUrl(name)`, `MFE_ROUTES`.
- `MICROSERVICE_PORTS = { auth: 5139 }`, `MFE_ROUTES = { childMfe: http://localhost:5006/remoteEntry.js }`.
- Di-load lewat `<script src="/env.js">` di `index.html` SEBELUM bundle app →
  bisa diganti per-deployment tanpa rebuild. `public/env.js` = stub override
  (`window._env = window._env || {}`) yang di-copy ke dist oleh CopyWebpackPlugin.

## sastStorage (`src/utils/sastStorage.ts`)
Wrapper localStorage dengan akses via bracket-string
(`window['local'+'Storage']['get'+'Item']`) — tujuannya agar scanner SAST tidak
menandai penggunaan langsung localStorage (juga ada salinan identik di child).

## remotes.d.ts
Deklarasi modul `'childMFE/Module'` (komponen dengan props `basePath?`, `subRoute?`)
agar TypeScript mengenal import remote — pola standar MF, walau di template ini
loading-nya dinamis via LazyMFE.
