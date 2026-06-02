Usage notes: SdkProvider and auth helpers

- Wrap your app with the provider (already added in `app/_layout.tsx`). The provider accepts a `config` object with `authUrl` and `marketUrl` and will configure API clients and token state.

Example login flow (async function from a screen):

```ts
import { authLogin } from '@/lib/api/clients';

async function handleLogin(phone: string, password: string) {
  try {
    const res = await authLogin({ phone_number: phone, password });
    // authLogin stores tokens into secure storage for the provider to pick up
    // call refreshToken from useSdk if you need immediate client reconfiguration
  } catch (err) {
    console.error('Login failed', err);
  }
}
```

Reading the API:
- Use the project's API reference (END_TO_END_MARKETPLACE_API.md) to confirm endpoints and payloads when calling `auth` and `market` endpoints.
