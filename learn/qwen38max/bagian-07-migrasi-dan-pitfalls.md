# Bagian 07 — Panduan Migrasi Monolith → MFE & Common Pitfalls

(Rangkuman + anotasi dari `MIGRATION-GUIDE.md`)

## Kapan layak split ke MFE

- Banyak tim mengerjakan fitur berbeda (independensi rilis/deploy).
- Bundle monolith terlalu besar → initial load lambat.
- Release cadence berbeda per modul.
- Butuh isolasi kegagalan (satu MFE down ≠ seluruh app crash).

## Langkah migrasi (6 step)

### Step 1 — Identifikasi module boundaries
Lihat struktur route monolith; tiap grup route top-level = kandidat child MFE.

```
monolith: pages/admin/*, pages/reports/*, pages/workflow/*
→ shell (Login, Dashboard, Layout)
→ mfe-admin (Users, Roles, AuditTrail) :5006 scope adminMFE
→ mfe-reports :5007 scope reportMFE
→ mfe-workflow :5008 scope workflowMFE
→ shared (kode bersama)
```

### Step 2 — Buat shared library
Ekstrak kode yang dipakai **2+ modul**:

| Ekstrak | JANGAN ekstrak |
|---------|----------------|
| UI components (Button, Card, Table, Modal, Input) | komponen page-specific (1 MFE saja) |
| common components (Spinner, ErrorFallback, Pagination) | business logic domain-specific |
| contexts (Auth, Theme, Loading) | API calls khusus satu MFE |
| hooks (useAuth, usePermission, useDebounce, useEventBus) | |
| utils (API client, formatter, validator, storage) | |
| types (API response, interface bersama) | |

### Step 3 — Setup shell
1. MF host config: `remotes: {}`, shared singleton (`eager: true` di shell).
2. Komponen LazyMFE (sudah tersedia di template).
3. Route statis per child: `path="/admin/*"` + `<LazyMFE scope module url basePath/>`.

### Step 4 — Buat tiap child MFE
1. Copy `template-mfe-child/`.
2. MF config: `name` unik, `exposes: { './Module': './src/Module.tsx' }`,
   shared singleton (`eager: false` di remote).
3. `Module.tsx`: wrapper `SharedProvider > LoadingProvider > ModuleContent +
   GlobalLoadingOverlay`; routing berbasis `subRoute` / `useLocation().pathname`.
4. Pindahkan pages → `src/pages/`, services → `src/services/`.

### Step 5 — Registrasi di shell
- Route baru di `routes/routes.tsx` (bungkus `MFEErrorBoundary`).
- URL remoteEntry di `env.js` → `MFE_ROUTES`.
- Item navigasi di `Layout.tsx`.

### Step 6 — Workspace
- Tambah package ke `pnpm-workspace.yaml`.
- Tambah ke script `dev` root (concurrently dengan `--names` per MFE).

## Common pitfalls (dengan penjelasan tambahan)

### 1. Duplikat React instance
- Gejala: "Invalid hook call", hooks error.
- Fix: `singleton: true` di SEMUA MFE + `eager: true` di shell. Template juga
  seed manual `__webpack_share_scopes__` via `initSharedDependencies()`.

### 2. Konflik CSS antar MFE
- Gejala: style MFE A bocor ke MFE B.
- Fix: CSS modules / scoped class / Tailwind (class atomik unik).
  Template memilih Tailwind untuk alasan ini.

### 3. MFE gagal load (blank / spinner selamanya)
- Fix: cek URL remoteEntry & dev server jalan; cek CORS di console
  (devServer child harus kirim `Access-Control-Allow-Origin: *`);
  pastikan `scope` = `name` MF remote dan `module` = key di `exposes`.

### 4. Shared state tidak sinkron (auth tidak mengalir)
- Fix: pola SharedProvider — shell inject `authContext` ke `SharedProvider`;
  child bungkus kontennya dengan `SharedProvider` dan baca via `useAuth()` shared.

### 5. Konflik routing (404 di child)
- Fix: shell pakai `path="/xxx/*"` (splat pass-through); child match path
  RELATIF terhadap basePath (`currentPath.replace(basePath,'')`), bukan full path.

## Port convention

5000 shell · 5001 reserved · 5002–5005 services · 5006–5010 child MFE 1–5.

## Insight / anotasi pribadi (hasil baca kode, bukan dari docs)

1. **Demo fallback login** di `AuthContext.tsx` shell: setiap kegagalan login
   API tetap menghasilkan sesi "Demo Admin" (`permissions: ['*']`). Nyaman untuk
   template, tapi HARUS dihapus di produksi.
2. `hasRole` memperlakukan role `admin` sebagai super-role (selalu lolos).
3. `sastStorage` = obfuscation akses localStorage (`window['local'+'Storage']`)
   agar tidak di-flag scanner SAST — bukan mekanisme keamanan nyata.
4. LazyMFE memvalidasi `react`/`react-dom` ada di share scope sebelum
   `container.init()` → fail fast dengan pesan jelas, bukan hook error misterius.
5. Cache-busting `?_t=timestamp` hanya di localhost; di produksi pakai `?v=version`
   → strategi deploy-versioning remote tanpa rename file.
6. Child `onUnauthorized` memakai `window.location.href = '/login'` (full reload)
   — pragmatis lintas MFE, tapi kehilangan SPA navigation.
7. `retry` React Query shell menolak retry 4xx — pola bagus yang layak ditiru.
8. Shared `useSharedContext()` sengaja tidak throw (fallback default) supaya
   child standalone tidak crash — kontras dengan `useAuth()` shell yang throw.
9. Tidak ada test/lint config nyata di repo — template ini fokus ke wiring MFE.
10. Tailwind `content` tiap app menyertakan `../template-shared/src/**` —
    konsekuensi shared dipakai sebagai source, bukan package ter-build, saat dev.
