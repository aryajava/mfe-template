# 01 — Kunci Jawaban & Koreksi

> Ujian | [← Kembali ke Bank Soal](./00-bank-soal-mfe.md)

Kunci jawaban lengkap untuk 100 soal. Format: **Jawaban** singkat (boleh diverifikasi di kode), lalu **⚠️ Koreksi** bila ada kesalahan/kesalahpahaman umum yang perlu dihindari. Semua referensi `file:baris` mengarah ke kode nyata repo.

---

# LEVEL 1 — Fondasi & Mental Model (1–25)

**1. Tiga package + peran + port**
- `template-shell` (`@template/shell`) — **host/shell**: login, layout, routing, loader MFE. Port **5000**.
- `template-mfe-child` (`@template/mfe-child`) — **remote contoh**: exposes `./Module`. Port **5006**.
- `template-shared` (`@template/shared`) — **library bersama**: UI, common components, contexts, hooks, api client, types, env. Tanpa port.

> ⚠️ Koreksi: `mfe-hallo` (`@template/mfe-hallo`, script `dev:hallo`/`build:hallo`) ada di `pnpm-workspace.yaml`, tapi itu **MFE latihan hands-on** (dibuat sendiri untuk praktik membuat remote) — **BUKAN bagian dari template**. Template resmi = 3 package. Jawaban benar cukup menyebut 3 package; menyebut `mfe-hallo` sebagai latihan = bonus.

**2. Microservices vs MFE (Browser ≠ Docker)**
- Backend: multi-proses/kontainer, isolasi OS total, komunikasi TCP/HTTP/gRPC, routing via reverse proxy, circuit breaker.
- Browser: **satu thread V8 + satu heap per tab**, TIDAK ada isolasi otomatis (berbagi `window` & `document`), komunikasi via memori lokal (EventBus/callback), routing via **HTML5 History API**, penanganan gagal via **React Error Boundary**.
- Esensi: semua kode shell & child dieksekusi di thread yang sama → tidak ada isolasi proses.

**3. Satu heap V8 → konsekuensi untuk React**
- Global `window`, `document`, localStorage, singleton semuanya **dibagikan**; tidak ada proses terpisah.
- Konsekuensi terbesar: **React wajib singleton** — 2 salinan React = dispatcher tidak cocok = error **"Invalid hook call"** (variabel privat Current Dispatcher di modul React).

**4. Module Federation vs Single-SPA/Qiankun**
- Built-in Webpack 5 (tanpa library tambahan), mature & production-proven, tanpa lock-in framework MFE, kontrol penuh atas konfigurasi.

**5. Kenapa pnpm**
- Efisien disk (dependency di-hoist, tidak duplikat per package), native workspace support (`pnpm --filter`), install lebih cepat dari npm/yarn.

**6. Kenapa Tailwind**
- Tanpa runtime overhead (CSS di-generate saat build), purging otomatis (hanya class terpakai yang masuk bundle), class atomik unik (`px-4 bg-blue-600`) → tidak ada class global yang bisa bertabrakan antar MFE → **menghindari CSS bleeding**.

**7. Kenapa dynamic loading (LazyMFE)**
1. URL remote bisa diganti di `env.js` **tanpa rebuild shell**.
2. Mendukung canary deploy, A/B testing, multi-environment.
3. MFE tidak dimuat jika route tidak diakses (bundle kecil, lazy).

**8. Dual mode child**
- **Standalone**: `index.tsx` → `bootstrap.tsx` → `BrowserRouter` → `App.tsx` (rute sendiri, port 5006).
- **Federated**: `remoteEntry.js` → `container.get('./Module')` → `Module.tsx` → `SharedProvider` → `ModuleContent` (dimuat shell).

**9. Async boundary**
- `entry: './src/index.tsx'` hanya berisi `import('./bootstrap')` — ini membuat webpack memisahkan entry chunk (async), sehingga runtime + shared eager module siap sebelum federated module di-init. Pola wajib Module Federation agar urutan load share scope benar.

**10. remoteEntry.js**
- File manifest **kecil (beberapa KB)**: runtime + mapping share scope + factory referensi modul. **BUKAN** seluruh bundle child.
- Kode komponen di-download **on-demand** saat `container.get('./Module')`. Klaim "berisi seluruh kode" = **mitos** (dibahas di `14`).

**11. Kenapa singleton React**
- Hooks bergantung pada **Current Dispatcher** di variabel privat modul React. 2 salinan → hook di-render oleh React A tapi membaca dispatcher React B → **Invalid hook call**. Shell & child berbagi `react`/`react-dom` via `shared: { singleton: true }`.

**12. eager true vs false**
- `eager: true` = modul dimuat di **chunk awal** (segera tersedia, ikut initial bundle). `eager: false` = dimuat on-demand saat dibutuhkan (menunggu di-share host).
- Shell: React eager `true` → share scope pasti terisi sebelum remote di-init; child: eager `false` → menerima React dari host, tidak membawa salinan sendiri.

**13. Script root (dari `package.json`)**
- `dev` — `concurrently` menjalankan shell+child+hallo (names `shell,child,hallo`).
- `build` — `build:shared` lalu build shell, child, hallo.
- `typecheck` — `pnpm -r typecheck` (semua package).
- `clean` — `pnpm -r exec rm -rf dist node_modules .webpack-cache`.
- Lainnya: `install:all`, `build:shared`, `build:shell`, `build:child`, `build:hallo`, `dev:shell`, `dev:child`, `dev:hallo`, `start`, `start:all`.

