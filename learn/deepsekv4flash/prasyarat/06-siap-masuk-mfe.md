# 06 — Siap Masuk ke Catatan MFE

> Prasyarat | [← Kembali ke Index Prasyarat](./00-index-prasyarat.md)

File terakhir seri prasyarat. Ini **jembatan**: setelah 01–05, kamu melihat ulang pola yang sudah dipelajari dalam konteks kode asli catatan utama — dan tahu persis harus membuka file yang mana. Kalau ada satu frasa di file ini yang belum klik, kembali ke file prasyarat terkait sebelum lanjut.

---

## 1. Recap: Pola yang Sudah Kamu Kuasai → Di Mana Muncul di Catatan MFE

| Pola prasyarat | Wujud nyata di catatan utama | File catatan |
|----------------|------------------------------|--------------|
| `async`/`await`, `fetch`, try/catch/finally | login & profil (`AuthContext`), `LazyMFE.loadComponent` | [`07`](../07-auth-routing-eventbus.md), [`04`](../04-shell-host.md) |
| Destructuring props + default | `ModuleProps` (`basePath = '/child'`), props `LazyMFE` | [`05`](../05-child-mfe-remote.md) |
| Spread `...props` / spread kondisional | meneruskan props; `getAuthHeaders` (`...(token && {...})`) | [`06`](../06-shared-library.md) |
| `?.`, `\|\|` fallback | `eventBus.ts:19`, `ErrorFallback` pesan default | [`06`](../06-shared-library.md), [`10`](../10-troubleshooting-dan-pitfall.md) |
| `interface`/`type`, Generic `<T>` | `ApiResponse<T>`, `PaginatedResponse<T>`, `client.get<T>` | [`06`](../06-shared-library.md) |
| `React.FC<Props>` + props opsional | seluruh component shell/shared/child | [`04`](../04-shell-host.md), [`06`](../06-shared-library.md) |
| `as const` + `keyof typeof` | `MFE_EVENTS` → `MFEEventType` | [`06`](../06-shared-library.md) |
| `ReturnType<typeof fn>` | `ApiClient` | [`06`](../06-shared-library.md) |
| `useState` + immutable update | state login, `LazyMFE` componentWrapper | [`04`](../04-shell-host.md) |
| `useEffect` + cleanup | EventBus subscription (`useEventSubscription`), init auth | [`07`](../07-auth-routing-eventbus.md) |
| `useContext` fallback vs throw | `useSharedContext` vs `useAuth` | [`06`](../06-shared-library.md), [`07`](../07-auth-routing-eventbus.md) |
| `useMemo`/`useCallback` | `SharedProvider`, `AuthContext` | [`06`](../06-shared-library.md), [`07`](../07-auth-routing-eventbus.md) |
| `Invalid hook call` ↔ singleton React | `shared: { react: { singleton: true } }` | [`03`](../03-module-federation-webpack.md) |
| `BrowserRouter`, `Outlet`, wildcard | provider stack shell, `routes.tsx` | [`04`](../04-shell-host.md) |
| `useLocation` + basePath | `Module.tsx` path-based routing | [`05`](../05-child-mfe-remote.md) |
| `<Link>` vs hard reload | SPA routing shell; hard redirect saat sesi habis | [`07`](../07-auth-routing-eventbus.md) |

---

## 2. Lima Cuplikan dari Catatan Utama — Dulu Asing, Sekarang Dibaca Kata per Kata

### Cuplikan 1 — Header auth kondisional (dari [`06`](../06-shared-library.md), `template-shared/src/lib/api.ts:16-22`)

```ts
const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
```

**Baca kata per kata:** function (tanpa parameter) mengembalikan `HeadersInit` (header HTTP). `token = getToken()` — ambil token dari pemanggil (di shell: localStorage). Template literal `` `Bearer ${token}` `` (file 01 §5) merakit header. `...(token && {...})` — spread kondisional (file 01 §4): kalau token ada, header `Authorization` ikut; kalau tidak, `false` di-spread = tidak terjadi apa-apa. **Hasil: header yang sama dipakai semua method API tanpa duplikasi** — alasan ia function helper, bukan menyalin di tiap method (lihat `api.ts:56-103` memanggil `getAuthHeaders()`).

