# Spesifikasi Arsitektur: Struktur Proyek dan Alur Data Microfrontend Toko GKLaku

## Problem Statement

Aplikasi Toko Online **Toko GKLaku** mengalami evolusi dari sistem berbasis web monolitik (ASP.NET Core Razor Pages) menjadi arsitektur terdistribusi berbasis **Microfrontend (MFE)**. Dalam arsitektur terdistribusi ini, tim pengembang menghadapi beberapa tantangan integrasi kritis:

1. **Kompleksitas Manajemen Modul Independen**: Pembagian modul antarmuka ke dalam repositori independen berpotensi menimbulkan inkonsistensi styling, redundansi pustaka dependensi (seperti React, ReactDOM, dan router), serta fragmentasi tata kelola kode jika struktur monorepo tidak memiliki batasan paket (*package boundaries*) yang tegas.
2. **Sinkronisasi Sesi Autentikasi dan State Global**: Setiap modul Microfrontend berjalan secara otonom di peramban pengguna. Tanpa kontrak aliran data yang terdefinisi, pertukaran informasi sensitif (seperti token sesi, kunci API, dan profil pengguna aktif) rawan mengalami *race condition*, kebocoran state, atau kegagalan sinkronisasi saat pengguna berpindah halaman atau keluar dari sistem (*logout*).
3. **Pemberlakuan Hak Akses Peran (RBAC) Dinamis Lintas Batas Modul**: Hak akses operasional toko berjenjang (**Super Admin (SA)**, **Pemilik Toko**, dan **Admin Toko**) tidak boleh lagi diperiksa secara statis di kode klien (*hardcoded role strings*). Sistem membutuhkan alur perolehan izin dinamis dari basis data backend yang dapat diakses oleh kontainer utama (*Shell*) maupun modul remote (*Remote MFE*), baik pada level navigasi antarmuka maupun penjaga rute (*route guards*).
4. **Komunikasi Antar-Modul yang Terisolasi (*Decoupled Communication*)**: Modul independen membutuhkan mekanisme pertukaran pesan (seperti notifikasi toast, pemicu muat ulang data, dan pembukaan dialog global) tanpa menciptakan ketergantungan langsung (*tight coupling*) antar-kode modul.
5. **Kesesuaian Standar Desain dan Glosarium Domain**: Seluruh antarmuka Microfrontend wajib mematuhi standar desain *anti-slop* (aksen tunggal oranye, hierarki tipografi rapi, kontras WCAG AA, bebas tanda em-dash) serta disiplin istilah domain resmi (*Ekspedisi*, bukan *kurir*; *Pelanggan*, bukan *customer*; *Status Aktif/Nonaktif*, bukan *soft delete*).

---

## Solution

Membangun dan mendokumentasikan spesifikasi arsitektur **Microfrontend Toko GKLaku** berbasis **Webpack 5 Module Federation** di dalam monorepo **PNPM Workspaces** (`mfe-template`). Solusi ini mengintegrasikan:

1. **Struktur Proyek Monorepo Berlapis**:
   - **`template-shell`** (Host Container): Berfungsi sebagai orkestrator rute utama, penyedia kerangka tata letak terpadu (Sidebar & Topbar), manajemen sesi autentikasi, serta pemuat kontainer modul mikro dinamis (*Dynamic Remote Container Loading*).
   - **`template-shared`** (Shared Core Library): Pustaka bersama internal yang mengekspos sistem desain terpadu (Tailwind CSS, komponen UI primitif), bus komunikasi global (*Event Bus singleton*), dan konteks data lintas modul.
   - **`mfe-master`** (Remote Domain MFE): Modul otonom yang mengisolasi seluruh logika domain data master toko (**Produk**, **Kategori**, dan **Ekspedisi**), dilengkapi penjaga izin berlapis (*Permission Guard*).
   - **Modul Ekstensibilitas** (`template-mfe-child`, `mfe-hallo`): Fondasi modul mikro tambahan untuk ekspansi fitur masa depan.
