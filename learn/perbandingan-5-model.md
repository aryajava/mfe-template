# Perbandingan 5 Catatan Model — learn/

> Analisa: 2026-09-08. Semua klaim catatan diverifikasi silang terhadap source code repo.
> Model: deepsekv4flash, gemini38flash, gpt56luna, qwen38max, sonnet46thinking.

## Statistik Mentah

| Model | File | Baris | Kata | Fokus |
|-------|------|-------|------|-------|
| sonnet46thinking | 16 | 1.914 | 7.194 | Tutorial pedagogis + agent tooling |
| deepsekv4flash | 11 | 1.057 | 5.909 | Ensiklopedia codebase |
| qwen38max | 8 | 712 | 4.108 | Analisa arsitektur + insight |
| gemini38flash | 12 | 668 | 3.455 | Mental model untuk backend dev |
| gpt56luna | 7 | 421 | 2.123 | Audit fakta + risiko |

---

## 1. Tabel Matriks Perbandingan

Skor 1–10 per dimensi (hasil verifikasi terhadap kode aktual):

| Dimensi | deepsekv4flash | gemini38flash | gpt56luna | qwen38max | sonnet46thinking |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Kelengkapan coverage codebase** | 9.5 | 5.5 | 7.5 | 8.0 | 9.0 |
| **Kedalaman teknis (mekanisme)** | 8.5 | 8.5 | 7.0 | 7.5 | 9.0 |
| **Akurasi vs kode aktual** | 9.0 | 8.0 | 10 | 8.5 | 5.5 |
| **Struktur & navigasi** | 9.0 | 8.0 | 6.0 | 8.0 | 9.5 |
| **Insight kritis / audit** | 7.0 | 6.0 | 9.5 | 8.0 | 6.5 |
| **Nilai pembelajaran (pedagogi)** | 7.5 | 9.0 | 6.5 | 7.0 | 9.0 |
| **Keunikan (tidak ada di lain)** | 8.0 | 9.0 | 9.0 | 7.0 | 8.5 |
| **TOTAL (rata-rata)** | **8.4** | **7.7** | **7.9** | **7.7** | **8.1** |
| **Peringkat keseluruhan** | 🥇 1 | 4 | 🥉 3 | 4 | 🥈 2 |

### Coverage topik (✓ = dibahas memadai, ✗ = tidak/sekilas)

| Topik | deepsek | gemini | gpt56 | qwen | sonnet |
|-------|:---:|:---:|:---:|:---:|:---:|
| Arsitektur 3 package | ✓ | ✓ | ✓ | ✓ | ✓ |
| Webpack MF config detail | ✓ | ✓ | ✓ | ✓ | ✓ |
| LazyMFE step-by-step | ✓ | ✓ | ✓ | ✓ | ✓ |
| sharedDependencies.ts (seeding share scope) | ✓ | ✗ | ✓ | ✓ | ✗ |
| Provider stack bootstrap | ✓ | ✗ | ✓ | ✓ | ✓ |
| AuthContext + demo fallback | ✓ | ✗ | ✓ | ✓ | ✗ |
| SharedContext/LoadingContext detail | ✓ | ✓ | ✓ | ✓ | ⚠ (salah) |
| EventBus + MFE_EVENTS | ✓ | ✓ | ✓ | ✓ | ✓ |
| createApiClient | ✓ | ✓ | ✓ | ✓ | ✓ |
| utils (cn/format/debounce) | ✓ | ✗ | ✓ | ✓ | ✓ |
| types/common.ts | ✓ | ✗ | ✓ | ✗ | ✗ |
| env.js runtime + env.ts fallback | ✓ | ✓ | ✓ | ✓ | ⚠ (salah) |
| fix-imports.cjs | ✓ | ✗ | ✓ | ✓ | ✗ |
| Tailwind/PostCSS/tsconfig | ✓ | ⚠ | ✓ | ✓ | ⚠ |
| Build scripts & pnpm | ✓ | ⚠ | ✓ | ✓ | ✓ |
| Migrasi monolith→MFE | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pitfalls + troubleshooting | ✓ | ✓ | ⚠ | ✓ | ✓ |
| Keamanan (XSS/CORS/token) | ✓ | ⚠ | ✓ | ⚠ | ✗ |
| Agent skills / docs/agents | ✗ | ✗ | ✗ | ✗ | ✓ (unik) |
| Bug/gap audit (auth tidak mengalir dll.) | ⚠ | ✗ | ✓ (unik) | ⚠ | ✗ |
| Mental model backend↔frontend | ✗ | ✓ (unik) | ✗ | ✗ | ⚠ |

