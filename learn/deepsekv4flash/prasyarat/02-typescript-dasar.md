# 02 — TypeScript Dasar untuk Membaca MFE

> Prasyarat | [← Kembali ke Index Prasyarat](./00-index-prasyarat.md)

TypeScript = JavaScript + **sistem tipe yang diperiksa saat kompilasi**. Semua kode di repo ini `.ts`/`.tsx`. Kamu tidak perlu menguasai TypeScript lengkap — hanya fitur yang benar-benar muncul di codebase ini.

Pertanyaan kunci sepanjang file ini: **apa yang terjadi saat type-check gagal?** Jawabannya: kompilasi (build) berhenti dengan error dan kode tidak jalan. Di `ts-loader` shell ada `transpileOnly: true` (cek tipe dilewati saat dev), tapi pengecekan tipe tetap dilakukan oleh `tsc` pada build — lihat `template-shell/package.json` dan catatan [**03**](../03-module-federation-webpack.md) bagian module.rules.

---

## 1. Type Annotation Dasar

```ts
const nama: string = 'Budi';
const umur: number = 30;
const aktif: boolean = true;
function simpan(): void { /* tidak mengembalikan apa pun */ }
const kosong: null = null;
const apaAja: unknown = JSON.parse('{"x":1}'); // nilai yang belum dikenal
```

- `string`, `number`, `boolean` — primitif.
- `void` — untuk function yang tidak `return` nilai.
- `null` / `undefined` — ketiadaan nilai.
- `unknown` — "nilai yang jenisnya belum diketahui" (mis. hasil parse JSON, respons API tak berstruktur). Aman dipakai karena **harus dipersempit dulu** sebelum dipakai — beda dengan `any` (lihat §6).

**Di repo ini:**
- `template-shared/src/types/common.ts:9-13` — `message?: string` (properti opsional).
- `template-shell/src/contexts/AuthContext.tsx:18` — `login: (email: string, password: string) => Promise<void>` — dipakai di `defaultAuthContext` dengan `async () => {}` (`SharedContext.tsx:37`).
- `template-shell/src/bootstrap.tsx:19-24` — `error as { status?: number }` + `unknown` — hasil pengecekan retry react-query.

**Inferensi:** kamu TIDAK wajib menulis tipe — TypeScript menebaknya:

```ts
let nama = 'Budi';        // tersimpulkan: string
const login = async () => {}; // tersimpulkan: () => Promise<void>
```

**Di repo ini:** hampir semua variabel lokal tidak ditulis tipenya — dikirim ke inferensi. Tipe eksplisit ditulis di **batas** (boundary): parameter function, props component, return type hook.

---

## 2. `interface` vs `type` — Kapan Pakai yang Mana

Dua cara mendeskripsikan bentuk objek:

```ts
// interface — bisa di-extend, bisa di-declare ulang (merging)
interface User {
  id: string;
  email: string;
}

// type alias — bisa union, intersection, primitive
type ID = string | number;
type WithId = { id: string } & { name: string };
```

Keduanya saling kompatibel untuk objek. **Konvensi de facto** (dan yang dipakai di repo ini): **`interface` untuk bentuk objek yang diekspor/di-share, `type` untuk alias yang melibatkan union/functional/derived.**

**Di repo ini — campuran dengan pola jelas:**
- `interface` untuk bentuk data & kontrak antar modul: `User`, `AuthContextType`, `SharedContextType` (`template-shared/src/contexts/SharedContext.tsx:6-29`), `ApiConfig`, `ApiError` (`template-shared/src/lib/api.ts:1-11`), `EventBusInstance` (`eventBus.ts:3-7`), `PaginatedResponse<T>`, `ApiResponse<T>` (`types/common.ts`).
- `type` untuk hasil derivasi: `ApiClient = ReturnType<typeof createApiClient>` (`api.ts:106`), `MFEEventType = (typeof MFE_EVENTS)[keyof typeof MFE_EVENTS]` (`eventBus.ts:68`), `EventCallback<T = unknown>` (`eventBus.ts:1`).

