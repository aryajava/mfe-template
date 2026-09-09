# 00 — Bank Soal Ujian Pemahaman MFE

> Ujian | [← Kembali ke Index Prasyarat](../prasyarat/00-index-prasyarat.md) · [Catatan Utama](../catatan_deepsekv4flash.md)

Bank soal **100 pertanyaan** untuk menguji pemahaman penuh tentang `mfe-template` (Webpack 5 Module Federation, React 18, pnpm workspace). Terbagi 4 level. Gunakan bersama [`01-kunci-jawaban-mfe.md`](./01-kunci-jawaban-mfe.md).

## Aturan Main

- Jawab dengan kata-katamu sendiri, boleh merujuk kode (`file:baris`) — bukan hafalan.
- Kerjakan per level, satu pesan per level. Jangan lihat kunci dulu.
- Kalau ragu, tulis "ragu" — itu dihitung sebagai belum paham.
- Setiap level punya skor; target: **semua level ≥ 90%** dan tidak ada "ragu".

| Level | Topik | Referensi | Jumlah |
|-------|-------|-----------|--------|
| 1 | Fondasi & Mental Model | `01`, `02` utama + prasyarat `01`–`04` | 25 |
| 2 | JavaScript / TypeScript / React | prasyarat `01`–`04` + `06` utama | 25 |
| 3 | Mekanisme MFE & Implementasi | `03`–`08` utama | 30 |
| 4 | Expert: Pitfall, Operasi, Produksi | `09`–`15` utama | 20 |

---

# LEVEL 1 — Fondasi & Mental Model (Soal 1–25)

*Referensi: `01-konsep-dan-mental-model.md`, `02-struktur-dan-scripts.md`*

1. Sebutkan 3 package di workspace ini + peran masing-masing + port-nya.
2. Apa perbedaan mendasar microservices backend vs micro-frontend di browser? Kenapa "Browser ≠ Docker"?
3. Kenapa semua MFE berbagi satu heap V8? Apa konsekuensi terbesarnya untuk React?
4. Apa itu Module Federation dan kenapa dipilih dibanding Single-SPA/Qiankun?
5. Kenapa pnpm workspaces, bukan npm biasa?
6. Kenapa Tailwind, bukan CSS-in-JS atau CSS global biasa? (kaitkan dengan CSS bleeding)
7. Kenapa dynamic loading (LazyMFE) lebih dipilih daripada `remotes:` statis? Sebutkan 3 alasan.
8. Apa itu "dual mode" child MFE? Sebutkan 2 mode-nya dan file entry masing-masing.
9. Apa itu async boundary (`index.tsx` → `bootstrap`)? Kenapa pola ini wajib di Module Federation?
10. `remoteEntry.js` itu berisi apa? Benar/salah: "berisi seluruh kode child MFE" — jelaskan.
11. Kenapa React wajib `singleton: true`? Apa yang terjadi kalau ada 2 salinan React?
12. Apa beda `eager: true` vs `eager: false` pada shared? Dan kenapa shell pakai `eager: true` untuk React tapi child `eager: false`?
13. Sebutkan 4 script root `package.json` (yang pakai `pnpm --filter` / `concurrently`) dan fungsinya.
14. Apa arti `workspace:*` pada dependency `@template/shared`?
15. Konvensi port: 5000, 5006, dan range 5001–5010 untuk apa?
16. Di mana fallback port microservice didefinisikan? Sebutkan 3 contoh (service: port).
17. Apa fungsi `initSharedDependencies()`? Apa yang di-set ke `window` dan ke `__webpack_share_scopes__`?
18. Gambarkan (ASCII) alur request runtime: browser → login → route `/child/*` → child dirender.
19. Apa itu `historyApiFallback: true` dan kenapa dibutuhkan? Apa padanannya di produksi?
20. Kenapa devServer child wajib kirim header CORS `Access-Control-Allow-Origin: *`?
21. Apa peran shell sebagai "Router Induk" dan child sebagai "Sub-Router"? Siapa yang punya daftar route lengkap?
22. Apa yang dimaksud "isolasi kegagalan" di MFE ini? Komponen apa yang mewujudkannya?
23. Kenapa `@template/shared` di-resolve ke `src` (bukan `dist`) saat dev? Apa bedanya saat build produksi?
24. Apa itu LazyMFE secara konsep — apa yang ia lakukan saat route `/child/*` diakses?
25. Jelaskan kenapa template memakai port berbeda per MFE, dan apa syarat saat produksi (URL remote dari mana?).

---

# LEVEL 2 — JavaScript / TypeScript / React (Soal 26–50)

*Referensi: prasyarat `01`–`04` + `06-shared-library.md`*