---

## 2. Analisa Mendalam Tiap Model

### 🥇 deepsekv4flash — "Ensiklopedia" (skor 8.4)

**Kelebihan:**
- Coverage paling lengkap & seimbang: satu-satunya (selain gpt56) yang membahas
  `types/common.ts`, `styles/globals.css`, detail tsconfig (`strict:false` di child),
  varian Button/CVA, isi halaman Login/Dashboard/Home, hingga port fallback microservice.
- Akurasi tinggi — hampir semua klaim cocok dengan kode (alur LazyMFE, normalisasi
  export 4 lapis, seeding `__webpack_share_scopes__`, `Object.freeze` env.js).
- Punya "Aturan Emas" 8 poin + glosarium istilah → bagus sebagai referensi cepat.
- Satu-satunya selain gpt56 yang memberi catatan keamanan eksplisit (demo fallback
  harus dihapus, token localStorage rawan XSS, CORS `*` hanya untuk dev).
- Tiap file self-contained → mudah dipakai sebagai konteks LLM per-topik.

**Kekurangan:**
- Deskriptif ("apa"), kurang analitis ("kenapa/mengapa ini masalah") — tidak
  menemukan bug tersembunyi seperti gpt56luna.
- Tidak membahas agent tooling repo (`.agents/skills`, docs/agents).
- Beberapa redundansi antar file (pitfalls muncul di 2 tempat).

**Kenapa peringkat 1:** kombinasi kelengkapan + akurasi + struktur terbaik.
Tidak ada catatan lain yang bisa menggantikan perannya sebagai referensi utama codebase.

---

### 🥈 sonnet46thinking — "Tutorial terbaik, fakta bermasalah" (skor 8.1)

**Kelebihan:**
- Volume terbesar (1.914 baris, 15 topik) dengan struktur navigasi terbaik:
  index + prev/next link + tabel + checklist + perintah troubleshoot konkret
  (`curl http://localhost:5006/remoteEntry.js`).
- Penjelasan "kenapa" paling pedagogis: mengapa `eager:true` hanya di shell,
  mengapa async bootstrap wajib, debounce vs throttle, troubleshooting 5 langkah
  untuk MFE blank.
- **Satu-satunya** yang mendokumentasikan agent tooling repo (37 skills di
  `.agents/skills/` — terverifikasi benar, issue tracker, triage labels, domain docs).
- Insight arsitektur (kenapa vanilla MF bukan Single-SPA/Qiankun, kenapa pnpm,
  kenapa Tailwind) dan use case LazyMFE (canary deploy, A/B testing).

**Kekurangan (akurasi terlemah — beberapa halusinasi terverifikasi):**
- File 11: mengklaim `window.__ENV__` + helper `getEnv()` yang throw — **tidak ada
  di kode**. Aktual: `window._env` (frozen) + `getApiUrl/getApiBaseUrl/...` dengan
  fallback, tidak pernah throw.
- File 06: interface SharedContext ditulis `{user, token, isAuthenticated, queryClient}`
  — **salah**; aktual `{queryClient, authContext, apiBaseUrl, eventBus}`.
- File 05: mengklaim bootstrap standalone child punya `AuthProvider (mock)` dan
  App.tsx punya route `/home` — **keduanya salah** (aktual: `Route index`).
- Klaim berulang bahwa auth "mengalir otomatis" ke child karena "MF share instance
  SharedContext" — **menyesatkan**; child membungkus `SharedProvider` TANPA props,
  jadi context shell tidak tersambung (gpt56luna membuktikan ini gap nyata).