Aturan praktis yang cukup: **kalau kamu akan `extends` atau memakainya sebagai kontrak antar paket → `interface`. Kalau kamu menurunkan tipe dari tipe lain → `type`.**

> ⚡ Gotcha: `interface` utamanya untuk **objek**. Pakai `interface` untuk `string | number` akan error — itu domain `type`. Sebaliknya, union dua interface hanya bisa lewat `type A = X | Y`.

---

## 3. Generic `<T>` — Tipe yang "Menunggu Diteruskan"

Generic = tipe berparameter. Saat menulis `interface PaginatedResponse<T>`, `T` adalah **placeholder**: setiap pemakai memilih tipe konkretnya.

```ts
interface Kotak<T> {
  isi: T;
}
const kotakAngka: Kotak<number> = { isi: 42 };
const kotakUser: Kotak<User> = { isi: user };
```

Manfaat: satu definisi, banyak tipe, tetap ketat (menulis `kotakAngka.isi.toUpperCase()` error — `number` tidak punya `toUpperCase`).

**Di repo ini — jantung shared library:**
- `template-shared/src/types/common.ts:1-7` — `PaginatedResponse<T>` (`data: T[]`, `total`, `page`, `pageSize`, `totalPages`) — halaman hasil API.
- `types/common.ts:9-13` — `ApiResponse<T>` (`success`, `data: T`, `message?`).
- `template-shared/src/lib/api.ts:24` — `async <T>(response: Response): Promise<T>` — method HTTP `get/post/put/patch/delete` semua `<T>` (`api.ts:56,65,75,85,95`). **Saat memanggil, `T` menentukan bentuk data yang kamu yakini dikembalikan server.**
- `template-shared/src/lib/eventBus.ts:1` — `EventCallback<T = unknown>` — punya **default** `= unknown` (kalau pemanggil tidak menyebutkan T).
- `template-shared/src/hooks/useEventBus.ts:8` — `subscribe: <T>(event, callback)`.

Pola baca: `client.get<User[]>('/users')` dibaca "**get yang mengembalikan array of User**". Lihat `template-mfe-child/src/services/api.ts:20` — `client.get<any>('/users')` — memakai `any`, evaluasi kita di §6.

---

## 4. Union Type — "Bisa Yang Ini Atau Itu"

```ts
type Status = 'active' | 'inactive';
const s: Status = 'active'; // ✅
// const t: Status = 'pending'; // ❌ error — tidak ada di union

type MaybeUser = User | null; // umum di auth
```

**Di repo ini — union + null ada di mana-mana karena auth:**
- `template-shared/src/contexts/SharedContext.tsx:15` — `user: User | null` — "bisa User, bisa null (belum login)".
- `template-shared/src/types/common.ts:30` — `type: 'text' | 'select' | 'date' | 'number'` — pilihan terbatas (discriminated union untuk `FilterConfig`).
- `eventBus.ts:8` di `useEventBus.ts` — `event: MFEEventType | string` — "event yang sudah dikenal ATAU string bebas".
- `ErrorFallback.tsx:5` — `error?: Error` — optional dan bertipe spesifik.

**Kenapa union penting di React:** kamu wajib **menyempitkan** (narrowing) sebelum memakai `user`:

```ts
if (user) {
  console.log(user.email); // ✅ TypeScript tahu user bukan null di sini
}
console.log(user.email); // ❌ error: Object is possibly 'null'
```

Pola narrowing ini muncul di `AuthContext.tsx:147` (`if (!user?.permissions) return false;`).

---

## 5. `React.FC<Props>` — Pola yang Selalu Muncul

`FC` = **Function Component**. `React.FC<Props>` artinya: "sebuah function yang menerima props bertipe `Props` dan mengembalikan elemen React (JSX)".

```tsx
interface ButtonProps { label: string; onClick?: () => void; }
const Button: React.FC<ButtonProps> = ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
);
```

Membaca deklarasi seperti ini:

```
template-shared/src/components/common/ErrorFallback.tsx:11
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({...}) => {...}
        ↑ named export    ↑ typed sebagai Function Component   ↑ destructuring props
```

