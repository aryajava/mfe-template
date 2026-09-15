# Ringkasan Proyek — Toko Online "Toko GKLaku" (BNI Trial)

> Dokumen ini adalah ringkasan konseptual agar proyek ini bisa dipahami oleh manusia maupun agent AI lain, tanpa merujuk ke kode sumbernya. Bila proyek ini dijadikan contoh di tempat lain, dokumen ini bisa disalin dan dibaca langsung.

## Apa proyek ini

Aplikasi **toko online** utuh (satu aplikasi web monolit, ASP.NET Core .NET 10 + Razor Pages) bernama **"Toko GKLaku"**. Pelanggan berbelanja dari area toko publik; pengurus mengelola toko dari kantor yang terpisah sama sekali. Nilai utamanya bukan fitur, melainkan disiplin desain yang bisa ditiru: kosakata domain yang ketat, keputusan arsitektur yang direkam (ADR), jejak audit permanen berbasis basis data, pemisahan tegas dua kelas akun, dan alur bisnis "tanpa jalan pintas".

Bayangkan aplikasi ini sebagai dua situs dalam satu aplikasi:

- **Toko** (untuk semua orang) dengan nuansa biru terang, santai, dan ramah.
- **Kantor staf** (tersembunyi) yang rapi, padat, dan hanya terlihat oleh pengurus.

Selain antarmuka bawaan Razor Pages, proyek ini juga menyediakan ekosistem **Microfrontend (MFE)** independen berbasis React dan Webpack Module Federation di direktori `mfe-template` yang mengonsumsi seluruh REST API backend secara utuh.

---

## 1. Wajah toko (area publik)

Halaman pertama yang dilihat pengunjung adalah **katalog produk**: satu baris navigasi putih semi-transparan menempel di atas layar, berisi logo toko, kotak pencarian "Cari produk...", ikon keranjang dengan lencana jumlah, dan tombol **Masuk** (atau menu akun setelah masuk).

Di bawahnya, tata letak dua kolom:

- **Kolom kiri**: daftar kategori dengan jumlah produk tiap kategori; kategori yang sedang dipilih tampil dengan latar biru lembut.
- **Kolom utama**: grid kartu produk (2 sampai 4 kolom tergantung lebar layar). Setiap kartu menampilkan foto (rasio 4:3), lencana kuning `-15%` bila sedang diskon, lencana abu-abu **"Habis"** bila stok nol, judul dua baris, harga asli yang dicoret tipis, dan harga efektif yang tebal biru. Di dasar kartu ada dua tombol berdampingan: ikon keranjang (+) dan tombol **Beli**.

Di atas grid ada tombol-tombol kecil berbentuk pil (chip) untuk mengurutkan **Terbaru / Termurah / Termahal**, dan bila pengunjung sedang mencari atau memfilter, muncul chip filter yang bisa ditutup (misal `"sepatu" ×`). Pencarian tidak menemukan apa pun? Muncul kartu kosong dengan ikon besar dan ajakan "Lihat Semua Produk".

Penting: **katalog belanja publik hanya menampilkan produk yang berstatus Aktif**. Produk yang dinonaktifkan oleh staf atau yang dinonaktifkan otomatis oleh sistem karena kehabisan stok tidak akan pernah muncul di etalase belanja publik maupun halaman detail produk.

