# 05 — React Router Dasar (v6)

> Prasyarat | [← Kembali ke Index Prasyarat](./00-index-prasyarat.md)

Repo memakai **React Router v6** (`react-router-dom`). Router = pustaka yang menghubungkan **URL** dengan **komponen mana yang dirender**. Ini bukan navigasi web tradisional (request HTML baru tiap klik) — ini **SPA**: HTML dimuat sekali, selanjutnya pindah halaman = ganti komponen di memori + update URL lewat History API.

```
URL:  /login         → <Login />
URL:  /dashboard     → <Layout><Dashboard /></Layout>
URL:  /child/settings → <Layout><LazyMFE → Module child /></Layout>
```

---

## 1. `BrowserRouter` vs `HashRouter`

| | `BrowserRouter` | `HashRouter` |
|---|---|---|
| URL | `/dashboard` (bersih) | `/#/dashboard` (pakai `#`) |
| Server | Butuh fallback (`try_files $uri /index.html`) | Tidak butuh — bagian setelah `#` tidak dikirim ke server |
| Kapan dipakai | Aplikasi produksi modern | Fallback; kasus khusus (statis hosting, file://) |

**Di repo ini — `BrowserRouter`, dipilih dengan komponen yang sudah ada:**
- `template-shell/src/bootstrap.tsx:43` — `<BrowserRouter>` membungkus seluruh aplikasi.
- Child standalone: `template-mfe-child/src/bootstrap.tsx` juga `BrowserRouter`.
- Dev server sudah punya `historyApiFallback: true` (lihat catatan [`03`](../03-module-federation-webpack.md) dan [`07`](../07-auth-routing-eventbus.md) — F5 dari `/child/settings` harus kembali ke index.html, bukan 404).

> ⚠️ Implikasi penting untuk produksi: karena pakai `BrowserRouter`, **server web WAJIB** diatur agar semua path mengembalikan `index.html` (`try_files $uri /index.html`). Lupa ini = halaman blank saat user refresh URL dalam. Catatan utama [`07`](../07-auth-routing-eventbus.md) menyebut persyaratan ini.

---

## 2. `Routes` + `Route` — Mendefinisikan Peta URL → Komponen

```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

- `Routes` = kontainer yang mencocokkan lokasi saat ini.
- `Route` = satu entri `path` → `element`. `element` diisi **JSX komponen** (bukan nama komponen tanpa tag — `<Login />`, bukan `Login`).
- Pencocokan v6: **paling spesifik menang**, tidak berurutan (tidak seperti v5). `/child/*` kalah oleh `/child` jika keduanya ada — perhatikan cara menulisnya.

**Di repo ini — `template-shell/src/routes/routes.tsx:22-62`:** rute publik `"/login"`; rute ber-Layout; wildcard `"*"`; dan yang paling penting untuk MFE:

```tsx
<Route
  path="/child/*"            {/* ← splat: /child DAN semua sub-rutenya */}
  element={
    <MFEErrorBoundary mfeName="Child MFE">
      <LazyMFE scope="childMFE" module="./Module" url="http://localhost:5006/remoteEntry.js" basePath="/child" />
    </MFEErrorBoundary>
  }
