# 01 — JavaScript ES6+ untuk Membaca MFE

> Prasyarat | [← Kembali ke Index Prasyarat](./00-index-prasyarat.md)

Kamu tidak perlu belajar seluruh JavaScript — hanya fitur ES6+ yang **benar-benar muncul** di codebase ini. Setiap fitur akan dijelaskan dua kali: dulu dengan contoh netral, lalu dengan contoh dari kode nyata repo beserta lokasi file:baris.

---

## 1. `const` dan `let` — dan Kenapa `var` Tidak Dipakai

`const` = variabel yang **tidak bisa di-reassign**. `let` = bisa di-reassign. Keduanya **block-scoped** (hanya hidup di dalam `{}` terdekat). `var` adalah function-scoped dan melakukan **hoisting** (dinaikkan ke atas function) — ini sumber bug klasik:

```js
// ❌ Jangan — var bocor keluar blok
for (var i = 0; i < 3; i++) { /* ... */ }
console.log(i); // 3 — i masih ada di luar blok!

// ✅ Benar — let terkurung di dalam blok
for (let j = 0; j < 3; j++) { /* ... */ }
// console.log(j); // ❌ ReferenceError: j is not defined
```

> ⚠️ `const` BUKAN berarti nilainya immutable. `const arr = [1]` tetap bisa `arr.push(2)` — yang dilarang hanya reassign `arr = [...]`.

**Di repo ini:** `var` tidak muncul sama sekali. Semua deklarasi pakai `const`/`let`. Contoh: `template-shared/src/lib/eventBus.ts:10` (`private listeners: Map<...> = new Map();` itu TypeScript class, tapi perhatikan semua lokal-nya pakai `const`), dan `template-shell/src/contexts/AuthContext.tsx:39` (`const [user, setUser] = useState<User | null>(null);`).

---

## 2. Arrow Function

```js
// function biasa
function tambah(a, b) { return a + b; }

// arrow function
const tambah = (a, b) => a + b;
```

Aturan cepat: `(param) => ekspresi` mengembalikan nilai ekspresi secara implisit; `(param) => { ... }` butuh `return` eksplisit. Satu parameter boleh tanpa kurung: `e => e.target.value`.

### Perbedaan `this` — Ini yang Paling Sering Membingungkan

- `function` biasa punya **`this` sendiri** (bergantung cara dipanggil).
- Arrow function **tidak punya `this` sendiri** — ia memakai `this` dari lingkup di mana ia **ditulis** (lexical).

```js
// ❌ Jangan — this di callback hilang
const obj = {
  nama: 'Admin',
  cetakSetelah() {
    setTimeout(function () {
      console.log(this.nama); // undefined! this = window
    }, 100);
  },
};

// ✅ Benar — arrow mewarisi this dari luar
const obj = {
  nama: 'Admin',
  cetakSetelah() {
    setTimeout(() => {
      console.log(this.nama); // 'Admin' — this dari cetakSetelah
    }, 100);
  },
};
```

### Kenapa Arrow Function Tidak Bisa `new`

Karena arrow tidak punya `this` sendiri dan tidak punya properti `prototype`, ia tidak bisa menjadi constructor:

```js
const Mobil = () => {};
// new Mobil(); // ❌ TypeError: Mobil is not a constructor

function Mobil2() {}
new Mobil2(); // ✅ ini jalan
```

Ini penting saat membaca kode React: **semua komponen di repo ini ditulis sebagai arrow function yang di-assign ke `const`** (mis. `Login.tsx:7` `export const Login: React.FC = () => {...}`). Komponen React memang tidak boleh di-`new` — React memanggilnya sebagai function biasa. Jadi pola ini konsisten: arrow function = nilai yang dipanggil, bukan di-instantiate.

**Di repo ini:**
- `template-shell/src/pages/Login.tsx:15-23` — `handleLogin` adalah `async` arrow, dan `onChange={(e) => setEmail(e.target.value)}` (baris 45) adalah arrow inline.
- `template-shared/src/lib/api.ts:56` — `get: async <T>(endpoint: string): Promise<T> => {...}`.

---

## 3. Destructuring — Mengambil Properti/Koleksi dalam Satu Baris

```js
// Object
const user = { name: 'Budi', age: 30 };
const { name, age } = user; // name = 'Budi', age = 30

// Array
const [first, second] = [10, 20]; // first = 10, second = 20
```

**Kegunaan paling umum di React:** membongkar props dan hasil hook.