### Cuplikan 2 — Path-based routing child (dari [`05`](../05-child-mfe-remote.md), `template-mfe-child/src/Module.tsx:37-47`)

```tsx
const relativePath = currentPath.replace(basePath, '').replace(/^\//, '');

if (relativePath === '' || relativePath === '/') {
  return <Home />;
}
return <NotFound />;
```

**Baca kata per kata:** `currentPath` dari `useLocation().pathname` (file 05 §4) — misal `/child/settings`. `.replace(basePath, '')` menghapus prefix `/child` → `/settings`. `.replace(/^\//, '')` menghapus slash di awal (regex `/^\//` = "karakter `/` di awal string") → `settings`. Kalau hasilnya kosong → `Home`; selain itu `NotFound`. Ini **sub-router manual di child** — tidak ada `Routes` dari React Router di child saat dimuat federasi; ia memotong pathname shell sendiri. (Regex ini juga muncul di catatan [`07`](../07-auth-routing-eventbus.md): "hitung path relatif: `currentPath.replace(basePath, '').replace(/^\//, '')`" — sekarang bukan lagi teks asing.)

### Cuplikan 3 — Subscribe + cleanup EventBus (dari [`07`](../07-auth-routing-eventbus.md), `template-shared/src/hooks/useEventBus.ts:44-53`)

```ts
export const useEventSubscription = <T>(
  event: MFEEventType | string,
  callback: EventCallback<T>,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(event, callback);
    return () => unsubscribe();
  }, [event, ...deps]);
};
```

**Baca kata per kata:** hook generic `<T>` (file 02 §3) yang targetnya string union (file 02 §4) + callback `EventCallback<T>` + daftar deps opsional. `useEffect` (file 04 §2): subscribe saat mount/deps berubah, **cleanup = unsubscribe** saat unmount/deps berubah. Spread `[event, ...deps]` (file 01 §4) menggabungkan daftar deps pemakai dengan event. **Ini pola "subscription tanpa bocor"** — kalau cleanup dihapus, handler menumpuk tiap kali komponen di-mount ulang (bug klasik yang dibahas catatan utama).

### Cuplikan 4 — Route MFE di shell (dari [`04`](../04-shell-host.md), `template-shell/src/routes/routes.tsx:40-52`)

```tsx
<Route
  path="/child/*"
  element={
    <MFEErrorBoundary mfeName="Child MFE">
      <LazyMFE
        scope="childMFE"
        module="./Module"
        url="http://localhost:5006/remoteEntry.js"
        basePath="/child"
      />
    </MFEErrorBoundary>
  }
/>
```

**Baca kata per kata:** `Route path="/child/*"` (file 05 §2, §6) — semua URL mulai `/child/` masuk ke sini. `element` = JSX: `MFEErrorBoundary` (beri `mfeName` untuk pesan "failed to load" yang ramah) membungkus `LazyMFE` — komponen yang **memuat child remote saat runtime** (file 04: `LazyMFE.tsx` pakai `useState`/`useEffect`/`Suspense`; file 03: conditional render `if (loading)`, `if (error)`). Props `scope`/`module`/`url` = kata kunci Module Federation (dibahas detail di [`03`](../03-module-federation-webpack.md)); `basePath="/child"` diteruskan ke `Module` child (Cuplikan 2). **Satu rute di shell = satu MFE yang bisa di-deploy terpisah.**

### Cuplikan 5 — Agenda event terkunci (dari [`06`](../06-shared-library.md), `template-shared/src/lib/eventBus.ts:47-68`)

```ts
export const MFE_EVENTS = {
  NAVIGATE_TO: 'mfe:navigate',
  USER_LOGGED_IN: 'auth:logged_in',
  // ...
} as const;

export type MFEEventType = (typeof MFE_EVENTS)[keyof typeof MFE_EVENTS];
```

