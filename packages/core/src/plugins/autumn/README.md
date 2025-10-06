<img src="../../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom - Autumn Plugin

Provides pricing and billing integration with [Autumn](https://useautumn.com/) - an open-source infrastructure layer over Stripe.

## Features

- Feature gating and access control
- Usage metering and tracking
- Stripe checkout and billing portal
- Subscription management (upgrade, downgrade, cancel)
- Customer data and analytics

## Setup

Add your Autumn API key to `.env`:

```bash
AUTUMN_SECRET_KEY=am_sk_1234567890
```

Add the plugin to your auth configuration:

```typescript
import { bloomAuth, autumn } from '@bloom/core';

const auth = bloomAuth({
  database: mongoose,
  plugins: [
    autumn(), // Reads AUTUMN_SECRET_KEY from env
  ],
});
```

Or with custom configuration:

```typescript
const auth = bloomAuth({
  database: mongoose,
  plugins: [
    autumn({
      apiKey: 'am_sk_1234567890',  // Optional: override env variable
      apiUrl: 'https://api.useautumn.com/v1',  // Optional: for self-hosted
    }),
  ],
});
```

## Usage

```typescript
'use server';
import { auth } from '@/lib/auth';
import { getCookieHeader } from '@bloom/adapters/nextjs/server';

export async function sendMessage(text: string) {
  const cookie = await getCookieHeader();

  // Check access
  const { data } = await auth.api.autumn.check({
    headers: { cookie },
    body: { featureId: 'messages' },
  });

  if (!data.allowed) {
    throw new Error('Message limit reached');
  }

  // Perform action
  await saveMessage(text);

  // Track usage
  await auth.api.autumn.track({
    headers: { cookie },
    body: { featureId: 'messages', value: 1 },
  });

  return { success: true };
}
```

## API Methods

### `auth.api.autumn.check(params)`
Check if user has access to a feature or product.

- **Params:** `{ featureId?: string, productId?: string }`
- **Returns:** `{ data: { allowed: boolean, remaining?: number, limit?: number } }`

### `auth.api.autumn.track(params)`
Record feature usage for metering.

- **Params:** `{ featureId: string, value?: number }`
- **Returns:** `{ success: boolean }`

### `auth.api.autumn.checkout(params)`
Create a Stripe checkout session.

- **Params:** `{ productId: string, successUrl?: string }`
- **Returns:** `{ url: string }`

### `auth.api.autumn.attach(params)`
Attach product to customer (upgrade/downgrade without checkout).

- **Params:** `{ productId: string, successUrl?: string }`
- **Returns:** `{ success: boolean, url?: string }`

### `auth.api.autumn.cancel(params)`
Cancel a subscription.

- **Params:** `{ productId?: string }`
- **Returns:** `{ success: boolean }`

### `auth.api.autumn.getCustomer(params)`
Get customer subscription and usage data.

- **Returns:** `{ products: [...], features: {...}, invoices: [...] }`

### `auth.api.autumn.getBillingPortal(params)`
Get Stripe billing portal URL.

- **Params:** `{ returnUrl?: string }`
- **Returns:** `{ url: string }`

### `auth.api.autumn.createEntity(params)`
Create entities like seats or workspaces.

- **Params:** `{ entities: { id: string, feature_id: string, name: string } }`
- **Returns:** Entity data

### `auth.api.autumn.query(params)`
Query usage data.

- **Params:** `{ featureId?: string, startDate?: string, endDate?: string }`
- **Returns:** Usage data array

For detailed API reference, see [Autumn API Documentation](https://docs.useautumn.com/api-reference/).

## License

This project is licensed under the GNU Affero General Public License v3.0.