- Nama file komponen shell sedikit melenceng (`components/Layout.tsx` vs aktual
  `components/Layout/Layout.tsx`).

**Kenapa peringkat 2:** format & pedagogi juara, tapi tidak bisa dipercaya sebagai
sumber fakta tanpa verifikasi — berbahaya bagi pemula yang menelan mentah-mentah.

---

### 🥉 gpt56luna — "Auditor" (skor 7.9)

**Kelebihan:**
- **Akurasi 10/10** — satu-satunya yang menangkap bug/gap nyata yang dilewatkan
  semua model lain:
  1. `Module.tsx` child membuat `SharedProvider` tanpa props → auth shell TIDAK
     otomatis mengalir ke child (kontrak harus dibuat eksplisit).
  2. `initSharedDependencies` mendaftarkan react-router-dom `6.28.1` padahal
     package.json meminta `^6.30.1` (mismatch versi share scope).
  3. `/unauthorized` dipakai ProtectedRoute tapi route-nya tidak terdaftar.
  4. `MFE_ROUTES` ada di env.js tapi URL LazyMFE di routes.tsx hard-coded.
  5. `AuthContext` tidak pernah publish `auth:logged_in/out` padahal event-nya ada.
  6. `ALLOWED_DOMAINS` didefinisikan tapi tidak dipakai.
  7. `pnpm clean` pakai `rm -rf` — tidak native di PowerShell/Windows.
  8. QueryClient shell vs child tidak otomatis sama.
- Memisahkan **fakta implementasi vs risiko vs rekomendasi** secara disiplin.
- "Kontrak Operasional Remote" + prosedur diagnosis → paling actionable untuk ops.

**Kekurangan:**
- Paling tipis (421 baris); 6 file "potongan" hanya stub daftar isi berisi link,
  bukan konten mandiri — struktur terlemah.
- Hampir tanpa snippet kode & tanpa penjelasan konseptual "kenapa" → kurang cocok
  untuk belajar dari nol; lebih cocok untuk yang sudah paham.
- Tidak membahas detail UI components, Tailwind theme, halaman-halaman.

**Kenapa peringkat 3:** kualitas analisa per baris tertinggi (signal-to-noise
terbaik), tapi kelengkapan dan nilai pembelajaran kalah.

---

### qwen38max — "Analis arsitektur" (skor 7.7)

**Kelebihan:**
- Struktur rapi: index + 7 bagian tematik; kuat di mekanisme MF (validasi share
  scope sebelum `container.init`, cache-busting `?_t=` dev vs `?v=` prod,
  cache key per version).
- 10 insight anotasi pribadi yang tajam: demo-fallback login harus dihapus,
  `hasRole` admin-bypass, sastStorage = obfuscation SAST bukan keamanan,
  retry 4xx React Query, kontras `useSharedContext` (fallback) vs `useAuth` shell (throw).
- Satu-satunya dengan seksi eksplisit "Hal yang TIDAK ada di template"
  (test, eslint config fisik, CI, CSS extraction, route `/unauthorized`).

**Kekurangan:**
- Tidak menangkap gap terbesar (auth tidak mengalir ke child — malah menulis
  "auth/query dari shell jika di-inject" yang ambigu).
- Melewati `types/common.ts`, detail halaman, dan agent tooling repo.
- Beberapa bagian mendeskripsikan ulang docs (MIGRATION-GUIDE) daripada menambah nilai.

**Kenapa peringkat 4:** solid dan akurat, tapi tidak punya keunikan dominan
dibanding deepsek (lebih lengkap) atau gpt56 (lebih kritis).

---

### gemini38flash — "Jembatan mental model" (skor 7.7)

**Kelebihan:**
- **Sudut pandang unik** yang tidak ada di catatan lain: ditulis untuk programmer
  backend — Docker vs single V8 thread, EventBus ≈ Kafka mini, ErrorBoundary ≈
  Circuit Breaker (Hystrix), env.js ≈ 12-Factor + ConfigMap Kubernetes,
  SPA routing vs Nginx rewrite.