**Wireframe halaman katalog:**

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [storefront] Toko GKLaku   [🔍 Cari produk...            ]  🛒 (3)  [Masuk] │
├──────────────────┬───────────────────────────────────────────────────┤
│ Kategori         │  Katalog Produk · 120 produk                      │
│                  │  [Terbaru] [Termurah] [Termahal]                  │
│ ● Semua  (120)   │  ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│ ○ Elektronik(38) │  │  [foto 4:3] │ │  [foto 4:3] │ │  [foto 4:3] │     │
│ ○ Fashion (35)   │  │  -15%  Habis│ │  -10%      │ │            │     │
│ ○ Otomotif (21)  │  │ Sepatu Run..│ │ Jaket Denim│ │ T-Shirt Kot│     │
│ ○ Rumah   (26)   │  │ Rp250.000   │ │ Rp180.000  │ │ Rp95.000    │     │
│                  │  │ Rp212.500   │ │ Rp162.000  │ │ Rp95.000    │     │
│                  │  │ [+][Beli]   │ │ [+][Beli]  │ │ [+][Beli]   │     │
│                  │  └────────────┘ └────────────┘ └────────────┘     │
│                  │  Menampilkan 1–12 dari 120   ◀ 1 2 3 … 10 ▶       │
└──────────────────┴───────────────────────────────────────────────────┘
```

**Halaman detail produk** menampilkan foto besar di kiri, dan di kanan: judul, kategori, lencana diskon, harga coret lalu harga tebal besar, deskripsi, stok tersedia, dan tombol **Masukkan Keranjang**. Bila produk berstatus nonaktif diakses langsung lewat tautan, sistem merespons dengan halaman tidak ditemukan (404).

```text
┌──────────────────────────┬─────────────────────────────────────────────┐
│        [foto produk]     │  Sepatu Running Pro                          │
│        (kartu 320px)     │  Kategori: Fashion            [-15%]         │
│                          │  Rp250.000 (coret) · Rp212.500 (tebal biru)  │
│                          │  Deskripsi produk ......................     │
│                          │  Stok tersedia: 10                           │
│                          │  [🛒 Masukkan Keranjang]                     │
└──────────────────────────┴─────────────────────────────────────────────┘
```

## 2. Berbelanja sampai pesanan tiba (alur pelanggan)

1. **Keranjang.** Pengunjung yang belum masuk menyimpan keranjangnya di browser (lencana jumlah di navbar ikut bertambah). Begitu masuk akun, keranjang itu digabung otomatis ke akunnya dan ikut tersedia dari perangkat lain. Keranjang tidak mengurangi stok. Produk yang berstatus nonaktif otomatis ditandai tidak tersedia di keranjang dan tidak dapat diproses ke checkout.
2. **Checkout wajib masuk.** Tombol checkout mengarahkan pelanggan untuk **Daftar** (nama, email, sandi) atau **Masuk** (email + sandi). Di layar checkout pelanggan mengisi alamat kirim, memilih **ekspedisi** (misal "Kurir Toko" atau "J&T", masing-masing dengan ongkir), lalu melihat ringkasan: subjumlah (pakai harga setelah diskon) + ongkir + pajak = **total**.
3. **Konfirmasi pesanan.** Sebelum pesanan terbentuk, pelanggan membuktikan identitasnya: mengulang kata sandi, dan bila pengurus mengaktifkannya, juga menyelesaikan CAPTCHA yang dijalankan aplikasi sendiri (tanpa layanan pihak ketiga). Pesanan baru tercipta bila keduanya lolos.
4. **Pesanan Saya.** Daftar riwayat pesanan dengan lencana status berwarna. Pelanggan bisa membatalkan (wajib mengisi alasan, selama masih boleh) dan menandai pesanan **Diterima** saat barang datang.

**Peta alur belanja & otomasi stok:**

```text
Katalog ──► Detail Produk ──► Keranjang ──► (wajib Masuk/Daftar) ──► Checkout
   ▲                                        ▲                          │
   └── bisa tambah langsung dari kartu ─────┘                          ▼
Pesanan Saya ◄── Pesanan tercipta (stok dipotong; stok 0 → Nonaktif) ◄── Konfirmasi: kata sandi + CAPTCHA
     │                    ┌─ DIBATALKAN (alasan wajib; stok kembali & produk otomatis Aktif)
     ▼                    ▼
