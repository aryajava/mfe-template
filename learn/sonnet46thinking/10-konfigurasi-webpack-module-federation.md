# 10. Konfigurasi Webpack Module Federation
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

---

## Shell (Host) — webpack.config.cjs

```javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

new ModuleFederationPlugin({
  name: 'shell',
  filename: 'remoteEntry.js',
  remotes: {},   // ← KOSONG — remote dimuat dinamis via LazyMFE

  shared: {
    react: {
      singleton: true,       // satu instance
      requiredVersion: false, // tidak strict versi
      eager: true,           // ← HANYA SHELL yang eager!
    },
    'react-dom': {
      singleton: true,
      eager: true,
    },
    'react/jsx-runtime': {
      singleton: true,
      eager: true,
    },
    'react-router-dom': {
      singleton: true,
      eager: true,
    },
    '@tanstack/react-query': {
      singleton: true,
      // tidak perlu eager — di-lazy load ok
    },
  },
})
```

## Child MFE (Remote) — webpack.config.cjs

```javascript
new ModuleFederationPlugin({
  name: 'childMFE',           // ← UNIK per MFE, cocok dengan scope di LazyMFE

  filename: 'remoteEntry.js', // ← file yang diminta shell
  exposes: {
    './Module': './src/Module.tsx',  // ← entry point yang di-expose
  },

  shared: {
    react:                  { singleton: true },  // ← TANPA eager!
    'react-dom':            { singleton: true },
    'react-router-dom':     { singleton: true },
    '@tanstack/react-query':{ singleton: true },
  },
})
```

## Kenapa eager: true Hanya di Shell?

```
Shell bootstrap.tsx dipanggil via dynamic import:
  index.tsx → import('./bootstrap')

Jika shared deps TIDAK eager di shell:
  bootstrap.tsx mulai mount
  → "Saya butuh React, tapi React belum ready (masih async load)"
  → ERROR!

Dengan eager: true di shell:
  React, react-dom, react-router-dom sudah tersedia synchronously
  → bootstrap.tsx bisa mount React tanpa menunggu

Child MFE TIDAK perlu eager:
  Module.tsx di-load secara async oleh LazyMFE
  → sudah dalam konteks async, tidak masalah
```

## Webpack Alias untuk Shared Library

```javascript
resolve: {
  extensions: ['.tsx', '.ts', '.js', '.jsx'],
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@template/shared': path.resolve(__dirname, '../template-shared/src'),
  },
}
```

Efek: `import { Button } from '@template/shared'` → langsung ke source TypeScript.  
Tidak perlu build step shared library saat development.

## Optimasi Build

```javascript
// Build lebih cepat dengan filesystem cache
cache: {
  type: 'filesystem',
  cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
},

// Code splitting
optimization: {
  runtimeChunk: 'single',        // satu runtime chunk
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
      },
    },
  },
},

// TypeScript: transpile only (type check terpisah via pnpm typecheck)
{
  test: /\.tsx?$/,
  use: {
    loader: 'ts-loader',
    options: { transpileOnly: true },  // cepat, skip type check saat build
  },
  exclude: /node_modules[\\/](?!@template)/, // exclude node_modules KECUALI @template
}
```

## devServer Configuration

```javascript
devServer: {
  port: 5000,                    // ganti per MFE (5006, 5007, dst.)
  historyApiFallback: true,      // ← WAJIB untuk SPA routing
  hot: true,
  headers: {
    'Access-Control-Allow-Origin': '*',  // ← WAJIB untuk cross-origin loading
  },
},
```

`historyApiFallback: true` → semua 404 di-redirect ke `index.html` (penting untuk React Router).  
`Access-Control-Allow-Origin: *` → shell bisa load `remoteEntry.js` dari port berbeda.

## Output Config

```javascript
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: '[name].[contenthash].js',  // content-based hash untuk cache busting
  clean: true,                          // hapus dist sebelum build
  publicPath: '/',                      // base URL untuk assets
},
```

---
*Lanjut → [11. Environment & Port Convention](./11-environment-dan-port-convention.md)*
