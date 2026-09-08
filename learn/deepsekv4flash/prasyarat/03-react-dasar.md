# 03 — React Dasar: Component, JSX & Props

> Prasyarat | [← Kembali ke Index Prasyarat](./00-index-prasyarat.md)

React = pustaka untuk membangun UI dari **komponen** — function yang mengembalikan deskripsi tampilan. Semua komponen di repo ini adalah **function component** (bukan class component).

---

## 1. Apa Itu Component

Component = function biasa yang: menerima **props** (data dari parent) dan mengembalikan **JSX** (deskripsi UI). Lalu React memanggilnya berkali-kali, setiap kali perlu me-render.

```
┌──────────────────────────┐
│  <App />                 │
│   └─ <Routes>            │  komponen "kontainer" — mengatur rute
│       └─ <Login />       │  komponen halaman — form login
│           └─ <Input />   │  komponen kecil — satu elemen input
└──────────────────────────┘
```

**Di repo ini — tiga tingkat yang akan kamu lihat terus:**
- Halaman: `template-shell/src/pages/Login.tsx:7` — `export const Login: React.FC = () => {...}`.
- Komponen bersama: `template-shared/src/components/common/ErrorFallback.tsx:11`.
- Komponen UI dasar: `template-shared/src/components/ui/button.tsx:38-49`.

### Apa yang Sebenarnya Terjadi di Balik JSX

`<h1>Halo</h1>` **bukan** HTML — JSX adalah gula sintaks untuk panggilan function:

```js
// JSX:
const el = <h1 className="text-xl">Halo</h1>;

// sama dengan:
const el = React.createElement('h1', { className: 'text-xl' }, 'Halo');
```

Komponen dipanggil dengan cara yang sama:

```js
<Button variant="ghost">Logout</Button>
// = React.createElement(Button, { variant: 'ghost' }, 'Logout')
```

**Implikasi kritis untuk MFE** (akan terhubung ke catatan utama [**03**](../03-module-federation-webpack.md)): dua salinan React di satu halaman berarti `React.createElement` bisa datang dari salinan berbeda → **ketidakcocokan element/reconciler**. Module Federation menangani ini dengan `singleton: true` untuk React. Kamu tidak perlu paham detailnya sekarang — cukup ingat: JSX = panggilan function, dan panggilan itu harus memakai React yang sama.

> ⚡ Gotcha: atribut JSX memakai camelCase, bukan kebab-case HTML: `className` (bukan `class`), `htmlFor` (bukan `for`), `onClick` (bukan `onclick`). Lihat `Login.tsx:39` (`htmlFor="email"`) dan `Login.tsx:44` (`className`).

---

## 2. Props — Data dari Parent ke Child

Props = parameter function dari parent:

```tsx
// Child
const Greeting: React.FC<{ name: string }> = ({ name }) => <p>Halo {name}</p>;

// Parent memakainya
<Greeting name="Budi" />
```

- Mengalir **satu arah**: parent → child. Child tidak bisa mengubah props.
- Boleh apa saja: string, number, function, JSX (`children`), bahkan komponen (`asChild`).

**Di repo ini:**
- `template-shared/src/components/ui/button.tsx:32-36` — `ButtonProps` memperluas atribut HTML button + props `asChild`; baris 42-46: props di-spread ke elemen `<Comp>`, termasuk `variant`/`size` yang dipakai untuk memilih class Tailwind via `buttonVariants`. `className` pun diteruskan (bukan diabaikan) — pola shadcn.
- `template-mfe-child/src/Module.tsx:8-16` — props `basePath` dan `subRoute` dengan default `'/child'`.
- `template-shell/src/routes/routes.tsx:43-51` — shell memberi props ke `LazyMFE` (`scope`, `module`, `url`, `basePath`).
- **`children`**: `SharedContext.tsx:81` — `<SharedContext.Provider value={value}>{children}</SharedContext.Provider>` — komponen pembungkus menerima JSX di antara tag pembuka/penutup.

```tsx
// template-shell/src/routes/routes.tsx:27-35 — Layout menerima seluruh konten route sebagai children
<Layout>
  <Outlet />   {/* anak-anak route dirender di sini */}
</Layout>
```

