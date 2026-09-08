# 07 — Auth, Routing & Event Bus

> Fase 5 dari Jalur Belajar. Komunikasi antar MFE: state auth, URL, dan event.

## Mental Model: Routing SPA vs Nginx

Banyak backend mengira routing MFE seperti rewrite Nginx (browser minta HTML ke server). **Bukan.**

- Aplikasi web tradisional: klik `/users` → HTTP GET ke server → HTML baru → reload (layar berkedip).
- SPA/MFE: HTML hanya diunduh **sekali**. Ketika pindah halaman:
  1. Browser **TIDAK** kirim request HTML.
  2. JS memanggil **HTML5 History API** (`window.history.pushState`) → URL berubah, tab tidak reload.
  3. React Router mendeteksi perubahan URL di memori → me-mount komponen yang sesuai.

**Koordinasi Shell ↔ Child:**
- Shell = **Router Induk**: `path="/child/*"` (splat `/*` meneruskan seluruh sub-route) → render `LazyMFE` dengan `basePath="/child"`.
- Child = **Sub-Router**: di `Module.tsx`, hitung path relatif: `currentPath.replace(basePath, '').replace(/^\//, '')`, lalu match (`''`→Home, `users`→Users, dsb.).
- F5 langsung dari URL bar: butuh `historyApiFallback: true` di devServer (sudah ada). Di produksi, server web perlu `try_files $uri /index.html`.

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
- **Demo fallback**: jika error apa pun → buat `demoUser` (admin, permissions `['*']`), simpan `demo-token`, tetap login & navigate. ⚠️ Khusus development — **wajib dihapus untuk produksi** (kegagalan API terlihat seperti login berhasil).

### logout()
- Hapus `token`, `authenticated`, `user` dari storage; `setUser(null)`; navigate `/login`.

### hasPermission / hasRole
- `hasPermission(p)`: tanpa permissions → false; `['*']` → true (wildcard); else `includes(p)`.
- `hasRole(r)`: `includes(r) || includes('admin')` (admin dianggap super-user).

### `useAuth` (shell)
- Hook lokal yang throw bila di luar `AuthProvider`.
- **Penting:** jangan tertukar dengan `useAuth` dari `@template/shared` (membaca `authContext` dari `SharedProvider`).

**Perbandingan dua `useAuth` — salah import = behavior berbeda:**

| | `useAuth` (shell) | `useAuth` (shared) |
|--|-------------------|--------------------|
| Import dari | `../contexts/AuthContext` (shell saja) | `@template/shared` |
| Sumber data | `AuthContext` dari `AuthProvider` | `authContext` di dalam `SharedProvider` |
| Di luar provider | ❌ **THROW error** | ✅ Return fallback kosong (`user: null`) |
| Dipakai di | Komponen shell (Login, Layout, routes) | Child MFE & shared components |

> Cara ingat: **shell = throw** (aplikasi host wajib punya auth), **shared = fallback** (child boleh standalone).

## Alur Auth: Kenyataan vs Niat (PENTING)

**Niat (design):**
```
AuthProvider (shell) → useAuth() → SharedAuthProvider → <SharedProvider authContext={authContext}>
Child <Module> dibungkus SharedProvider → useAuth() @template/shared membaca authContext yang sama
```

**Kenyataan di template ini (gap nyata):**
`Module.tsx` child membuat `SharedProvider` **tanpa props** → `authContext` memakai `defaultAuthContext` kosong (`user: null`). Jadi **auth shell TIDAK otomatis mengalir ke child**. Gabungan `SharedProvider` yang terhubung tidak terjadi hanya karena kedua pakai nama yang sama — context dihubungkan oleh props, bukan sihir.

**Kontrak yang harus dibuat eksplisit** jika child butuh auth (lihat [`12-risiko-dan-gap-produksi.md`](./12-risiko-dan-gap-produksi.md)):
- Shell meneruskan `authContext` ke `SharedProvider`.
- Child menerima `authContext` sebagai prop (dari shell via `Module` props) dan meneruskan ke `SharedProvider`-nya.
- Atau gunakan event bus / query string untuk info sesi (token tetap di `localStorage`).