26. Bedakan `export default` vs named export — contoh masing-masing di repo (file:line).
27. Kenapa `async` function selalu return Promise? Apa implikasi kalau kamu panggil tanpa `await` dalam `try/catch`?
28. Apa beda `||` vs `??`? Yang mana dipakai di repo ini? Beri 1 contoh + kenapa itu pilihan yang dipakai.
29. Apa itu optional chaining? Contoh nyata di `eventBus.ts` dan `AuthContext.tsx`.
30. Apa itu generic `<T>`? Jelaskan `PaginatedResponse<T>` dan `ApiResponse<T>` — kenapa generic di sini?
31. Apa itu `as const`? Kenapa `MFE_EVENTS` memakainya, dan apa efeknya ke tipe `MFEEventType`?
32. Apa itu `ReturnType<typeof createApiClient>`? Kenapa pola ini dipakai (satu sumber kebenaran)?
33. `interface` vs `type` — kapan pakai yang mana? Sebutkan contoh keduanya di shared.
34. Apa implikasi `strict: true` (shared) vs `strict: false` (shell/child)? Sebutkan 1 contoh kode yang hanya lolos karena longgar.
35. Apa bahaya `as any`? Bandingkan pemakaian di `LazyMFE` (window global) vs `AuthContext.tsx:100` — mana yang lebih bisa dibenarkan dan kenapa?
36. Apa itu controlled vs uncontrolled input? Contoh controlled di `Login.tsx`.
37. Kenapa `key` wajib di `map()`? Kenapa `key={item.id}` lebih baik daripada `key={index}`?
38. Apa yang sebenarnya terjadi di balik `<h1>Halo</h1>` (JSX)? Kenapa ini terhubung ke masalah singleton React?
39. `useState` vs `useRef` — beda apa? Contoh nyata keduanya di repo (file:line).
40. Apa itu stale closure? Jelaskan kenapa `useEventSubscription` punya parameter `deps` dan apa yang terjadi kalau tidak ada.
41. Kenapa `SharedProvider` memakai `useMemo` untuk `value`? Apa yang terjadi tanpa itu?
42. Apa itu cleanup function di `useEffect`? Contoh di `useEventBus.ts:29-34` — apa yang dibersihkan dan kapan?
43. Sebutkan 2 penyebab "Invalid hook call". Mana yang relevan untuk MFE dan kenapa?
44. Kenapa `<a href="/dashboard">` TIDAK boleh dipakai di SPA ini? Sebutkan 1 pengecualian di repo (hard redirect yang disengaja).
45. `Link` vs `Navigate` vs `useNavigate` — beda? Contoh masing-masing di repo.
46. Kenapa `useState` butuh "immutable update"? Apa yang terjadi kalau `arr.push()` langsung?
47. Dependency array `[]` vs `[dep]` vs tanpa array — kapan tiap bentuk? Contoh di `AuthContext`, `Layout`, `LazyMFE`.
48. Apa beda `useContext` yang throw (`useAuth` shell) vs yang return fallback (`useSharedContext`)? Kenapa desainnya berbeda?
49. Apa itu `React.FC<Props>`? Kenapa pola ini dipakai di semua komponen repo, padahal resmi dianggap usang?
50. Apa itu narrowing pada union `User | null`? Contoh di `AuthContext.tsx:147`.

---

# LEVEL 3 — Mekanisme MFE & Implementasi (Soal 51–80)

*Referensi: `03`–`08`*

51. Tulis isi `ModuleFederationPlugin` shell (name, filename, remotes, shared) dan child (name, filename, exposes, shared).
52. Kenapa `remotes: {}` di shell padahal ada child MFE? Bagaimana child dimuat tanpa mendeklarasikan remote?
53. Kenapa `publicPath: '/'` di shell tapi `'auto'` di remote?
54. Jelaskan alur LazyMFE baris demi baris: script tag → `loadRemoteContainer` → `init(shareScope)` → `container.get('./Module')` → `factory()`.
55. Kenapa LazyMFE menambah `?_t=` di dev dan `?v=` di prod? Apa bedanya?
56. Apa itu `__webpack_share_scopes__.default`? Siapa yang mengisinya dan siapa yang membacanya?
57. Apa yang dilakukan `container._initialized`? Kenapa init tidak boleh dipanggil 2x?
58. Kenapa LazyMFE mengecek `shareScope['react']` sebelum init? Apa yang terjadi kalau tidak ada?
59. Bagaimana `Module.tsx` menentukan halaman yang dirender? Tulis rumus `relativePath` dan 2 contoh input→output.
60. Apa beda `basePath` vs `subRoute` di `ModuleProps`? Mana yang dipakai template saat ini?
61. Kenapa child membungkus `ModuleContent` dengan `SharedProvider` + `LoadingProvider` saat dimuat shell, padahal shell sudah punya?
62. Dua `useAuth` (shell vs shared) — beda sumber data & beda perilaku di luar provider. Jelaskan.
63. Apa isi `AuthContext` (state, functions)? Ceritakan alur login dari submit form sampai `navigate('/dashboard')`.
64. Apa itu demo fallback di `login`? Kenapa berbahaya untuk produksi (sebutkan skenario nyata)?
65. `hasPermission` & `hasRole` — bagaimana wildcard `*` dan `admin` diperlakukan?
66. Apa itu `MFEErrorBoundary` vs `ErrorBoundary` biasa? Kenapa `mfeName` penting?
67. EventBus: class, struktur data (`Map<string, Set<callback>>`), kenapa `publish` pakai try/catch per callback?
68. Kenapa `subscribe` mengembalikan function `unsubscribe`? Apa yang terjadi kalau unsubscribe tidak pernah dipanggil?
69. Sebutkan 6 event dari `MFE_EVENTS` beserta nilai & prefix-nya. Siapa yang publish `USER_LOGGED_IN`? *(soal konsep/kontrak — jawab berdasarkan desain, boleh berbeda dari kondisi kode saat ini)*
70. `createApiClient` — apa saja config-nya? Apa yang `handleResponse` lakukan untuk 401, 403, 204, dan !ok?
71. Kenapa `getAuthHeaders` memakai spread kondisional `...(token && {...})`? Apa hasilnya saat token null?
72. Apa itu `fix-imports.cjs` dan kenapa dibutuhkan (moduleResolution bundler + Node ESM)?
73. `env.ts` — beda `getApiUrl` vs `getApiBaseUrl` vs `getEnvMode`? Dari mana nilai `window._env` berasal?
74. Apa isi `types/common.ts`? Jelaskan `TableColumn<T>` dan `FilterConfig`.
75. `cn()` di utils — apa yang dilakukannya dan kenapa dipakai di `button.tsx`?
76. `useLoading` vs `useSharedContext` — kenapa satu throw, satu fallback?
77. `sastStorage` — apa sebenarnya? (baca file-nya) Kenapa menulis `'local'+'Storage'` seperti itu?
78. `QueryClient` di shell — apa nilai `staleTime`, `gcTime`, `retry`? Kenapa `retry` tidak untuk 4xx?
79. Apa itu `GlobalLoadingOverlay` dan bagaimana cara menampilkan/menyembunyikannya?
80. Kenapa `bootstrap.tsx` shell memakai `SharedAuthProvider` (bukan langsung `SharedProvider`)? Apa yang diteruskan?

