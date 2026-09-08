# 11. Cheat Sheet & Rangkuman Jebakan Ujian

Rangkuman cepat konsep kunci sebelum menghadapi tes berikutnya.

---

## 1. Glosarium Istilah Kunci

* **Host (Shell):** Aplikasi penampung utama yang pertama kali dimuat di browser.
* **Remote (Child):** Aplikasi mandiri yang mengekspos modul untuk dikonsumsi oleh Host di runtime.
* **Module Federation:** Plugin Webpack 5 untuk berbagi kode JavaScript dinamis di browser.
* **`remoteEntry.js`:** File manifest kecil yang diekspos oleh Remote, berisi method `init()` dan `get()`.
* **Share Scope:** Ruang tukar dependensi bersama (misal React) yang dikelola oleh Webpack di `window`.
* **Singleton:** Menjamin hanya ada 1 salinan library di memori browser.
* **Eager Loading:** Memaksa library diunduh di awal saat inisialisasi aplikasi (wajib `true` di Shell, `false` di Child).
* **HTML5 History API (`pushState`):** Mekanisme manipulasi URL bar browser di memori tanpa memicu HTTP reload halaman.
* **EventBus:** Komunikasi pub/sub bebas ketergantungan (*decoupled*) antar MFE di memori browser.
* **Error Boundary:** Komponen penangkap crash (*Circuit Breaker*) agar error di satu MFE tidak membuat seluruh web *blank screen*.

---

## 2. Pertanyaan Jebakan Klasik untuk Backend Developer

1. **Jebakan:** *"Browser mengisolasi MFE seperti Docker container / proses OS terpisah."*  
   **Fakta:** **SALAH**. Browser hanya punya 1 thread V8 dan 1 memori heap per tab. Semuanya berbagi `window` dan `document` yang sama.

2. **Jebakan:** *"Kita butuh server Nginx di dalam browser untuk me-redirect rute port 5006 ke port 5000."*  
   **Fakta:** **SALAH**. Tidak ada Nginx di browser klien. Navigasi dikelola oleh JavaScript di memori menggunakan **React Router & pushState**.

3. **Jebakan:** *"Agar tidak ada CSS conflict, matikan saja CSS di Child MFE."*  
   **Fakta:** **SALAH**. Menghapus CSS mematikan otonomi tim. Solusinya adalah **Tailwind CSS** (utility classes) atau **CSS Modules** (nama class di-hash unik otomatis).

4. **Jebakan:** *"Child MFE A bisa meng-import store state Redux Child MFE B langsung dari kodenya."*  
   **Fakta:** **SALAH**. Ini menyebabkan tight coupling. Gunakan **Event Bus (Pub/Sub)** di `template-shared` agar tetap terpisah.

5. **Jebakan:** *"File `remoteEntry.js` berisi seluruh bundle kode Child MFE beserta React."*  
   **Fakta:** **SALAH**. File tersebut hanyalah manifest kecil berisi interface `init()` dan `get()`. Kode komponen sesungguhnya baru didownload saat halaman dipanggil (*on-demand*).