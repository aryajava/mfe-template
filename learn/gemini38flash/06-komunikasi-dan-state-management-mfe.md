# 06. Komunikasi & State Management Decoupling

Di arsitektur microservices backend, dua service independen tidak boleh saling mengakses tabel database secara langsung. Di MFE, prinsip yang sama berlaku: **dua Child MFE pantang saling meng-import store state management secara langsung**.

---

## 1. Event Bus (Pola Pub/Sub Antar-MFE)

Disediakan di [**`template-shared/src/lib/eventBus.ts`**](file:///d:/Repositories/mfe-template/template-shared/src/lib/eventBus.ts).

### Konsep:
EventBus bertindak seperti **Message Broker (Kafka/RabbitMQ)** mini yang hidup di dalam memori browser:
- MFE Pengirim memancarkan event tanpa perlu tahu siapa yang menerima.
- MFE Penerima mendaftarkan callback listener untuk topik event tertentu.

### Implementasi:
```typescript
import { eventBus, MFE_EVENTS } from '@template/shared';

// 1. MFE Pembayaran mem-publish event ketika transaksi selesai:
eventBus.publish(MFE_EVENTS.DATA_UPDATED, {
  orderId: 'ORD-9901',
  status: 'PAID'
});

// 2. MFE Notifikasi mendengarkan event tersebut di tempat terpisah:
useEffect(() => {
  const unsubscribe = eventBus.subscribe(MFE_EVENTS.DATA_UPDATED, (payload) => {
    toast.success(`Pesanan ${payload.orderId} telah dibayar!`);
  });

  return () => unsubscribe(); // Wajib di-cleanup saat unmount komponen
}, []);
```

---

## 2. Shared Context (Autentikasi & Query Client)

Disediakan di [**`template-shared/src/contexts/SharedContext.tsx`**](file:///d:/Repositories/mfe-template/template-shared/src/contexts/SharedContext.tsx).

### Alur Auth Token:
1. Shell menangani form login, menyimpan JWT token, dan membungkus aplikasi dengan `<SharedProvider>`.
2. Saat Child MFE dimuat, Child dapat langsung membaca user dan permission:
   ```typescript
   const { authContext } = useSharedContext();
   console.log("Current User:", authContext.user?.email);
   ```

### Rahasia "Standalone Mode":
Perhatikan baris 50–56 pada `SharedContext.tsx`:
```typescript
export const useSharedContext = (): SharedContextType => {
  const context = useContext(SharedContext);
  if (!context) {
    return defaultFallbackContext; // Fallback cerdas saat tidak ada Shell!
  }
  return context;
};
```
Jika Child MFE dijalankan sendiri di `http://localhost:5006`, tidak ada Shell yang membungkusnya dengan `<SharedProvider>`. Alih-alih melempar error crash, fungsi ini menyediakan `defaultFallbackContext`. Inilah yang memungkinkan Child MFE dapat didevelop secara mandiri.