**Di repo ini — object destructuring dari hook:**
- `template-shell/src/pages/Login.tsx:13` — `const { login } = useAuth();` — ambil satu fungsi dari objek yang dikembalikan hook.
- `template-shared/src/lib/api.ts:14` — `const { baseUrl, getToken, onUnauthorized } = config;` — bongkar config.

**Destructuring parameter props (ini pola yang akan kamu lihat di SETIAP component):**
- `template-shared/src/contexts/SharedContext.tsx:65-70` — `({ children, queryClient, authContext, apiBaseUrl })`.
- `template-shared/src/components/common/ErrorFallback.tsx:11-16` — destructuring props sekaligus memberi nilai default: `title = 'Something went wrong'`.

**Destructuring dengan default (sangat umum di props opsional):**
```js
const { basePath = '/child', subRoute } = props;
// kalau props.basePath undefined → '/child'
```

**Di repo ini:** `template-mfe-child/src/Module.tsx:13-16` — `({ basePath = '/child', subRoute }) =>`.

---

## 4. Spread (`...`) dan Rest

Dua operator dengan simbol sama `...`, dua makna berbeda:

| Operator | Posisi | Makna |
|----------|--------|-------|
| Spread | Di **nilai** | Menyalin properti/elemen ke objek/array baru |
| Rest | Di **parameter** | Mengumpulkan sisa argumen menjadi array |

```js
// ✅ Spread object — salin lalu tambahkan/override
const base = { a: 1, b: 2 };
const baru = { ...base, b: 99 }; // { a: 1, b: 99 }

// ✅ Spread array
const nums = [1, 2];
const semua = [...nums, 3]; // [1, 2, 3]

// ✅ Rest parameter
function jumlah(...angka) { return angka.reduce((a, b) => a + b, 0); }
jumlah(1, 2, 3); // 6
```

**Di repo ini — spread yang paling sering muncul ada tiga:**

1. **Meneruskan props**: `template-mfe-child/src/Module.tsx:54` — `<ModuleContent {...props} />` menyalin semua props `Module` ke `ModuleContent`. Begitu juga `template-shared/src/components/common/ErrorFallback.tsx:47` — `{...props}` di `MFEErrorFallback`.

2. **Menggabungkan dengan kondisi** — ini pola idiomatis React yang diajarkan oleh semua petunjuk resmi React:
   ```js
   // template-shared/src/lib/api.ts:16-22
   const getAuthHeaders = (): HeadersInit => {
     const token = getToken();
     return {
       'Content-Type': 'application/json',
       ...(token && { Authorization: `Bearer ${token}` }),
     };
   };
   ```
   Baca baris 20: jika `token` **truthy** (ada nilainya), ekspresi `token && {...}` menghasilkan `{ Authorization: ... }` lalu di-spread → header Authorization ikut. Jika `token` null, `token && ...` menghasilkan `false`, dan menyebar `false` ke objek tidak melakukan apa-apa. Singkatnya: **"tambahkan header Authorization HANYA kalau token ada"**.

3. **Spread array**: `template-shared/src/contexts/AuthContext.tsx` menyerupai pola ini di `hasPermission`; contoh spread array literal ada di `template-shared/src/components/ui/button.tsx:45` (`{...props}` — meneruskan atribut HTML seperti `type`, `disabled`).

> ⚡ Gotcha: urutan spread menentukan hasil. Baris `...base` dulu, baru `b: 99` → b ter-override. Balik urutannya, `base` yang menang:
> ```js
> const x = { b: 99, ...base }; // b = 2 (base menang)
> ```

---

## 5. Template Literal — String dengan `${}`