- Penjelasan "kenapa singleton React wajib" paling mendalam (dispatcher hooks).
- CSS bleeding dijelaskan dengan skenario kerusakan konkret.
- "5 pertanyaan jebakan" → alat uji pemahaman yang bagus.
- Analogy deployment (build sekali, inject env.js per environment) paling matang.

**Kekurangan:**
- Coverage codebase tersempit: tidak membahas build scripts detail, utils,
  types, fix-imports.cjs, sharedDependencies.ts, Tailwind config, halaman-halaman.
- Beberapa konten generik (CSS Modules, scoping prefix) bukan analisa kode repo ini.
- Path file merujuk `d:/Repositories/...` (mesin lain) — artefak sesi asal.
- Tidak ada analisa risiko/keamanan spesifik repo (demo fallback tidak disebut).

**Kenapa peringkat 4 (sama):** tidak lengkap sebagai referensi codebase, tapi
tak tergantikan sebagai materi pembelajaran konsep.

---

## 3. Rekomendasi Strategi Belajar

Jangan pilih satu — **gabungkan berdasarkan peran**, karena tiap catatan unggul
di fase belajar berbeda:

### Jalur belajar (urutan baca)

| Fase | Baca | Alasan |
|------|------|--------|
| **1. Konsep awal** (belum paham MFE) | `gemini38flash/01,03,05,07,08,11` | Mental model backend↔browser + "kenapa" di balik singleton/routing/error boundary. Jawaban jebakan #11 = self-test. |
| **2. Referensi utama codebase** | `deepsekv4flash` (semua, urut 01→10) | Coverage terlengkap & akurat; jadikan "buku pegangan". |
| **3. Tutorial praktik** (menambah MFE baru, troubleshooting) | `sonnet46thinking/10,12,13,15` | Checklist & langkah paling actionable, perintah troubleshoot konkret. |
| **4. Verifikasi & audit sebelum produksi** | `gpt56luna` §6, §12, §13 | Daftar bug/gap nyata (auth tidak mengalir, version mismatch, /unauthorized hilang) — WAJIB dibaca sebelum memakai template ini serius. |
| **5. Insight pengayaan** | `qwen38max/bagian-07` (10 insight) + `sonnet46thinking/14` (agent tooling) | Sudut kritis tambahan + satu-satunya dokumentasi `.agents/skills`. |

### Aturan penting saat memakai catatan ini

1. **Perlakukan sonnet46thinking sebagai tutorial, bukan sumber fakta.**
   Sebelum meniru kode di file 05, 06, 11 — cek ulang ke source; bagian itu
   mengandung halusinasi (`__ENV__`, `getEnv()`, interface SharedContext salah,
   klaim auth mengalir otomatis).
2. **Jika hanya boleh baca satu:** `deepsekv4flash` (paling lengkap + akurat).
3. **Jika hanya boleh baca satu sebelum produksi:** `gpt56luna` (menemukan gap
   yang semua model lain lewatkan — terutama: auth shell TIDAK otomatis mengalir
   ke child karena `SharedProvider` child dibuat tanpa props).
4. **Untuk menguji pemahaman diri:** kerjakan 5 "pertanyaan jebakan" gemini38flash
   tanpa melihat catatan, lalu validasi jawaban terhadap deepsekv4flash.
5. **Sintesis ideal** bila ingin satu dokumen gabungan: kerangka sonnet (struktur
   & pedagogi) + isi fakta deepsekv4flash + seksi risiko gpt56luna + analogi
   gemini + insight qwen38max.

### Putusan akhir

- **Paling lengkap & detil secara keseluruhan: `deepsekv4flash`** 🥇
- Paling besar & paling enak dibaca (tapi perlu fact-check): `sonnet46thinking`
- Paling akurat & paling kritis: `gpt56luna`
- Paling unik untuk belajar konsep: `gemini38flash`
- Penengah solid dengan insight bagus: `qwen38max`
