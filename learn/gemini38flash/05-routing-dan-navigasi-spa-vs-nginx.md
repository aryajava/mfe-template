# 05. Routing & Navigasi: SPA vs Nginx

Banyak insinyur backend mengira routing di frontend mirip dengan aturan rewrite Nginx. Bagian ini meluruskan konsep tersebut.

---

## 1. Single Page Application (SPA) Routing

Di aplikasi web tradisional:
- Setiap kali Anda klik tautan `/users`, browser mengirim HTTP GET ke server web (Nginx/Apache), server merespons dengan dokumen HTML baru, dan browser me-reload halaman dari nol (layar berkedip putih).

Di aplikasi SPA / MFE:
- Dokumen HTML hanya diunduh **satu kali** di awal saat user pertama kali membuka website.
- Ketika user berpindah halaman:
  1. Browser **TIDAK** mengirim request HTTP GET untuk halaman HTML baru.
  2. JavaScript memanggil **HTML5 History API**: `window.history.pushState(state, title, url)`.
  3. URL di address bar browser berubah, tetapi tab tidak me-reload.
  4. Library **React Router** mendeteksi perubahan URL di memori, lalu me-mount komponen yang sesuai ke layar.

---

## 2. Koordinasi Rute Antara Shell dan Child

Bagaimana Shell dan Child MFE berbagi tanggung jawab URL tanpa bertabrakan?

### A. Di Shell (`template-shell/src/routes/routes.tsx`)
Shell bertindak sebagai **Router Induk**:
```tsx
<Route
  path="/child/*"   // Perhatikan tanda wildcard /*
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
- `path="/child/*"`: Memberi tahu React Router bahwa seluruh path yang diawali `/child/` didelegasikan ke `LazyMFE`.
- Properti `basePath="/child"` dioper ke Child MFE sebagai titik acuan (*root baseline*).

### B. Di Child MFE (`template-mfe-child/src/Module.tsx`)
Child MFE bertindak sebagai **Sub-Router**:
```tsx
const ModuleContent: React.FC<ModuleProps> = ({ basePath = '/child', subRoute }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Hitung rute relatif terhadap basePath Shell:
  const relativePath = currentPath.replace(basePath, '').replace(/^\//, '');

  if (relativePath === '' || relativePath === '/') return <Home />;
  if (relativePath === 'users') return <UsersPage />;
  if (relativePath === 'roles') return <RolesPage />;

  return <NotFound />;
};
```

Dengan pola ini, Child MFE cukup mengurusi rute relatif (`users`, `roles`) tanpa perlu memikirkan domain atau rute utama milik Shell.