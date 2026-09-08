# 15. Pola Penting & Insight
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## Pola 1: Async Bootstrap (index.tsx)

```typescript
// index.tsx
import('./bootstrap');  // ← dynamic import, BUKAN static!
```

```typescript
// bootstrap.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

**Mengapa tidak `import bootstrap from './bootstrap'` (static)?**

Module Federation membutuhkan waktu **async** untuk negotiate shared modules antar MFE. Jika bootstrap di-import secara static, React mulai mount sebelum shared modules (React sendiri, React Router, dll.) siap → crash.

Dynamic import = memberi waktu Module Federation untuk setup terlebih dahulu.

**Analogi:** Seperti `async/await` — tunggu semua dependencies siap dulu, baru eksekusi.

---

## Pola 2: SharedProvider Auth Propagation

**Tantangan:** Shell punya auth state. Child MFE perlu akses auth state. Tapi mereka package terpisah.

**Solusi:**

```
Shell:
  AuthProvider
    ↓ (owns: user, token, login(), logout())
  SharedAuthProvider
    ↓ (bridge: inject authContext ke SharedProvider)
  SharedProvider (@template/shared)
    ↓ (expose: useAuth() hook tersedia via context)

Child MFE (Module.tsx):
  SharedProvider  ← receive context dari shell via Module Federation
    ↓
  useAuth()  → { user, token, isAuthenticated }  ✓
```

**Key:** Module Federation share instance `SharedContext` yang sama antara shell dan child. Child cukup wrap dengan `<SharedProvider>` untuk "tap into" context yang sudah diisi shell.

---

## Pola 3: LazyMFE — Dynamic Remote Loading

```typescript
// LazyMFE.tsx (pseudocode)
const LazyMFE = ({ scope, module, url, basePath }) => {
  useEffect(() => {
    // 1. Inject script tag
    const script = document.createElement('script');
    script.src = url;  // "http://localhost:5006/remoteEntry.js"
    document.head.appendChild(script);

    script.onload = async () => {
      // 2. Initialize share scope
      await __webpack_init_sharing__('default');
      await window[scope].init(__webpack_share_scopes__.default);

      // 3. Get exposed component
      const factory = await window[scope].get(module);  // './Module'
      const Module = factory();

      // 4. Render
      setComponent(() => Module.default);
    };
  }, [url]);

  return (
    <Suspense fallback={<PageLoader />}>
      {Component && <Component basePath={basePath} />}
    </Suspense>
  );
};
```

**Keunggulan:** URL bisa diubah di `env.js` **tanpa rebuild shell**. Perfect untuk:
- Multi-environment (dev/staging/prod)
- A/B testing (load MFE versi berbeda)
- Canary deployment

---

## Pola 4: Dual-Mode MFE Component

```
Standalone Mode:
  index.tsx → bootstrap.tsx → BrowserRouter → App.tsx → routes standalone
  (full stack: router, query client, providers semua ada)

Federated Mode:
  remoteEntry.js → Module.tsx → SharedProvider → ModuleContent
  (tanpa router/provider baru — pakai dari shell)
```

**Tip:** Untuk standalone mode yang lengkap, buat `StandaloneAuthProvider` mock di `bootstrap.tsx` child MFE agar `useAuth()` tidak crash saat standalone.

---

## Pola 5: Error Boundary per MFE

```tsx
<MFEErrorBoundary mfeName="Admin">
  <LazyMFE scope="adminMFE" ... />
</MFEErrorBoundary>
```

Jika `adminMFE` gagal load (dev server mati, network error, JavaScript error):
- `MFEErrorBoundary` menangkap error
- Menampilkan fallback UI ("Admin MFE is currently unavailable")
- MFE lain dan shell tetap berjalan normal

**Ini adalah "Circuit Breaker" di frontend** — satu MFE down tidak cascade ke seluruh aplikasi.

---

## Insight Arsitektur

### Mengapa Tidak Pakai Micro-frontend Framework Lain?

Template ini memilih **vanilla Webpack Module Federation** karena:
1. Built-in di Webpack 5 — tidak perlu library tambahan
2. Mature dan production-proven
3. Tidak lock-in ke framework MFE specific
4. Kontrol penuh atas konfigurasi

Alternatif yang tidak dipilih: Single-SPA, Qiankun, Module Federation 2.0.

### Mengapa pnpm Workspaces?

- **Disk efisien:** dependencies di-hoist, tidak duplikat per package
- **Native workspace support:** `pnpm --filter` sangat powerful
- **Lebih cepat** dari npm/yarn untuk install

### Mengapa Tailwind vs CSS-in-JS?

- **No runtime overhead** — CSS di-generate saat build
- **Purging otomatis** — hanya class yang dipakai yang masuk bundle
- **Konsisten** — utility classes sama di semua MFE = tidak ada conflict

---

## Quick Reference — Checklist Saat Membuat MFE Baru

```
□ Buat folder: template-mfe-<nama>/
□ Copy struktur dari template-mfe-child/
□ Edit package.json: name = "@template/mfe-<nama>"
□ webpack.config.cjs:
  □ name: '<nama>MFE'  ← unik!
  □ port: 5007  ← unik!
  □ semua shared: { singleton: true }
□ Buat Module.tsx dengan <SharedProvider> wrapper
□ Registrasi di shell:
  □ routes.tsx: path="/<nama>/*" scope="<nama>MFE"
  □ env.js: MFE_ROUTES.<nama>Mfe = "http://localhost:5007/remoteEntry.js"
□ Update pnpm-workspace.yaml
□ Update dev script di root package.json
□ Test standalone + test via shell
```

---
*← [Kembali ke Index](./catatan_sonnet46thinking.md)*
