# 08. Masalah CSS Bleeding & Style Isolation

CSS di browser memiliki karakteristik yang sering mengejutkan programmer backend: **secara bawaan, CSS tidak memiliki lingkup privat (tidak ada private memory scope)**.

---

## 1. Bahaya "CSS Bleeding" (Style Leakage)

Tag `<style>` apa pun yang disuntikkan ke dalam dokumen HTML akan berlaku untuk **seluruh dokumen**, tanpa memandang apakah class tersebut ditulis di Shell atau di Child MFE.

### Skenario Kerusakan:
Bayangkan programmer di Child MFE menulis kode CSS berikut:
```css
/* file global.css di Child MFE */
button {
  background-color: #ef4444 !important; /* Merah menyala */
  padding: 24px;
}
```
Ketika Child MFE dimuat, tag style ini dimasukkan ke dalam `<head>` browser. Tiba-tiba, tombol Logout di Shell, tombol Simpan di Child B, dan semua elemen `<button>` di seluruh website berubah menjadi merah besar. Ini disebut **CSS Bleeding**.

---

## 2. Solusi Standar yang Diterapkan di Template Ini

1. **Tailwind CSS (Utility-First):**
   - Menghindari styling tag HTML telanjang (seperti `button { ... }`).
   - Menggunakan class utilitas yang fungsional dan terprediksi, seperti `px-4 py-2 bg-blue-600 text-white rounded`.
2. **CSS Modules (`[name].module.css`):**
   - Webpack secara otomatis mengubah nama class menjadi hash unik saat build:
     ```css
     /* Sumber kode kita */
     .submitButton { background: green; }

     /* Hasil compile Webpack */
     .submitButton_x98df2 { background: green; }
     ```
   - Dua MFE berbeda bisa sama-sama menggunakan class `.submitButton` tanpa akan pernah bentrok di browser.
3. **Scoping Container Prefix:**
   - Membungkus seluruh tampilan Child MFE dalam class pembungkus, misal `.mfe-child-scope`.