> ⚠️ Koreksi: `clean` memakai `rm -rf` — **tidak jalan di PowerShell native** (risk #11 file 12).

**14. `workspace:*`**
- Merujuk versi **lokal** dari workspace, bukan npm registry → selalu pakai kode lokal saat `pnpm install`.

**15. Konvensi port**
- 5000 shell · 5001 reserved · 5002–5005 reserved (services) · 5006 child MFE 1 · 5007 child 2 · 5008 child 3 · 5009–5010 child 4–5.

**16. Fallback port microservice**
- `template-shared/src/lib/env.ts` (fallback map `getApiUrl`): auth **5139**, workflow **5224**, rules **5227**, dedup **5084**, portfolio **5091**, screening **5291**, partnership/common **5062**; default 5000.

**17. `initSharedDependencies()` (`sharedDependencies.ts`)**
- Set `window.React = React` & `window.ReactDOM = ReactDOM` (jika belum ada).
- Pastikan `window.__webpack_share_scopes__ = { default: {} }`.
- Daftarkan ke share scope default: `react` 18.3.1, `react-dom` 18.3.1, `react/jsx-runtime` 18.3.1, `react-router-dom` 6.28.1, `@tanstack/react-query` 5.0.0 — masing-masing `{ get, loaded: true, from: 'shell', eager: true }`.

> ⚠️ Koreksi (risk #6): versi terdaftar `react-router-dom` **6.28.1**, padahal `package.json` meminta `^6.30.1`. Non-strict aman sekarang, tapi wajib disamakan saat upgrade.

**18. Alur request runtime (ASCII)**
```
Browser → Shell :5000
  ├─ /login → AuthContext (fetch /Auth/login, simpan token di localStorage)
  ├─ /child/* → LazyMFE
  │     ├─ load remoteEntry.js childMFE dari :5006
  │     ├─ init share scope (React dsb singleton)
  │     ├─ container.get('./Module')
  │     └─ render <Module basePath="/child" />
  └─ Child memakai @template/shared (context, api, eventBus)
```

**19. `historyApiFallback`**
- DevServer mengembalikan `index.html` untuk semua path (agar F5/refresh URL dalam SPA tidak 404).
- Padanan produksi: konfigurasi server web `try_files $uri /index.html` (nginx).

**20. CORS di child**
- Shell :5000 memuat script/chunk dari :5006 (cross-origin). Tanpa `Access-Control-Allow-Origin: *`, browser memblokir pemuatan remoteEntry & chunk.

> ⚠️ Koreksi (risk #10): `*` hanya aman untuk **dev**. Produksi harus whitelist domain.

**21. Router Induk vs Sub-Router**
- Shell = Router Induk: punya **daftar route lengkap** (`routes.tsx`), `path="/child/*"` (splat) meneruskan semua sub-route → `LazyMFE` dengan `basePath="/child"`.
- Child = Sub-Router: **tidak punya `Routes`** saat federated; menghitung path relatif sendiri (`currentPath.replace(basePath,'').replace(/^\//,'')`) lalu match (`''`→Home, dst).

**22. Isolasi kegagalan**
- Satu MFE down tidak merusak shell: `ErrorBoundary`/`MFEErrorBoundary` + UI error LazyMFE mencegah **White Screen of Death**; deploy per-MFE independen.

**23. Shared: dev vs produksi**
- Dev: webpack `alias @template/shared → ../template-shared/src` → langsung kompilasi source TS, **tanpa build step** (HMR jalan).
- Produksi: shared di-compile `tsc` → ESM `dist/` + `fix-imports.cjs`; dipakai sebagai package.

**24. LazyMFE konsep**
- Komponen yang memuat MFE remote secara dinamis: inject `<script>` remoteEntry → ambil container dari `window[scope]` → init share scope → `get('./Module')` → render komponen dalam `Suspense` dengan `PageLoader` fallback; error → UI "Not Available".

**25. Port beda + syarat produksi**
- Tiap MFE dev server sendiri (tim independen, hot reload sendiri). Produksi: URL remote **bukan hardcoded** — harus dari konfigurasi runtime (`env.js`/`window._env`, `getMfeUrl`) agar bisa diarahkan per environment; remote harus bisa diakses (CORS/HTTPS).

> ⚠️ Koreksi (risk #7): `routes.tsx:47` masih **hardcode** `http://localhost:5006/remoteEntry.js` — `MFE_ROUTES`/`getMfeUrl` di env.js ada tapi **tidak dikonsumsi**.

---

# LEVEL 2 — JavaScript / TypeScript / React (26–50)

**26. default vs named export**
- Default (1/file, nama bebas): `Login.tsx:89` `export default Login` → `routes.tsx:8` `import Login from '../pages/Login'`.
- Named (banyak, nama harus sama): `ErrorFallback.tsx:11` `export const ErrorFallback`, `useAuth.ts:3`, `MFE_EVENTS` (`eventBus.ts:47`) → `import { Button } from '@template/shared'`.

**27. async selalu return Promise**
- Nilai return dibungkus Promise otomatis (`async () => 42` → `Promise<42>`). Tanpa `await`, `try/catch` di luar **tidak menangkap** error dari dalam promise → harus `await` di dalam `try`. Contoh benar: `Login.tsx:15-23` (`await login(...)` dalam try/finally).

**28. `||` vs `??`**
- `||`: semua falsy (`0`, `''`, `false`, `NaN`, `null`, `undefined`). `??`: hanya `null`/`undefined`.
- Repo ini **tidak memakai `??` sama sekali** — semua fallback `||` (mis. `api.ts:31` `error.message || 'Access Denied'`; `ErrorFallback.tsx:25`).
- Implikasi: nilai falsy yang sah (`0`, `''`) dari server ikut kena fallback.

**29. Optional chaining**
- `eventBus.ts:19` `this.listeners.get(event)?.delete(...)` — aman jika event belum pernah di-subscribe.
- `AuthContext.tsx:147` `user?.permissions` — aman jika user null.

**30. Generic `<T>`**
- Placeholder tipe. `PaginatedResponse<T>` (`common.ts:1-7`): `data: T[]`, `total`, `page`, `pageSize`, `totalPages`. `ApiResponse<T>` (`9-13`): `success`, `data: T`, `message?`. `client.get<T>('/users')` = "get yang mengembalikan bentuk T". `EventCallback<T = unknown>` punya default.

**31. `as const`**
- Membuat properti **readonly** + tipe **literal**. `MFE_EVENTS` (`eventBus.ts:47-66`) → nilai `'mfe:navigate'` dst menjadi literal, bukan `string`. Efek: `MFEEventType` (`:68`) = union literal → typo event **gagal kompilasi** di pemanggil.

**32. `ReturnType<typeof createApiClient>`**
- `api.ts:106` — tipe objek hasil `createApiClient` diturunkan otomatis. Tanpa interface terpisah → **satu sumber kebenaran**, selalu sinkron dengan implementasi.

**33. interface vs type**
- `interface`: kontrak objek yang di-share (`User`, `AuthContextType`, `SharedContextType`, `ApiConfig`, `ApiError`, `EventBusInstance`, `PaginatedResponse`).
- `type`: turunan/alias (`ApiClient`, `MFEEventType`, `EventCallback`), union, intersection.
- Aturan praktis repo: **kontrak objek → interface; turunan/union → type**.

**34. strict true vs false**
- Shared `strict: true` (`tsconfig.json:12`) → `strictNullChecks`, `noImplicitAny` aktif. Shell/child `strict: false` (`:13`/`:15`) + `noImplicitAny: false`.
- Contoh yang hanya lolos karena longgar: `AuthContext.tsx:100` `const error: any = new Error(...); error.status = ...` (any eksplisit) — di shared ada `eventBus.ts:16` non-null assertion `!` (bukti strict aktif). Juga shell `transpileOnly: true` → type-check dilewati saat dev.

**35. Bahaya `as any`**
- Mematikan pemeriksaan tipe pada nilai itu & menyebar; typo/kesalahan kontrak lolos → bug runtime.
- `LazyMFE.tsx:118,132,136,147` `(window as any)[...]` — **batas sistem** (global window MF) → bisa dibenarkan, terkontain.
- `AuthContext.tsx:100` `const error: any = ...` — menempelkan properti `status` pada `Error` → **menghindari** sistem tipe. Lebih baik: object literal `as ApiError` (seperti `api.ts:32-36`).

**36. Controlled vs uncontrolled**
- Controlled: nilai hidup di state, `value` + `onChange` (satu-satunya jalan ubah). Uncontrolled: DOM yang pegang (ref/defaultValue).
- `Login.tsx:40-49` (email) & `:55-64` (password) controlled penuh; tombol `type` toggle (`:57`) dan `disabled` (`:78`) hanya mungkin karena controlled.

**37. `key` wajib**
- React memakai `key` untuk mencocokkan elemen lama/baru di list (reuse DOM & state). `key={index}` rapuh saat list reorder/insert (state salah menempel); `key={item.id}` stabil. Contoh: `Layout.tsx:86` `key={item.id}`.

**38. JSX = createElement**
- `<h1 className="x">Halo</h1>` ≡ `React.createElement('h1', {className:'x'}, 'Halo')`; `<Button variant="ghost">` ≡ `createElement(Button, ...)`.
- Terhubung ke singleton: komponen harus di-create dengan **React yang sama** (reconciler/element identity). 2 React = identitas elemen & dispatcher tidak cocok.

**39. useState vs useRef**
- `useState`: nilai + **render ulang** saat berubah (`Login.tsx:9-12`, `LazyMFE.tsx:30-34`).
- `useRef`: `.current` mutable, **tanpa render ulang** (`useEventBus.ts:5` — daftar unsubscribe, buku catatan internal).

**40. Stale closure + `deps` di useEventSubscription**
- Closure mengunci nilai lama. `useEventSubscription` (`useEventBus.ts:44-53`) menyebar `[event, ...deps]` ke `useEffect` → callback dibuat ulang saat dep berubah. Tanpa dep yang benar, callback memanggil state **basi** (bug tersembunyi di subscription). `subscribe` di `useEventBus` aman karena hanya menulis ke `useRef` (selalu segar).

**41. useMemo di SharedProvider**
- `SharedContext.tsx:71-79`: objek `value` stabil selama `queryClient`/`authContext`/`apiBaseUrl` tidak berubah. Tanpa itu, tiap render provider membuat objek baru → **semua konsumen `useSharedContext` ikut render ulang**. Ini stabilisasi identitas, bukan sekadar optimasi mikro.

**42. Cleanup useEffect**
- Function yang dikembalikan efek; jalan **sebelum efek dijalankan ulang** & saat **unmount**. `useEventBus.ts:29-34`: saat unmount, semua `unsubscribe` di `subscriptionsRef` dipanggil + array di-reset → tidak ada listener bocor / handler ganda saat remount.

**43. Invalid hook call — 2 penyebab**
1. Aturan hook dilanggar: dipanggil dalam kondisi/loop/non-component.
2. **Dua salinan React** — kasus MFE: child dirender oleh React shell tapi hook-nya dari salinan sendiri → dispatcher beda. Fix: `singleton: true`.

**44. `<a href>` dilarang**
- Full page reload → seluruh state React hilang (auth, context), child di-unmount, terasa seperti logout. Penegasan: `Link`/`navigate` pakai History API.
- **Pengecualian disengaja**: `template-mfe-child/src/services/api.ts:12` `window.location.href = '/login'` saat `onUnauthorized` — hard redirect keluar child menuju shell (harus reload karena harus "keluar aplikasi").

**45. Link vs Navigate vs useNavigate**
- `Link` (JSX, klik): `Layout.tsx:59,85`.
- `Navigate` (deklaratif dalam render): `routes.tsx:36-37` (`/` → `/dashboard`), `:59`; `ProtectedRoute.tsx:23,28`.
- `useNavigate` (imperatif dalam logic): `Login.tsx:8` → `AuthContext.tsx:116` `navigate("/dashboard")`.

**46. Immutable update**
- `setX(nilaiBaru)` menandai render; `arr.push()` mengubah referensi yang sama → React membandingkan dengan `Object.is` dan **bail out** (tidak render). Harus `setArr([...arr, 2])` (nilai baru).

**47. Dependency array**
- `[]`: sekali saat mount — `AuthContext.tsx:43-60` (init auth).
- `[dep]`: tiap dep berubah — `Layout.tsx:40-42` `[sidebarExpanded]`; `LazyMFE.tsx:36-41` `[cacheKey]`.
- Tanpa array: tiap render (berisiko infinite loop) — **tidak dipakai di repo**.
- Multi-dep: `LazyMFE.tsx:43-85` `[scope, module, url, version, cacheKey]`.

**48. useAuth throw vs useSharedContext fallback**
- `AuthContext.tsx:26-32` throw — **fail fast**: salah pakai = bug, harus ketahuan segera (app-specific).
- `SharedContext.tsx:50-56` return `defaultFallbackContext` — shared components harus tetap jalan di luar provider (fallback: QueryClient baru, auth kosong, apiBaseUrl, eventBus global).

**49. `React.FC<Props>`**
- Tipe "function component dengan props Props". Semua komponen repo memakainya (`Login.tsx:7`, `ErrorFallback.tsx:11`, `Module.tsx:13`). Resmi dianggap **usang** (React 18 types) — alternatif: `const C = ({...}: Props) => ...`. Repo tetap konsisten → **ikuti gaya repo** saat menulis kode baru.

**50. Narrowing**
- Union `User | null` harus dipersempit sebelum akses. `AuthContext.tsx:147` `if (!user?.permissions) return false;` → di bawahnya `user.permissions` aman (TS tahu user non-null).

---

# LEVEL 3 — Mekanisme MFE & Implementasi (51–80)

**51. ModuleFederationPlugin**
- Shell: `name: 'shell'`, `filename: 'remoteEntry.js'`, `remotes: {}`, `shared`: react/react-dom/react/jsx-runtime/react-router-dom `{ singleton: true, requiredVersion: false, strictVersion: false, eager: true }`, @tanstack/react-query `{ singleton: true, requiredVersion: false }` (tanpa eager).
- Child: `name: 'childMFE'`, `filename: 'remoteEntry.js'`, `exposes: { './Module': './src/Module.tsx' }`, `shared`: react/react-dom/react/jsx-runtime `{ singleton: true, requiredVersion: '^18.3.1', strictVersion: false, eager: false }`, react-router-dom `{ singleton: true, requiredVersion: false, eager: false }`, react-query `{ singleton: true, requiredVersion: false }`.

**52. Kenapa `remotes: {}`**
- Remote dimuat **dinamis** oleh LazyMFE (script injection), bukan statis. Manfaat: URL bisa dari konfigurasi runtime, lazy (tidak dimuat kecuali route diakses), tanpa rebuild saat ganti URL.

**53. publicPath**
- Shell `'/'`: aset direferensikan absolut dari root server (shell di root :5000).
- Remote `'auto'`: chunk di-resolve relatif terhadap lokasi remoteEntry → remote bisa di-host di URL/path mana pun (cross-origin) tanpa konfigurasi ulang.

**54. Alur LazyMFE (baris 46–82, 115–149)**
1. Cek cache (`componentCache` Map) → hitung `cacheKey`.
2. Tentukan URL (dev `?_t=`, prod `?v=`) → `loadRemoteContainer(scope, url)`.
3. Buat `<script src=url>` → append ke head → `await` onload.
4. `container = window[scope]`; cek ada; cek `_initialized` (jangan init 2x).
5. Ambil `shareScope = window.__webpack_share_scopes__?.default`; cek `react` & `react-dom` ada.
6. `await container.init(shareScope)` → `container._initialized = true`.
7. `factory = await container.get(module)` → `Module = factory()`.
8. Resolve component (function / `.default` / `.Module` / key function pertama) → cache → `setComponentWrapper`, `setLoading(false)`.
9. Render `<Component basePath subRoute/>` dalam `Suspense` (fallback PageLoader).

**55. `?_t=` vs `?v=`**
- Dev `_t=timestamp` (per load): selalu fresh — cache browser tidak pernah menyimpan remoteEntry lama saat development.
- Prod `v=version`: cache busting eksplisit per rilis (chunk contenthash + URL versi), mendukung **rollback** ke versi sebelumnya; tidak spam timestamp.

**56. `__webpack_share_scopes__.default`**
- Registry global module shared: `{ name: { version: { get, loaded, from, eager } } }`.
- **Pengisi**: shell (`initSharedDependencies()` + runtime MF eager) dan remote saat `container.init(shareScope)` dipanggil.
- **Pembaca**: `container.init()` di LazyMFE — untuk me-resolve React dsb (dipakai bersama, bukan salinan sendiri).

**57. `container._initialized`**
- Flag agar `init(shareScope)` dipanggil **sekali** per container. Init 2x = mendaftarkan share scope ulang / error runtime (duplicate init). Diset setelah init sukses (`LazyMFE.tsx:135-145`).

**58. Cek `shareScope['react']` sebelum init**
- `LazyMFE.tsx:139-141`: kalau React tidak tersedia di share scope, lempar error jelas **"Required React dependencies not shared"** — fail fast dengan pesan yang bisa di-debug, mencegah "Invalid hook call" misterius di kemudian hari.

**59. `relativePath` di Module.tsx**
- `relativePath = currentPath.replace(basePath, '').replace(/^\//, '')` (`Module.tsx:38`).
- Contoh: `'/child'` → `''` → `<Home />`; `'/child/settings'` → `'settings'` → (belum ada match) `<NotFound />`. Saat ini template hanya match kosong → Home, sisanya NotFound; titik ekstensi ada di komentar (`startsWith('settings')`, `subRoute`).

**60. basePath vs subRoute**
- `basePath`: prefix tempat shell memasang child (default `'/child'`, **harus cocok** dengan route shell).
- `subRoute`: sub-route eksplisit dari shell (bisa bypass parsing path). **Template saat ini hanya memakai `basePath` + path-based fallback**; `subRoute` hanya placeholder komentar.

**61. Kenapa child bungkus SharedProvider sendiri**
- Child harus **self-sufficient** di kedua mode: standalone (tanpa provider lain) & federated (tidak bergantung pada internal shell). `SharedProvider` menyediakan default (`queryClient` baru, auth default, apiBaseUrl, eventBus) + `LoadingProvider` untuk `GlobalLoadingOverlay`. (Catatan: saat federated, `SharedAuthProvider` shell sudah menginjeksi authContext — provider child memakai nilai default bila tak di-inject, inilah **gap risk #2**.)

**62. Dua useAuth**
- Shell `useAuth` (`../contexts/AuthContext`): baca `AuthContext` dari `AuthProvider`; **throw** di luar provider; dipakai Login/Layout/routes.
- Shared `useAuth` (`@template/shared`, `hooks/useAuth.ts:3-5`): baca `authContext` dari `useSharedContext()`; **return fallback** (user null) di luar provider; dipakai child & shared components.
- Import salah = perilaku berbeda (throw vs diam-diam kosong).

**63. AuthContext — isi & alur login**
- State: `user (User|null)`, `isAuthenticated (!!user)`, `isLoading`. Functions: `login`, `logout`, `hasPermission`, `hasRole`.
- Login (`AuthContext.tsx:88-135`): `setIsLoading(true)` → `getApiUrl('auth')` → `fetch POST /Auth/login {email,password}` → `!ok` → buat error+status → throw → **catch: demo fallback** (admin, `demo-token`, `setUser`, navigate) → ok: `data.token || data.Token` → `storage.store` token+authenticated → `await fetchUserProfile(token)` → `navigate('/dashboard')` → `finally setIsLoading(false)`.
- `fetchUserProfile` (62-86): GET `/Auth/profile` + Bearer → `response.ok` → map ke `User` (`roles: [role || 'user']`, `permissions`) → `setUser`.

**64. Demo fallback & bahayanya**
- `AuthContext.tsx:117-129`: **error apa pun** (server down, password salah, network) → buat sesi admin `permissions: ['*']`, simpan `demo-token`, tetap masuk dashboard. Skenario produksi: layanan auth mati → **semua orang masuk sebagai admin**; kegagalan tampak seperti sukses; audit keamanan gagal. **Wajib dihapus untuk produksi** (risk #1).

**65. hasPermission / hasRole**
- `hasPermission` (145-152): tanpa `user.permissions` → false; `includes('*')` → true (wildcard); else `includes(permission)`.
- `hasRole` (154-160): tanpa roles → false; `includes(role) || includes('admin')` (admin = super-user).

**66. MFEErrorBoundary vs ErrorBoundary**
- `ErrorBoundary` (shell) menangkap error render di subtree → fallback `ErrorFallback` (kartu + "Try Again").
- `MFEErrorBoundary` (varian, `mfeName` prop): title `"{mfeName} failed to load"` + pesan "temporarily unavailable" — dipakai **membungkus LazyMFE** (`routes.tsx:43`) agar kegagalan satu MFE tidak menjatuhkan shell & pesannya menyebut MFE mana yang gagal.

**67. EventBus**
- Class `EventBus` (`eventBus.ts:9-43`): `listeners: Map<string, Set<EventCallback>>` — satu event → banyak callback.
- `subscribe`: get-or-create Set → add → return unsubscribe (delete dari Set).
- `publish`: `forEach` callback dalam `try/catch` **per callback** — satu handler error tidak mematikan handler lain / tidak memutus publish; error di-log dengan nama event.

**68. Kenapa subscribe return unsubscribe**
- Menghapus callback dari Set → publish berikutnya tidak memanggilnya. Tanpa memanggilnya (tanpa cleanup): **memory leak**, handler ganda saat remount, event diproses komponen yang sudah mati. `useEventBus` auto-unsubscribe semua saat unmount (`29-34`).

**69. MFE_EVENTS**
- `mfe:navigate`, `mfe:navigation_complete`, `auth:logged_in`, `auth:logged_out`, `auth:session_expired`, `auth:token_refreshed`, `data:updated`, `cache:invalidate`, `ui:notification`, `ui:modal_open`, `ui:modal_close`, `ui:sidebar_toggle`, `mfe:error`, `api:error`. Prefix: `mfe:` / `auth:` / `data:` / `ui:` / `api:`.

> ⚠️ Koreksi (risk #5): ini **soal konsep/kontrak** — sah ditanyakan walau belum ada di kode. Jawaban benar: *secara desain, yang seharusnya publish adalah **shell `AuthContext`** — `USER_LOGGED_IN` setelah login sukses, `USER_LOGGED_OUT` saat logout.* TAPI di kode template saat ini **tidak ada pemanggil** `eventBus.publish` (dikonfirmasi grep: hanya `subscribe`/`publish` di `useEventBus.ts`; `AuthContext` hanya meng-*import* `eventBus`/`MFE_EVENTS`). Event masih **kontrak yang belum tersambung** — jawaban "AuthContext sudah publish" = salah.

**70. createApiClient**
- Config (`api.ts:1-5`): `{ baseUrl, getToken, onUnauthorized? }`.
- `handleResponse` (24-53): **401** → `onUnauthorized?.()` + throw `'Unauthorized'`; **403** → parse json (catch → 'Access Denied') → throw `ApiError {message, status:403, details}`; **!ok** → json (catch → 'Request failed') → throw `ApiError`; **204** → `{} as T`; else `response.json()`. Semua method `credentials: 'include'`.

**71. Spread kondisional header**
- `api.ts:20` `...(token && { Authorization: \`Bearer ${token}\` })` — token truthy → objek `{Authorization}` di-spread (header ikut); token null → `false` di-spread = no-op. Hasil: header Authorization hanya ada saat token ada; tanpa ini akan jadi `Bearer null`.

**72. fix-imports.cjs**
- TS `moduleResolution: bundler` menulis import relatif **tanpa ekstensi** (`'./lib/eventBus'`), tapi **Node ESM butuh ekstensi** (`.js`). Script pasca-`tsc`: scan `dist/**/*.js`, untuk tiap `from '…'` relatif cek `target + '.js'` atau `target/index.js` → tulis ulang dengan ekstensi.

**73. env.ts**
- `getApiUrl(service)`: `window._env.getApiUrl` bila ada, else fallback map port. `getApiBaseUrl()`: `window._env.API_BASE_URL` else `http://localhost:5139/api`. `getEnvMode()`: `window._env.MODE` else `'local'`. `window._env` berasal dari **`public/env.js`** (disalin `CopyWebpackPlugin`) yang dibaca saat runtime — bukan build-time.

> ⚠️ Koreksi (risk #12): ada **dua** env.js — `template-shell/env.js` (konfigurasi lengkap, TIDAK ter-serve) vs `public/env.js` (stub kosong yang benar-benar dimuat) → `window._env = {}` → semua helper pakai fallback hardcoded. Edit file yang salah = tidak ada efek.

**74. types/common.ts**
- `PaginatedResponse<T>` (data[], total, page, pageSize, totalPages), `ApiResponse<T>` (success, data, message?), `SelectOption` (label, value), `TableColumn<T>` (key: `keyof T`, label, `sortable?`, `render?(value, row): ReactNode`), `FilterConfig` (key, label, type `'text'|'select'|'date'|'number'`, options?), `SortConfig`, `PaginationConfig`.
- `TableColumn.render` = function render sel kustom (menerima nilai + row, return ReactNode). `FilterConfig.type` = union literal (discriminated).

**75. `cn()`**
- `twMerge(clsx(...))` — gabung class, dedupe, **resolusi konflik Tailwind** (class belakang menang untuk utility sama). Dipakai `button.tsx:43` agar `className` dari pemakai digabung dengan class variant tanpa konflik gaya.

**76. useLoading vs useSharedContext**
- `useLoading` (**throw** di luar `LoadingProvider`) — overlay global bersifat opsional; memakainya di luar provider = bug, harus ketahuan cepat.
- `useSharedContext` (**return fallback**) — komponen shared harus jalan di mana pun, tidak boleh crash karena provider tidak ada.

**77. sastStorage**
- Wrapper tipis atas `window.localStorage` (`retrieve/store/remove/clear`) dengan **properti yang dipecah string**: `'local'+'Storage'`, `'get'+'Item'`. Fungsinya tetap localStorage biasa. Pecahan string = **obfuscation** (menghindari scanner/naive detector), **bukan enkripsi** (risk #11) — jangan dipakai untuk data sensitif.

**78. QueryClient shell**
- `bootstrap.tsx:14-32`: `staleTime: 5*60*1000` (5 menit), `gcTime: 30*60*1000` (30 menit), `retry: (failureCount, error) => { if (error.status 400–499) return false; return failureCount < 3 }` — **4xx tidak di-retry** (kesalahan klien tidak akan sembuh dengan coba lagi; hemat request), `refetchOnWindowFocus: false`, mutations `retry: false`.

**79. GlobalLoadingOverlay**
- Overlay fullscreen (`z-[9999]`, `bg-black/50 backdrop-blur`) menampilkan `LoadingSpinner` + `loadingMessage`. Dikontrol via `useLoading()` → `showLoading(msg?)` / `hideLoading()` (state di `LoadingProvider`). Dipakai untuk operasi global (mis. seluruh aplikasi sedang memproses).

**80. SharedAuthProvider**
- `bootstrap.tsx:34-37`: membridge `useAuth()` (AuthContext shell) → `SharedProvider authContext={authContext}`. Tanpa ini, konsumen `@template/shared` (`useAuth` shared, `useSharedContext`) mendapat **auth default kosong** (bukan user shell). Urutan: `AuthProvider` (auth nyata) → `SharedAuthProvider` (injeksi ke shared) → konsumen shared membaca user asli.

---

# LEVEL 4 — Expert: Pitfall, Operasi, Produksi (81–100)

**81. Child blank di shell tapi jalan standalone — 4 penyebab**
1. Remote tidak jalan / port salah → cek `http://localhost:5006/remoteEntry.js` di browser.
2. **CORS** hilang → cek `devServer.headers['Access-Control-Allow-Origin']` di webpack child.
3. **Share scope/React tidak ada** → console: "Required React dependencies not shared" / "Invalid hook call" → cek `singleton` + `initSharedDependencies` shell.
4. **Route/basePath tidak cocok** → `/child` vs `/child/*`, `basePath` harus sama dengan route shell.
- Cek juga: URL di `routes.tsx` vs port child; `window.__webpack_share_scopes__` di devtools.

**82. Invalid hook call — diagnosis pertama**
- Cek dulu **dua salinan React**: devtools → `window.__webpack_share_scopes__.default.react` ada? Cek config `shared.react.singleton` di shell & child; cek console error LazyMFE "Required React dependencies not shared". Setelah itu baru periksa **aturan hook** (hook dalam loop/kondisi/non-component).

**83. env.js tanpa rebuild**
- `public/env.js` dibaca saat runtime oleh `index.html` → `window._env`; helper `env.ts` membacanya per request. Ganti file + refresh → nilai baru terbaca, tanpa rebuild (konfigurasi runtime, bukan bundel). Syarat: file diserve dengan cache-header wajar (agar tidak cache lama), dan kode **harus** membaca lewat helper `env.ts`, bukan hardcode.

**84. Risiko demo fallback**
- Skenario: server auth down / kredensial salah / network error → `catch` membuat sesi **Demo Admin** (`permissions: ['*']`, `demo-token`) → siapa pun "login sukses" sebagai admin, padahal tidak ada autentikasi. Dampak: bypass keamanan total; kegagalan sistem tersamar sebagai sukses. **Wajib hapus untuk produksi.**

**85. Tiga gap produksi lain (file 12)**
- Bebas pilih 3 dari: (2) **auth shell tidak diteruskan ke child federated** (`Module.tsx` SharedProvider tanpa props → authContext kosong); (3) `fetchUserProfile` non-OK **tidak membersihkan** token/user lama; (4) redirect `/unauthorized` tapi **route-nya tidak ada**; (5) **event auth tidak pernah di-publish**; (6) version mismatch registry (`react-router-dom` 6.28.1 vs `^6.30.1`); (7) URL MFE **hardcoded** (`MFE_ROUTES` tidak dipakai); (8) `ALLOWED_DOMAINS` didefinisikan tapi tak dipakai; (9) QueryClient shell/child tidak otomatis sama; (10) token di localStorage + CORS `*`; (11) tidak ada test/eslint/CI; (12) dua env.js tidak selaras.

**86. Migrasi monolith → MFE (file 11)**
- (1) **Identifikasi batas modul** — tiap grup route top-level = kandidat child.
- (2) **Buat shared library** — kode dipakai ≥2 modul (UI, contexts, hooks, utils, types); jangan ekstrak yang khusus 1 halaman.
- (3) **Siapkan shell** — MF host config, LazyMFE, route statis per child (`/admin/*`).
- (4) **Buat tiap child** — salin template, set name+port unik, Module.tsx routing + SharedProvider, pindahkan pages/services, ganti import ke `@template/shared`.
- (5) **Daftarkan di shell** — routes.tsx + env.js + Layout + pnpm-workspace + script dev. (6) Tambah ke pnpm workspace.

**87. PageLoader vs GlobalLoadingOverlay**
- `PageLoader`: spinner besar **di dalam area konten** (`minHeight: 60vh`) — loading halaman/route (auth init di `routes.tsx:18`, fallback LazyMFE).
- `GlobalLoadingOverlay`: **overlay fullscreen** di atas segalanya (`z-[9999]`) + pesan — operasi global (via `useLoading`).

**88. `version` vs `_t`**
- `version`: string versi eksplisit → `cacheKey scope::module::version` + URL `?v=` → cache busting saat rilis (URL baru → fetch remoteEntry baru), bisa **rollback** ke versi lama (URL versi sebelumnya). `_t`: timestamp **setiap load** — hanya untuk dev (selalu fresh).

**89. Trade-off eager true (React)**
- Plus: React pasti tersedia sebelum remote di-init → keandalan (tidak ada race share scope). Minus: React masuk **initial bundle shell** (lebih besar, TAPI biasanya sudah ada karena shell sendiri pakai React). Child `eager: false`: tidak bawa salinan, menunggu host — lebih ramah ukuran & tidak duplikat.

**90. Dua react-router-dom tanpa singleton**
- Dua instance/context berbeda → hook dari salinan child (`useNavigate`, `useLocation`) tidak melihat Router context shell (context object beda) → error "useNavigate may be used only within Router context", navigasi child rusak/blank, state route tidak sinkron. Gejala mirip duplikat React. Fix: `singleton: true` + satu versi.

**91. Menambah MFE baru (tutorial 15)**
- (0) `pnpm install` + `pnpm dev` baseline. (1) **Salin** `template-mfe-child` → ganti nama package. (2) **Config MF**: `name` unik (scope) + `port` unik (mis. 5007), `publicPath: 'auto'`. (3) **Module.tsx** routing (`subRoute`/`useLocation`) + bungkus `SharedProvider`; (4) **Daftarkan di shell**: route `/admin/*` + LazyMFE di `routes.tsx`, URL di env.js, item navigasi Layout, tambah ke `pnpm-workspace.yaml` + script `dev` concurrently. (5) Test standalone & federated.

**92. Triage labels**
- 5 role kanonik: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` (lihat `docs/agents/triage-labels.md`).

**93. CONTEXT-MAP.md**
- Root **peta konteks** untuk dokumen domain multi-konteks (`docs/agents/domain.md`) — memetakan topik/area ke file konteks, agar agent & manusia menemukan domain doc yang tepat.

**94. Child standalone tanpa AuthProvider**
- Standalone child (`bootstrap.tsx` child) memang tidak punya `AuthProvider`/`SharedProvider` dengan auth — child mengandalkan shared context saat dimuat shell. Halaman child yang butuh user saat standalone: `useAuth` (shared) → **fallback kosong** (`user: null`) karena di luar provider → tampil tanpa user / perlu handling. Itu sebabnya `Module.tsx` membungkus `SharedProvider` (tetap tanpa auth nyata) — dan risk #2 mencatat auth shell **tidak otomatis** mengalir.

**95. `window.location.href='/login'` di onUnauthorized**
- Hard redirect **keluar child** ke shell (reload penuh) — child tidak memiliki route `/login` & tidak boleh navigasi lintas boundary dengan router internal; reload juga membersihkan state/child yang tidak valid. `navigate('/login')` dari dalam child tidak cocok (path relatif shell, child tidak pegang router saat federated).

**96. Verifikasi React sama**
- Devtools: `window.React === (window as any).__webpack_share_scopes__.default.react['18.3.1'].get()` (identitas sama) atau cek hanya ada **satu** entri react di share scope (`from: 'shell'`).
- Cek config: `shared.react.singleton: true` di shell & child; tidak ada error "Invalid hook call"; `LazyMFE` lolos cek `shareScope['react']`.

**97. requiredVersion vs strictVersion**
- `requiredVersion`: constraint versi saat resolve (mis. `^18.3.1`) — MF memakai/memilih versi yang cocok; `requiredVersion: false` = versi apa pun diterima.
- `strictVersion: true`: versi tidak cocok = **error**; `false`: **best-effort** (pakai yang ada, hanya warning).
- Risiko: tanpa pinning (`requiredVersion: false` + `strictVersion: false` di shell) dua MFE bisa memakai React versi berbeda → runtime incompatibilitas halus (hooks/API beda) yang tidak terdeteksi sampai produksi.

**98. splitChunks vendor + runtimeChunk single**
- Vendor (React dkk) di chunk terpisah dengan `contenthash` → **cache browser jangka panjang**, reload lebih cepat; `runtimeChunk: 'single'` → satu runtime dipakai semua chunk (dibutuhkan MF agar runtime & share scope tunggal, tidak duplikat per chunk).

**99. Canary/A-B via LazyMFE**
- URL remote diambil dari konfigurasi runtime (`env.js`/`getMfeUrl`) → deploy versi baru child ke URL baru, grup canary menerima env.js yang menunjuk URL baru, sisanya URL lama. A/B: `version` prop + feature flag / pembagian persentase pengguna → tanpa rebuild shell (ganti nilai runtime saja).

**100. Lima hal sebelum produksi**
- Pilih 5 dari daftar prioritas file 12: (1) **hapus demo fallback** login; (2) **kontrak auth lintas MFE** (siapa pemilik sesi, inject authContext ke child); (3) **sumber URL remote dari env.js** (bukan hardcode) + versi remote; (4) **strategi token** (httpOnly cookie, bukan localStorage) + CORS whitelist (bukan `*`); (5) **penyatuan QueryClient/shared context** + server fallback (`try_files`) + hardening (HTTPS, header keamanan) + **test/CI** (typecheck+build di pipeline), hapus devtools/console demo.

---

## Skoring

| Level | Benar / 25 atau / 30 | Status |
|-------|----------------------|--------|
| 1 | ≥ 23/25 | ✅ |
| 2 | ≥ 23/25 | ✅ |
| 3 | ≥ 27/30 | ✅ |
| 4 | ≥ 18/20 | ✅ |

Di bawah target = baca ulang file catatan yang dirujuk pada soal yang salah, lalu ulangi. Tidak ada "ragu" yang tersisa = pemahaman 100% (sejauh yang bisa diuji dari catatan ini).

---

[**← Kembali ke Bank Soal**](./00-bank-soal-mfe.md) | [← Kembali ke Index Prasyarat](../prasyarat/00-index-prasyarat.md)