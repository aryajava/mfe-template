# 13. Common Pitfalls & Solusinya
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## Pitfall #1: Duplikat React (Invalid Hook Call)

**Gejala:**
```
Error: Invalid hook call. Hooks can only be called inside of a function component.
```
atau
```
Warning: You are running two instances of React.
```

**Penyebab:** Dua instance React aktif — satu di shell, satu di child MFE.

**Solusi:**
```javascript
// SEMUA MFE (shell + child) HARUS punya:
shared: {
  react:         { singleton: true },  // ← satu instance
  'react-dom':   { singleton: true },
  'react/jsx-runtime': { singleton: true },
}

// Shell saja tambah:
react:         { singleton: true, eager: true },
```

**Cek di browser:**
```javascript
// Console browser
window.React  // harus ada satu objek, bukan undefined
```

---

## Pitfall #2: CSS Bleeding (Style Bocor Antar MFE)

**Gejala:** Button di MFE Admin tiba-tiba ikut style dari MFE Reports.

**Penyebab:** CSS di browser bersifat global — semua styles masuk ke satu stylesheet.

**Solusi (template ini sudah handle):**

| Pendekatan | Cara | Template |
|-----------|------|---------|
| **Tailwind CSS** | Utility classes unik per element | ✅ digunakan |
| CSS Modules | `.module.css`, scoped per file | Opsi tambahan |
| CSS-in-JS | styles per component | Opsi tambahan |
| Shadow DOM | isolasi total | Overkill untuk kebanyakan kasus |

Tailwind generate class seperti `px-4`, `bg-blue-500` — tidak ada class `.button` global yang bisa conflict.

---

## Pitfall #3: MFE Gagal Load (Blank Page / Spinner Selamanya)

**Gejala:** Area MFE blank atau loading spinner tidak berhenti.

**Troubleshoot checklist:**

```
1. Apakah dev server child MFE sudah jalan?
   → curl http://localhost:5006/remoteEntry.js
   → Harus return JavaScript, bukan 404/ECONNREFUSED

2. Apakah ada CORS error di browser console?
   → devServer harus ada: headers: { 'Access-Control-Allow-Origin': '*' }

3. Apakah scope cocok?
   → LazyMFE scope="childMFE" harus cocok dengan
      ModuleFederationPlugin name: 'childMFE'

4. Apakah module name cocok?
   → LazyMFE module="./Module" harus cocok dengan
      exposes: { './Module': './src/Module.tsx' }

5. Apakah MFEErrorBoundary menangkap error?
   → Lihat <details> di UI atau console.error
```

---

## Pitfall #4: Auth State Tidak Mengalir ke Child MFE

**Gejala:** `useAuth()` di child MFE return `null` / undefined / tidak ada user.

**Penyebab:** Child MFE tidak wrap dengan `SharedProvider`.

**Solusi:**

```tsx
// Module.tsx di SETIAP child MFE — WAJIB ada SharedProvider
const Module: React.FC<ModuleProps> = (props) => (
  <SharedProvider>      {/* ← ini yang bikin useAuth() bekerja */}
    <LoadingProvider>
      <ModuleContent {...props} />
    </LoadingProvider>
  </SharedProvider>
);
```

**Flow lengkap:**
```
Shell: AuthProvider → SharedAuthProvider → SharedProvider
  ↓ (via Module Federation shared context)
Child Module.tsx: SharedProvider → ModuleContent → useAuth() ✓
```

---

## Pitfall #5: Routing Conflict (404 di Sub-route)

**Gejala:**
- `/admin` bekerja, tapi `/admin/users` return 404 atau tidak render apapun.
- Navigasi ke `/admin/users` langsung dari URL bar gagal.

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

// ✅ BENAR — routing relatif di Module.tsx
const relativePath = currentPath.replace(basePath, '').replace(/^\//, '');
if (relativePath.startsWith('users')) return <Users />;
```

**Untuk URL bar langsung (F5 refresh):**  
Pastikan `historyApiFallback: true` di devServer child MFE. Di production, Nginx perlu konfigurasi `try_files $uri /index.html`.

---

## Ringkasan Cepat

| # | Masalah | Cek Pertama |
|---|---------|------------|
| 1 | Duplikat React | `singleton: true` di semua webpack config |
| 2 | CSS bleeding | Gunakan Tailwind / CSS Modules |
| 3 | MFE blank | `curl remoteEntry.js` + cek CORS + cek scope/module match |
| 4 | Auth undefined | `<SharedProvider>` di Module.tsx child |
| 5 | 404 sub-route | `path="/*"` di shell + routing relatif di child |

---
*Lanjut → [14. Agent Skills](./14-agent-skills-dan-tooling.md)*