MENUNGGU_KONFIRMASI → DIKEMAS → DIKIRIM → DITERIMA
```

**Wireframe layar checkout:**

```text
Checkout ─ silakan masuk akun dulu
┌──────────────────────────────────────┬───────────────────────────┐
│ Data Pengiriman                      │ Ringkasan                 │
│ Nama      [____________]             │ Subtotal    Rp 212.500    │
│ No. HP    [____________]             │ Ongkir      Rp  10.000    │
│ Alamat    [________________]         │ Pajak (2%)  Rp   4.250    │
│ Catatan   [____________]             │ ────────────────────      │
│                                      │ Total       Rp 226.750    │
│ Ekspedisi                            │                           │
│ (•) Kurir Toko      Rp 10.000        │                           │
│ ( ) J&T             Rp 15.000        │                           │
│                                      │                           │
│ Konfirmasi Identitas                 │ [🔒 Buat Pesanan]         │
│ Kata sandi [________]  [🛡 CAPTCHA]  │                           │
└──────────────────────────────────────┴───────────────────────────┘
```

**Otomasi stok dan status ketersediaan:**
- **Saat checkout berhasil:** harga dihitung ulang secara ketat di server, dan stok produk langsung dipotong. Bila pemotongan tersebut membuat sisa stok produk menjadi 0, sistem secara reaktif mengubah status produk menjadi **Nonaktif** agar tidak dapat lagi dipesan oleh pelanggan lain.
- **Saat pesanan dibatalkan:** bila pesanan dibatalkan (oleh pelanggan saat menunggu konfirmasi atau oleh pengurus saat pesanan dikemas), stok barang otomatis dikembalikan ke basis data dan status produk otomatis beralih kembali menjadi **Aktif**.

## 3. Kantor staf (area `/Panel`, tersembunyi)

Area ini **tidak boleh diketahui pelanggan**; pengunjung yang belum masuk diarahkan ke halaman **Masuk staf** yang terpisah (akun pengurus berbeda kelas dari akun pelanggan). Tampilannya langsung terasa "kantor": **sidebar putih di kiri** dengan ikon, dikelompokkan **Beranda, Master, Operasional, Maintenance, Monitoring, Settings**, dan **topbar** berisi jejak halaman (breadcrumb), nama pengguna, lencana peran, dan tombol keluar. Menu dan tombol aksi menyesuaikan peran: fitur yang tidak boleh diakses peran tertentu **tidak dimunculkan sama sekali**.

**Dashboard** membuka dengan deretan kartu statistik berwarna: **Total Produk** (biru), **Produk Diskon** (biru muda), **Stok Menipis 1–5** (kuning), **Stok Habis** (merah), lalu untuk pemilik: **Diskon Menunggu Persetujuan**, **Pesanan Menunggu Proses**, dan **Pesanan Hari Ini**. Tiap kartu bisa diklik dan langsung membawa ke halaman terkait.

**Wireframe tata letak panel (semua halaman berpola sama):**

```text
┌──────────────┬──────────────────────────────────────────────────────────┐
│  [storefront]│  Beranda > Master > Master Produk      Nama [Pemilik] ⏻ │
│  Toko GKLaku │──────────────────────────────────────────────────────────│
│              │                                                          │
│ BERANDA      │  Dashboard (klik kartu → ke halamannya)                  │
│  ▸ Dashboard │  ┌────────┐┌────────┐┌────────┐┌────────┐                │
│ MASTER       │  │🟦 Total││🟦 Diskon││🟨 Stok ││🟥 Stok │                │
│  ▸ Produk    │  │  Produk ││   42   ││ Menipis││ Habis │                │
│  ▸ User      │  │  120   ││        ││   8    ││   3   │                │
│  ▸ Kategori  │  └────────┘└────────┘└────────┘└────────┘                │
│  ▸ Ekspedisi │  ┌────────┐┌────────┐                                    │
│  ▸ Pelanggan │  │🟨 Diskon││🟦 Pesanan│                                   │
│ OPERASIONAL  │  │ Menunggu││ Hari Ini│                                    │
│  ▸ Pesanan   │  │   5    ││   12   │                                    │
│ MAINTENANCE  │  └────────┘└────────┘                                    │
│  ▸ UserCtrl  │                                                          │
│  ▸ Hak Akses │                                                          │
│ MONITORING   │                                                          │
│  ▸ Permintaan│                                                          │
│  ▸ Notifikasi●                                                          │
│  ▸ Persetuj. │                                                          │
│  ▸ Laporan   │                                                          │
│ SETTINGS     │                                                          │
│  ▸ Pengaturan│                                                          │
│  ▸ Audit Log │                                                          │
│ ─────────────│                                                          │
│ [🛠 API Docs]│                                                          │
└──────────────┴──────────────────────────────────────────────────────────┘
```

**Halaman data** (Master Produk, Master Kategori, Master User, Master Pelanggan, Master Ekspedisi, Pesanan, dan lain-lain) semuanya berpola sama: tabel dengan **judul kolom yang bisa diklik untuk mengurutkan**, kotak pencarian, filter, nomor baris, harga dalam format Rupiah, pagination ringkas, dan **tombol aksi berupa ikon**. Tindakan penting meminta konfirmasi lewat popup atau halaman konfirmasi khusus, lalu umpan balik muncul sebagai pemberitahuan kecil di sudut layar.

**Wireframe halaman data (contoh Master Produk):**

```text
Master Produk                                    [+ Tambah Produk]
[Cari produk...             ]  [Kategori ▾]  [Status ▾]
┌────┬─────────────┬──────────────────┬─────────┬────────┬──────────┬─────┬──────────┐
│ #  │ Produk      │ Harga Dasar      │ Diskon  │ Stok   │ Status   │ Kat │ Aksi     │
├────┼─────────────┼──────────────────┼─────────┼────────┼──────────┼─────┼──────────┤
│ 1  │ Sepatu Run..│ Rp250.000        │ -15%    │ 10     │ Aktif    │ Fsn │ ✎ ⏻ 🗑   │
│ 2  │ Jaket Denim │ Rp180.000        │ -10%    │ 0      │ Nonaktif │ Fsn │ ✎ ⏻ 🗑   │
│ 3  │ T-Shirt K.. │ Rp95.000         │ -       │ 25     │ Aktif    │ Fsn │ ✎ ⏻ 🗑   │
└────┴─────────────┴──────────────────┴─────────┴────────┴──────────┴─────┴──────────┘
                                     ◀ 1 2 3 … 10 ▶