**Baca kata per kata:** objek konstanta event (file 02 §9 `as const` — nilai literal, readonly). Tipe `MFEEventType` diambil dari **nilai-nilainya** (`keyof typeof` → union literal, file 02 §8). Semua `subscribe`/`publish` di `useEventBus` menerima `MFEEventType | string` (Cuplikan 3) — jadi typo `'auth:loggedin'` bisa lolos hanya kalau ditulis sebagai string bebas; pemakaian lewat `MFE_EVENTS.USER_LOGGED_IN` dijamin benar oleh kompiler. **Ini "kontrak terpusat" antar MFE yang berbeda tim** — satu tempat untuk mendefinisikan kosakata komunikasi.

---

## 3. Peta Perluasan: dari Prasyarat ke Catatan Utama (Urutan Baca)

```
Seri prasyarat selesai
   │
   ▼
catatan_deepsekv4flash.md  (index + jalur belajar resmi)
   │
   ▼  mulai di sini (fase 1)
01-konsep-dan-mental-model.md    ← "browser ≠ docker"; kenapa React wajib singleton
   ▼
02-struktur-dan-scripts.md       ← peta repo, script pnpm, port
   ▼
03-module-federation-webpack.md  ← remoteEntry, share scope, singleton React, eager
   ▼
04-shell-host.md                 ← provider stack, LazyMFE — kamu sudah kenal komponennya
05-child-mfe-remote.md           ← Module.tsx dual-mode — kamu sudah baca Cuplikan 2
06-shared-library.md             ← types, api, eventBus, contexts, hooks — Cuplikan 1,3,5
07-auth-routing-eventbus.md      ← mental model SPA, AuthContext, dua useAuth
08-environment-config-runtime.md
09-pola-dan-insight.md
10-troubleshooting-dan-pitfall.md
15-tutorial-menambah-mfe-baru.md
11-migrasi-monolith-ke-mfe.md
12-risiko-dan-gap-produksi.md
13-agent-tooling-repo.md
14-ujian-dan-cheatsheet.md       ← ujian & cheat sheet — bisa jadi "garis akhir"mu
```

> 💡 Tips membaca catatan utama: jangan baca pasif. Untuk tiap file, buka kode yang dirujuk (path `template-*/src/...` ada di repo ini) — catatan adalah peta, kode adalah wilayahnya. `14-ujian-dan-cheatsheet.md` punya pertanyaan jebakan; kerjakan setelah selesai fase 5–6.

---

## 4. Checklist Sebelum Melanjutkan (Jujur pada Diri Sendiri)

- [ ] Saya bisa menjelaskan perbedaan `export default` vs named export tanpa membuka catatan.
- [ ] Saya bisa membaca `interface PaginatedResponse<T>` dan `client.get<User[]>('/users')`.
- [ ] Saya paham kenapa `{resetErrorBoundary && <button/>}` dan kenapa `key` wajib di `map()`.
- [ ] Saya bisa menjelaskan: `useEffect` dengan `[]`, `[dep]`, dan tanpa array — plus apa itu cleanup.
- [ ] Saya paham kenapa "Invalid hook call" muncul di MFE (dua salinan React) tanpa panik.
- [ ] Saya bisa menjelaskan kenapa `<a href>` tidak boleh dipakai untuk navigasi internal.
- [ ] Saya paham cara kerja `Module.tsx`: membaca `useLocation`, memotong `basePath`.

Jika ada yang belum, kembali ke file prasyarat terkait (navigasi di bawah). Jika semua ✅ — selamat, kamu siap. Jalan masuk resmi:

**Mulai dari [**`01-konsep-dan-mental-model.md`**](../01-konsep-dan-mental-model.md)** (atau lihat peta lengkap di [`catatan_deepsekv4flash.md`](../catatan_deepsekv4flash.md)).

---

[**← 05. React Router Dasar**](./05-react-router-dasar.md) | Kembali ke [**00. Index Prasyarat**](./00-index-prasyarat.md)

> Dari prasyarat ini, kamu sudah siap membaca: [**01. Konsep & Mental Model MFE**](../01-konsep-dan-mental-model.md) dan seluruh jalur belajar di [`catatan_deepsekv4flash.md`](../catatan_deepsekv4flash.md).