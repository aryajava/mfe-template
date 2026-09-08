# 09 — Migrasi Monolith → MFE

Ringkasan `MIGRATION-GUIDE.md`: panduan memecah React monorepo menjadi MFE berbasis Module Federation (arsitektur yang sudah diterapkan di template ini).

## Kapan Layak Dipecah
- Banyak tim mengerjakan fitur berbeda.
- Butuh deploy independen per fitur.
- Bundle besar memperlambat load awal.
- Cadence rilis berbeda tiap modul.
- Perlu isolasi kegagalan (satu MFE down tak merusak app).

## 6 Langkah Migrasi

### Langkah 1 — Identifikasi Batas Modul
- Setiap **grup route top-level** di monolith = kandidat child MFE.
- Contoh: `pages/admin` → `template-mfe-admin`, `pages/reports` → `template-mfe-reports`, `pages/workflow` → `template-mfe-workflow`.

### Langkah 2 — Buat Shared Library
- Ekstrak kode yang dipakai **≥ 2 modul** ke `@template/shared`:
  - UI components (Button, Card, Table, Modal, Form), common components (LoadingSpinner, ErrorFallback, Pagination).
  - Contexts (Auth, Theme, Loading), hooks (useAuth, usePermission, useDebounce, useEventBus).
  - Utilities (API client, formatter tanggal, validator, storage helper), types.
- **Jangan** ekstrak: komponen khusus satu halaman, business logic domain, API call khusus MFE.

### Langkah 3 — Siapkan Shell
1. Module Federation host config (`webpack.config.cjs`) — `name:'shell'`, `remotes:{}`, `shared` singleton.
2. `LazyMFE` (sudah ada) untuk load remote dinamis.
3. Route statis per child MFE: `path="/admin/*"` + `<LazyMFE scope="adminMFE" module="./Module" url=... basePath="/admin" />`.

### Langkah 4 — Buat Setiap Child MFE
1. Salin `template-mfe-child`.
2. Set `name` unik (scope) + `port` di devServer.
3. Buat `Module.tsx` dengan logika routing (berdasarkan `subRoute`/`useLocation`), bungkus dengan `SharedProvider`.
4. Pindahkan page ke `src/pages/`, service/API ke `src/services/`.
5. Ganti import monolith dengan `@template/shared`.

### Langkah 5 — Daftarkan di Shell
- Tambah route di `routes/routes.tsx` + `MFE_ROUTES` di `env.js` + item navigasi di `Layout` + daftarkan di `pnpm-workspace.yaml` + script `dev` (concurrently).

### Langkah 6 — Tambah ke pnpm Workspace
```yaml
packages:
  - 'template-shared'
  - 'template-shell'
  - 'template-mfe-admin'
  - 'template-mfe-reports'
  - 'template-mfe-workflow'
```
```json
"dev": "concurrently --names \"shell,admin,reports,workflow\" \
  \"pnpm --filter @template/shell dev\" ..."
```

## Checklist

**Sebelum ekstraksi**
- [ ] Identifikasi semua route modul
- [ ] Identifikasi semua API endpoint modul
- [ ] Identifikasi kode shared (2+ modul)
- [ ] Identifikasi kode khusus modul

**Membuat child MFE**
- [ ] Copy `template-mfe-child`
- [ ] Set unique `name` (MF config)
- [ ] Set `port` devServer
- [ ] Buat `Module.tsx` routing
- [ ] Buat `App.tsx` route standalone
- [ ] Pindah page & service
- [ ] Ganti import dengan `@template/shared`

**Registrasi di shell**
- [ ] Route di `routes.tsx`
- [ ] URL di `env.js` MFE_ROUTES
- [ ] Item navigasi di Layout
- [ ] Tambah di `pnpm-workspace.yaml`

**Testing**
- [ ] Child jalan standalone di port sendiri
- [ ] Child jalan saat dimuat shell
- [ ] Dependensi shared singleton (tanpa duplikasi React)
- [ ] Auth context mengalir shell → child
- [ ] Navigasi antar MFE tanpa reload penuh
- [ ] Error boundary menangkap kegagalan load MFE

## Arsitektur Target

```
Shell :5000 (Login, Dashboard, Layout, LazyMFE loader)
  ├─ Child MFE A (Admin)    :5006  scope: adminMFE    exposes: ./Module
  ├─ Child MFE B (Reports)  :5007  scope: reportMFE
  └─ Child MFE C (Workflow) :5008  scope: workflowMFE
            └── @template/shared (components, hooks, contexts, utils, types, api client)
```
