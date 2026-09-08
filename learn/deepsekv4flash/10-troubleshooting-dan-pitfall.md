# 10 — Troubleshooting & Common Pitfalls

> Fase 6 dari Jalur Belajar. Pegang file ini saat sesuatu tidak berjalan.

## Pitfall #1: Duplikat React (Invalid Hook Call)

**Gejala:**
```
Error: Invalid hook call. Hooks can only be called inside of a function component.
Warning: You are running two instances of React.
```

**Penyebab:** Dua instance React aktif (satu di shell, satu di child).

**Solusi:**
```js
// SEMUA MFE (shell + child) HARUS punya:
shared: {
  react:              { singleton: true },
  'react-dom':        { singleton: true },
  'react/jsx-runtime':{ singleton: true },
}
// Shell saja tambah: eager: true
```

**Cek cepat:** di console browser, `window.React` harus ada (bukan undefined). Detail mekanisme: [`03`](./03-module-federation-webpack.md).

## Pitfall #2: CSS Bleeding (Style Bocor Antar MFE)

**Gejala:** Tombol di MFE Admin tiba-tiba memakai style dari MFE Reports.

**Penyebab:** CSS di browser **global** — semua `<style>` berlaku untuk seluruh dokumen, tanpa memandang ditulis di shell atau child. Skenario kerusakan: child menulis `button { background: red !important; }` → semua tombol di seluruh website ikut merah.

**Solusi (template sudah pakai):**

| Pendekatan | Cara | Status di template |
|-----------|------|--------------------|
| **Tailwind CSS** | Utility class atomik (`px-4 bg-blue-600`), hindari styling tag telanjang | ✅ digunakan |
| CSS Modules | `[name].module.css`, class di-hash unik saat build | Opsi tambahan |
| CSS-in-JS | Style per komponen | Opsi tambahan |
| Shadow DOM | Isolasi total | Overkill untuk kebanyakan kasus |

## Pitfall #3: MFE Gagal Load (Blank / Spinner Selamanya)

**Troubleshoot checklist (berurutan):**

```
1. Apakah dev server child MFE jalan?
   → curl http://localhost:5006/remoteEntry.js
   → Harus return JavaScript, bukan 404/ECONNREFUSED

2. Ada CORS error di console?
   → devServer child harus kirim: headers: { 'Access-Control-Allow-Origin': '*' }

3. Scope cocok?
   → LazyMFE scope="childMFE" === ModuleFederationPlugin name: 'childMFE'

4. Module cocok?
   → LazyMFE module="./Module" === exposes: { './Module': './src/Module.tsx' }

5. Share scope valid?
   → __webpack_share_scopes__.default harus berisi react & react-dom
   → (template men-seed manual via initSharedDependencies; lihat 04)

6. MFEErrorBoundary menangkap error?
   → lihat pesan fallback di UI / console.error
```

## Pitfall #4: Auth Tidak Mengalir ke Child MFE

**Gejala:** `useAuth()` dari `@template/shared` di child return `user: null` / auth kosong.

**Penyebab:** `Module.tsx` child membuat `SharedProvider` **tanpa props** → memakai `defaultAuthContext` kosong. Context TIDAK terhubung otomatis hanya karena nama sama.

**Solusi (kontrak eksplisit):**
```tsx
// Shell — teruskan authContext ke SharedProvider
<SharedProvider authContext={authContext}> ... </SharedProvider>

// Module.tsx child — terima & teruskan
const Module = ({ basePath, subRoute, authContext }) => (
  <SharedProvider authContext={authContext}> ... </SharedProvider>
);
```
Untuk template contoh: child tanpa fitur auth memang aman — tapi sadari batasannya. Detil: [`12-risiko-dan-gap-produksi.md`](./12-risiko-dan-gap-produksi.md).

## Pitfall #5: Routing Conflict (404 di Sub-route)

**Gejala:** `/admin` bekerja, tapi `/admin/users` 404; atau navigasi langsung dari URL bar gagal.

**Penyebab & Solusi:**
```tsx
// ❌ SALAH — tanpa wildcard, sub-route tidak ditangkap
<Route path="/admin" element={<LazyMFE ... />} />

// ✅ BENAR — /* menangkap semua sub-route
<Route path="/admin/*" element={<LazyMFE ... basePath="/admin" />} />
```
```tsx
// ❌ SALAH — routing absolut di Module.tsx
if (currentPath === '/admin/users') return <Users />;

// ✅ BENAR — routing relatif terhadap basePath
const relativePath = currentPath.replace(basePath, '').replace(/^\//, '');
if (relativePath.startsWith('users')) return <Users />;
```
F5 langsung: pastikan `historyApiFallback: true` (devServer). Produksi: server web perlu rewrite ke `index.html` (`try_files $uri /index.html`).

## Kontrak Operasional Remote (Referensi Diagnostik)

```
host path  = /child/* (atau namespace lain)
scope      = childMFE
remote URL = .../remoteEntry.js
module     = ./Module
props      = { basePath?, subRoute? }
shared     = react, react-dom, jsx-runtime, react-router-dom, react-query
```

**Prosedur diagnosis remote gagal (ringkas):** server hidup? → buka `remoteEntry.js` → scope = name? → module = key exposes? → CORS ok? → React/ReactDOM di share scope? → wildcard route & basePath cocok?

## Ringkasan Cepat

| # | Masalah | Cek Pertama |
|---|---------|-------------|
| 1 | Duplikat React | `singleton: true` di semua webpack config |
| 2 | CSS bleeding | Pakai Tailwind / CSS Modules |
| 3 | MFE blank | `curl remoteEntry.js` + CORS + scope/module match |
| 4 | Auth kosong | `SharedProvider` child tanpa props → buat kontrak eksplisit |
| 5 | 404 sub-route | `path="/*"` di shell + routing relatif di child |

## Pitfall #6: RemoteEntry Bermasalah Saat Produksi

- Pastikan `publicPath: 'auto'` di remote (chunk internal di-resolve relatif URL remoteEntry).
- URL `remoteEntry.js` harus dapat diakses publik (CORS diizinkan domain shell).
- Versi React host vs remote: host menang (eager + dimuat duluan) — jaga agar major version sama.

## Pitfall #7: Build / Tooling

- `transpileOnly: true` di webpack shell **bukan** pengganti type check → tetap jalankan `pnpm typecheck`.
- Shared build butuh `node scripts/fix-imports.cjs` setelah `tsc` — kalau lupa, Node ESM error "Cannot find module './x.js'".
- `pnpm clean` memakai `rm -rf` → tidak native di PowerShell/Windows (jalankan dari WSL/Git Bash, atau hapus manual).

---
Lanjut ke [**15. Tutorial: Menambah MFE Baru**](./15-tutorial-menambah-mfe-baru.md)