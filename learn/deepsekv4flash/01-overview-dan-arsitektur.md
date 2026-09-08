# 01 — Overview & Arsitektur MFE

## Apa Itu Template Ini

Template **Micro-Frontend (MFE)** berbasis **Webpack 5 Module Federation** untuk React. Terdiri dari 3 package dalam satu pnpm workspace:

1. **`template-shell`** (`@template/shell`) — Host/shell, port **5000**
2. **`template-mfe-child`** (`@template/mfe-child`) — Remote/child MFE, port **5006**
3. **`template-shared`** (`@template/shared`) — Library kode bersama

## Konsep Module Federation

Module Federation memungkinkan sebuah aplikasi (host/shell) memuat kode aplikasi lain (remote) **saat runtime** dari jarak jauh:

- Remote mempublikasikan (exposes) modul tertentu lewat file **`remoteEntry.js`**.
- Host men-download `remoteEntry.js` (via `<script>` dinamis), lalu memanggil `container.get('./Module')` untuk mendapatkan komponen.
- Dependensi umum (**React, ReactDOM, React Router, React Query**) di-**share** sebagai **singleton** agar hanya ada satu instance — mencegah error hooks / duplikasi React.

## Tiga Lapisan

### Shell (Host)
- Punya halaman Login, Dashboard, Layout sidebar, autentikasi.
- Memuat child MFE **secara dinamis** (lazy) melalui komponen `LazyMFE`.
- Mengelola dependensi bersama (shared singleton).

### Child MFE (Remote)
- Mengekspos komponen `Module` lewat Module Federation.
- Bisa jalan **mandiri** (standalone, punya `index.tsx` + `bootstrap.tsx` + `App.tsx` sendiri di port 5006).
- Bisa dimuat **oleh shell** (lewat `Module.tsx`).
- Berbagi React/React Router dengan shell (singleton).

### Shared Library (`@template/shared`)
- UI components, common components, contexts, hooks, utils, api client, types, env helpers.
- Di dev, **webpack alias** mengarahkan `@template/shared` ke `../template-shared/src` → tanpa build step.
- Saat build/dipublish, di-compile dengan `tsc` menjadi ESM di `dist/`.

## Alur Request Runtime

```
Browser → Shell :5000
  ├─ login → AuthContext (fetch /Auth/login, simpan token)
  ├─ route /child/* → LazyMFE
  │     ├─ muat remoteEntry.js childMFE dari :5006
  │     ├─ init share scope (React dsb singleton)
  │     ├─ container.get('./Module')
  │     └─ render <Module basePath="/child" />
  └─ Child memakai @template/shared (context, api, eventBus)
```

## Keunggulan Arsitektur Ini
- **Deploy terpisah** per MFE (tim berbeda, rilis berbeda).
- **Isolasi kegagalan**: satu MFE down tidak merusak shell (ada error boundary).
- **Bundle lebih kecil** per aplikasi, dimuat sesuai kebutuhan (lazy).
- **Skalabilitas tim**: setiap fitur menjadi package sendiri.
