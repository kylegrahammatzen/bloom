<img src="../../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Autumn Plugin

Pricing and billing integration with [Autumn](https://useautumn.com/) - an open-source infrastructure layer over Stripe for subscriptions, usage metering, and feature gating.

## Installation

Built into `@bloom/core` - no additional packages needed.

## Setup

Add your API key to `.env`:

```bash
AUTUMN_SECRET_KEY=am_sk_1234567890
```

Add the plugin:

```typescript
import { bloomAuth } from '@bloom/core';
import { autumn } from '@bloom/core/plugins/autumn';

const auth = bloomAuth({
  plugins: [autumn()],
});
```

## Available Methods

| Category | Method | Description |
|----------|--------|-------------|
| **Access Control** | `check()` | Check if user has access to feature/product |
| | `track()` | Record feature usage for metering |
| **Subscriptions** | `checkout()` | Create Stripe checkout session |
| | `attach()` | Attach product (upgrade/downgrade) |
| | `cancel()` | Cancel subscription |
| **Customer** | `getCustomer()` | Get subscription and usage data |
| | `getBillingPortal()` | Get Stripe billing portal URL |
| **Entities** | `createEntity()` | Create entities (seats, workspaces) |
| | `getEntity()` | Get entity information |
| **Analytics** | `query()` | Query usage data |

For full API reference, see [Autumn API Documentation](https://docs.useautumn.com/api-reference/).

### Access Control

**check** - Check feature/product access:
```typescript
const { data } = await auth.api.autumn.check({
  headers: { cookie },
  body: { featureId: 'messages' },
});
// Returns: { data: { allowed: boolean, remaining?: number, limit?: number } }
```

**track** - Track feature usage:
```typescript
await auth.api.autumn.track({
  headers: { cookie },
  body: { featureId: 'ai_tokens', value: 150 },
});
```

### Subscriptions

**checkout** - Create Stripe checkout session:
```typescript
const { url } = await auth.api.autumn.checkout({
  headers: { cookie },
  body: { productId: 'pro', successUrl: '/success' },
});
```

**attach** - Attach product (upgrade/downgrade):
```typescript
const result = await auth.api.autumn.attach({
  headers: { cookie },
  body: { productId: 'pro' },
});
```

**cancel** - Cancel subscription:
```typescript
await auth.api.autumn.cancel({
  headers: { cookie },
  body: { productId: 'pro' },
});
```

### Customer

**getCustomer** - Get subscription and usage:
```typescript
const customer = await auth.api.autumn.getCustomer({
  headers: { cookie },
});
```

**getBillingPortal** - Get billing portal URL:
```typescript
const { url } = await auth.api.autumn.getBillingPortal({
  headers: { cookie },
  body: { returnUrl: '/settings' },
});
```

### Entities

**createEntity** - Create entities (seats, workspaces):
```typescript
await auth.api.autumn.createEntity({
  headers: { cookie },
  body: {
    entities: { id: 'seat_1', feature_id: 'seats', name: 'John' }
  },
});
```

### Analytics

**query** - Query usage data:
```typescript
const { data } = await auth.api.autumn.query({
  headers: { cookie },
  body: { featureId: 'messages', startDate: '2024-01-01' },
});
```

## Usage Example

Feature gating with usage tracking:

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

  // Perform action...
  await saveMessage(text);

  // Track usage
  await auth.api.autumn.track({
    headers: { cookie },
    body: { featureId: 'messages', value: 1 },
  });

  return { success: true };
}
```
