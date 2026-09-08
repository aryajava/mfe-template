# 04 — React Hooks: Fondasi Seluruh Codebase

> Prasyarat | [← Kembali ke Index Prasyarat](./00-index-prasyarat.md)

**Hook** = function bawaan React yang "menempelkan" perilaku stateful ke function component. Di repo ini, hampir semua file punya minimal satu hook. Pemahaman hook = kunci membaca 90% kode shell, child, dan shared. File ini yang paling penting dari seluruh seri.

Satu mental model dulu — **hal-hal yang bisa dilakukan hook:**

| Hook | "Saya ingin komponen ini..." | Muncul di repo? |
|------|------------------------------|-----------------|
| `useState` | ...menyimpan nilai, dan render ulang saat nilainya berubah | ✅ sangat sering |
| `useEffect` | ...menjalankan efek samping setelah render (fetch, subscribe) | ✅ sangat sering |
| `useContext` | ...membaca data dari provider terdekat | ✅ sangat sering |
| `useRef` | ...menyimpan nilai antar render TANPA memicu render ulang | ✅ (eventBus) |
| `useMemo` | ...meng-*cache* nilai hasil perhitungan | ✅ (SharedContext) |
| `useCallback` | ...meng-*cache* function agar identitasnya stabil | ✅ (AuthContext) |

---

## 1. `useState` — State Lokal dan **Immutable Update**

```tsx
const [email, setEmail] = useState('');   // "" = nilai awal
const [user, setUser] = useState<User | null>(null);

// update: SELALU lewat setter, JANGAN ubah variabel langsung
setEmail('budi@x.com');
```

**Kenapa "immutable update" wajib:** setiap `setX(nilaiBaru)` → React menandai komponen "perlu render ulang" → memanggil function component lagi → nilai baru dari state dibaca. Kalau kamu ubah variabel langsung (`email = 'x'`), React tidak tahu apa-apa — UI tidak berubah.

```js
// ❌ Jangan — mutasi langsung tidak memicu render ulang
const [arr, setArr] = useState([1]);
arr.push(2);            // React tidak tahu; UI diam

// ✅ Benar — selalu buat nilai BARU
setArr([...arr, 2]);    // spread → array baru → render ulang
```

**Di repo ini:**
- `Login.tsx:9-12` — empat state: `showPassword`, `email`, `password`, `loading`.
- `LazyMFE.tsx:30-34` — `useState` dengan **initializer function** `componentCache.get(cacheKey) || null` (dijalankan sekali, bukan tiap render).
- `Layout.tsx:35-38` — `useState(() => {...})` — membaca localStorage sekali saat mount.
- `AuthContext.tsx:39-40` — `useState<User | null>(null)` — user kosong sebelum login.

> ⚡ Gotcha: **state update async (batched).** Dua `setState` berurutan tidak menjamin render di antaranya — baca `tambah()` berurutan di `AuthContext.tsx` dan kamu tidak akan melihat render ganda. Petunjuk praktis: jangan baca state lama segera setelah `setState`; kalau butuh nilai baru, gunakan hasil function/event-nya.

---

## 2. `useEffect` — Side Effects, Dependency Array, Cleanup

`useEffect(fn, deps)` menjalankan `fn` **setelah render**, dan (opsional) menjalankan **cleanup** sebelum menjalankan ulang / saat unmount.

```tsx
useEffect(() => {
  // efek samping: fetch, subscribe, timer...
  return () => {
    // cleanup: unsubscribe, clearTimeout... (opsional)
  };
}, [deps]);
```

### Dependency Array: `[]` vs `[dep]` vs tanpa array

| Deps | Efek dijalankan | Contoh pemakaian |
|------|-----------------|------------------|
| `[]` (kosong) | **Sekali** setelah mount | Inisialisasi auth (`AuthContext.tsx:43-60`), subscribe sekali |
| `[dep]` | Setiap `dep` berubah (setelah render) | Persist sidebar (`Layout.tsx:40-42`) |
| (tanpa array) | **Setiap render** — hati-hati, gampang jadi infinite loop | Jarang; hindari |

**Di repo ini — tiga pola:**
1. **Mount sekali — fetch profil**: `template-shell/src/contexts/AuthContext.tsx:43-60`. `useEffect(() => {...}, [])` — baca token dari storage, kalau ada → `fetchUserProfile(token)`, `finally` → `setIsLoading(false)`. Function async dibungkus `initAuth()` karena efek tidak bisa langsung `await` di level teratas.
2. **Deps berubah — persist state**: `Layout.tsx:40-42` — `useEffect(() => { storage.store("sidebarExpanded", ...) }, [sidebarExpanded])` — tiap sidebar berubah, tulis ke localStorage.
3. **Deps berubah — muat ulang komponen remote**: `LazyMFE.tsx:36-41` — `useEffect(..., [cacheKey])` — kalau `cacheKey` berubah (scope/module/version beda), reset state; lalu `LazyMFE.tsx:43-85` — efek kedua dengan deps `[scope, module, url, version, cacheKey]` menjalankan `loadComponent()` — fetch `remoteEntry.js` dan `container.get()`.

