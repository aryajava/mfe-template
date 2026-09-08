# 09 — Pola Penting & Insight

> Fase 6 dari Jalur Belajar. Baca setelah paham seluruh komponen (`04`–`08`). Berisi pola desain yang wajib dikuasai + insight kritis hasil audit kode.

## Pola 1: Async Bootstrap

```ts
// index.tsx — dynamic import, BUKAN static
import('./bootstrap');
```
**Kenapa:** Module Federation butuh waktu **async** untuk negotiate shared modules antar MFE. Jika bootstrap di-import statik, React mulai mount sebelum shared deps siap → crash. Dynamic import = "tunggu dependencies siap dulu, baru eksekusi" (seperti `await`).

## Pola 2: Dual-Mode Component

```
Standalone: index.tsx → bootstrap.tsx → BrowserRouter → App.tsx (routes lengkap)
Federated:  remoteEntry.js → Module.tsx → SharedProvider → ModuleContent (pakai router shell)
```
Satu folder code, dua entry path. `App.tsx` untuk standalone, `Module.tsx` untuk federated.

## Pola 3: LazyMFE — Dynamic Remote Loading

```ts
// inti LazyMFE.tsx
const script = document.createElement('script');
script.src = url;                              // http://localhost:5006/remoteEntry.js
document.head.appendChild(script);
script.onload = async () => {
  await container.init(window.__webpack_share_scopes__.default);
  const factory = await container.get(module); // './Module'
  const Module = factory();
  setComponent(Module.default ?? Module);
};
```
Keunggulan (vs `remotes:` statis):
- URL bisa ganti di `env.js` **tanpa rebuild shell**.
- Canary deploy & A/B testing (beda `version` → beda cache key).

## Pola 4: Error Boundary per MFE = Circuit Breaker Frontend

```tsx
<MFEErrorBoundary mfeName="Admin">
  <LazyMFE scope="adminMFE" ... />
</MFEErrorBoundary>
```
Jika `adminMFE` gagal load (server mati / network error / crash): boundary menangkap, tampilkan fallback UI, MFE lain + shell tetap hidup. **Satu MFE down tidak cascade ke seluruh app** (bandingkan dengan Hystrix di backend).

## Pola 5: SharedProvider + Kontrak Auth

Auth tidak mengalir dengan sendirinya (lihat [`07`](./07-auth-routing-eventbus.md) & [`12`](./12-risiko-dan-gap-produksi.md)). Kontrak eksplisit yang disarankan: shell inject `authContext` ke `SharedProvider`; child menerima `authContext` lewat props `Module` dan meneruskannya. JANGAN mengandalkan "sihir federation" — verifikasi dengan mencetak `authContext.user` di child.

## 10 Insight Kritis (Hasil Audit Kode, Bukan Docs)

1. **Demo fallback login** (`AuthContext.tsx`): SETIAP kegagalan login API menghasilkan sesi "Demo Admin" (`permissions: ['*']`). Nyaman untuk template, tapi **HARUS dihapus di produksi** — kegagalan auth terlihat seperti login sukses.
2. **`hasRole` memperlakukan `admin` sebagai super-role** — selalu lolos, terlepas dari konteks. Desain sadar, tapi sadari konsekuensinya.
3. **`sastStorage` = obfuscation, bukan keamanan.** Memecah nama `window['local'+'Storage']` hanya menghindari flag scanner SAST literal. Data tetap `localStorage` biasa.
4. **LazyMFE fail-fast**: memvalidasi `react`/`react-dom` ada di share scope **sebelum** `container.init()` → error jelas, bukan "Invalid hook call" misterius.
5. **Strategi cache-busting brilian**: `?_t=timestamp` hanya di localhost (dev); produksi pakai `?v=version` → deploy-versioning remote tanpa rename file.
6. **`onUnauthorized` child memakai `window.location.href = '/login'`** (full reload). Pragmatis lintas MFE, tapi kehilangan navigasi SPA mulus.
7. **React Query `retry` shell menolak 4xx** — pola bagus yang layak ditiru (jangan retry error status client).
8. **`useSharedContext()` sengaja TIDAK throw** (fallback default) → child standalone tidak crash; **kontras** dengan `useAuth` shell yang throw. Dua mentalitas berbeda dalam satu codebase — pahami keduanya.
9. **Tidak ada test/lint config nyata** — template fokus ke wiring MFE. Jangan berasumsi ada CI.
10. **Tailwind `content` tiap app menyertakan `../template-shared/src/**`** — konsekuensi shared dipakai sebagai **source** saat dev, bukan package ter-build. **Dampak nyata:** komponen shared (Button, Card, dll.) TIDAK punya CSS sendiri di runtime — class-nya harus di-generate oleh Tailwind milik app yang memakainya. Jika MFE baru lupa menyertakan `../template-shared/src/**/*.{ts,tsx}` di `tailwind.config.ts`-nya (atau menambah komponen shared baru tanpa rebuild app yang memakainya), class-nya tidak ada → komponen tampil tanpa style. **Fix:** setiap app/MFE wajib scan path shared-nya; jika shell punya tailwind, jangan lupa tambahkan path MFE baru (mis. `../template-mfe-admin/src/**/*.{ts,tsx}`) ke `content` shell bila shell perlu meng-compile class MFE tersebut.

## Checklist Menambah MFE Baru (Ringkas)

> Tutorial langkah demi langkah dengan kode lengkap: [`15-tutorial-menambah-mfe-baru.md`](./15-tutorial-menambah-mfe-baru.md).

```
□ Salin template-mfe-child/ → template-mfe-<nama>/
□ package.json: name = "@template/mfe-<nama>"
□ webpack.config.cjs:
  □ name: '<nama>MFE' (unik)   □ port unik (5007, ...)   □ semua shared: singleton:true
□ Buat Module.tsx (sub-route routing relatif terhadap basePath)
□ Registrasi di shell:
  □ routes.tsx: path="/<nama>/*" scope="<nama>MFE"
  □ env.js: MFE_ROUTES.<nama>Mfe = "http://localhost:<port>/remoteEntry.js"
  □ Layout: item navigasi
□ pnpm-workspace.yaml + script dev root (concurrently)
□ Test: standalone ✓ + via shell ✓ + singleton ✓ + error boundary ✓
```

---
Lanjut ke [**10. Troubleshooting & Common Pitfalls**](./10-troubleshooting-dan-pitfall.md)