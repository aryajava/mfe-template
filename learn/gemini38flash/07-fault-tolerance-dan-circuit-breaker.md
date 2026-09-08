# 07. Fault Tolerance: Circuit Breaker di Frontend

Di backend, jika salah satu microservice down, sistem menggunakan pola **Circuit Breaker** (seperti Netflix Hystrix / Resilience4j) agar kegagalan tersebut tidak merambat (*cascading failure*).

Di frontend MFE, peran Circuit Breaker dijalankan oleh **React Error Boundary**.

---

## 1. Masalah: White Screen of Death

Di browser, jika komponen JavaScript melempar runtime error (misalnya: `TypeError: Cannot read properties of undefined`) tanpa penanganan, React secara default akan **mencopot seluruh pohon DOM**.
Akibatnya, seluruh layar menjadi putih kosong (*White Screen of Death*), dan user tidak bisa mengklik apa pun.

---

## 2. Solusi: `<MFEErrorBoundary>`

Implementasi ada di [**`template-shell/src/components/ErrorBoundary/MFEErrorBoundary.tsx`**](file:///d:/Repositories/mfe-template/template-shell/src/components/ErrorBoundary/MFEErrorBoundary.tsx):

```typescript
export class MFEErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[MFEErrorBoundary] Error in ${this.props.mfeName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <MFEErrorFallback
          mfeName={this.props.mfeName}
          error={this.state.error}
          resetErrorBoundary={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }
    return this.props.children;
  }
}
```

### Dampak Positif pada Arsitektur:
1. **Isolasi Kegagalan (*Blast Radius Minimal*):** Jika server Child MFE mati (HTTP 502/down) atau ada bug kode di halaman Child, hanya kotak tengah tempat Child berada yang menampilkan kartu error fallback.
2. **Navigasi Tetap Hidup:** Navbar atas dan Sidebar menu Shell tetap 100% aktif dan dapat diklik. Pengguna dapat berpindah ke menu lain tanpa harus menutup tab atau merefresh browser.