### Cleanup Function — **WAJIB Dipahami untuk MFE**

```tsx
useEffect(() => {
  const unsub = eventBus.subscribe('auth:logged_in', cb);
  return () => unsub();   // dibersihkan saat unmount / deps berubah
}, [event]);
```

**Kenapa cleanup penting:** kalau tidak dibersihkan, callback "menggantung" setelah komponen hilang — event berikutnya memanggil kode komponen yang sudah tidak ada → memory leak, error, atau **handler ganda** (subscribe ulang tiap mount tanpa unsubscribe yang lama).

**Di repo ini — dua contoh bersebelahan:**

```ts
// template-shared/src/hooks/useEventBus.ts:29-34 — cleanup SEMUA subscription
useEffect(() => {
  return () => {
    subscriptionsRef.current.forEach((unsub) => unsub());  // unsubscribe semua
    subscriptionsRef.current = [];
  };
}, []);
```

```ts
// useEventBus.ts:44-53 — hook bungkus subscribe + cleanup otomatis
export const useEventSubscription = <T>(event, callback, deps = []) => {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(event, callback);
    return () => unsubscribe();        // cleanup: unsubscribe saat unmount/deps berubah
  }, [event, ...deps]);
};
```

Ini persis pola yang dibahas catatan utama [`07`](../07-auth-routing-eventbus.md) (EventBus subscription) — subscription tanpa cleanup = bug klasik MFE.

> ⚡ Gotcha: efek dengan deps `[event]` di atas **unsubscribe lalu subscribe ulang** setiap `event` berubah — itu memang benar (langganan harus ke event yang aktif). Yang salah adalah melupakan cleanup.

---

## 3. `useContext` — Membaca Data dari Provider Terdekat

Context = mekanisme berbagi data lintas komponen tanpa menembak-nembak props (prop drilling). Dua sisi:

```tsx
// Sisi 1 — Provider: menyediakan nilai kepada semua anak ("pemasok")
<AuthContext.Provider value={value}>{children}</AuthContext.Provider>

// Sisi 2 — Konsumen: hook membaca nilai terdekat di atasnya ("pembeli")
const context = useContext(AuthContext);
```

**Di repo ini — dua pola hook konsumen yang BERBEDA dan sering tertukar:**

```ts
// template-shared/src/contexts/SharedContext.tsx:50-56 — LEMBUT: fallback, tidak throw
export const useSharedContext = (): SharedContextType => {
  const context = useContext(SharedContext);
  if (!context) return defaultFallbackContext;   // ← di luar provider: nilai default
  return context;
};
```

```ts
// template-shell/src/contexts/AuthContext.tsx:26-32 — TEGAS: throw
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider"); // ← di luar provider: ERROR
  return context;
};
```

**Kenapa beda?** `useSharedContext` dipakai komponen shared yang harus tetap jalan walau berada di luar provider (fallback = context kosong). `useAuth` milik shell harus **gagal cepat** kalau dipakai di tempat yang salah (bug pemanggilan tertangkap segera, bukan diam-diam). Perbandingan lengkap ada di catatan utama [`07`](../07-auth-routing-eventbus.md) — dan kesalahan memilih salah satu = behavior berbeda saat bug.

Provider-stack shell (dari `template-shell/src/bootstrap.tsx:40-58`):

```
<QueryClientProvider>          ← react-query (server state cache)
  <BrowserRouter>              ← routing
    <AuthProvider>             ← auth (user, login, logout)
      <SharedAuthProvider>     ← meneruskan authContext ke SharedProvider
        <LoadingProvider>      ← loading overlay global
          <TooltipProvider>    ← UI
            <App/>
```

---

## 4. `useRef` — Nilai Antar Render TANPA Render Ulang

`useRef(initial)` mengembalikan objek `{ current: nilai }` yang **tetap hidup antar render** dan **tidak memicu render ulang** saat berubah. Bandingkan dengan `useState` yang memicu render ulang.

| | `useState` | `useRef` |
|---|---|---|
| Perubahan nilai | Memicu render ulang | Tidak memicu |
| Untuk apa | Nilai yang tampil di UI | Handle DOM, akumulator, "kotak penyimpanan" |

**Di repo ini — `template-shared/src/hooks/useEventBus.ts:5`:**