---

## 3. Rendering Kondisional

JSX tidak punya `if` — pakai ekspresi JavaScript:

| Pola | Kapan dipakai |
|------|---------------|
| `{kondisi && <X />}` | render X hanya kalau kondisi truthy |
| `{kondisi ? <A /> : <B />}` | pilih salah satu dari dua |
| `if (...) return <X />;` | early return di dalam function component |

**Di repo ini:**
- `template-shared/src/components/common/ErrorFallback.tsx:27-35` — `{resetErrorBoundary && (<button onClick={resetErrorBoundary}>Try Again</button>)}` — tombol hanya muncul kalau callback diberikan.
- `Login.tsx:80` — `{loading ? "Signing in..." : "Sign in"}` — teks tombol berubah sesuai state.
- **Early return** — pola terpenting untuk MFE: `template-mfe-child/src/Module.tsx:30-47` — `if (subRoute) {...}` lalu `if (relativePath === '' || ...) return <Home />;` lalu `return <NotFound />;`. `template-shell/src/components/LazyMFE.tsx:87-104` — `if (error) return <...>;` / `if (loading) return <PageLoader />;` sebelum render aktual. `routes/ProtectedRoute.tsx:18-31` — `if (isLoading) return <PageLoader />; if (!isAuthenticated) return <Navigate .../>;`

> ⚡ Gotcha klasik: `{kondisi && <X />}` dengan `kondisi = 0` merender **"0"** di layar (karena `0 && ...` menghasilkan `0`, dan React merender angka). Solusi: pastikan kondisi boolean — `<X />` hanya bila `kondisi` truthy non-falsy, atau pakai `kondisi ? <X /> : null`.

---

## 4. Rendering List — `map()` dan Kenapa `key` Wajib

Array JS dirender dengan `map()`:

```jsx
const items = ['A', 'B', 'C'];
return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
```

**Kenapa `key` wajib:** React memakai `key` untuk **mencocokkan elemen lama vs baru** saat list berubah (deduplikasi & reuse). Tanpa `key` (atau dengan `key` yang tidak stabil seperti index saat list berubah urutan), React salah mengidentifikasi elemen → bug state/animasi.

**Di repo ini:**
- `template-shell/src/components/Layout/Layout.tsx:78-99` — `navigation.map((item) => { ... return (<Link key={item.id} ...>) ... })` — `key` di baris 86 memakai `item.id` (stabil), bukan index.
- `template-shared/src/lib/eventBus.ts:26` — `callbacks.forEach((callback) => {...})` — forEach bukan untuk render, tapi tetap pola "loop array" yang sama.

> ⚡ Gotcha: `key` pada `map()` adalah **prop khusus React** — tidak ikut diteruskan ke komponen anak. Menulis `key` di tempat yang salah (mis. di komponen pembungkus yang bukan list) tidak menimbulkan error, hanya tidak berguna.

---

## 5. Event Handling

Event React = prop `onXxx` yang menerima function:

```jsx
<button onClick={() => setShowPassword(!showPassword)}>
<button type="submit" onClick={handleLogin}>
<input onChange={(e) => setEmail(e.target.value)} />
```

- Handler menerima **synthetic event** (`e`). `e.target.value` = nilai input saat ini.
- Yang di-pass adalah **function, bukan panggilan**: `onClick={handleLogin}` ✅ — `onClick={handleLogin()}` ❌ (langsung dieksekusi saat render!).

**Di repo ini:**
- `Login.tsx:45` — `onChange={(e) => setEmail(e.target.value)}` — arrow inline yang mengekstrak nilai.
- `Login.tsx:15-16` — `handleLogin` memanggil `e.preventDefault()` **dulu**, lalu logic — karena ini form `<form onSubmit={...}>` (`Login.tsx:37`), tanpa preventDefault halaman akan reload.
- `Login.tsx:67` — `onClick={() => setShowPassword(!showPassword)}` — toggle eye password.
- `Layout.tsx:109` — `onClick={() => setSidebarExpanded(!sidebarExpanded)}`.

