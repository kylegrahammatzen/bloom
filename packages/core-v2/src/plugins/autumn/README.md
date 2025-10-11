# Bloom Core V2 - Autumn Plugin

Pricing and billing integration with [Autumn](https://useautumn.com/) - open-source infrastructure layer over Stripe.

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
import { bloomAuth } from '@bloom/core-v2'
import { autumn } from '@bloom/core-v2/plugins/autumn'
import { drizzleAdapter } from '@bloom/core-v2/adapters/drizzle'

const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  plugins: [
    autumn(), // Reads AUTUMN_SECRET_KEY from env
  ],
})
```

Or with custom configuration:

```typescript
import { redisStorage } from '@bloom/core-v2/storage/redis'

const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: redisStorage(redis), // Optional: enables customer caching
  plugins: [
    autumn({
      apiKey: 'am_sk_1234567890',
      apiUrl: 'https://api.useautumn.com/v1',
      customerCacheTTL: 300, // 5 minutes (default)
    }),
  ],
})
```

## Usage

```typescript
'use server'
import { auth } from '@/lib/auth'

export async function sendMessage(text: string) {
  // Check access
  const { data } = await auth.api.autumn.check({
    headers: await headers(),
    body: { featureId: 'messages' },
  })

  if (!data.allowed) {
    throw new Error('Message limit reached')
  }

  // Perform action
  await saveMessage(text)

  // Track usage
  await auth.api.autumn.track({
    headers: await headers(),
    body: { featureId: 'messages', value: 1 },
  })

  return { success: true }
}
```

## API Methods

```typescript
// Check feature access
const { data } = await auth.api.autumn.check({
  headers: await headers(),
  body: { featureId: 'messages' }
})

// Track usage
await auth.api.autumn.track({
  headers: await headers(),
  body: { featureId: 'messages', value: 1 }
})

// Create checkout session
const { url } = await auth.api.autumn.checkout({
  headers: await headers(),
  body: { productId: 'prod_123', successUrl: '/dashboard' }
})

// Get customer data
const customer = await auth.api.autumn.getCustomer({
  headers: await headers()
})

// Get billing portal
const { url } = await auth.api.autumn.getBillingPortal({
  headers: await headers(),
  body: { returnUrl: '/settings' }
})

// Attach product (upgrade/downgrade)
await auth.api.autumn.attach({
  headers: await headers(),
  body: { productId: 'prod_456' }
})

// Cancel subscription
await auth.api.autumn.cancel({
  headers: await headers(),
  body: { productId: 'prod_123' }
})

// Create entities (seats, workspaces)
await auth.api.autumn.createEntity({
  headers: await headers(),
  body: {
    entities: [{ id: 'seat_1', feature_id: 'seats', name: 'Team Member' }]
  }
})

// Query usage data
const usage = await auth.api.autumn.query({
  headers: await headers(),
  body: { featureId: 'messages' }
})
```

For detailed API reference and response types, see [Autumn API Documentation](https://docs.useautumn.com/api-reference/).

## Advanced Configuration

### Custom Customer ID

By default, Autumn uses the logged-in user's ID as the customer ID. You can customize this for organization-based tracking:

```typescript
const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  plugins: [
    autumn({
      // Custom function to extract customer ID from requests
      getCustomerId: async (params) => {
        // Example: Use organization ID instead of user ID
        const session = await auth.api.getSession(params)
        if (!session) throw new Error('Not authenticated')

        const user = await db.user.findById(session.user.id)
        return user.organizationId // Track by org instead of user
      },
    }),
  ],
})
```

### Storage and Caching

When you provide a `storage` option to BloomAuth, the Autumn plugin caches customer existence checks to reduce API calls:

```typescript
import { redisStorage } from '@bloom/core-v2/storage/redis'

const auth = bloomAuth({
  adapter: drizzleAdapter(db),
  storage: redisStorage(redis),
  plugins: [
    autumn({
      customerCacheTTL: 300, // Cache for 5 minutes (default)
    }),
  ],
})
```

**Without storage:** Customer existence is checked on every request (no caching)
**With storage:** Customer existence is cached for the configured TTL

### Clear Customer Cache

If a customer is deleted, you can clear their cache manually:

```typescript
// Clear by customer ID
await auth.api.autumn.clearCustomerCache('cust_123')

// Or clear from authenticated request
await auth.api.autumn.clearCustomerCache({
  headers: await headers()
})
```

## License

This project is licensed under the GNU Affero General Public License v3.0.
