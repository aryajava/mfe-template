# 08. API Client (createApiClient)
> **Model:** Claude Sonnet 4.6 (Thinking) | [← Kembali ke Index](./catatan_sonnet46thinking.md)

File: `template-shared/src/lib/api.ts`

---

## Factory Pattern

`createApiClient` adalah **factory function** — setiap MFE membuat instance-nya sendiri dengan konfigurasi berbeda.

```typescript
interface ApiConfig {
  baseUrl: string;
  getToken: () => string | null;   // fungsi, bukan nilai — selalu fresh
  onUnauthorized?: () => void;     // callback saat 401
}
```

## Cara Membuat Instance

```typescript
import { createApiClient } from '@template/shared';

// Di services/api.ts masing-masing MFE
const api = createApiClient({
  baseUrl: 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    // Redirect ke login atau clear session
    window.location.href = '/login';
  },
});

export default api;
```

## Semua Method HTTP

```typescript
// GET
const users = await api.get<User[]>('/users');
const user = await api.get<User>('/users/1');

// POST
const newUser = await api.post<User>('/users', {
  name: 'Budi',
  email: 'budi@example.com',
});

// PUT (replace seluruh resource)
const updated = await api.put<User>('/users/1', { name: 'Budi Santoso', email: 'budi@example.com' });

// PATCH (update sebagian)
const patched = await api.patch<User>('/users/1', { name: 'Budi Santoso' });

// DELETE
await api.delete<void>('/users/1');
```

## Error Handling Built-in

| Status | Behaviour |
|--------|-----------|
| `401` | Panggil `onUnauthorized()` lalu throw `Error('Unauthorized')` |
| `403` | Throw `ApiError` dengan message "Access Denied" + details |
| `204` | Return `{}` (no content — tidak parse JSON) |
| Other non-ok | Throw `ApiError` dengan status + pesan dari response body |

```typescript
interface ApiError {
  message: string;
  status: number;
  details?: Record<string, unknown>;
}
```

## Penggunaan dengan TanStack Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.get<User[]>('/users'),
});

// Mutation
const { mutate } = useMutation({
  mutationFn: (userData: CreateUserDto) =>
    api.post<User>('/users', userData),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

## Fitur Keamanan

Setiap request otomatis menyertakan:
```
Content-Type: application/json
Authorization: Bearer <token>   ← hanya jika token ada
credentials: 'include'          ← kirim cookies (untuk session-based auth)
```

`getToken` dipanggil **saat request dikirim** (bukan saat createApiClient dipanggil), sehingga selalu mendapat token terbaru.

## TypeScript: ApiClient Type

```typescript
export type ApiClient = ReturnType<typeof createApiClient>;

// Berguna untuk dependency injection
interface MyService {
  api: ApiClient;
}
```

---
*Lanjut → [09. Utility Functions](./09-utility-functions.md)*