```

### Aturan status produk, penghapusan, dan hak akses peran

1. **Status Operasional Produk (Aktif vs Nonaktif):**
   - Kolom status produk (`IS_ACTIVE`) bukan penanda penghapusan (soft delete), melainkan status operasional toko: apakah produk sedang ditawarkan di etalase publik atau ditarik sementara.
   - Tabel Master Produk menampilkan seluruh produk (Aktif maupun Nonaktif) dengan lencana status yang jelas, opsi filter status (Semua / Aktif / Nonaktif), dan pengurutan.
   - Pengurus yang memiliki hak akses dapat menonaktifkan atau mengaktifkan produk secara manual via tombol aksi (*toggle*).
   - **Validasi stok nol:** produk dengan stok 0 dilarang mutlak untuk diaktifkan kembali. Sistem akan menolak percobaan aktivasi dengan pesan kesalahan yang jelas.
   - **Aturan Restock:** bila staf mengisi ulang stok produk dari 0 ke nilai positif melalui formulir ubah produk, produk **sengaja tetap berstatus Nonaktif**. Status baru berubah menjadi Aktif setelah pengurus berwenang mengaktifkannya secara sadar (memberi waktu bagi pengurus untuk menyiapkan rilis produk).

2. **Penghapusan Produk (Hard Delete dengan Proteksi Transaksi):**
   - Fungsional *soft delete* telah ditiadakan sepenuhnya dari aplikasi.
   - Aksi hapus produk murni menjalankan penghapusan permanen (*hard delete*).
   - **Perlindungan integritas data:** bila sebuah produk pernah tercatat dalam transaksi belanja pelanggan (`TRX_ORDER_ITEM`), produk tersebut **dilarang dihapus permanen** agar riwayat pesanan pelanggan dan audit transaksi tetap utuh dan valid.
   - Pada halaman konfirmasi hapus, jika produk memiliki riwayat pesanan, tombol hapus permanen otomatis disembunyikan. Sebagai gantinya, sistem menyajikan kartu peringatan dan tombol untuk **menonaktifkan produk** agar tidak lagi tampil di etalase publik.

3. **Sistem Hak Akses Peran Dinamis (Maintenance > Hak Akses Peran):**
   - Pengaturan otorisasi staf kini dikelola melalui basis data pada menu **Hak Akses Peran** (`/Panel/Maintenance/HakAksesPeran`), tersimpan di tabel `MASTER_ROLE_MENU` dan `MASTER_MENU`.
   - Izin diberikan secara granular per menu untuk aksi:
     - **Lihat** (akses halaman menu)
     - **Tambah** (`CAN_CREATE`)
     - **Ubah** (`CAN_UPDATE`)
     - **Hapus** (`CAN_DELETE`)
     - **Status** (`CAN_TOGGLE_ACTIVE`) — hak untuk mengaktifkan/menonaktifkan status operasional produk.
   - Hak akses status dipisahkan dari hak edit biasa; staf toko bisa diberi izin memperbarui nama atau harga produk namun tidak berhak mengaktifkan produk ke publik bila belum memiliki hak status.
   - Tersedia tombol aksi cepat untuk konfigurasi hak akses: *Pilih Semua*, *Kosongkan*, *Hanya Lihat*, dan *Akses Penuh*.
   - Khusus peran **Super Admin (SA)**, seluruh hak akses diberikan secara penuh pada setiap menu staf.

**Alur status pesanan yang dikerjakan staf:**

```text
MENUNGGU_KONFIRMASI ──[Konfirmasi & Kemas]──► DIKEMAS ──[Tandai Dikirim]──► DIKIRIM ──(pelanggan: Diterima)──► DITERIMA
        │                                    │
        └──[Batalkan + alasan]──► DIBATALKAN ◄──[Batalkan + alasan]
             (pembeli atau penjual)              (penjual saja)
             → stok dikembalikan & produk aktif kembali
