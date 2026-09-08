# 07. Komunikasi Antar MFE (EventBus)
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

File: `template-shared/src/lib/eventBus.ts`

---

## Masalah yang Dipecahkan

MFE-MFE berjalan dalam isolasi — mereka tidak bisa langsung memanggil fungsi satu sama lain.  
EventBus adalah **Pub/Sub bus** sederhana untuk komunikasi loosely-coupled antar MFE.

Analogi: seperti RabbitMQ/Kafka, tapi dalam memori browser (satu tab).

## Interface EventBus

```typescript
interface EventBusInstance {
  subscribe<T>(event: string, callback: (data: T) => void): () => void;
  // returns unsubscribe function — panggil untuk cleanup!

  publish<T>(event: string, data?: T): void;

  once<T>(event: string, callback: (data: T) => void): () => void;
  // subscribe sekali saja — otomatis unsubscribe setelah trigger pertama
}

export const eventBus = new EventBus();  // singleton
```

## Event Constants Bawaan (MFE_EVENTS)

```typescript
export const MFE_EVENTS = {
  // Navigation
  NAVIGATE_TO:           'mfe:navigate',
  NAVIGATION_COMPLETE:   'mfe:navigation_complete',

  // Authentication
  USER_LOGGED_IN:        'auth:logged_in',
  USER_LOGGED_OUT:       'auth:logged_out',
  SESSION_EXPIRED:       'auth:session_expired',
  TOKEN_REFRESHED:       'auth:token_refreshed',

  // Data
  DATA_UPDATED:          'data:updated',
  CACHE_INVALIDATE:      'cache:invalidate',

  // UI
  NOTIFICATION_SHOW:     'ui:notification',
  MODAL_OPEN:            'ui:modal_open',
  MODAL_CLOSE:           'ui:modal_close',
  SIDEBAR_TOGGLE:        'ui:sidebar_toggle',

  // Error
  MFE_ERROR:             'mfe:error',
  API_ERROR:             'api:error',
} as const;

export type MFEEventType = (typeof MFE_EVENTS)[keyof typeof MFE_EVENTS];
```

## Cara Pakai via useEventBus Hook

```tsx
import { useEventBus, MFE_EVENTS } from '@template/shared';

const MyComponent = () => {
  const { subscribe, publish, once } = useEventBus();

  useEffect(() => {
    // Subscribe — SELALU cleanup di return
    const unsub = subscribe<{ path: string }>(
      MFE_EVENTS.NAVIGATE_TO,
      (data) => {
        console.log('Navigate to:', data.path);
      }
    );
    return unsub;  // ← cleanup otomatis saat unmount
  }, [subscribe]);

  const handleSave = () => {
    // Publish
    publish(MFE_EVENTS.DATA_UPDATED, { entity: 'user', id: 123 });
  };

  const handleLogout = () => {
    // Once — hanya trigger sekali
    once(MFE_EVENTS.USER_LOGGED_OUT, () => {
      console.log('User sudah logout');
    });
  };
};
```

## Cara Pakai Langsung (tanpa Hook)

```typescript
import { eventBus, MFE_EVENTS } from '@template/shared';

// Subscribe
const unsubscribe = eventBus.subscribe(MFE_EVENTS.USER_LOGGED_IN, (data) => {
  console.log('User login:', data);
});

// Publish
eventBus.publish(MFE_EVENTS.SIDEBAR_TOGGLE);

// Cleanup manual
unsubscribe();
```

## Implementasi Internal

```typescript
class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback as EventCallback);
    };
  }

  publish<T>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
          // Error di satu handler tidak menghentikan handler lain
        }
      });
    }
  }
}
```

**Key design decisions:**
- Menggunakan `Set` (bukan array) untuk callback → otomatis deduplicate
- Error satu handler tidak propagate ke handler lain
- `once()` = `subscribe()` yang langsung `unsubscribe()` setelah triggered

---
*Lanjut → [08. API Client](./08-api-client-createapiclient.md)*