**Di repo ini — setiap komponen memakai pola ini:**
- `Login.tsx:7` — `export const Login: React.FC = () => {...}` (tanpa props — bracket kosong di TSX lama; tsx modern menulis `React.FC` tanpa argumen **tidak** error karena default props = `{}`).
- `ErrorFallback.tsx:11` dan `Module.tsx:13` — dengan props.
- `SharedProvider: React.FC<SharedProviderProps>` (`SharedContext.tsx:65`).

> ⚡ Gotcha: `React.FC` sebenarnya **usang secara resmi** (React 18 type definitions mark `FC` deprecated — sebaiknya `{ props }: Props` langsung), TAPI template ini konsisten memakai `React.FC` di semua file. Saat membaca kode, kenali pola ini; saat menulis kode baru di repo, **ikuti gaya repo** (konsistensi > preferensi pribadi). Catatan utama [`06`](../06-shared-library.md) merujuk ini sebagai "gaya shadcn".

---

## 6. Optional Props (`prop?: string`) vs Required

Tanda `?` pada deklarasi properti = **opsional**: pemanggil boleh tidak memberikannya.

```tsx
interface Props {
  title?: string;          // boleh tidak ada
  description: string;     // WAJIB ada — error kalau tidak diberi di JSX
  children?: React.ReactNode; // opsional — biasanya diisi JSX dalam
}
```

Konsekuensi otomatis: tipe aktualnya adalah `string | undefined`. Kamu wajib menangani kemungkinan `undefined` — biasanya dengan **default value saat destructuring**:

```ts
// template-shared/src/components/common/ErrorFallback.tsx:13-16
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',  // ← kalau undefined → pakai default
  description,
}) => {...}
```

**Di repo ini:**
- `ErrorFallback.tsx:4-9` — `error?`, `resetErrorBoundary?`, `title?`, `description?` — semuanya opsional; komponen harus berfungsi dengan nilai minimum.
- `template-mfe-child/src/Module.tsx:8-11` — `basePath?: string` (default `'/child'` saat destructuring, baris 14), `subRoute?: string`.
- `template-shell/src/components/LazyMFE.tsx:4-12` — campuran: `scope`, `module`, `url` **wajib**; `version?`, `fallback?`, `basePath?`, `subRoute?` opsional.
- `template-shared/src/lib/api.ts:4` — `onUnauthorized?: () => void` — ditangani dengan optional call `onUnauthorized?.()` (`api.ts:26`).

> ⚡ Gotcha: props wajib yang tidak diberikan di JSX = **error kompilasi**. Ini "kontrak" yang melindungi pemanggil (shell) dari salah memakai komponen shared. Lihat `routes.tsx:43-51` — `LazyMFE` dipanggil dengan `scope`, `module`, `url`, `basePath` — semuanya ada.

---

## 7. Type Assertion — dan Bahaya `as any`

Assertion = "aku lebih tahu dari kompiler, anggap ini bertipe X". Dua bentuk: `value as X` (dipakai di repo) dan `<X>value`.

```ts
const el = document.getElementById('root')!;          // ! = non-null assertion
const apiError = error as { status?: number };
```

### Kenapa `as any` Berbahaya

`any` **mematikan pemeriksaan tipe total** pada nilai itu — dan penyebarannya menular: `any` ke function → semua yang terpengaruh jadi tidak terperiksa. Error yang seharusnya tertangkap saat build baru muncul saat runtime (atau tidak pernah, dan jadi bug tersembunyi).

**Di repo ini — `as any` muncul, dan perlu kamu tahu kenapa:**
- `LazyMFE.tsx:118,132,136,147` — `(window as any)[containerKey]`, `(window as any)[scope]` — akses global `window` yang memang tidak ada di type definitions → assertion "terpaksa" untuk menembus batas DOM/Module Federation. **Kontekstual dan dibatasi.**
- `template-shell/src/contexts/AuthContext.tsx:100` — `const error: any = new Error("Login failed"); error.status = response.status;` — assert `Error` (yang tidak punya properti `status`) jadi `any` agar bisa diberi properti ekstra. Konsekuensi: TypeScript tidak akan memeriksa lagi. Catatan utama [`10`](../10-troubleshooting-dan-pitfall.md) membahas pola error seperti ini.

