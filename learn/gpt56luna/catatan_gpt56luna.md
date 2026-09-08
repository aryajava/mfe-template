# Catatan Pengetahuan Template MFE

Pemetaan ini dibuat dari source, konfigurasi, dan dokumentasi template pada
2026-09-08. Fakta implementasi dipisahkan dari risiko dan rekomendasi.

## 1. Ringkasan

Template adalah monorepo pnpm untuk React Micro-Frontend berbasis Webpack 5
Module Federation.

- `template-shell` adalah host pada port `5000`.
- `template-mfe-child` adalah remote contoh pada port `5006`.
- `template-shared` adalah library lintas package dengan nama `@template/shared`.
- Shell memuat child dari `http://localhost:5006/remoteEntry.js`.
- React, React DOM, JSX runtime, React Router, dan React Query dikonfigurasi
  sebagai singleton shared dependency.
- Shell menyediakan login, auth, route protection, layout, dashboard, loader
  remote, dan error boundary.
- Child dapat berjalan standalone atau sebagai remote melalui `./Module`.
- `env.js` menyediakan runtime configuration melalui `window._env`.
- Child contoh masih berupa halaman Home dengan kartu Analytics, Documents, dan
  Settings; template ini bukan aplikasi domain lengkap.

## 2. Peta Repository

```text
.
├── package.json                 # workspace scripts
├── pnpm-workspace.yaml          # tiga package
├── pnpm-lock.yaml
├── GETTING-STARTED.md           # instalasi dan quick start
├── MIGRATION-GUIDE.md           # panduan pemecahan monolith
├── start.sh / start.ps1         # launcher lintas OS
├── template-shell/              # host
├── template-mfe-child/          # remote contoh
├── template-shared/             # shared library
└── learn/                       # catatan pembelajaran
```

### Shell

`webpack.config.cjs` mengatur host, `env.js` mengatur environment browser, dan
`src/` berisi bootstrap, route registry, auth context, layout, loader, error
boundary, serta halaman Login/Dashboard/NotFound.

### Child

`webpack.config.cjs` mengatur remote. `src/Module.tsx` adalah entry federated,
sedangkan `src/App.tsx` adalah route entry standalone. Page ada di `pages/`,
contoh service di `services/api.ts`, dan wrapper storage di `utils/`.

### Shared

`src/components/ui` berisi primitive Radix/Tailwind, `components/common` berisi
loader/error fallback, `contexts` berisi shared/auth/loading context, `hooks`
berisi hook auth/event bus, `lib` berisi API/event bus/env/utilities, dan `types`
berisi tipe umum. `src/index.ts` mengekspor semua barrel tersebut.

## 3. Alur Runtime

### 3.1 Shell bootstrap

`src/index.tsx` hanya melakukan `import('./bootstrap')`. `bootstrap.tsx`:

1. memanggil `initSharedDependencies()`;
2. membuat satu `QueryClient`;
3. memakai `staleTime` 5 menit, `gcTime` 30 menit, retry maksimal tiga kali
   untuk error non-4xx, dan `refetchOnWindowFocus: false`;
4. memasang provider `QueryClientProvider -> BrowserRouter -> AuthProvider ->
   SharedProvider -> LoadingProvider -> TooltipProvider`;
5. merender `App`, `SonnerToaster`, `GlobalLoadingOverlay`, dan React Query
   Devtools ke `#root`.

### 3.2 Child standalone

Child memakai pola entry yang sama, tetapi provider tree-nya adalah
`QueryClientProvider -> BrowserRouter -> LoadingProvider -> App`. `App` memiliki
route index ke `Home` dan wildcard ke `NotFound`.

### 3.3 Child federated

Shell mengimpor `./Module` dari remote. `Module` menerima `basePath` dan
`subRoute`, membaca `location.pathname`, menghapus base path, lalu merender
`Home` untuk path kosong dan `NotFound` untuk path lain. `subRoute` baru berupa
extension point berupa komentar; belum ada sub-route nyata.

`Module` membungkus isi dengan `SharedProvider`, `LoadingProvider`, dan
`GlobalLoadingOverlay`. Provider tersebut dibuat di child, sehingga belum
otomatis sama dengan provider shell.

## 4. Module Federation

### 4.1 Host

`template-shell/webpack.config.cjs` memiliki:

