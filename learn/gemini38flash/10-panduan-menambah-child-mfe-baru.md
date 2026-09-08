# 10. Panduan Praktis Menambah Child MFE Baru

Panduan langkah demi langkah saat Anda perlu membuat modul Micro-Frontend baru (contoh kasus: membuat modul `template-mfe-admin`).

---

## 6 Langkah Implementasi:

### Langkah 1: Duplikasi Folder Template
Salin folder `template-mfe-child` menjadi folder baru bernama `template-mfe-admin`:
```bash
cp -r template-mfe-child template-mfe-admin
```

### Langkah 2: Sesuaikan Port dan Nama di `webpack.config.cjs`
Buka `template-mfe-admin/webpack.config.cjs`:
1. Ubah port devServer ke port unik berikutnya:
   ```javascript
   devServer: {
     port: 5007, // Port unik untuk admin
   }
   ```
2. Ubah nama federation container:
   ```javascript
   new ModuleFederationPlugin({
     name: 'adminMFE', // Scope unik di window
     filename: 'remoteEntry.js',
     exposes: {
       './Module': './src/Module.tsx',
     },
     // shared dependencies tetap sama
   })
   ```

### Langkah 3: Bangun Halaman di `src/pages/` dan Atur `src/Module.tsx`
Buat halaman fitur admin (misal: `Users.tsx`, `Roles.tsx`), dan sesuaikan rute internal di `src/Module.tsx`:
```tsx
const ModuleContent: React.FC<ModuleProps> = ({ basePath = '/admin' }) => {
  const location = useLocation();
  const relativePath = location.pathname.replace(basePath, '').replace(/^\//, '');

  if (relativePath === 'roles') return <RolesPage />;
  return <UsersPage />;
};
```

### Langkah 4: Daftarkan Route di Shell
Buka [**`template-shell/src/routes/routes.tsx`**](file:///d:/Repositories/mfe-template/template-shell/src/routes/routes.tsx), tambahkan:
```tsx
<Route
  path="/admin/*"
  element={
    <MFEErrorBoundary mfeName="Admin MFE">
      <LazyMFE
        scope="adminMFE"
        module="./Module"
        url="http://localhost:5007/remoteEntry.js"
        basePath="/admin"
      />
    </MFEErrorBoundary>
  }
/>
```

### Langkah 5: Daftarkan URL di `template-shell/env.js`
Buka [**`template-shell/env.js`**](file:///d:/Repositories/mfe-template/template-shell/env.js):
```javascript
const MFE_ROUTES = {
  childMfe: "http://localhost:5006/remoteEntry.js",
  adminMfe: "http://localhost:5007/remoteEntry.js",
};
```

### Langkah 6: Daftarkan ke Workspace
Buka [**`pnpm-workspace.yaml`**](file:///d:/Repositories/mfe-template/pnpm-workspace.yaml) di root project:
```yaml
packages:
  - 'template-shared'
  - 'template-shell'
  - 'template-mfe-child'
  - 'template-mfe-admin'
```

Dan perbarui script `dev` di `package.json` root jika ingin menjalankannya bersamaan.