---

# LEVEL 4 — Expert: Pitfall, Operasi, Produksi (Soal 81–100)

*Referensi: `09`–`15`*

81. Troubleshoot: child MFE blank saat dimuat shell tapi jalan standalone di :5006 — sebutkan 4 kemungkinan penyebab & cara memeriksanya.
82. Troubleshoot: "Invalid hook call" muncul di console — apa langkah diagnosis pertamamu?
83. Kenapa `env.js` bisa diganti tanpa rebuild shell? Apa syaratnya agar perubahan terbaca?
84. Apa risiko produksi dari demo fallback auth (file 12)? Sebutkan skenario konkret.
85. Sebutkan 3 gap produksi lain dari file 12 selain demo fallback.
86. Bagaimana strategi migrasi monolith → MFE (file 11)? Sebutkan 4 langkah inti & urutannya.
87. Apa beda `PageLoader` vs `GlobalLoadingOverlay`? Kapan tiap dipakai?
88. Kenapa `version` prop di LazyMFE penting untuk cache busting? Apa bedanya dengan `_t`?
89. Apa trade-off `eager: true` untuk react/react-dom di shell (bundle size vs keandalan)?
90. Apa yang terjadi kalau 2 MFE memakai `react-router-dom` versi beda tanpa singleton? Gejala & dampak?
91. Bagaimana cara menambah MFE baru (tutorial 15)? Sebutkan 5 langkah inti.
92. Apa itu triage labels (5 role) di issue tracker repo ini?
93. Apa itu `CONTEXT-MAP.md` dan untuk apa?
94. Kenapa child standalone (`bootstrap.tsx` child) TIDAK punya AuthProvider? Apa yang terjadi kalau halamannya butuh user?
95. Apa peran `window.location.href = '/login'` di `onUnauthorized` child? Kenapa bukan `navigate('/login')`?
96. Bagaimana kamu memverifikasi bahwa shell & child benar-benar memakai React yang sama (bukan 2 salinan)?
97. Apa risiko tidak menetapkan `strictVersion` vs `requiredVersion` di shared? Kapan versi React bisa bentrok?
98. Kenapa `splitChunks` vendor + `runtimeChunk: single` di shell? Apa efeknya terhadap cache & loading?
99. Apa itu canary deploy dalam konteks LazyMFE (URL remote dinamis)? Bagaimana A/B testing dilakukan?
100. Kalau kamu disuruh men-deploy MFE ini ke produksi: sebutkan 5 hal yang harus diubah/diperbaiki dari setup dev sekarang.

---

## Cara Menggunakan Kunci

Jawab dulu, baru buka [`01-kunci-jawaban-mfe.md`](./01-kunci-jawaban-mfe.md). Untuk jawaban yang meleset, baca blok **Koreksi** di kunci lalu baca ulang file catatan yang dirujuk. Skor per level: hitung benar/total, target ≥ 90%.

---

[**← Kembali ke Index Prasyarat**](../prasyarat/00-index-prasyarat.md) | Lanjut ke [**01. Kunci Jawaban & Koreksi**](./01-kunci-jawaban-mfe.md)