- `name: 'shell'`, output `remoteEntry.js`, dan `remotes: {}` kosong;
- dev server port `5000`, history fallback, HMR, serta CORS wildcard;
- `publicPath: '/'`, filesystem cache, source map production/development;
- alias `@template/shared` langsung ke `template-shared/src`;
- `ts-loader` `transpileOnly: true` pada shell;
- CSS melalui style-loader, css-loader, postcss-loader;
- runtime chunk tunggal dan vendor split chunk;
- HtmlWebpackPlugin dan CopyWebpackPlugin untuk HTML/public.

React, React DOM, JSX runtime, dan React Router di-share singleton serta eager.
React Query singleton tetapi tidak eager. Versi dibuat non-strict.

### 4.2 Remote

`template-mfe-child/webpack.config.cjs` memiliki `name: 'childMFE'`, mengekspos
`'./Module': './src/Module.tsx'`, port `5006`, `publicPath: 'auto'`, alias shared
ke source, dan share dependency singleton. React/React DOM menggunakan
`requiredVersion: '^18.3.1'`, `strictVersion: false`, dan `eager: false`.

### 4.3 LazyMFE

`LazyMFE` adalah loader manual yang:

1. membentuk cache key dari scope/module/version;
2. memakai cache component in-memory;
3. menambahkan timestamp `_t` ke URL saat localhost;
4. menyisipkan `remoteEntry.js` sebagai script ke document head;
5. mengambil container dari `window[scope]`;
6. menginisialisasi container dengan `__webpack_share_scopes__.default`;
7. memvalidasi share React dan React DOM;
8. memanggil `container.get(module)` dan menormalisasi beberapa bentuk export;
9. merender component dengan props `basePath` dan `subRoute` dalam Suspense;
10. menampilkan pesan module unavailable bila loading gagal.

`MFEErrorBoundary` membungkus route child, mencatat error, dan merender
`MFEErrorFallback` dengan aksi reset.

## 5. Routing Shell

Route pada `src/routes/routes.tsx`:

| Path | Status | Hasil |
|---|---|---|
| `/login` | public | Login |
| `/` | protected | redirect ke `/dashboard` |
| `/dashboard` | protected | Dashboard |
| `/child/*` | protected | Child melalui LazyMFE |
| wildcard | conditional | NotFound atau redirect login |

Protected route memakai `ProtectedRoute` dan `Layout` dengan `Outlet`.
`ProtectedRoute` memeriksa loading, authentication, dan optional permission.
Permission gagal diarahkan ke `/unauthorized`, tetapi route khusus tersebut
belum didaftarkan sehingga wildcard yang akan menangani hasil akhirnya.

`Layout` memiliki navigation statis ke Dashboard dan Child MFE. Sidebar dapat
di-expand/collapse dan nilai `sidebarExpanded` disimpan di localStorage.

## 6. Authentication dan Shared State

### 6.1 AuthContext

User berisi `id`, `email`, `name`, `roles`, dan `permissions`.

- Mount membaca `token` dari localStorage lalu meminta `GET /Auth/profile`.
- Login meminta `POST /Auth/login` dengan email/password.
- Response menerima field `token` atau `Token`.
- Token dan flag `authenticated` disimpan di localStorage.
- Logout menghapus token, flag, user, dan menuju `/login`.
- Permission `*` memberi akses semua permission.
- Role `admin` dianggap memenuhi role apa pun.

### 6.2 Fallback demo

Semua error pada proses login masuk fallback demo: user `Demo Admin`, token
`demo-token`, `authenticated=true`, lalu redirect ke dashboard. Ini cocok untuk
demo lokal, tetapi berisiko tinggi bila terbawa ke production karena kegagalan
auth terlihat sebagai login berhasil.

### 6.3 SharedContext

`SharedProvider` menyediakan `queryClient`, `authContext`, `apiBaseUrl`, dan
singleton `eventBus`. Tanpa provider, `useSharedContext` mengembalikan fallback
context dengan auth kosong dan QueryClient baru.

Shell memang meneruskan auth shell ke SharedProvider-nya, tetapi `Module` child
membuat SharedProvider tanpa props. Jadi auth user shell belum otomatis mengalir
ke child. Ini harus menjadi kontrak eksplisit saat template dikembangkan.

## 7. Environment dan API

### 7.1 Runtime environment

`template-shell/env.js` mendefinisikan getter `window._env` yang dibekukan.
Default-nya:

```text
MODE             = local
auth API         = http://localhost:5139/api
childMfe remote  = http://localhost:5006/remoteEntry.js
allowed domains  = localhost
app name         = Template MFE Shell
version          = 1.0.0
```