```

**Matriks acuan default peran** (konfigurasi awal di basis data, dapat disesuaikan di menu Hak Akses Peran):

| Fitur / halaman | Admin Toko | Pemilik Toko | Super Admin |
|---|---|---|---|
| Kelola Produk & Kategori (lihat/tambah/ubah) | ✔ | ✔ | ✔ |
| Hapus Produk Permanen (bila tanpa riwayat order) | ✘ | ✔ | ✔ |
| Ubah Status Produk (Aktif/Nonaktif) | ✘ (opsional via Hak Akses) | ✔ | ✔ |
| Master User, User Control, Ekspedisi | ✘ | ✔ | ✔ |
| Master Pelanggan | ✘ | ✔ | ✔ |
| Permintaan Diskon | milik sendiri | semua | semua |
| Persetujuan Diskon | ✘ | ✔ | ✔ |
| Laporan Penjualan | ✘ | ✔ | ✔ |
| Hak Akses Peran | ✘ | ✘ | ✔ |
| Pengaturan Aplikasi (ambang login) | ✘ | ✘ | ✔ |
| Pengaturan Toko (ongkir, pajak) | ✘ | ✔ | ✔ |
| Audit Log | ✘ | ✘ | ✔ |

**Pesanan** menampilkan daftar ber-lencana status. Pengurus menggerakkan pesanan maju dengan tombol **Konfirmasi & Kemas** lalu **Tandai Dikirim**; pembatalan selalu meminta alasan. **Laporan Penjualan** memperlihatkan produk **terlaris** dan **jarang terjual** dengan filter 7/30 hari/sepanjang masa. **Notifikasi** menampilkan lencana merah di sidebar dan melayang toast bila ada peristiwa baru (misal pesanan baru), diperbarui otomatis tiap beberapa detik.

**Alur diskon** punya dua halaman terpisah: **Permintaan Diskon** (daftar permintaan yang menunggu; staf hanya melihat miliknya) dan **Persetujuan Diskon** (khusus pemilik/super admin, untuk menyetujui atau menolak). Tidak ada jalan pintas: perubahan diskon oleh siapa pun selalu jadi permintaan yang menunggu keputusan, dan produk memakai diskon lama sampai diputuskan.

**Settings** berisi: **Pengaturan Aplikasi** (ambang penguncian setelah gagal masuk, khusus super admin), **Pengaturan Toko** (ongkir tetap dan persen pajak, untuk pemilik), dan **Audit Log** dengan tiga tab: aksi pengurus, siklus hidup akun pelanggan, dan lalu lintas HTTP. Dari sidebar juga ada tautan **Dokumentasi API** (Swagger).

---

## 4. Integrasi Microfrontend (`mfe-template`)

Ekosistem Toko GKLaku dirancang siap untuk arsitektur terdistribusi modern melalui suite **Microfrontend (MFE)** di repositori `mfe-template`. Menggunakan Webpack 5 Module Federation, antarmuka dipecah menjadi beberapa modul otonom:
- **`template-shell`**: Wadah utama aplikasi, penyedia layout navigasi, state autentikasi global, dan router terpadu.
- **`template-shared`**: Pustaka komponen UI (Tailwind CSS, shadcn-like), event bus antarmodul, context loading, dan utilitas format.
- **`mfe-master`**: Modul mikro untuk pengelolaan data master, termasuk katalog **Master Produk**.

### Mekanisme Integrasi Produk & Hak Akses di Microfrontend:
1. **Layanan API Klien (`productApi.ts` & `roleMenuApi.ts`)**:
   - Berkomunikasi langsung ke backend `http://localhost:5251` dengan menyertakan Secret Key aktif pada header `X-Api-Key`.
   - Mengambil daftar produk berhalaman dengan dukungan filter status (`IsActive`), pencarian teks, dan kategori.
   - Mengubah status operasional produk secara instan via `toggleStatus(id, isActive)`.
   - Menghapus produk murni secara permanen via `delete(id)`.