## Routing

### Shell (`routes.tsx`)
- `/login` publik.
- Route induk protected: `<ProtectedRoute><Layout><Outlet/></Layout></ProtectedRoute>` berisi `/` (redirect → dashboard), `/dashboard`, `/child/*` (LazyMFE).
- `*` → NotFound (jika auth) / redirect login.

### ProtectedRoute
- Cek `isLoading` → PageLoader; `isAuthenticated` → redirect login dengan `state.from`; `permission` opsional → redirect `/unauthorized`; else render children.
- ⚠️ `/unauthorized` **tidak didaftarkan** sebagai route eksplisit → wildcard `*` yang menanganinya (gap, lihat [`12`](./12-risiko-dan-gap-produksi.md)).

### Child MFE
- Standalone: `App.tsx` — `<Route index>` + `<Route path="*">`.
- Federated: `Module.tsx` memakai `useLocation()` + path-matching relatif terhadap `basePath` (bukan `<Routes>`), karena shell yang memegang router.

## Event Bus — Komunikasi Lintas MFE

**Mental model:** EventBus ≈ **Message Broker (Kafka/RabbitMQ) mini di memori browser**. Pengirim publish tanpa tahu siapa penerima; penerima subscribe per topik.

`@template/shared/src/lib/eventBus.ts`:
- Singleton `eventBus` (Map event → Set callback).
- API: `subscribe(event, cb) → unsubscribe`, `publish(event, data)`, `once(event, cb) → unsubscribe` (auto cleanup saat unmount via `useEventBus`).
- **Kontrak event lintas MFE** — `MFE_EVENTS` (const):
  - Navigasi: `NAVIGATE_TO` (mfe:navigate), `NAVIGATION_COMPLETE`
  - Auth: `USER_LOGGED_IN`, `USER_LOGGED_OUT`, `SESSION_EXPIRED`, `TOKEN_REFRESHED`
  - Data: `DATA_UPDATED`, `CACHE_INVALIDATE`
  - UI: `NOTIFICATION_SHOW`, `MODAL_OPEN`, `MODAL_CLOSE`, `SIDEBAR_TOGGLE`
  - Error: `MFE_ERROR`, `API_ERROR`

`useEventBus` & `useEventSubscription` untuk integrasi React (auto cleanup).
⚠️ Event bus ini **in-memory** — tidak lintas tab; efektivitas antar remote bergantung pada satu instance modul `@template/shared` yang benar-benar dibagi (singleton).

### Rahasia Standalone Mode — `useSharedContext` tidak throw
```ts
export const useSharedContext = (): SharedContextType => {
  const context = useContext(SharedContext);
  if (!context) return defaultFallbackContext; // fallback cerdas: tidak crash
  return context;
};
```
Saat child standalone (`:5006`), tidak ada shell yang membungkus `SharedProvider` → alih-alih crash, `useSharedContext()` mengembalikan `defaultFallbackContext` (auth kosong, QueryClient baru). Ini yang membuat child bisa di-develop mandiri. **Kontras**: `useAuth` shell THROW bila di luar `AuthProvider`.

## Storage (`sastStorage.ts`)

- Wrapper `localStorage`: `retrieve/store/remove/clear`, nama dipisah string concat (`'local'+'Storage'`) — hanya **obfuscation** untuk menghindari deteksi literal SAST scanner, **bukan** mekanisme keamanan nyata.
- Key yang dipakai: `token`, `authenticated`, `user` (Logout), `sidebarExpanded` (Layout).

## Keamanan (Catatan)

- **Demo fallback login wajib dihapus** di produksi.
- Token di `localStorage` rentan XSS → pertimbangkan httpOnly cookie + refresh token.
- CORS devServer `Access-Control-Allow-Origin: *` hanya untuk development; produksi di-lock ke domain shell.
- `window._env` adalah config client-side — **jangan simpan secret di sana**.
- `ALLOWED_DOMAINS` didefinisikan di `env.js` tapi belum dipakai untuk validasi.

---
Lanjut ke [**08. Environment / Konfigurasi Runtime**](./08-environment-config-runtime.md)