2. **Alur Data Terstandarisasi (*Data Flow Architecture*)**:
   - **Alur Autentikasi & Penyebaran Kredensial**: Login tunggal terpusat di Shell yang mendistribusikan token dan kredensial via penyimpanan terisolasi (`sastStorage`) dan `SharedProvider`.
   - **Alur Evaluasi Hak Akses Dinamis**: Pengambilan izin pengguna aktif via endpoint `/api/role-menus/my-permissions` untuk menyaring menu sidebar di Shell dan memproteksi rute serta tombol aksi CRUD di Remote MFE.
   - **Alur Komunikasi Antar-Modul**: Penggunaan *Singleton Event Bus* yang terpasang pada objek global jendela peramban (`window.__MFE_EVENT_BUS__`) untuk pengiriman peristiwa *real-time* tanpa keterikatan kode.
   - **Alur Konsumsi REST API Backend**: Komunikasi langsung dari Remote MFE ke backend monolith ASP.NET Core (`cobaproject`) menggunakan header `X-Api-Key` dan `Content-Type: application/json`.

---

## User Stories

### Pengembang & Frontend Engineer
1. Sebagai Pengembang Frontend, saya ingin struktur monorepo dengan PNPM Workspaces yang terisolasi rapi, sehingga saya dapat mengelola dependensi bersama tanpa duplikasi dependensi node_modules yang membebani memori.
2. Sebagai Pengembang Frontend, saya ingin dependensi inti (`react`, `react-dom`, `react-router-dom`) dikonfigurasi sebagai singleton di Webpack Module Federation, sehingga peramban hanya memuat satu instance React dan tidak terjadi konflik runtime hook.
3. Sebagai Pengembang Frontend, saya ingin mekanisme pemuatan remote dinamis (*LazyMFE*) dilengkapi fallback antarmuka dan penanganan kesalahan (*Error Boundary*), sehingga jika salah satu remote server tidak aktif, kontainer utama tidak crash total.
4. Sebagai Pengembang Frontend, saya ingin pustaka `template-shared` menyediakan komponen UI atomik yang seragam dan patuh WCAG AA, sehingga saya tidak perlu membuat ulang komponen tombol, kartu, input, dan dialog di setiap modul remote.
5. Sebagai Pengembang Frontend, saya ingin ada kontrak event bus (`MFE_EVENTS`) bertipe data aman, sehingga pengiriman sinyal notifikasi dan pembaruan data antar-MFE dapat dilacak dengan mudah.

### Super Admin (SA)
6. Sebagai Super Admin (SA), saya ingin dapat masuk ke sistem melalui panel login Shell, sehingga saya memperoleh akses penuh ke seluruh modul master dan konfigurasi sistem.
7. Sebagai Super Admin (SA), saya ingin menu navigasi menampilkan seluruh kelompok menu secara utuh, sehingga saya dapat mengelola data toko tanpa hambatan otorisasi.
8. Sebagai Super Admin (SA), saya ingin memiliki wewenang penuh untuk melakukan operasi Tambah, Ubah, Hapus Permanen, dan Ubah Status pada Produk, Kategori, dan Ekspedisi.

### Pemilik Toko
9. Sebagai Pemilik Toko, saya ingin melihat seluruh ringkasan data operasional pada modul Master Hub, sehingga saya dapat memantau katalog dan opsi pengiriman toko secara komprehensif.
10. Sebagai Pemilik Toko, saya ingin sidebar hanya menampilkan menu yang memiliki hak akses bagi peran saya, sehingga navigasi kerja saya tetap fokus dan terbebas dari pengaturan sistem tingkat rendah.
11. Sebagai Pemilik Toko, saya ingin dapat menonaktifkan atau mengaktifkan status operasional Produk, Kategori, dan Ekspedisi secara cepat via tombol toggle di tabel.
12. Sebagai Pemilik Toko, saya ingin sistem memblokir penghapusan permanen data Produk yang pernah dipesan atau Ekspedisi yang pernah digunakan dalam pesanan pelanggan, sehingga keutuhan audit transaksi toko terlindungi.
13. Sebagai Pemilik Toko, saya ingin dapat menghapus permanen data Kategori yang belum memiliki produk atau Ekspedisi yang belum pernah dipakai dalam transaksi, sehingga entitas uji coba dapat dibersihkan dari basis data.