> ⚡ Gotcha (kebalikannya juga berlaku): `{...} as any` lalu dipakai sebagai props = kompiler tidak bisa melindungimu dari typo nama prop. Perhatikan `template-mfe-child/src/services/api.ts:20,25` — `client.get<any>('/users')` — hasilnya `any`, jadi semua properti yang kamu akses dari hasilnya **tidak** diperiksa. Itu trade-off yang sengaja dipilih di template contoh; jangan tiru di kode produksi tanpa alasan.

**Aturan:** assertion boleh di *batas* sistem (global `window`, boundary Module Federation, parsing JSON). Di *dalam* logika aplikasi, assertion biasanya menyembunyikan bug.

---

## 8. `ReturnType<typeof fn>` — Tipe Diturunkan dari Function

```ts
const createApiClient = (config: ApiConfig) => {
  // ... return { get, post, put, patch, delete, ... }
};

export type ApiClient = ReturnType<typeof createApiClient>;
// "tipe dari apa yang dikembalikan createApiClient"
```

**Kenapa pola ini dipakai:** tanpa menulis satu pun tipe interface untuk objek hasil, kompiler menginferensinya — satu sumber kebenaran, tidak bisa tidak sinkron dengan implementasinya.

**Di repo ini:**
- `template-shared/src/lib/api.ts:106` — `export type ApiClient = ReturnType<typeof createApiClient>;` — dipakai di `EventBusInstance`? Tidak — dipakai untuk `SharedContextType.eventBus`? Tidak. Dipakai pemakai API: `template-mfe-child/src/services/api.ts:4-15` mengembalikan `createApiClient(...)` tanpa annotate, dan konsumennya mendapat tipe lengkap `get/post/...`.

Bentuk sepupunya yang juga muncul: `keyof typeof` — `eventBus.ts:68`:

```ts
export const MFE_EVENTS = { NAVIGATE_TO: 'mfe:navigate', ... } as const;
export type MFEEventType = (typeof MFE_EVENTS)[keyof typeof MFE_EVENTS];
// = 'mfe:navigate' | 'auth:logged_in' | ... — semua nilai literalnya
```

Dibaca: "ambil tipe dari objek `MFE_EVENTS`, lalu proyeksikan ke semua key-nya → union of all values".

---

## 9. `as const` — Mengunci Nilai Literal

```ts
const tanpaAsConst = { NAVIGATE_TO: 'mfe:navigate' };
// tipe NAVIGATE_TO: string (broad — bisa diisi string apa saja)

const denganAsConst = { NAVIGATE_TO: 'mfe:navigate' } as const;
// tipe NAVIGATE_TO: 'mfe:navigate' (literal — hanya string itu persis)
```

`as const` membuat properti **readonly** dan tipenya **literal**. Efek berantai: `MFEEventType` di atas hanya berisi string yang benar-benar terdaftar di `MFE_EVENTS` — typo seperti `'auth:loggedin'` akan **gagal kompilasi** di semua pemanggil.

**Di repo ini:** `template-shared/src/lib/eventBus.ts:47-66` — `export const MFE_EVENTS = {...} as const;` + baris 68 tipe turunannya. Semua `subscribe`/`publish` di `useEventBus.ts` dan `useEventSubscription` memakai `MFEEventType | string` — kalau bukan bagian union literal, TypeScript memperingatkan (kecuali di-`string`-kan).

> ⚡ Gotcha: array/objek `as const` jadi **readonly** — `MFE_EVENTS.NAVIGATE_TO = 'x'` error. Itu memang tujuannya (konstanta agenda event).

---

## 10. `strict: true` vs `strict: false` — dan Implikasinya di Repo Ini