---

## 6. Controlled vs Uncontrolled Component

Dua cara mengelola nilai input:

| | Controlled | Uncontrolled |
|---|---|---|
| Sumber nilai | **state React** (nilai di `value` + diubah via `onChange`) | DOM sendiri (`ref`, atau baca di submit) |
| Cocok untuk | form yang validasinya tergantung nilai, kondisi tombol | form sederhana, nilai yang jarang dibaca |
| React mengontrol | Ya — nilai selalu sinkron dengan state | Tidak — React hanya "menonton" hasilnya |

```jsx
// ✅ Controlled — nilai ada di state, onChange adalah satu-satunya jalan mengubah
<input value={email} onChange={(e) => setEmail(e.target.value)} />

// ❌ Uncontrolled — value di-hardcode tanpa onChange = input tidak bisa diketik sama sekali
<input value={email} />
```

**Di repo ini — form login di `template-shell/src/pages/Login.tsx` adalah contoh controlled penuh:**
- `useState` untuk `email`, `password`, `showPassword`, `loading` (baris 9-12).
- Input email (baris 40-49): `value={email}` + `onChange={(e) => setEmail(e.target.value)}` — siklus lengkap: ketik → onChange → setState → render ulang dengan nilai baru.
- Input password (baris 55-64): nilai password hidup di state, dan sifatnya bisa diubah (`type={showPassword ? "text" : "password"}`, baris 57) **karena** nilainya controlled.
- Tombol submit dinonaktifkan saat `loading` (baris 78) — state-driven UI.

Mengapa pola ini penting untuk MFE: `AuthContext` menyimpan sesi di state; form apa pun yang harus "tahu" nilai terkini (mis. validasi, disabilitas tombol) harus controlled agar UI dan state tidak bertabrakan.

---

## 7. Menyatukan Semua: Membaca Satu Komponen Utuh

Baca `ErrorFallback.tsx:11-39` dengan lensa di atas:

```tsx
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary, title = '...', description }) => {
  return (
    <div className="...">                              {/* JSX = createElement */}
      <h3>{title}</h3>                                 {/* nilai props dirender */}
      <p>{description || error?.message || '...'}</p>  {/* conditional fallback */}
      {resetErrorBoundary && (                        {/* conditional render */}
        <button onClick={resetErrorBoundary}>Try Again</button>  {/* event + prop function */}
      )}
    </div>
  );
};
```

Satu komponen memakai: props + destructuring + default, JSX, conditional render, event handling. Pola ini berulang di seluruh repo.

---

## Ringkasan Satu Layar

| Konsep | Contoh di repo |
|--------|----------------|
| Function component | `Login.tsx:7`, `ErrorFallback.tsx:11` |
| JSX = `createElement` | implikasi singleton React → [`03`](../03-module-federation-webpack.md) |
| Props & `children` | `Module.tsx:8-16`, `routes.tsx:27-35`, `SharedContext.tsx:81` |
| Conditional render | `ErrorFallback.tsx:27`, `LazyMFE.tsx:87-104`, early return `Module.tsx:40-47` |
| List + `key` | `Layout.tsx:78-99` (`key={item.id}`) |
| Events | `Login.tsx:45` `onChange`, `:16` `preventDefault` |
| Controlled vs uncontrolled | form `Login.tsx` (controlled penuh) |

Yang belum dibahas dan menjadi **dasar hampir semua kode repo**: bagaimana komponen menyimpan dan merespons perubahan data (`useState`, `useEffect`, dst.) — itulah file berikutnya, dan paling penting.

---

[**← 02. TypeScript Dasar**](./02-typescript-dasar.md) | Lanjut ke [**04. React Hooks: Fondasi Seluruh Codebase**](./04-react-hooks.md)

> Dari prasyarat ini, kamu sudah siap membaca: [**06. Shared Library (`@template/shared`)**](../06-shared-library.md) — UI/common components (`button.tsx`, `ErrorFallback.tsx`); [**04. Shell / Host App**](../04-shell-host.md) — halaman & layout shell.