### Admin Toko
14. Sebagai Admin Toko, saya ingin dapat mengelola katalog Produk dan Kategori sesuai hak operasional yang diberikan oleh Super Admin, sehingga kegiatan rutin toko berjalan lancar.
15. Sebagai Admin Toko, saya ingin menu Master Ekspedisi otomatis disembunyikan dari sidebar navigasi saya, sehingga saya tidak melihat menu yang berada di luar wewenang saya.
16. Sebagai Admin Toko, saya ingin melihat tampilan halaman 403 Akses Ditolak yang jelas jika saya mencoba mengakses URL `/master/ekspedisi` secara langsung dari address bar peramban, sehingga saya memahami batasan hak akses saya.
17. Sebagai Admin Toko, saya ingin tombol aksi Tambah, Hapus, atau Ubah Status otomatis tersembunyi pada tabel jika hak akses saya pada menu tersebut dibatasi, sehingga tidak timbul kebingungan aksi yang berakhir penolakan server.

### Pengurus Toko & Pelanggan (Keandalan Sistem)
18. Sebagai Pengurus Toko, saya ingin transisi collapse dan uncollapse pada sidebar berjalan mulus pada 60fps tanpa sentakan tata letak, sehingga pengalaman bekerja di panel pengurus terasa modern dan nyaman.
19. Sebagai Pengurus Toko, saya ingin setiap aksi penting (ubah status, hapus permanen) meminta konfirmasi melalui dialog internal yang jelas, sehingga terhindar dari kesalahan klik yang tidak disengaja.
20. Sebagai Pelanggan, saya ingin data produk yang dinonaktifkan oleh pengurus toko segera ditarik dari katalog belanja publik, sehingga saya tidak memesan barang yang sedang tidak ditawarkan.

---

## Implementation Decisions

### 1. Struktur Arsitektur Repositori (PNPM Monorepo Workspaces)

Monorepo diatur dalam struktur workspace `pnpm` dengan pemisahan tanggung jawab yang ketat:

```text
mfe-template/
├── package.json                   # Orkestrasi skrip global (dev, build, typecheck, lint)
├── pnpm-workspace.yaml            # Definisi paket monorepo
├── template-shell/                # Host Container Application (Port 5000 / 5005)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/            # Sidebar dinamis, Topbar, Animasi transisi
│   │   │   ├── LazyMFE.tsx        # Dynamic Remote Container Loader + Cache
│   │   │   └── ErrorBoundary.tsx  # Isolasi crash per modul remote
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # State autentikasi, penyedia RBAC canAccessMenu
│   │   ├── routes/
│   │   │   ├── routes.tsx         # Rute global, pendelegasian sub-rute remote
│   │   │   └── ProtectedRoute.tsx # Penjaga rute terautentikasi
│   │   └── bootstrap.tsx          # Titik masuk aplikasi host
│   └── webpack.config.cjs         # Konfigurasi Module Federation Host
├── template-shared/               # Core Shared Package (@template/shared)
│   ├── src/
│   │   ├── components/ui/         # Primitif UI: Button, Card, Input, Tooltip, Dialog
│   │   ├── contexts/              # SharedContext, LoadingContext, AuthContext contract
│   │   ├── lib/
│   │   │   ├── eventBus.ts        # Singleton Event Bus (window.__MFE_EVENT_BUS__)
│   │   │   └── env.ts             # Resolusi URL endpoint lingkungan
│   │   └── types/                 # Tipe data bersama (Pagination, Sort, API Envelope)
│   └── package.json               # Dilisensikan sebagai paket internal workspace:*
├── mfe-master/                    # Remote MFE: Data Master Toko (Port 5008)
│   ├── src/
│   │   ├── components/
│   │   │   └── PermissionGuard.tsx# Penjaga otorisasi tingkat halaman & sub-rute
│   │   ├── pages/
│   │   │   ├── Home.tsx           # Master Hub Navigator
│   │   │   ├── Produk/            # Index (Tabel katalog), Tambah, Ubah
│   │   │   ├── Kategori/          # Index (Tabel klasifikasi), Tambah, Ubah
│   │   │   └── Ekspedisi/         # Index (Tabel pengiriman & ongkir), Tambah, Ubah
│   │   ├── services/              # API Client (productApi, categoryApi, courierApi, roleMenuApi)
│   │   ├── routes/
│   │   │   └── masterRoutes.tsx   # Sub-router independen modul master
│   │   ├── Module.tsx             # Titik eksposisi Module Federation (./Module)
│   │   └── bootstrap.tsx          # Standalone runner untuk pengembangan lokal terisolasi
│   └── webpack.config.cjs         # Konfigurasi Module Federation Remote
└── cobaproject/                   # Backend Monolith (ASP.NET Core .NET 10, Port 5251)
    ├── Controllers/Api/           # ProductsController, CategoryController, CourierController, RoleMenuController
    ├── Infrastructure/            # DbUp Migrations, Dapper Repositories, Dynamic Authorization Handlers
    └── CONTEXT.md                 # Glosarium Domain Resmi & Aturan Kosakata
```

---

### 2. Konfigurasi Webpack Module Federation

Integrasi federasi modul menerapkan prinsip pemisahan runtime dengan ketergantungan singleton:

#### A. Host Container (`template-shell`)
- Bertindak sebagai konsumen dinamis.
- Menggunakan `LazyMFE` yang menginjeksi tag `<script src=".../remoteEntry.js">` secara aman saat rute terkait pertama kali diakses.
- Mendeklarasikan dependensi bersama (`shared`) dengan flag `singleton: true` dan `eager: true` untuk menghindari pemuatan ganda:
  - `react` & `react-dom`
  - `react-router-dom`
  - `@tanstack/react-query`

#### B. Remote Module (`mfe-master`)
- Mengekspos komponen kontainer utama melalui nama unik:
  - `name: 'mfeMaster'`
  - `filename: 'remoteEntry.js'`
  - `exposes: { './Module': './src/Module.tsx' }`
- Mengatur dependensi bersama dengan `singleton: true` dan `eager: false` agar memanfaatkan dependensi yang sudah dimuat oleh Host Container.

```text
┌──────────────────────────────────────────────────────────────┐
│                    Host: template-shell                      │
│   (Port 5000/5005 - Shared React, Router, Auth Context)      │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     Remote: mfe-master       │ │    Remote: template-mfe-child│
│        (Port 5008)           │ │        (Port 5006)           │
│  - Katalog Produk            │ │  - Fitur Eksperimental /     │
│  - Klasifikasi Kategori      │ │    Contoh Boilerplate        │
│  - Mitra Ekspedisi           │ │                              │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

### 3. Diagram & Spesifikasi Alur Data (Data Flow Architecture)

#### Flow 1: Autentikasi, Sesi, dan Distribusi Kredensial
1. Pengguna memasukkan kredensial pada halaman login `template-shell`.
2. Shell memanggil endpoint backend `/api/auth/login`.
3. Backend mengembalikan data profil pengguna dan API Secret Key (`apiKey`).
4. Shell menyimpan informasi ini ke dalam `sastStorage` yang terisolasi.
5. `AuthProvider` menginisialisasi state dan menyediakannya ke seluruh komponen turunan melalui `SharedProvider`.
6. Saat modul remote `mfe-master` dimuat, modul membaca kredensial dari `sastStorage` atau konteks bersama untuk disertakan pada setiap permintaan HTTP backend.

```text
[Pengguna] ──1. Login──► [Shell: Login.tsx] ──2. POST /api/auth/login──► [Backend API: AuthController]
                                ▲                                                    │
                                │                                              3. Token & Profile
                                ▼                                                    ▼
                       [sastStorage] ◄──4. Simpan apiKey & User ───────────── [Shell: AuthContext]
                                │
                                └───5. Terbaca oleh remote ────────────► [mfe-master: Services]