| | `template-shared` | `template-shell` | `template-mfe-child` |
|---|---|---|---|
| `strict` | **`true`** (`tsconfig.json:12`) | `false` (`tsconfig.json:13`) | `false` (`tsconfig.json:15`) |
| `noImplicitAny` | implied true | `false` | `false` |

`strict: true` mengaktifkan serangkaian pemeriksaan: `strictNullChecks` (null/undefined tidak bisa dipakai sembarangan), `noImplicitAny` (parameter tanpa tipe = error), dst.

**Implikasi praktis yang akan kamu lihat:**
1. **Kode shared diperiksa paling ketat** — library yang dipakai semua orang tidak boleh punya tipe longgar. Perhatikan `eventBus.ts:16` memakai **non-null assertion** `this.listeners.get(event)!.add(...)` — simbol `!` di akhir: "aku yakin ini tidak null". Ini **hanya diperlukan karena strict** — bukti kode shared berjalan dengan pemeriksaan penuh.
2. **Shell & child longgar** — `AuthContext.tsx:100` (`error: any`) dan `LazyMFE.tsx` (`(window as any)`) lolos di shell. Di shared, pola itu akan `any` juga lolos (kses `any` tidak dilarang oleh strict — strict melarang *implicit* any, bukan explicit). Jadi `any` eksplisit tetap bisa muncul; yang tidak boleh adalah **parameter tanpa tipe**.
3. **`strictNullChecks` berbeda** — di shell, `user.name` saat `user` bisa null tidak selalu error; di shared, pola `user?.permissions` (defensif) sudah menjadi kebiasaan — cocok dengan komunitas "shared harus aman".

Ini persis yang dibahas catatan utama [`06`](../06-shared-library.md) tentang shared library: kode yang dipakai semua MFE harus paling disiplin, dan konfigurasi tsconfig per-package mengunci disiplin itu di level tooling.

> ⚠️ Praktisnya untuk pembaca: **mengeksekusi kode shell/child yang longgar tidak lebih "rusak"** — keduanya tetap di-compile TypeScript yang menghasilkan JavaScript sama. Strictness hanya menggeser deteksi bug: shared menangkap lebih banyak di waktu build, shell menangkap di runtime (atau lewat pengecekan editor yang tidak memblokir build).

---

## Ringkasan Satu Layar

| Fitur TS | Muncul di repo ini di | Cara baca |
|----------|-----------------------|-----------|
| Annotation dasar | `types/common.ts`, props | `login(email: string): Promise<void>` |
| `interface` vs `type` | `interface` untuk kontrak; `type` untuk turunan | lihat objek shared vs `ReturnType` |
| Generic `<T>` | `PaginatedResponse<T>`, `ApiResponse<T>`, `client.get<T>` | "T = bentuk data dari API" |
| Union | `User \| null`, `MFEEventType \| string` | "bisa ini atau itu, sempitkan dulu" |
| `React.FC<Props>` | Semua komponen | "function component dengan props Props" |
| Optional prop | `ErrorFallback`, `LazyMFE` | wajib tangani `undefined`; default saat destructuring |
| `as any` | `LazyMFE` (window global), `AuthContext:100` | assertion hanya di batas sistem |
| `ReturnType<typeof fn>` | `api.ts:106` | tipe = hasil function, selalu sinkron |
| `as const` | `MFE_EVENTS` `eventBus.ts:47-66` | nilai literal + readonly |
| strict true/false | shared ketat, shell/child longgar | shared = "library publik", harus disiplin |

Sekarang kamu bisa membaca deklarasi `export const Login: React.FC = () => {...}` dan `interface ApiResponse<T>` tanpa ragu. Berikutnya: React — apa itu component, JSX, props, dan rendering.

---

[**← 01. JavaScript ES6+**](./01-javascript-es6.md) | Lanjut ke [**03. React Dasar: Component, JSX & Props**](./03-react-dasar.md)

> Dari prasyarat ini, kamu sudah siap membaca: [**06. Shared Library (`@template/shared`)**](../06-shared-library.md) — types, api client, eventBus; bagian tsconfig di [**03. Module Federation & Webpack Config**](../03-module-federation-webpack.md).