2. **Evaluasi Izin Dinamis (`useAuth` + `roleMenuApi.getMyPermissions`)**:
   - Saat halaman Master Produk dibuka, `mfe-master` secara otomatis meminta izin pengguna yang sedang aktif via endpoint `/api/role-menus/my-permissions`.
   - Menghilangkan *hardcoded role checking* (`['sa', 'owner']`), digantikan oleh izin nyata dari database: `canCreate`, `canUpdate`, `canDelete`, dan `canToggleActive`.
3. **Penyelarasan UX & Desain Anti-Slop**:
   - Filter dropdown status (*Semua Status*, *Aktif*, *Nonaktif*) terpasang rapi di toolbar pencarian.
   - Kolom aksi dilengkapi tombol ikon toggle dinamis: hijau untuk mengaktifkan, kuning untuk menonaktifkan, lengkap dengan tooltip keterangan.
   - Dialog konfirmasi pengalihan status berbasis modal internal (menggunakan kartu Tailwind di MFE dan modal Bootstrap di Razor Pages) menggantikan dialog peramban (`confirm`/`alert`) maupun pustaka pop-up pihak ketiga (SweetAlert) demi menjaga estetika desain anti-slop, kontras WCAG AA, dan peringatan stok 0 interaktif.
   - Peringatan transaksi: bila penghapusan permanen gagal akibat riwayat pesanan, modal dan toast notifikasi secara eksplisit memandu pengurus untuk menonaktifkan produk sebagai gantinya.

---

## 5. Profil teknis

| Aspek | Pilihan |
|---|---|
| Kerangka Backend | ASP.NET Core (.NET 10), Razor Pages + REST API Controllers dalam satu proyek monolit |
| Kerangka Frontend | Razor Pages (bawaan) + Microfrontend Workspace (React 18, TypeScript, Webpack 5 Module Federation, Tailwind CSS di `mfe-template`) |
| Basis data | SQL Server, akses data via Dapper, migrasi via DbUp (skrip SQL berurutan dengan pemisah batch `GO`) |
| Keamanan & Otorisasi | Autentikasi cookie dua kelas akun; otorisasi kebijakan dinamis berbasis menu dan aksi (`Menu:{kode}:{aksi}`); sandi di-hash (bcrypt); API dilindungi kunci rahasia per user |
| Logging & Audit | Pemisahan tegas: jejak audit di tabel basis data, kesalahan teknis di file log |
| Antarmuka | Bahasa Indonesia di UI; nama tabel basis data dalam bahasa Inggris |

## 6. Prinsip jejak (khas proyek ini)