```

---

#### Flow 2: Alur Evaluasi Hak Akses Peran Dinamis (RBAC Flow)
1. Setelah login berhasil, Shell memanggil endpoint `/api/role-menus/my-permissions` dengan header `X-Api-Key`.
2. Backend mengevaluasi peran pengguna terhadap tabel `MASTER_ROLE_MENU` dan mengembalikan kamus izin untuk setiap kode menu (`master-produk`, `master-kategori`, `master-ekspedisi`).
3. Shell menormalisasi hasil izin ke format huruf kecil dan menyimpannya di memori state `menuPermissions`.
4. **Pada Navigasi Sidebar (Shell)**:
   - Fungsi `canAccessMenu(menuCode)` memeriksa apakah menu memiliki `canRead === true`.
   - Submenu *Master* otomatis menyembunyikan item yang tidak memiliki hak baca (misal: *Ekspedisi* disembunyikan dari Admin Toko).
   - Jika seluruh item anak di dalam grup Master tidak diizinkan, grup Master otomatis disembunyikan.
5. **Pada Tingkat Halaman & Sub-rute (Remote MFE)**:
   - Komponen `PermissionGuard` membungkus rute `/master/ekspedisi/*`.
   - Jika pengguna memaksakan akses melalui address bar peramban, `PermissionGuard` menampilkan tampilan **403 Akses Ditolak** dengan tombol kembali ke Beranda.
6. **Pada Tingkat Aksi Tombol (Remote MFE)**:
   - Halaman tabel membaca izin granular: `canCreate`, `canUpdate`, `canDelete`, dan `canToggleActive`.
   - Tombol *Tambah*, tombol *Edit*, tombol *Hapus*, dan tombol *Toggle Status* dirender secara kondisional berdasarkan izin granular tersebut.

```text
[Shell: AuthProvider] ──1. GET /api/role-menus/my-permissions──► [Backend: RoleMenuController]
         │                                                                   │
         │◄─────────────────2. Kamus Hak Akses Peran─────────────────────────┘
         ▼
[State: menuPermissions]
         │
         ├──► 3. Evaluasi Sidebar: canAccessMenu("master-ekspedisi")
         │         ├── True  ──► Tampilkan menu di Sidebar
         │         └── False ──► Sembunyikan menu dari Sidebar
         │
         └──► 4. Evaluasi Remote: PermissionGuard (mfe-master)
                   ├── Diizinkan  ──► Render Index / Form Tambah / Form Ubah
                   └── Ditolak    ──► Render Tampilan 403 Forbidden
```

---

#### Flow 3: Alur Komunikasi Lintas Modul via Singleton Event Bus
Komunikasi antar-MFE tidak menggunakan event emitter lokal yang terduplikasi, melainkan memanfaatkan objek singleton global di jendela peramban:

$$\text{EventBus Instance} = \text{window}[\text{"\_\_MFE\_EVENT\_BUS\_\_"}] \parallel \text{new EventBus()}$$

Katalog peristiwa resmi (`MFE_EVENTS`):
- `NOTIFICATION_SHOW`: Menampilkan toast notifikasi global di pojok layar Shell.
- `AUTH_LOGOUT`: Memicu pembersihan sesi dan pengalihan ke login.
- `DATA_UPDATED`: Memberi sinyal pembaruan data antar-komponen independen.
- `NAVIGATE_TO`: Meminta Shell melakukan navigasi rute programatis.

```text
[mfe-master: KategoriIndex]                                        [template-shell: NotificationContainer]
             │                                                                      │
             │ 1. publish(NOTIFICATION_SHOW, { type: 'success', message: '...' })    │
             ├─────────────────────────────────────────────────────────────────────►│
             │                                                                      │ 2. Tampilkan Toast Notifikasi
             ▼                                                                      ▼
```

---

#### Flow 4: Alur Konsumsi REST API dan Proteksi Integritas Transaksi
Setiap service client di `mfe-master` (`productApi`, `categoryApi`, `courierApi`) berkomunikasi secara langsung ke API Backend (`http://localhost:5251`):

1. **Format Header Baku**:
   ```http
   Content-Type: application/json
   X-Api-Key: <token-aktif-dari-sastStorage>
   ```
2. **Amplop Respons Terpadu**:
   ```typescript
   interface ApiResponse<T> {
     isSuccess: boolean;
     statusCode: number;
     message: string;
     data: T;
     errors?: string[];
   }
   ```
3. **Proteksi Integritas Transaksi Relasional**:
   - **Hapus Produk**: Jika produk terdapat di tabel `TRX_ORDER_ITEM`, backend menolak penghapusan permanen dan mengembalikan pesan validasi. Antarmuka MFE menangkap pesan ini dan menyajikan dialog panduan untuk **Menonaktifkan Produk** sebagai gantinya.
   - **Hapus Kategori**: Jika kategori memiliki produk terkait (aktif maupun nonaktif), backend menolak penghapusan. MFE menampilkan modal peringatan interaktif dan menyarankan penonaktifan status kategori.
   - **Hapus Ekspedisi**: Jika ekspedisi pernah dipilih dalam transaksi pesanan belanja pelanggan (`TRX_ORDER`), penghapusan permanen ditolak demi keutuhan riwayat audit.
4. **Otomasi Status Operasional**:
   - Aktivasi produk ditolak keras oleh server jika stok produk bernilai `0`.
   - Operasi penambahan stok produk dari 0 ke nilai positif sengaja membiarkan produk tetap berstatus **Nonaktif** hingga pengurus mengaktifkannya secara sadar.

---

### 4. Standar Desain & Tipografi (Kepatuhan Taste-Skill)

1. **Aksen Warna Tunggal**: Seluruh modul menggunakan palet warna primer oranye (`orange-600` untuk aksi utama, `orange-50`/`orange-100` untuk kontainer lencana dan latar lembut). Menghindari gradien ungu acak atau palet templat generik.
2. **Kontras WCAG AA**: Seluruh teks abu-abu sekunder menggunakan minimal kelas `text-gray-500` atau `text-gray-600` di atas latar putih, dan lencana status memiliki kontras warna latar dan teks yang jelas (misal: `bg-green-50 text-green-700` untuk Aktif; `bg-gray-100 text-gray-700` untuk Nonaktif).
3. **Zero Em-Dash**: Tidak ada tanda hubung em-dash (`—`) pada seluruh teks antarmuka, keterangan, maupun pesan kesalahan.
4. **Konsistensi Radius & Spacing**: Seluruh kartu data dan modal menggunakan sudut membulat modern (`rounded-xl`), bayangan lembut (`shadow-xs` / `shadow-sm`), dan padding konsisten (`p-6 max-w-7xl mx-auto space-y-6`).
5. **Glosarium Bahasa Resmi**:
   - Wajib: **Ekspedisi**, **Tarif Ongkir**, **Pelanggan**, **Status Operasional (Aktif/Nonaktif)**, **Hapus Permanen**.
   - Dilarang: *kurir*, *jasa kirim*, *customer*, *soft delete*, *admin* (tanpa toko), *owner*.

---

## Testing Decisions

### 1. Seam Pengujian Terpadu (*Unified Test Seams*)
Pengujian arsitektur difokuskan pada titik batas (*seams*) tertinggi untuk memastikan ketahanan integrasi tanpa menguji detail implementasi internal:

1. **Seam 1: Pemuatan Modul Federasi (*Federation Loading Seam*)**:
   - Menguji kemampuan `template-shell` memuat bundle `remoteEntry.js` dari `mfe-master` secara dinamis.
   - Menguji isolasi kesalahan (*Error Boundary*) ketika remote server port 5008 tidak dapat dihubungi, memastikan Shell tetap menampilkan halaman pengganti yang ramah pengembang tanpa crash.
2. **Seam 2: Kontrak Komunikasi Bus Acara (*Event Bus Seam*)**:
   - Menguji emisi peristiwa `NOTIFICATION_SHOW` dari komponen di dalam `mfe-master` dan memastikan *listener* di `template-shell` menerima muatan data (*payload*) secara akurat.
3. **Seam 3: Penegakan Hak Akses Peran (*RBAC Authorization Seam*)**:
   - Menguji perilaku rendering sidebar Shell terhadap variasi kamus izin (SA vs Pemilik Toko vs Admin Toko).
   - Menguji respons rute `PermissionGuard` terhadap pengguna tanpa wewenang dengan memverifikasi munculnya status kode dan tampilan 403 Forbidden.
4. **Seam 4: Adapter Layanan API (*API Service Contract Seam*)**:
   - Menguji serialisasi dan deserialisasi format amplop API (`ApiResponse<T>`).
   - Menguji penyertaan header autentikasi `X-Api-Key` pada seluruh panggilan REST API.

### 2. Prior Art Pengujian
- Mengadopsi pengujian berbasis tipe (*Typecheck verification*) menggunakan TypeScript Compiler (`tsc --noEmit`) di seluruh paket monorepo secara serentak (`pnpm --filter ... typecheck`).
- Pengujian bundling produksi Webpack (`pnpm --filter ... run build`) untuk memvalidasi ketiadaan konflik dependensi bersama.

---

## Out of Scope

1. **Server-Side Rendering (SSR) untuk Remote Federation**: Seluruh integrasi Microfrontend berjalan murni di sisi peramban klien (*Client-Side Rendering*).
2. **Otentikasi Pihak Ketiga (OAuth2/OpenID Connect Publik)**: Sistem autentikasi internal toko tetap menggunakan otentikasi berbasis token kunci rahasia mandiri.
3. **Penyimpanan State Terdistribusi (Redux/Zustand Global Lintas MFE)**: Tidak menggunakan state manager global terpusat; setiap MFE mengelola state internalnya sendiri dan hanya bertukar data melalui API dan Event Bus.

---

## Further Notes

1. **Dokumen Pendukung Terkait**:
   - Glosarium Domain & Kosakata: `CONTEXT.md` (di repositori backend `cobaproject`).
   - Keputusan Arsitektur: `docs/adr/0005-status-produk-dan-otomasi-stok.md` dan `docs/adr/0006-standarisasi-status-dan-proteksi-kategori-ekspedisi.md`.
   - Spesifikasi Fitur Terkait: `docs/specs/0001-master-kategori-dan-ekspedisi.md`.
2. **Port Alokasi Lingkungan Pengembangan Lokal**:
   - Backend API (`cobaproject`): `http://localhost:5251`
   - Host Shell (`template-shell`): `http://localhost:5000` (atau port dev `5005`)
   - Remote Master (`mfe-master`): `http://localhost:5008`
   - Remote Child (`template-mfe-child`): `http://localhost:5006`
   - Remote Hallo (`mfe-hallo`): `http://localhost:5007`