/>
```

**Kenapa `*` di `/child/*` kritis untuk MFE:** tanpa `*`, `/child/settings` tidak cocok dengan route → fallback ke `*`. Dengan `*`, React Router meneruskan **seluruh sub-route** ke `LazyMFE`, dan child MFE memutuskan sendiri apa yang dirender untuk `/child/settings` (lihat §6).

---

## 3. `Link` vs `Navigate` vs `useNavigate`

| Alat | Bentuk | Kapan dipakai |
|------|--------|---------------|
| `<Link to="/x">` | JSX | Navigasi **yang bisa diklik user** (menu, breadcrumb) — tanpa reload |
| `<Navigate to="/x" replace />` | JSX | Navigasi **deklaratif dalam render** (redirect) |
| `useNavigate()` | Hook `navigate('/x')` | Navigasi **imperatif dalam logic** (setelah login, tombol) |

**Kenapa `<a href>` TIDAK BOLEH dipakai di app React Router:**

```jsx
// ❌ Jangan — <a href="/dashboard"> = full page reload
//    → seluruh state React (auth, context) hilang; bundle di-render dari nol
//    → di MFE: child di-unmount total, error boundary reset — terasa seperti logout

// ✅ Benar — Link memakai history API, tetap dalam SPA, state utuh
<Link to="/dashboard">Dashboard</Link>
```

`<a href>` tetap muncul di repo — tapi hanya untuk lompatan keluar aplikasi: `template-mfe-child/src/services/api.ts:12` — `window.location.href = '/login'` saat sesi habis (hard redirect keluar child ke shell — memang disengaja).

**Di repo ini:**
- `Link`: `template-shell/src/components/Layout/Layout.tsx:59,85` — logo & menu sidebar.
- `Navigate`: `routes.tsx:36-37` (`<Navigate to="/dashboard" replace />` untuk `/`), `routes.tsx:59` (belum login → `/login`), `template-shell/src/routes/ProtectedRoute.tsx:23,28`.
- `useNavigate`: `Login.tsx:8` — `const navigate = useNavigate();` lalu `AuthContext.tsx:116` memanggil `navigate("/dashboard")` setelah login sukses (login bisa dipicu dari mana saja, bukan hanya dari Link).

---

## 4. `useLocation` dan `useParams`

```tsx
const location = useLocation();   // { pathname: '/child/settings', search: '?x=1', state: {...} }
const params = useParams();       // { id: '42' } untuk route '/users/:id'
```

- `useLocation` — baca URL aktif (terutama `pathname`).
- `useParams` — baca segmen dinamis dari rute pola `/users/:id`.

**Di repo ini:**
- `useLocation` adalah **jantung routing child MFE**: `template-mfe-child/src/Module.tsx:17` — `const location = useLocation(); const currentPath = location.pathname;` — child tidak punya daftar route sendiri saat dimuat shell; ia **membaca pathname shell** lalu memotong `basePath` (baris 38). Catatan utama [`05`](../05-child-mfe-remote.md) menyebut pola ini "path-based fallback routing".
- `useLocation` + `Navigate state`: `ProtectedRoute.tsx:16` — mencatat `location` untuk dipakai sebagai "halaman asal" (lihat §6).
- `useParams` **belum dipakai di template ini** — tapi pola rute `/child/users/:id` akan membutuhkannya; kenali saja bentuknya untuk saat itu:
  ```tsx
  // Kalau nanti route shell memakai:  path="/child/users/:id"
  // Maka di child:  const { id } = useParams();  // id = '42'
  ```
  (Berbeda dengan `useLocation`, `useParams` membaca parameter dari rute **shell** — di child yang dimuat federasi, lebih umum pakai `useLocation` seperti di `Module.tsx`.)

---

## 5. Nested Routes dan `Outlet`

Route induk bisa membungkus route anak. Anak dirender di posisi **`<Outlet />`** milik induk — "stopkontak" yang diisi anak-anaknya.

```
<Route element={<ProtectedRoute><Layout><Outlet /></Layout></ProtectedRoute>}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/child/*" element={<LazyMFE ... />} />
</Route>
```

Urutan render untuk `/dashboard`: `ProtectedRoute` → `Layout` → `Outlet` → `Dashboard`. Hasilnya: **satu Layout menyediakan sidebar header untuk semua halaman** tanpa menduplikasi markup.

**Di repo ini — `routes.tsx:27-35`:**

```tsx
<Route
  element={
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  }
>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/child/*" element={...LazyMFE...} />
</Route>
```

Layout menerima `<Outlet />` sebagai `children` (`Layout.tsx:130` — `<main>{children}</main>`). Perhatikan: `ProtectedRoute` dan `Layout` di sini adalah **layout route** — tidak punya `path` sendiri, hanya pembungkus.

---

## 6. Wildcard `*` dan `state` di Navigate

### `path="*"` — Tangkap-Semua (Fallback)

```tsx
<Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/login" replace />} />
```

Dua peran `*` di repo ini:
1. `path="*"` (routes.tsx:57) — URL yang tidak cocok route mana pun: user terautentikasi → halaman 404; tamu → lempar ke login.
2. `path="/child/*"` (routes.tsx:41) — **menyerahkan seluruh sub-path ke MFE** ([§2](#2-routes--route--mendefinisikan-peta-url--komponen)).

### `state` di Navigate — Data Opsional yang Ikut ke Tujuan

```tsx
<Navigate to="/login" state={{ from: location }} replace />
// di halaman tujuan: const location = useLocation(); location.state?.from
```

**Di repo ini — `ProtectedRoute.tsx:23`:** sebelum melempar user yang belum login ke `/login`, ia menyimpan `location` asal di `state`. Halaman login bisa membaca `location.state.from` dan **mengembalikan user ke halaman yang ingin ia kunjungi** setelah login — pola "redirect after login".

---

## 7. Route Absolut vs Relatif di Child MFE — Kritis

Di aplikasi MFE, ada dua sistem navigasi yang harus disadari:

```
Shell (Router Induk):
  /login · /dashboard · /child/*        ← route ABSOLUT, milik shell

Child (Sub-Router — Module.tsx):
  menerima pathname shell:  /child/settings
  memotong basePath:        currentPath.replace('/child', '') → '/settings'
  memutuskan sendiri:       '' → Home · settings → Settings · lainnya → NotFound
```

**Perbedaan absolut vs relatif yang langsung terlihat di `Module.tsx:38`:**

```ts
const relativePath = currentPath.replace(basePath, '').replace(/^\//, '');
// '/child/settings' → 'settings'   (strip basePath, strip leading slash)
```

Implikasi praktis untuk MFE:
1. **Child jangan hardcode path absolut milik shell** di dalam routed-nya sendiri — `LazyMFE` memberi `basePath` dan child harus memakainya (`Module.tsx:14` default `'/child'`).
2. **`<Link to="/child/x">` vs `<Link to="x">` di child**: relatif dihitung terhadap rute induk; absolut dihitung dari root. Dalam pola `Module.tsx` (bukan `Route` shell), child lebih sering memakai **conditional render** daripada `Link` — karena child tidak punya `Routes` sendiri saat dimuat.
3. Reset `BrowserRouter` di child **ketika dimuat federasi tidak aktif** — child memakai router shell; masuk akal karena satu heap, satu History API (lihat catatan [`01`](../01-konsep-dan-mental-model.md) — "semua berbagi `window` & `document`").

> ⚡ Gotcha: kalau child membuat `<Link to="/settings">` (relatif terhadap root shell), itu akan **melompat keluar dari cakupan `/child/*`** → shell render `*` → 404. Pola yang benar: gunakan `basePath` + path lengkap (`/child/settings`), atau serahkan pada conditional render di `Module.tsx`.

---

## Ringkasan Satu Layar

| Konsep | Contoh di repo |
|--------|----------------|
| `BrowserRouter` + alasan | `bootstrap.tsx:43`; butuh server fallback (§1) |
| `Routes`/`Route` + `element` | `routes.tsx:22-62` |
| `Link` vs `Navigate` vs `useNavigate` | `Layout.tsx:59` · `routes.tsx:36` · `Login.tsx:8` |
| `<a href>` dilarang (full reload) | kecuali lompat keluar app (`services/api.ts:12`) |
| `useLocation` / `useParams` | `Module.tsx:17` (inti child MFE); `useParams` belum dipakai |
| Nested + `Outlet` | `routes.tsx:27-35`, `Layout.tsx:130` |
| Wildcard `*` + `state` | `routes.tsx:41,57`; `ProtectedRoute.tsx:23` |
| Absolut vs relatif child | `Module.tsx:38` — path-based fallback |

Satu-satunya prasyarat yang tersisa: menyatukan semuanya. Di file terakhir seri ini, kamu akan melihat ulang pola-pola yang baru dipelajari dalam **cuplikan kode asli catatan MFE** yang tadinya terlihat asing.

---

[**← 04. React Hooks**](./04-react-hooks.md) | Lanjut ke [**06. Siap Masuk ke Catatan MFE**](./06-siap-masuk-mfe.md)

> Dari prasyarat ini, kamu sudah siap membaca: [**05. Child MFE / Remote**](../05-child-mfe-remote.md) — `Module.tsx` & path-based routing; [**04. Shell / Host App**](../04-shell-host.md) — routes, `ProtectedRoute`, `Layout`; [**07. Auth, Routing & Event Bus**](../07-auth-routing-eventbus.md) — mental model routing SPA vs nginx.