`getApiUrl`, `getApiBaseUrl`, `getAllApiUrls`, `getEnvMode`, `getEnvConfig`, dan
`getMfeUrl` membaca runtime config atau memakai fallback port lokal.

### 7.2 API client shared

`createApiClient` mendukung GET/POST/PUT/PATCH/DELETE, Bearer token lazy,
`Content-Type: application/json`, dan `credentials: 'include'`.

- 401 memanggil `onUnauthorized` lalu throw `Unauthorized`.
- 403 dan error non-OK lain menjadi `ApiError` dengan status/details.
- 204 menghasilkan object kosong.
- Response normal diparse sebagai JSON.

Child membuat client auth API dan memiliki contoh `getUsers()` (`GET /users`)
serta `getUserById(id)` (`GET /users/:id`). Response contoh masih `any`.

## 8. Event Bus

Event bus shared adalah pub/sub in-memory berbasis `Map<string, Set<callback>>`.
API: `subscribe`, `publish`, `once`, masing-masing mengembalikan unsubscribe.
`useEventBus` membersihkan subscription saat unmount.

Konstanta event meliputi navigasi (`mfe:navigate`), auth (`auth:logged_in`,
`auth:logged_out`, `auth:session_expired`, `auth:token_refreshed`), data
(`data:updated`, `cache:invalidate`), UI (notification/modal/sidebar), dan error
(`mfe:error`, `api:error`). Bus ini bukan komunikasi lintas tab dan efektivitas
lintas remote bergantung pada satu instance module yang benar-benar dibagi.

## 9. Shared UI, Utility, dan Tipe

### UI

Shared mengekspor `Button` (variant dan size dengan CVA/Radix Slot), `Card` dan
subkomponennya, `Input`, `Label`, Tooltip Radix, DropdownMenu Radix, serta
Sonner toast/toaster.

### Common component

`LoadingSpinner` memiliki ukuran sm/md/lg, `PageLoader` memakai spinner besar,
`GlobalLoadingOverlay` menampilkan overlay full-screen berdasarkan LoadingContext,
dan `ErrorFallback`/`MFEErrorFallback` menyediakan pesan serta retry.

### Utility

`cn` menggabungkan class via `clsx` dan `tailwind-merge`. Tersedia
`formatDate`/`formatDateTime` locale `en-US`, `formatCurrency` locale `id-ID`
dengan default IDR, serta `debounce` dan `throttle`.

### Tipe

Tipe umum meliputi `PaginatedResponse<T>`, `ApiResponse<T>`, `SelectOption`,
`TableColumn<T>`, `FilterConfig` (text/select/date/number), `SortConfig`, dan
`PaginationConfig`. User/Auth/Shared context juga diekspor dari barrel types.

## 10. Build, Package, dan Styling

### Root scripts

| Script | Fungsi |
|---|---|
| `install:all` | `pnpm install` |
| `build:shared` | build shared |
| `build:shell` | shared lalu shell |
| `build:child` | shared lalu child |
| `build` | build ketiga package berurutan |
| `dev:shell` / `dev:child` | satu dev server |
| `dev` | shell dan child via concurrently |
| `start` / `start:all` | install lalu dev |
| `typecheck` | `pnpm -r typecheck` |
| `clean` | hapus dist/node_modules/cache |

Shared build menjalankan `tsc` lalu `scripts/fix-imports.cjs` untuk menambahkan
ekstensi `.js` atau `/index.js` pada relative import hasil dist. Package shared
menyediakan exports untuk root, components, ui, hooks, contexts, lib, dan types.

Ketiga package menargetkan ES2020, `moduleResolution: bundler`, JSX
`react-jsx`, dan alias source `@template/shared`. Shared `strict: true`, tetapi
shell dan child `strict: false`, `noImplicitAny: false`, dan `noUnused*` false.

Tailwind 3 menggunakan dark mode berbasis class, semantic CSS variables seperti
`--primary`, `--background`, `--muted`, `--card`, serta plugin
`tailwindcss-animate`. Shell memindai source shell/shared/child; child memindai
source child/shared.

