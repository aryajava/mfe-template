# 07 — Auth, Routing & Event Bus

## AuthContext (Shell) — `template-shell/src/contexts/AuthContext.tsx`

Data user:
```ts
interface User {
  id: string; email: string; name: string;
  roles: string[]; permissions: string[];
}
```

Context value: `{ user, isAuthenticated, isLoading, login, logout, hasPermission, hasRole }`.

### Inisialisasi
- `useEffect` on mount: jika ada `token` di storage → `fetchUserProfile(token)` (GET `${getApiUrl('auth')}/Auth/profile` dengan `Authorization: Bearer`). Respons → peta ke `User` (roles default `[role || 'user']`, permissions dari respons). Jika gagal → hapus token + `authenticated`.

### login(email, password)
- POST `${getApiUrl('auth')}/Auth/login` (JSON `{email, password}`).
- Ambil token (`data.token || data.Token`); simpan ke storage (`token`, `authenticated='true'`).
- `fetchUserProfile(token)` lalu `navigate('/dashboard')`.
- **Demo fallback**: jika error apa pun → buat `demoUser` (admin, permissions `['*']`), simpan `demo-token`, tetap login & navigate. (Khusus development.)

### logout()
- Hapus `token`, `authenticated`, `user` dari storage; `setUser(null)`; navigate `/login`.

### hasPermission / hasRole
- `hasPermission(p)`: tanpa permissions → false; `['*']` → true (wildcard); else `includes(p)`.
- `hasRole(r)`: `includes(r) || includes('admin')` (admin super).

### `useAuth` (shell)
- Hook lokal yang throw bila di luar `AuthProvider`.
- **Penting**: jangan tertukar dengan `useAuth` dari `@template/shared` (yang membaca `authContext` dari `SharedProvider`). Di shell, `SharedAuthProvider` menghubungkan keduanya.

## Alur Auth Mengalir ke Child MFE

```
AuthProvider (shell, domain asli)
   ↓ useAuth()  [hook shell]
SharedAuthProvider → <SharedProvider authContext={authContext}>
   ↓
Child MFE <Module> dibungkus SharedProvider-nya sendiri
   ↓
useAuth() dari @template/shared → membaca authContext → sama dengan auth shell
```
Jadi auth **single source of truth** di shell; child mengakses lewat shared context (tidak login ulang).

## Routing

### Shell (`routes.tsx`)
- `/login` publik.
- Route induk protected: `<ProtectedRoute><Layout><Outlet/></Layout></ProtectedRoute>` berisi `/` (redirect → dashboard), `/dashboard`, `/child/*` (LazyMFE).
- `*` → NotFound (jika auth) / redirect login.

### ProtectedRoute
- Cek `isLoading` → PageLoader; `isAuthenticated` → redirect ke login dengan `state.from`; `permission` opsional → redirect `/unauthorized`; else render children.

### Child MFE
- Standalone: `App.tsx` — `<Route index>` + `<Route path="*">`.
- Mode MFE: `Module.tsx` memakai `useLocation()` dan mencocokkan `location.pathname` relatif terhadap `basePath` (bukan react-router `<Routes>`), karena shell yang memegang router.

## Event Bus (`@template/shared/src/lib/eventBus.ts`)

- Singleton `eventBus` (Map event → Set callback).
- API: `subscribe(event, cb) → unsubscribe`, `publish(event, data)`, `once(event, cb) → unsubscribe`.
- `MFE_EVENTS` konstanta (lihat file 06) → komunikasi lintas MFE: navigasi, auth events, data updated, UI modal/toast, error.
- Hook `useEventBus` & `useEventSubscription` untuk integrasi React (auto cleanup).

## Storage (`sastStorage.ts`)

- Wrapper `localStorage`: `retrieve/store/remove/clear`, nama dipisah string concat untuk menghindari deteksi literal (`'local'+'Storage'`).
- Key yang dipakai: `token`, `authenticated`, `user` (Logout), `sidebarExpanded` (Layout).

## Keamanan yang Perlu Diperhatikan (Catatan)

- Template ini memakai **demo fallback login** — di produksi harus dihapus dan semua path melewati verifikasi nyata.
- Token disimpan di `localStorage` (rentan XSS); pertimbangkan httpOnly cookie + refresh token untuk produksi.
- CORS devServer `Access-Control-Allow-Origin: *` hanya untuk development; produksi harus di-lock ke domain shell.
