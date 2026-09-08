# 12. Panduan Migrasi: Monolith → MFE
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

Sumber: `MIGRATION-GUIDE.md`

---

## Kapan Harus Split?

Kandidat yang baik untuk split MFE:

| Signal | Penjelasan |
|--------|-----------|
| Multiple tim | Tim berbeda kerja di fitur berbeda, sering conflict |
| Independent deploy | Modul A butuh deploy tanpa menyentuh modul B |
| Bundle size besar | Load awal sudah > 1-2MB, pengguna merasakan lambat |
| Release cadence berbeda | Fitur A rilis mingguan, fitur B rilis bulanan |
| Isolasi kegagalan | Satu modul error tidak boleh crash seluruh app |

## Langkah 1: Identifikasi Batas Modul

Lihat struktur route monolith. Setiap kelompok route top-level = kandidat 1 MFE.

```
Monolith:                         Hasil split MFE:
src/pages/
├── admin/                    →  template-mfe-admin/
│   ├── Users.tsx
│   ├── Roles.tsx
│   └── AuditTrail.tsx
├── reports/                  →  template-mfe-reports/
│   ├── Dashboard.tsx
│   └── Export.tsx
└── workflow/                 →  template-mfe-workflow/
    ├── Inbox.tsx
    └── Detail.tsx

App.tsx (semua routes)        →  template-shell/ (Login, Dashboard, Layout)
src/components/shared/        →  template-shared/
```

## Langkah 2: Extract ke Shared Library

Extract kode yang dipakai **2 atau lebih** modul:

| Kategori | Contoh |
|----------|--------|
| UI components | Button, Card, Table, Modal, Form inputs |
| Common components | LoadingSpinner, ErrorFallback, Pagination |
| Contexts | Auth, Theme, Loading |
| Hooks | useAuth, usePermission, useDebounce, useEventBus |
| Utilities | API client, date formatters, validators |
| Types | API response types, shared interfaces |

## Langkah 3: Setup Shell

1. Buat `webpack.config.cjs` dengan ModuleFederationPlugin host
2. Buat `LazyMFE` component (sudah ada di template)
3. Definisikan static routes untuk tiap MFE

## Langkah 4: Buat Tiap Child MFE

1. Copy `template-mfe-child/` sebagai starting point
2. Rename folder dan update `package.json`
3. Set **unique** `name` di webpack Federation config
4. Set **unique** port di devServer
5. Buat `Module.tsx` dengan routing logic
6. Pindahkan pages dari monolith ke `src/pages/`
7. Pindahkan services/API ke `src/services/`
8. Ganti semua import monolith → `@template/shared`

## Langkah 5: Registrasi di Shell

```typescript
// routes/routes.tsx — tambah route
<Route
  path="/admin/*"
  element={
    <MFEErrorBoundary mfeName="Admin">
      <LazyMFE
        scope="adminMFE"
        module="./Module"
        url="http://localhost:5006/remoteEntry.js"
        basePath="/admin"
      />
    </MFEErrorBoundary>
  }
/>
```

```javascript
// env.js — tambah URL
const MFE_ROUTES = {
  adminMfe: "http://localhost:5006/remoteEntry.js",
  reportMfe: "http://localhost:5007/remoteEntry.js",
  workflowMfe: "http://localhost:5008/remoteEntry.js",
};
```

## Langkah 6: Daftarkan di Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'template-shared'
  - 'template-shell'
  - 'template-mfe-admin'
  - 'template-mfe-reports'
  - 'template-mfe-workflow'
```

```json
// package.json root — update dev script
"dev": "concurrently --names \"shell,admin,reports,workflow\"
  \"pnpm --filter @template/shell dev\"
  \"pnpm --filter @template/mfe-admin dev\"
  \"pnpm --filter @template/mfe-reports dev\"
  \"pnpm --filter @template/mfe-workflow dev\""
```

## Checklist Lengkap per Child MFE Baru

```
SEBELUM EXTRACT:
☐ Identifikasi semua routes milik modul ini
☐ Identifikasi semua API endpoints yang dipakai
☐ Pisahkan: shared code (≥2 MFE) vs module-specific

MEMBUAT CHILD MFE:
☐ Copy template-mfe-child/ sebagai starting point
☐ Set unique name di webpack Federation config
☐ Set unique port di devServer
☐ Buat Module.tsx dengan routing logic
☐ Buat App.tsx untuk standalone mode
☐ Pindahkan page components dari monolith
☐ Pindahkan services/API calls terkait
☐ Ganti semua import monolith → @template/shared

REGISTRASI DI SHELL:
☐ Tambah route di routes/routes.tsx (path="/<name>/*")
☐ Tambah URL di env.js MFE_ROUTES
☐ Tambah nav item di Layout sidebar
☐ Tambah ke pnpm-workspace.yaml
☐ Tambah ke concurrently dev script

TESTING:
☐ Child MFE jalan standalone (localhost:506X)
☐ Child MFE jalan saat dimuat shell
☐ Shared deps singleton (tidak duplikat React)
☐ Auth context mengalir shell → child (useAuth() bekerja)
☐ Navigasi antar MFE tanpa full page reload
☐ Error boundary menangkap kegagalan load MFE
```

---
*Lanjut → [13. Common Pitfalls](./13-common-pitfalls-dan-solusinya.md)*