Hampir semua keputusan bisnis ditulis permanen ke tabel audit di basis data, bukan file: aksi pengurus yang mengubah data (dengan nilai sebelum dan sesudah), siklus hidup akun pelanggan (daftar, masuk, gagal masuk, ubah profil, ganti sandi, blokir/buka), perubahan status produk (aktif/nonaktif), dan lalu lintas HTTP area pengurus. Data rahasia disunting sebelum disimpan, dan tabel audit sengaja tidak memakai relasi kunci asing agar tetap utuh sebagai bukti sekalipun data terkait dihapus. Kesalahan teknis dicatat terpisah dan tidak tercampur dengan jejak audit.

## 7. Arsitektur API

Satu set endpoint REST di bawah `/api/*` dengan pola seragam: setiap entitas dilayani oleh controller khusus berstandar enterprise:
- **`ProductsController` (`/api/products`)**:
  - `GET /api/products/paged`: Mengambil data produk berhalaman dengan filter pencarian, kategori, pengurutan, dan parameter filter status `isActive` (`true`, `false`, atau kosong).
  - `GET /api/products/{id}`: Detail produk tanpa memedulikan status aktif.
  - `POST /api/products`: Tambah produk baru (`Menu:master-produk:create`).
  - `PUT /api/products/{id}`: Ubah produk (`Menu:master-produk:update`). Penurunan stok `<= 0` otomatis menonaktifkan produk.
  - `POST /api/products/{id}/status`: Pengalihan status operasional produk (`Menu:master-produk:status`). Menolak aktivasi produk bila stok 0.
  - `DELETE /api/products/{id}`: Hapus permanen (`Menu:master-produk:delete`). Menolak penghapusan bila produk terkait dengan data transaksi di `TRX_ORDER_ITEM`.
- **`RoleMenuController` (`/api/role-menus`)**:
  - `GET /api/role-menus?role={role}`: Mengambil seluruh menu dan izin aksi untuk peran tertentu (`Menu:hak-akses-peran:read`).
  - `PUT /api/role-menus`: Menyimpan konfigurasi hak akses peran secara batch (`Menu:hak-akses-peran:update`), mencegah pengubahan pada peran `SA`.
  - `GET /api/role-menus/my-permissions`: Mengembalikan kamus izin menu dan aksi pengguna yang sedang login (`[Authorize]`), menjadi fondasi evaluasi izin bagi aplikasi Microfrontend.
- **Controller Pendukung Lainnya**: `AuthController`, `UsersController`, `CustomerController`, `CategoryController`, `CourierController`, `OrderController`, `DiscountApprovalsController`, `SalesReportController`, `SettingController`, dan `AuditLogController`.

## 8. Asal-usul dan evolusi

Proyek dimulai sebagai percobaan endpoint CRUD dengan konsumen data dari API produk publik (fakestoreapi), lalu dirombak total menjadi toko online dengan dua area, dua kelas akun, siklus pesanan penuh, audit dua sisi, dan laporan penjualan. Sejarah ini terekam dalam dokumen rencana eksekusi dan ADR bernomor:
- **ADR 0001–0004:** Arsitektur monolit, autentikasi dua kelas akun, alur diskon dua tahap, dan audit log permanen.
- **ADR 0005:** Perombakan status operasional produk (`IS_ACTIVE`), peniadaan soft delete demi integritas transaksi, otomasi ketersediaan stok, dan sistem hak akses peran dinamis berbasis basis data (`CAN_TOGGLE_ACTIVE`).
- **Ekspansi Microfrontend (MFE):** Pembentukan repositori `mfe-template` yang memisahkan aplikasi menjadi arsitektur modular terfederasi, didukung oleh API otorisasi izin pengguna (`my-permissions`).

Arsitektur ini membuktikan bahwa sistem tumbuh lewat keputusan terukur yang terekam secara transparan, bukan sekadar menumpuk fitur.

## 9. Dokumen pendukung di repo ini

Kosakata domain resmi (istilah yang dipakai + istilah yang dilarang) ada di glossary proyek ([CONTEXT.md](CONTEXT.md)); keputusan desain bermakna direkam sebagai ADR di direktori `docs/adr/`; kebutuhan produk dirinci di dokumen PRD. Ketika mengerjakan atau meniru proyek ini, baca ketiganya lebih dulu agar bahasa dan arah desainnya konsisten.
