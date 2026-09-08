# 02. Peta Arsitektur & Peran Tiap Modul

Repositori ini adalah sebuah **Monorepo** yang dikelola menggunakan `pnpm workspaces` (dikonfigurasi pada file `pnpm-workspace.yaml`).

---

## 1. Diagram Arsitektur

```
                                  BROWSER CLIENT (http://localhost:5000)
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TEMPLATE-SHELL (Port 5000)                                       │
│  - Berfungsi sebagai API Gateway & Frame Induk (Layout, Navbar, Sidebar)                              │
│  - Mengelola Sesi Login / Autentikasi Global                                                          │
│  - Menangani Routing Induk: /child/* -> LazyMFE Loader                                                 │
│  - Menyediakan Circuit Breaker (<MFEErrorBoundary>)                                                    │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    │ Mengunduh http://localhost:5006/remoteEntry.js
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     TEMPLATE-MFE-CHILD (Port 5006)                                     │
│  - Microservice Tampilan: mengurusi domain fitur spesifik (Users, Roles, Dashboard)                    │
│  - Mengekspos (expose) komponen './Module' -> src/Module.tsx                                           │
│  - Dwi-Fungsi: Bisa jalan Standalone di port 5006 ATAU ditanam di dalam Shell                          │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    │ Import dependensi bersama
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            @template/shared                                            │
│  - Common SDK / Shared Library / Design System                                                         │
│  - UI Kit baku: Button, Card, Input, Modal, LoadingSpinner                                             │
│  - EventBus, API Client (Fetch wrapper + JWT), Context (Auth & QueryClient)                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pemisahan Tanggung Jawab (Separation of Concerns)

### A. `template-shell` (Host / Gateway)
- **Tugas Utama:**
  1. Pintu gerbang utama aplikasi (URL utama user).
  2. Menyediakan bingkai luar (*outer layout*): Header, Navbar, Sidebar, Footer.
  3. Mengelola status autentikasi login (Login, Logout, Token Session).
  4. Menyediakan kontainer isolasi error (`<MFEErrorBoundary>`).
  5. Memuat remote MFE secara on-demand (*lazy loading*).
- **Analogi Backend:** API Gateway / Reverse Proxy (Kong / Nginx) + Auth Server.

### B. `template-mfe-child` (Remote / Microservice)
- **Tugas Utama:**
  1. Menangani halaman dan logika bisnis domainnya sendiri (misal: CRUD User, Manajemen Role).
  2. Mengekspos satu pintu masuk bernama `./Module` via Module Federation.
  3. **Kemampuan Dwi-Fungsi (Dual Mode):**
     - **Integrated Mode:** Berjalan di dalam Shell sebagai sub-komponen.
     - **Standalone Mode:** Bisa dinyalakan dan ditest mandiri di port 5006 tanpa menyalakan Shell.
- **Analogi Backend:** Satu Microservice Bisnis (misal: Order Service atau User Service).

### C. `template-shared` (Shared Library / Design System)
- **Tugas Utama:**
  1. Menyediakan komponen UI standar (*Design System*): Button, Card, Input, Modal, Spinner.
  2. Menyediakan utilitas komunikasi: `eventBus`.
  3. Menyediakan helper API client (`createApiClient`) dengan penanganan otentikasi otomatis.
  4. Mengelola konteks global (`SharedContext`).
- **Analogi Backend:** Common Core SDK / Shared Library (seperti paket `company-common-auth` atau `shared-dto`).