Backtick `` ` `` bukan kutip biasa: isinya bisa multi-baris dan bisa menyisipkan ekspresi dengan `${...}`.

```js
const nama = 'Budi';
console.log(`Halo, ${nama}!`); // Halo, Budi!
// cara lama: 'Halo, ' + nama + '!'
```

**Di repo ini — sangat sering, terutama untuk URL API dan header auth:**
- `template-shared/src/lib/api.ts:57` — `` fetch(`${baseUrl}${endpoint}`, ...) `` — merakit URL.
- `template-shell/src/contexts/AuthContext.tsx:67` — `` Authorization: `Bearer ${token}` `` — header token.
- `template-mfe-child/src/services/api.ts:25` — `` client.get<any>(`/users/${id}`) ``.

---

## 6. `async`/`await` dan Promise — Semua Komunikasi API

`fetch()` mengembalikan **Promise** — objek yang merepresentasikan nilai yang belum ada (respons server). `await` menghentikan eksekusi function sampai Promise selesai, tanpa memblokir thread lain. Fungsi yang memakai `await` **wajib** ditandai `async`.

```js
async function getData() {
  const response = await fetch('/api/users'); // tunggu respons
  const data = await response.json();         // tunggu parse JSON
  return data;
}
```

### Kenapa `async` Function Selalu Mengembalikan Promise

Ini aturan yang paling sering salah dipahami: **nilai return dari `async` function tetap dibungkus Promise**. Jadi:

```js
async function f() { return 42; }
const x = f();
console.log(x); // Promise { 42 } — BUKAN 42!
console.log(await x); // 42
```

**Implikasinya untuk kode React:** kalau kamu memanggil function `async` tanpa `await`, hasilnya Promise dan `try/catch` di luarnya tidak akan menangkap error dari dalam promise:

```js
// ❌ Jangan — error di dalam func tidak akan tertangkap
try {
  caraAsync(); // tidak di-await!
} catch (e) { /* tidak pernah jalan */ }

// ✅ Benar
try {
  await caraAsync();
} catch (e) { /* tertangkap */ }
```

**Di repo ini:**
- `template-shell/src/pages/Login.tsx:15-23` — `handleLogin` di-`await` di dalam `try/finally` (`await login(email, password)`), `finally` menjalankan `setLoading(false)` baik sukses maupun error.
- `template-shell/src/contexts/AuthContext.tsx:44-60` — `initAuth` (async) dipanggil tanpa await karena dipanggil dari `useEffect`; error-nya ditangani `try/catch` **di dalam** function itu sendiri. Ini pola penting: di dalam `useEffect`, kamu tidak bisa `await` di level teratas — makanya error harus ditangani di dalam.
- `template-shell/src/components/LazyMFE.tsx:46-82` — `loadComponent` menunggu `loadRemoteContainer(...)`, `container.get(module)`, `factory()`, semuanya berantai dengan `await`.

> ⚡ Gotcha: `await` hanya boleh di dalam fungsi `async`. Menulis `await` di function biasa = `SyntaxError`. Di repo, semua fungsi yang menunggu fetch ditandai `async` — periksa sendiri di `LazyMFE.tsx:46`.

---

## 7. ES Modules — `import` / `export`

Kode dipecah menjadi file, dan tiap file **mengekspor** isinya agar file lain bisa **mengimpor**.

```js
// utils.js
export const formatDate = (d) => d.toISOString();   // named export
export default function parseInput(s) { /* ... */ } // default export
```

```js
// main.js
import parseInput, { formatDate } from './utils.js';
//        ↑ default (bebas namanya)   ↑ named (harus sama persis)
```

### Perbedaan `export default` vs Named Export (Sering Bikin Bingung)

| | `export default` | named export |
|---|---|---|
| Jumlah per file | Maksimal 1 | Banyak |
| Nama saat import | Bebas (`import X from`) | Harus sama (`import { X } from`) |
| Dilacak alat bantu (IDE, grep) | Lemah — nama sembarang | Kuat — nama konsisten |
| Pola khas React | Halaman/komponen utama file | Hook, utility, type |

```js
// ❌ Jangan — import salah nama
import { Login } from './pages/Login';   // Login.tsx line 89: export default Login;
// ⇢ hasilnya undefined! (kalau strict TypeScript: error)

