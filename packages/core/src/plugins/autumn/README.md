<img src="../../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom - Autumn Plugin

Provides pricing and billing integration with [Autumn](https://useautumn.com/), an open-source infrastructure layer over Stripe for managing subscriptions, usage metering, and feature permissions.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Setup](#setup)
- [API Reference](#api-reference)
  - [check](#check)
  - [track](#track)
  - [checkout](#checkout)
  - [attach](#attach)
  - [cancel](#cancel)
  - [getBillingPortal](#getbillingportal)
  - [createEntity](#createentity)
  - [getEntity](#getentity)
  - [query](#query)
  - [getCustomer](#getcustomer)
- [Usage Examples](#usage-examples)
  - [Feature Gating](#feature-gating)
  - [Usage Tracking](#usage-tracking)
  - [Upgrade Flow](#upgrade-flow)
  - [Billing Portal](#billing-portal)
  - [Entity Management](#entity-management)
- [Next.js Integration](#nextjs-integration)
  - [Server Components](#server-components)
  - [Server Actions](#server-actions)
  - [API Routes](#api-routes)
- [Error Handling](#error-handling)

## Features

- Check feature/product access
- Track usage events
- Create Stripe checkout sessions
- Attach/upgrade products without checkout
- Cancel subscriptions
- Access Stripe billing portal
- Create and manage entities (seats, workspaces)
- Query usage data and analytics
- Get customer subscription data
- Automatic customer identification from Bloom sessions

## Installation

The plugin is built into `@bloom/core`. No additional packages needed.

## Setup

### 1. Get Autumn API Key

1. Sign up at [app.useautumn.com](https://app.useautumn.com/)
2. Navigate to "Developer" section
3. Copy your API secret key (starts with `am_sk_`)

### 2. Configure Environment

Add to your `.env`:

```bash
AUTUMN_SECRET_KEY=am_sk_1234567890
```

### 3. Add Plugin to Bloom

```typescript
import { bloomAuth } from '@bloom/core';
import { autumn } from '@bloom/core/plugins/autumn';

const auth = bloomAuth({
  database: mongoose,
  plugins: [
    autumn(), // Uses AUTUMN_SECRET_KEY from environment
  ],
});
```

Or with custom configuration:

```typescript
const auth = bloomAuth({
  plugins: [
    autumn({
      apiKey: 'am_sk_1234567890',
      apiUrl: 'https://api.useautumn.com', // Optional: for self-hosted
    }),
  ],
});
```

## API Reference

### check

Check if the authenticated user has access to a feature or product.

```typescript
auth.api.autumn.check(params: ApiMethodParams): Promise<AutumnCheckResponse>
```

Parameters:

- `featureId` (string, optional): Feature to check access for
- `productId` (string, optional): Product to check access for
- One of `featureId` or `productId` is required

Returns:

```typescript
{
  data: {
    allowed: boolean;
    remaining?: number;  // For usage-based features
    limit?: number;      // For usage-based features
  }
}
```

Example:

```typescript
const { data } = await auth.api.autumn.check({
  headers: request.headers,
  body: {
    featureId: 'messages',
  },
});

if (!data.allowed) {
  return { error: 'Feature not available on your plan' };
}
```

### track

Track usage of a feature for the authenticated user.

```typescript
auth.api.autumn.track(params: ApiMethodParams): Promise<AutumnTrackResponse>
```

Parameters:

- `featureId` (string, required): Feature to track usage for
- `value` (number, optional): Usage amount (default: 1)

Returns:

```typescript
{
  success: boolean;
}
```

Example:

```typescript
await auth.api.autumn.track({
  headers: request.headers,
  body: {
    featureId: 'ai_tokens',
    value: 150, // Number of tokens used
  },
});
```

### checkout

Create a Stripe checkout session for product purchase.

```typescript
auth.api.autumn.checkout(params: ApiMethodParams): Promise<AutumnCheckoutResponse>
```

Parameters:

- `productId` (string, required): Product ID to purchase
- `successUrl` (string, optional): URL to redirect after successful payment
- `cancelUrl` (string, optional): URL to redirect if user cancels

Returns:

```typescript
{
  url: string; // Stripe checkout URL
}
```

Example:

```typescript
const { url } = await auth.api.autumn.checkout({
  headers: request.headers,
  body: {
    productId: 'pro',
    successUrl: 'https://yourapp.com/success',
    cancelUrl: 'https://yourapp.com/pricing',
  },
});

// Redirect user to checkout URL
return { redirectUrl: url };
```

### attach

Attach a product to the customer (upgrade/downgrade without going through Stripe checkout).

```typescript
auth.api.autumn.attach(params: ApiMethodParams): Promise<AutumnAttachResponse>
```

Parameters:

- `productId` (string, required): Product ID to attach
- `successUrl` (string, optional): URL to redirect after successful payment
- `cancelUrl` (string, optional): URL to redirect if user cancels

Returns:

```typescript
{
  success: boolean;
  url?: string;  // Stripe checkout URL if payment required
}
```

Example:

```typescript
const result = await auth.api.autumn.attach({
  headers: request.headers,
  body: {
    productId: 'pro',
    successUrl: 'https://yourapp.com/success',
    cancelUrl: 'https://yourapp.com/pricing',
  },
});

if (result.url) {
  // Payment required - redirect to Stripe checkout
  return { redirectUrl: result.url };
} else {
  // Product attached successfully
  return { success: true };
}
```

### cancel

Cancel a product subscription for the authenticated user.

```typescript
auth.api.autumn.cancel(params: ApiMethodParams): Promise<AutumnCancelResponse>
```

Parameters:

- `productId` (string, optional): Product ID to cancel (cancels all if not provided)

Returns:

```typescript
{
  success: boolean;
}
```

Example:

```typescript
await auth.api.autumn.cancel({
  headers: request.headers,
  body: {
    productId: 'pro', // Optional - cancels all if not provided
  },
});
```

### getBillingPortal

Get Stripe billing portal URL for the authenticated user.

```typescript
auth.api.autumn.getBillingPortal(params: ApiMethodParams): Promise<AutumnBillingPortalResponse>
```

Parameters:

- `returnUrl` (string, optional): URL to redirect back to after managing billing

Returns:

```typescript
{
  url: string;  // Stripe billing portal URL
}
```

Example:

```typescript
const { url } = await auth.api.autumn.getBillingPortal({
  headers: request.headers,
  body: {
    returnUrl: 'https://yourapp.com/settings',
  },
});

// Redirect user to billing portal
return { redirectUrl: url };
```

### createEntity

Create an entity (seats, workspaces, etc.) for the authenticated user.

```typescript
auth.api.autumn.createEntity(params: ApiMethodParams): Promise<AutumnEntityResponse>
```

Parameters:

- `entityFeatureId` (string, required): Feature ID for the entity type
- `data` (object, optional): Additional metadata for the entity

Returns:

```typescript
{
  id: string;
  feature_id: string;
  customer_id: string;
  data?: Record<string, any>;
}
```

Example:

```typescript
const entity = await auth.api.autumn.createEntity({
  headers: request.headers,
  body: {
    entityFeatureId: 'seats',
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
    },
  },
});

console.log(entity.id);
```

### getEntity

Get entity information by ID.

```typescript
auth.api.autumn.getEntity(params: ApiMethodParams): Promise<AutumnEntityResponse>
```

Parameters:

- `entityId` (string, required): Entity ID to retrieve

Returns:

```typescript
{
  id: string;
  feature_id: string;
  customer_id: string;
  data?: Record<string, any>;
}
```

Example:

```typescript
const entity = await auth.api.autumn.getEntity({
  headers: request.headers,
  body: {
    entityId: 'entity_123',
  },
});

console.log(entity.data);
```

### query

Query usage data for the authenticated user.

```typescript
auth.api.autumn.query(params: ApiMethodParams): Promise<AutumnQueryResponse>
```

Parameters:

- `featureId` (string, optional): Feature ID to query (queries all if not provided)
- `startDate` (string, optional): Start date for query (ISO format)
- `endDate` (string, optional): End date for query (ISO format)

Returns:

```typescript
{
  data: {
    feature_id?: string;
    usage: number;
    limit?: number;
    period_start?: string;
    period_end?: string;
  }[];
}
```

Example:

```typescript
const { data } = await auth.api.autumn.query({
  headers: request.headers,
  body: {
    featureId: 'messages',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
});

data.forEach(usage => {
  console.log(`Feature: ${usage.feature_id}, Usage: ${usage.usage}`);
});
```

### getCustomer

Get the authenticated user's subscription and usage data.

```typescript
auth.api.autumn.getCustomer(params: ApiMethodParams): Promise<any>
```

Example:

```typescript
const customer = await auth.api.autumn.getCustomer({
  headers: request.headers,
});

console.log(customer.plan);
console.log(customer.usage);
```

## Usage Examples

### Feature Gating

Check access before allowing a feature:

```typescript
// Check if user has access to messages feature
const { data } = await auth.api.autumn.check({
  headers: request.headers,
  body: { featureId: 'api_calls' },
});

if (!data.allowed) {
  return res.status(403).json({ error: 'API limit reached' });
}

// Perform the action
await performApiCall();

// Track usage
await auth.api.autumn.track({
  headers: request.headers,
  body: { featureId: 'api_calls', value: 1 },
});
```

### Usage Tracking

Track feature usage with values:

```typescript
// Track AI token usage
await auth.api.autumn.track({
  headers: request.headers,
  body: {
    featureId: 'ai_tokens',
    value: 1500, // Number of tokens consumed
  },
});
```

### Upgrade Flow

Create a checkout session for upgrading:

```typescript
// Generate checkout URL
const { url } = await auth.api.autumn.checkout({
  headers: request.headers,
  body: {
    productId: 'pro',
    successUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?upgraded=true`,
    cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  },
});

// Redirect to Stripe
return res.redirect(url);
```

### Billing Portal

Open Stripe billing portal:

```typescript
const { url } = await auth.api.autumn.getBillingPortal({
  headers: request.headers,
  body: {
    returnUrl: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
  },
});

return res.redirect(url);
```

### Entity Management

Create and manage entities like seats:

```typescript
// Create a new seat
const seat = await auth.api.autumn.createEntity({
  headers: request.headers,
  body: {
    entityFeatureId: 'seats',
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'member',
    },
  },
});

// Get seat information
const entity = await auth.api.autumn.getEntity({
  headers: request.headers,
  body: {
    entityId: seat.id,
  },
});
```

## Next.js Integration

### Server Components

Use the plugin directly in server components:

```typescript
import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const { data } = await auth.api.autumn.check({
    headers: { cookie: cookieHeader },
    body: { featureId: 'advanced_analytics' },
  });

  if (!data.allowed) {
    return <UpgradePrompt />;
  }

  return <AdvancedAnalytics />;
}
```

### Server Actions

Create server actions for client-side usage:

```typescript
'use server';

import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function sendMessage(message: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // Check access
  const { data } = await auth.api.autumn.check({
    headers: { cookie: cookieHeader },
    body: { featureId: 'messages' },
  });

  if (!data.allowed) {
    throw new Error('Message limit reached');
  }

  // Send message logic here...

  // Track usage
  await auth.api.autumn.track({
    headers: { cookie: cookieHeader },
    body: { featureId: 'messages', value: 1 },
  });

  return { success: true };
}
```

### API Routes

Create API routes for custom endpoints:

```typescript
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const headers = Object.fromEntries(request.headers.entries());

    const customer = await auth.api.autumn.getCustomer({
      headers,
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
```

## Error Handling

The plugin throws standard Bloom API errors:

```typescript
try {
  const { data } = await auth.api.autumn.check({
    headers: request.headers,
    body: { featureId: 'messages' },
  });
} catch (error) {
  if (error.code === 'NOT_AUTHENTICATED') {
    // User not logged in
  } else if (error.code === 'INVALID_INPUT') {
    // Missing required parameters
  } else {
    // Autumn API error
    console.error(error.message);
  }
}
```

## How It Works

1. Customer Identification: Plugin extracts user ID from Bloom session cookie
2. API Communication: Makes authenticated requests to Autumn API
3. Access Control: Returns real-time access/usage data
4. Usage Tracking: Records feature usage for metering
5. Checkout: Generates Stripe checkout URLs for upgrades

## Architecture

```
┌─────────────────┐
│   User Request  │
│  (with session) │
└────────┬────────┘
         │
         ├─ Extract userId from cookie
         │
    ┌────▼────────────────┐
    │  Autumn Plugin      │
    │  (Server-side)      │
    └────────┬────────────┘
             │
        ┌────▼────┐
        │ Autumn  │
        │   API   │
        └────┬────┘
             │
        ┌────▼────┐
        │ Stripe  │
        └─────────┘
```

## License

This plugin is part of the Bloom project and follows the same license (AGPL-3.0).