```ts
const subscriptionsRef = useRef<Array<() => void>>([]);
// subscriptionsRef.current = daftar unsubscribe functions

subscribe = useCallback((event, callback) => {
  const unsubscribe = eventBus.subscribe(event, callback);
  subscriptionsRef.current.push(unsubscribe);  // dicatat, tanpa render
  return unsubscribe;
}, []);
```

Kenapa `useRef` (bukan `useState`) di sini: daftar subscription adalah buku catatan internal; menambah subscription tidak perlu merender ulang komponen. Cleanup di `useEffect` (baris 29-34) membaca isinya saat unmount.

---

## 5. `useMemo` — Cache Nilai Hasil Hitung

`useMemo(() => hitung(), [deps])` mengembalikan nilai hasil `hitung()` yang di-*cache*; dihitung ulang **hanya** saat deps berubah.

**Di repo ini — `template-shared/src/contexts/SharedContext.tsx:71-79`:**

```tsx
const value = useMemo(
  () => ({
    queryClient: queryClient || new QueryClient(),
    authContext: authContext || defaultAuthContext,
    apiBaseUrl: apiBaseUrl || getApiBaseUrl(),
    eventBus,
  }),
  [queryClient, authContext, apiBaseUrl]
);
```

**Kenapa `useMemo` di sini (analisis, bukan sekadar "biar cepat"):** nilai `value` diberikan ke `SharedContext.Provider`. Tanpa `useMemo`, setiap render `SharedProvider` membuat **objek baru** → semua konsumen context (setiap komponen yang memanggil `useSharedContext`) ikut render ulang. `useMemo` menjamin **objek yang sama** selama deps tidak berubah → konsumen tidak render ulang sia-sia. Ini bukan optimasi mikro; ini pola stabilisasi identitas object yang diberikan lewat context.

> ⚠️ Jangan pakai `useMemo` untuk SEMUA perhitungan — hanya untuk nilai yang (a) mahal, atau (b) **identitasnya dipakai sebagai dependensi/kontrak** (seperti objek context). `useMemo` yang berlebihan malah membuat kode sulit dibaca.

---

## 6. `useCallback` — Cache Function Agar Identitasnya Stabil

`useCallback(fn, [deps])` = `useMemo` untuk **function**: mengembalikan function yang sama persis selama deps tidak berubah.

**Di repo ini — `template-shell/src/contexts/AuthContext.tsx:88-135`:**

```tsx
const login = useCallback(async (email: string, password: string) => {
  setIsLoading(true);
  try { ... fetch ... storage.store ... navigate("/dashboard"); }
  catch { /* demo fallback */ }
  finally { setIsLoading(false); }
}, [navigate]);
```

`login` ditulis ulang (objek function baru) hanya kalau `navigate` berubah. Kenapa penting: `login` masuk ke objek `value` context (baris 162-170) — kalau function dibuat baru tiap render, semua konsumen `useAuth()` ikut render ulang, dan `useMemo`/`useCallback` di tempat lain yang bergantung padanya ikut berantai.

Pola `useCallback` lainnya: `useEventBus.ts:7-27` (deps `[]` — function benar-benar abadi), `AuthContext.tsx:145-160` (`hasPermission`/`hasRole` bergantung `user`).

> ⚡ Gotcha: `useCallback` dengan deps `[]` mengunci function ke nilai-nilai **dari render pertama**. Kalau function membaca state (`user`), ia membaca yang basi — **stale closure** (lihat §8). Solusinya: sertakan dep, pakai `useRef`, atau gunakan bentuk fungsional setState.

---

## 7. Kenapa "Invalid Hook Call" Terjadi — Jembatan ke Singularitas React di MFE

Error ini — `Invalid hook call. Hooks can only be called inside of the body of a function component` — muncul dalam dua kelas kasus:

1. **Aturan pemakaian dilanggar** — hook dipanggil dalam kondisi/loop di dalam komponen, atau dari function non-komponen (mis. dari handler event atau util biasa). Hook harus selalu dipanggil di **level teratas** function component, tanpa kondisi di depannya.
2. **Dua salinan React** — ini kasus khas MFE: React mencatat "siapa pemanggil hook" lewat variabel internal (dispatcher) di modul React. Kalau komponen di-render oleh React A tapi memanggil hook dari React B, pencatatan gagal → "Invalid hook call". **Inilah alasan React wajib `singleton: true` di Module Federation** — dibahas detail di catatan utama [`03`](../03-module-federation-webpack.md):

```js
// template-shell/webpack.config.cjs (ringkas)
shared: {
  react: { singleton: true, ... eager: true },
  'react-dom': { singleton: true, ... eager: true },
}
```