// ✅ Benar
import Login from './pages/Login';       // default import, nama bebas
```

**Di repo ini — keduanya dipakai dengan pola konsisten:**
- **Default export** untuk komponen halaman: `template-shell/src/pages/Login.tsx:89` (`export default Login;`) dan `template-shell/src/pages/Dashboard.tsx`. Panggilannya: `import Login from '../pages/Login';` di `routes.tsx:8`.
- **Named export** untuk komponen/shared: `template-shared/src/components/common/ErrorFallback.tsx:11` (`export const ErrorFallback`), `template-shared/src/hooks/useAuth.ts:3` (`export const useAuth`), `template-shared/src/lib/eventBus.ts:47` (`export const MFE_EVENTS`).
- Re-export agregat: `template-shared/src/index.ts` mengekspor ulang semua dari subfolder — itulah kenapa `import { Button } from '@template/shared'` (bukan dari path komponen) bisa jalan.

> ⚡ Gotcha: `export default function X() {}` membuat X **juga punya nama**, tapi saat komponen di-import dengan nama bebas lalu di-rename, identitas error di stack trace berubah. Itu sebabnya catatan utama menekankan import default yang konsisten. Di `LazyMFE.tsx:64-72` kamu akan lihat kenapa repo harus pintar menebak: `Module?.default`, `Module?.Module`, dst. — hasil `container.get()` tidak selalu berbentuk default export.

---

## 8. Optional Chaining (`?.`) dan Nullish Coalescing (`||` / `??`)

### `?.` — akses properti dengan aman

```js
const user = null;
user.name;      // ❌ TypeError: Cannot read properties of null
user?.name;     // ✅ undefined — tidak error
user?.roles?.[0]; // ✅ aman juga untuk index
```

**Di repo ini:**
- `template-shared/src/lib/eventBus.ts:19` — `this.listeners.get(event)?.delete(callback)` — kalau event belum pernah di-subscribe, `get` mengembalikan `undefined`, dan `?.` mencegah error.
- `template-shell/src/contexts/AuthContext.tsx:147` — `user?.permissions` — kalau `user` masih null (belum login), jangan crash.
- `template-shell/src/components/LazyMFE.tsx:136` — `(window as any).__webpack_share_scopes__?.default`.
- `template-shell/src/components/Layout/Layout.tsx:121` — `user?.name || "Admin User"` — pakai `?.` + `||` sekaligus untuk fallback.

### `||` vs `??` — nullish coalescing

```js
const a = 0 || 'fallback';   // 'fallback' — 0 itu falsy!
const b = 0 ?? 'fallback';   // 0 — ?? hanya bereaksi pada null/undefined
```

- `||` bereaksi pada semua **falsy**: `0`, `''`, `false`, `NaN`, `null`, `undefined`.
- `??` (nullish coalescing) hanya bereaksi pada `null` dan `undefined`.

**Fakta di repo ini (perlu kamu tahu):** template ini **tidak memakai `??` sama sekali** — semua fallback pakai `||`. Contoh: `template-shared/src/lib/api.ts:31` (`error.message || 'Access Denied'`), `ErrorFallback.tsx:25` (`description || error?.message || 'An unexpected error occurred...'`), `api.ts:43`. Implikasinya: nilai falsy seperti `0` atau `''` yang sah dari server akan kena fallback.

> ⚡ Gotcha: kalau nanti kamu memperbaiki kode template, jangan asal ganti `||` dengan `??` — keduanya punya semantik berbeda. `||` melindungi dari semua falsy, `??` hanya dari null/undefined. Lihat juga `LazyMFE.tsx:30-34` — `componentCache.get(cacheKey) || null` dengan sengaja menormalkan `undefined` menjadi `null`.

---

## Ringkasan Satu Layar

| Fitur ES6+ | Kenapa penting di repo ini | Contoh nyata |
|------------|-----------------------------|--------------|
| `const`/`let` | Seluruh codebase, `var` = 0 pemakaian | `AuthContext.tsx:39` |
| Arrow function | Semua komponen & callback | `Login.tsx:7,45` |
| Destructuring | Menerima props & hasil hook | `Login.tsx:13`, `SharedContext.tsx:65-70` |
| Spread/rest | Meneruskan props, header kondisional | `Module.tsx:54`, `api.ts:20` |
| Template literal | Merakit URL & header | `api.ts:57`, `AuthContext.tsx:67` |
| `async`/`await` | Semua fetch terhadap API | `LazyMFE.tsx:46-82` |
| `import`/`export` | Memecah & merakit modul | `routes.tsx:8`, `index.ts` |
| `?.` / `\|\|` | Akses aman data yang mungkin null | `eventBus.ts:19`, `AuthContext.tsx:147` |

Dengan ini, baris seperti `const { login } = useAuth();` atau `...(token && { Authorization: `Bearer ${token}` })` sudah tidak asing lagi. Berikutnya: TypeScript — lapisan tipe di atas JavaScript.

---

[**← 00. Index Prasyarat**](./00-index-prasyarat.md) | Lanjut ke [**02. TypeScript Dasar untuk Membaca MFE**](./02-typescript-dasar.md)

> Dari prasyarat ini, kamu sudah siap membaca: [**07. Auth, Routing & Event Bus**](../07-auth-routing-eventbus.md) (fetch login/profil di `AuthContext`), [**06. Shared Library**](../06-shared-library.md) (api client & eventBus).