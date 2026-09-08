# 12 — Risiko & Gap Sebelum Produksi

> Fase 6 dari Jalur Belajar. **WAJIB dibaca sebelum memakai template ini serius / produksi.**
> Sumber utama: audit gpt56luna (akurasi 10/10 — satu-satunya yang menemukan gap ini), diselaraskan dengan kode aktual.

## Daftar Risiko & Gap yang Nyata (Terverifikasi)

### 1. Demo fallback login membuat kegagalan API jadi login sukses
`AuthContext.tsx` shell: catch block apa pun → buat sesi "Demo Admin" (`permissions: ['*']`, token `demo-token`) → masuk dashboard.
**Risiko:** di produksi, server down pun user tetap "masuk". **Action:** hapus fallback di produksi; surface error sebenarnya.

### 2. Auth shell TIDAK diteruskan ke child federated
`Module.tsx` child membuat `SharedProvider` **tanpa props** → `authContext` default kosong. Jangan percaya klaim "auth mengalir otomatis karena Module Federation share context" — itu keliru.
**Action:** buat kontrak eksplisit (inject `authContext` dari shell → props `Module` → `SharedProvider` child), atau biarkan child tanpa auth bila memang tanpa fitur user.

### 3. Profile non-OK tidak membersihkan user/token
`fetchUserProfile` hanya mengisi user jika `response.ok`; kalau tidak, token lama tetap di storage.
**Action:** tangani respons non-OK dengan logout/redirect.

### 4. `/unauthorized` dipakai tapi route-nya tidak ada
`ProtectedRoute` redirect ke `/unauthorized` saat permission gagal, tapi tidak ada route terdaftar → ditangkap wildcard (NotFound / redirect login).
**Action:** daftarkan route `/unauthorized` atau ganti target redirect.

### 5. Event auth tidak pernah di-publish
`MFE_EVENTS.USER_LOGGED_IN/OUT` didefinisikan, tapi `AuthContext` tidak pernah memanggil `eventBus.publish`.
**Action:** publish saat login/logout bila ada konsumen event, atau hapus event yang tidak dipakai.

### 6. Version mismatch di share registry manual
`initSharedDependencies()` mendaftarkan `react-router-dom` versi `6.28.1`, padahal `package.json` meminta `^6.30.1`. Non-strict sekarang aman, tapi tetap harus diuji saat upgrade.
**Action:** samakan versi terdaftar dengan versi terpasang, dan uji behavior strict version bila diterapkan.

### 7. URL MFE hard-coded, `MFE_ROUTES` tidak dipakai
`routes.tsx` menulis URL `http://localhost:5006/remoteEntry.js` langsung; `env.js` menyediakan `MFE_ROUTES`/`getMfeUrl` yang tidak dikonsumsi.
**Action:** baca URL dari `window._env.getMfeUrl('childMfe')` agar deploy bisa diarahkan tanpa rebuild.

### 8. `ALLOWED_DOMAINS` didefinisikan tapi tidak dipakai
Tidak ada validasi domain di kode.
**Action:** pakai untuk validasi (mis. cek asal pesan postMessage bila dipakai), atau hapus agar tidak menyesatkan.

### 9. QueryClient shell vs child tidak otomatis sama
Child standalone & federated membuat `new QueryClient()` sendiri; config (staleTime, retry) hanya di shell.
**Action:** sentralkan config QueryClient di `@template/shared` (factory), dan bila perlu inject lewat `SharedProvider` (props `queryClient`).

### 10. Token di localStorage + CORS `*` (produksi)
`localStorage` rentan XSS; `Access-Control-Allow-Origin: *` hanya aman untuk dev.
**Action:** produksi pakai httpOnly cookie/refresh token + whitelist domain CORS.

### 11. Lain-lain tooling
- `pnpm clean` pakai `rm -rf` → tidak native PowerShell.
- `transpileOnly` bukan pengganti `pnpm typecheck`.
- Tidak ada test, eslint config, atau CI di repo.
- Dev alias memakai source shared, sementara `package.json` exports menunjuk `dist` — konsistenkan pemahaman antara dev & produksi.
- `sastStorage` = obfuscation, bukan enkripsi.
- `window._env` = config client-side, **bukan** tempat secret.

## Keputusan Paling Penting Sebelum Produksi (Prioritas)

1. **Kontrak auth lintas MFE** — siapa pemilik sesi, bagaimana child mendapat user/permission.
2. **Strategi token** — localStorage vs cookie; kapan token invalid.
3. **Hapus demo fallback** — wajib.
4. **Sumber URL remote** — hard-coded vs `env.js` (pilih env.js).
5. **Penyatuan QueryClient / shared context** — satu config di shared.
6. **Test & CI** — belum ada; tambahkan minimal typecheck + build di pipeline.
7. **Hardening deployment** — CORS, env per environment, versi remote.

## Kontrak Operasional Remote (Rekap)

```
host path  = /child/* (atau namespace lain)
scope      = childMFE
remote URL = .../remoteEntry.js
module     = ./Module
props      = { basePath?, subRoute? }        (+ authContext? bila kontrak auth dibuat)
shared     = react, react-dom, jsx-runtime, react-router-dom, react-query
```

---
Lanjut ke [**13. Agent Tooling Repo**](./13-agent-tooling-repo.md)