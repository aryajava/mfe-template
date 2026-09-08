# 03. Webpack Module Federation Secara Mendalam

**Module Federation** adalah fitur bawaan Webpack 5 yang memungkinkan beberapa kompilasi JavaScript terpisah saling membagikan modul dan kode di **runtime browser**, bukan saat compile-time.

---

## 1. Anatomi `remoteEntry.js`

Ketika Child MFE dinyalakan (`http://localhost:5006`), Webpack menyajikan sebuah file manifest bernama `remoteEntry.js`.

File ini berukuran sangat kecil (hanya beberapa kilobyte) dan memiliki interface standar:
```typescript
interface RemoteContainer {
  // 1. Menginisialisasi share scope (mencocokkan library singleton dari Shell)
  init: (shareScope: any) => Promise<void>;
  
  // 2. Mengambil pabrik komponen yang diekspos (misal './Module')
  get: (module: string) => Promise<() => any>;
}
```

---

## 2. Perbandingan Konfigurasi Webpack

### A. Host (`template-shell/webpack.config.cjs`)
```javascript
new ModuleFederationPlugin({
  name: 'shell',
  filename: 'remoteEntry.js',
  remotes: {}, // Dikelola dinamis di runtime via LazyMFE
  shared: {
    react: {
      singleton: true,                 // Hanya 1 instance React di memori
      requiredVersion: false,
      strictVersion: false,
      eager: true,                     // Shell langsung memuat React saat inisialisasi awal
    },
    'react-dom': { singleton: true, eager: true },
    'react-router-dom': { singleton: true, eager: true },
    '@tanstack/react-query': { singleton: true },
  },
})
```

### B. Remote (`template-mfe-child/webpack.config.cjs`)
```javascript
new ModuleFederationPlugin({
  name: 'childMFE',                    // Nama variabel container global di window
  filename: 'remoteEntry.js',
  exposes: {
    './Module': './src/Module.tsx',    // Komponen yang ditawarkan ke Shell
  },
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^18.3.1',
      strictVersion: false,
      eager: false,                    // Remote TIDAK eager memuat React, memakai milik Shell
    },
    'react-dom': { singleton: true, eager: false },
    'react-router-dom': { singleton: true, eager: false },
    '@tanstack/react-query': { singleton: true },
  },
})
```

---

## 3. Mengapa React Wajib `singleton: true`?

Di React, hooks seperti `useState`, `useEffect`, dan `useContext` bergantung pada **Current Dispatcher** yang disimpan di variabel privat memori modul React.

Jika `singleton: false`:
1. Shell memuat `React_Copy_A`.
2. Child MFE mengunduh dan memuat `React_Copy_B`.
3. Komponen Child dirender di dalam Virtual DOM milik Shell.
4. Saat Child memanggil `useState()`, komponen tersebut mencari dispatcher dari `React_Copy_B`, padahal yang sedang aktif adalah dispatcher `React_Copy_A`.
5. Hasilnya adalah runtime error fatal:
   > `Error: Invalid hook call. Hooks can only be called inside the body of a function component.`

Dengan opsi `singleton: true`, Module Federation memastikan Shell dan semua Child MFE **menggunakan satu pointer referensi React yang sama persis** di memori.