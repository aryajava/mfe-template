# 03 — Module Federation & Webpack Config

Dua file konfigurasi webpack: `template-shell/webpack.config.cjs` (host) dan `template-mfe-child/webpack.config.cjs` (remote).

## Kesamaan Keduanya

- `entry: './src/index.tsx'` → `index.tsx` hanya `import('./bootstrap')` (pola async boundary).
- `mode` mengikuti argv (development/production); shell juga set `devtool`.
- `devServer` dengan `historyApiFallback: true`, `hot: true`, dan header CORS `Access-Control-Allow-Origin: *` (WAJIB agar host bisa memuat remote cross-origin).
- `resolve`:
  ```js
  extensions: ['.tsx', '.ts', '.js', '.jsx'],
  modules: ['node_modules', path.resolve(__dirname, '../template-shared/src')],
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@template/shared': path.resolve(__dirname, '../template-shared/src'),
  },
  ```
  → `@template/shared` di-resolve ke **source**, bukan ke `dist` (tanpa build saat dev).
- `module.rules`:
  - `/\.tsx?$/` → `ts-loader` (shell pakai `transpileOnly: true`), exclude `/node_modules[\\\/](?!@template)/` (jangan kompilasi node_modules kecuali paket @template).
  - `/\.css$/` → `style-loader → css-loader → postcss-loader` (postcss = tailwind + autoprefixer).

## Host (`shell`) — port 5000

```js
output: { path: dist, filename: '[name].[contenthash].js', clean: true, publicPath: '/' }
optimization: { runtimeChunk: 'single', splitChunks: vendor (name: 'vendors', priority 10) }
plugins:
  new ModuleFederationPlugin({
    name: 'shell',
    filename: 'remoteEntry.js',
    remotes: {},           // kosong → remote dimuat dinamis oleh LazyMFE
    shared: {
      react: { singleton: true, requiredVersion: false, strictVersion: false, eager: true },
      'react-dom': { ... eager: true },
      'react/jsx-runtime': { ... eager: true },
      'react-router-dom': { ... eager: true },
      '@tanstack/react-query': { singleton: true, requiredVersion: false }, // tanpa eager
    },
  }),
  new HtmlWebpackPlugin({ template: './index.html' }),
  new CopyWebpackPlugin({ patterns: [{ from: 'public', to: '.', noErrorOnMissing: true }] }), // salin env.js
```
- `eager: true` di shell agar dependensi shared langsung tersedia tanpa menunggu async chunk — penting karena LazyMFE memuat remote secara dinamis dan langsung mengakses `window.__webpack_share_scopes__.default`.
- `cache: { type: 'filesystem', cacheDirectory: '.webpack-cache' }` untuk mempercepat rebuild.

## Remote (`childMFE`) — port 5006

```js
output: { ..., publicPath: 'auto' }   // publicPath auto agar asset path ikut lokasi remote
plugins:
  new ModuleFederationPlugin({
    name: 'childMFE',
    filename: 'remoteEntry.js',
    exposes: { './Module': './src/Module.tsx' },   // satu-satunya entry yang diekspos
    shared: {
      react: { singleton: true, requiredVersion: '^18.3.1', strictVersion: false, eager: false },
      'react-dom': { ... requiredVersion: '^18.3.1', eager: false },
      'react/jsx-runtime': { ... requiredVersion: '^18.3.1', eager: false },
      'react-router-dom': { singleton: true, requiredVersion: false, eager: false },
      '@tanstack/react-query': { singleton: true, requiredVersion: false },
    },
  }),
```
- Remote memakai `requiredVersion` konkret untuk React (^18.3.1), `eager: false` (menunggu di-share oleh host).
- `publicPath: 'auto'` vs shell `publicPath: '/'` — remote butuh auto agar chunk internal di-resolve relatif terhadap URL remoteEntry.

## Pola Penting: Async Boundary
`index.tsx` berisi `import('./bootstrap')` — pola standar Module Federation: kode yang memakai `shared` tidak boleh dievaluasi saat entry sinkron; dengan dynamic import, webpack menunggu share scope siap.

## Catatan Detail
- `requiredVersion: false` + `strictVersion: false` = fleksibel, versi tidak diperiksa ketat.
- Bila versi React tidak cocok antara host/remote, singleton akan memilih satu versi (host menang karena eager + dimuat duluan).
- Untuk MFE tambahan, cukup salin `template-mfe-child`, ganti `name` (scope unik), `port`, dan `exposes`.