Jadi saat kamu membaca catatan [**03**](../03-module-federation-webpack.md) nanti, kalimat "dua salinan React bertabrakan" artinya persis kasus 2 ini: hook dari komponen child MFE menunjuk ke dispatcher React shell (atau sebaliknya), dan React menolak.

> ⚡ Gotcha MFE-nyata: error "Invalid hook call" di child MFE yang jalan standalone (port 5006) tapi rusak saat dimuat shell = hampir pasti masalah **shared/singleton**, bukan aturan hook.

---

## 8. Stale Closure di `useEffect`

**Closure** = function yang "mengunci" variabel dari lingkup pembuatannya. **Stale closure** = closure yang masih memegang nilai LAMA karena dibuat saat nilai itu masih lama.

```tsx
const [count, setCount] = useState(0);

// ❌ Jangan — closure mengunci count = 0 selamanya
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000); // selalu 0!
  return () => clearInterval(id);
}, []);

// ✅ Benar — sertakan dep, atau baca via bentuk fungsional
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000); // pakai updater
  return () => clearInterval(id);
}, []);
```

**Kenapa ini bug tersembunyi di EventBus MFE:** callback subscribe (`EventCallback`) sering membaca state komponen. Kalau callback dibuat sekali (deps `[]`) dan membaca state lama, event berikutnya memanggil callback dengan nilai basi.

**Di repo ini — `useEventSubscription` (`useEventBus.ts:44-53`) menangani ini dengan parameter `deps`:**

```ts
useEffect(() => {
  const unsubscribe = eventBus.subscribe(event, callback);
  return () => unsubscribe();
}, [event, ...deps]);    // ← pemakai WAJIB menyebut dep yang dibaca callback
```

Dan `subscribe` di `useEventBus` (baris 7-14) memakai `useCallback` deps `[]` — aman karena ia hanya mencatat ke `subscriptionsRef` (ref selalu "segar", tidak basi — inilah alasan lain `useRef` dipakai di sana). Kalau callback yang di-subscribe membaca state, pemakai harus memastikan callback-nya sendiri tidak basi (mis. dengan `useCallback` ber-deps benar).

---

## 9. Kuis Cepat Penguatan

Baca `template-shell/src/pages/Login.tsx:7-23` — sekarang kamu bisa menjawab:

1. `const [email, setEmail] = useState('')` — mengapa `setEmail(e.target.value)` ada di `onChange` (baris 45)? → hook: setiap ketikan = update state → render ulang.
2. `handleLogin` dipanggil dari `onSubmit` form (baris 37) — kenapa `e.preventDefault()` di awal? → tanpa itu browser me-reload halaman dan seluruh state SPA hilang.
3. `try { await login(...) } finally { setLoading(false) }` — kenapa `finally`? → jalan baik sukses maupun error; tombol tidak terkunci.
4. `const { login } = useAuth()` (baris 13) — dari mana `login`? → `useContext` membaca `AuthProvider` (maksimal satu lapis provider berisi nilai ini di `bootstrap.tsx`).

---

## Ringkasan Satu Layar

| Hook | Fungsi | Contoh terbaik di repo |
|------|--------|------------------------|
| `useState` | state lokal + render ulang | `Login.tsx:9-12`, `LazyMFE.tsx:30-34` |
| `useEffect` | efek samping; deps `[]`/`[dep]`/tanpa; cleanup | `AuthContext.tsx:43-60`, `Layout.tsx:40-42`, `useEventBus.ts:29-34` |
| `useContext` | baca provider; pola fallback vs throw | `SharedContext.tsx:50-56` vs `AuthContext.tsx:26-32` |
| `useRef` | nilai antar render tanpa render ulang | `useEventBus.ts:5` |
| `useMemo` | cache nilai; stabilkan identitas objek context | `SharedContext.tsx:71-79` |
| `useCallback` | cache function; stabilkan identitas fn | `AuthContext.tsx:88-135`, `useEventBus.ts:7-27` |
| **Kritis** | Invalid hook call, stale closure, deps | hubungkan ke [`03`](../03-module-federation-webpack.md) & [`07`](../07-auth-routing-eventbus.md) |

---

[**← 03. React Dasar**](./03-react-dasar.md) | Lanjut ke [**05. React Router Dasar (v6)**](./05-react-router-dasar.md)

> Dari prasyarat ini, kamu sudah siap membaca: [**07. Auth, Routing & Event Bus**](../07-auth-routing-eventbus.md) — `AuthContext`, EventBus + cleanup; [**04. Shell / Host App**](../04-shell-host.md) — `LazyMFE`, provider stack; [**06. Shared Library**](../06-shared-library.md) — `SharedContext`, `useEventBus`.