CSS global memakai font Inter dari Google Fonts. Tema default bernuansa orange
dan menyediakan token light/dark, termasuk token sidebar. Shell menambahkan
aturan `overflow-wrap`/`word-break` untuk elemen teks dan overflow horizontal
untuk `pre`/`code`. HTML shell memuat `/env.js` sebelum React dan menyediakan
`#root`; HTML child hanya menyediakan `#root`. Deklarasi TypeScript remote
menyatakan module `childMFE/Module` menerima `basePath?` dan `subRoute?`.

Wrapper `sastStorage` pada shell dan child memetakan operasi retrieve/store/remove/
clear ke localStorage. Nama API dibangun secara dinamis dari string, tetapi
perilakunya tetap localStorage biasa.

## 11. Cara Memakai dan Menambah MFE

Quick start:

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:5000` untuk shell dan `http://localhost:5006` untuk child
standalone. Untuk child baru, salin template child, ubah package/name/port,
pertahankan atau sepakati exposed `./Module`, buat route standalone dan
federated, pindahkan page/service khusus ke package child, lalu tambahkan package
ke workspace dan concurrently script. Daftarkan URL pada `env.js` bila dipakai,
route pada shell dengan `MFEErrorBoundary` + `LazyMFE`, dan item navigasi pada
Layout.

Kode yang dipakai dua atau lebih MFE cocok masuk shared. Page-specific component,
business logic domain, dan API khusus satu MFE sebaiknya tetap lokal.

Migration guide menyarankan split ketika ada banyak tim, kebutuhan deployment
independen, bundle awal besar, release cadence berbeda, atau kebutuhan isolasi
kegagalan. Batas modul dapat dimulai dari kelompok route tingkat atas pada
monolith. Checklist migrasi mencakup identifikasi route/API/shared code,
unique federation name, port, `Module.tsx`, `App.tsx`, page/service, shared
imports, shell route/URL/navigation, lalu pengujian standalone, federated,
singleton dependency, auth, navigasi tanpa reload, dan error boundary.

Konvensi port dokumentasi: `5000` shell, `5006` child pertama, `5007` child
kedua, `5008` child ketiga, `5009` child keempat, dan `5010` child kelima.
Port `5001` serta `5002-5005` disediakan untuk kebutuhan lain/reserved.

## 12. Risiko dan Gap yang Terlihat

- Fallback login demo membuat kegagalan API menjadi login sukses.
- Auth shell belum diteruskan ke provider child federated.
- Profile non-OK tidak secara eksplisit membersihkan user/token.
- `/unauthorized` digunakan tetapi tidak memiliki route eksplisit.
- Event auth tersedia tetapi `AuthContext` belum mem-publish event login/logout.
- Share registry manual mendaftarkan React Router `6.28.1`, sedangkan package
  meminta `6.30.1`; konfigurasi non-strict tetap perlu diuji.
- Route child memakai URL hard-code, meskipun `env.js` memiliki `MFE_ROUTES`.
- CORS wildcard dan localStorage token perlu ditinjau untuk production.
- `window._env` adalah konfigurasi client-side, bukan tempat menyimpan secret.
- QueryClient child dan shell tidak otomatis sama.
- Dev alias memakai source shared, sedangkan package exports menunjuk dist.
- `transpileOnly` tidak menggantikan `pnpm typecheck`.
- Tidak terlihat test, lint config, atau CI.
- `pnpm clean` memakai `rm -rf`, tidak native untuk PowerShell.
- `ALLOWED_DOMAINS` didefinisikan tetapi belum terlihat dipakai untuk validasi.

## 13. Kontrak Operasional Remote

```text
host path       = /child/* (atau namespace lain)
scope           = childMFE
remote URL      = .../remoteEntry.js
module          = ./Module
props           = { basePath?, subRoute? }
shared          = react, react-dom, jsx-runtime, react-router-dom, react-query
```

Diagnosis remote gagal: pastikan server hidup, buka `remoteEntry.js`, cocokkan
scope dengan name, cocokkan module dengan exposes, periksa CORS/console, pastikan
React dan React DOM masuk share scope, lalu periksa wildcard route dan base path.

## 14. Kesimpulan

Template sudah menyediakan fondasi MFE: workspace, host/remote federation,
shared UI/state/API, dynamic loader, routing, auth, loading, error isolation,
dan migration guide. Sebelum production, keputusan terpenting adalah kontrak
auth lintas MFE, strategi token, penghapusan fallback demo, sumber URL remote,
penyatuan QueryClient/shared context, test/CI, dan hardening deployment.

Daftar isi tersegmentasi tersedia pada `potongan-01` sampai `potongan-06`.
