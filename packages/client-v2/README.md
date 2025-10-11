# @bloom/client-v2

Framework-agnostic client library for Bloom Auth V2.

## Installation

```bash
pnpm add @bloom/client-v2
```

## Usage

### Basic Setup

```typescript
import { bloomClient } from '@bloom/client-v2'

const client = bloomClient({
  baseUrl: '/auth', // default
  credentials: 'include', // for cookies
})
```

### With Plugins

```typescript
import { bloomClient, autumnClient } from '@bloom/client-v2'

const client = bloomClient({
  baseUrl: '/auth',
  credentials: 'include',
  plugins: [
    autumnClient(), // Adds billing methods
  ],
})

// Now you can use autumn methods
const { data } = await client.autumn.check({ featureId: 'messages' })
```

### Authentication

```typescript
// Register
const { data, error } = await client.auth.register({
  email: 'user@example.com',
  password: 'securepassword',
  name: 'John Doe',
})

// Login
const { data, error } = await client.auth.login({
  email: 'user@example.com',
  password: 'securepassword',
})

// Logout
await client.auth.logout()

// Get current session
const { data } = await client.auth.getSession()
if (data) {
  console.log(data.user.email)
}
```

### Session Management

```typescript
// Get all sessions
const { data } = await client.auth.getSessions()

// Delete a specific session
await client.auth.deleteSession('session-id')

// Delete all sessions (except current)
await client.auth.deleteAllSessions()
```

### Email Verification

```typescript
// Send verification email
await client.auth.sendVerificationEmail()

// Verify email with token
await client.auth.verifyEmail({ token: 'verification-token' })
```

### Password Reset

```typescript
// Request password reset
await client.auth.requestPasswordReset({
  email: 'user@example.com'
})

// Reset password with token
await client.auth.resetPassword({
  token: 'reset-token',
  password: 'newpassword'
})
```

## Plugins

### Autumn (Stripe Billing)

The Autumn plugin adds Stripe billing integration. Add it when creating your client:

```typescript
import { bloomClient, autumnClient } from '@bloom/client-v2'

const client = bloomClient({
  plugins: [autumnClient()],
})

// Check feature access
const { data } = await client.autumn.check({
  featureId: 'messages',
})

if (data?.allowed) {
  // User has access
}

// Track usage
await client.autumn.track({
  featureId: 'messages',
  value: 1,
})

// Create checkout session
const { data } = await client.autumn.checkout({
  productId: 'prod_123',
  successUrl: '/dashboard',
})

if (data) {
  window.location.href = data.url
}

// Get customer data
const { data } = await client.autumn.getCustomer()

// Get billing portal
const { data } = await client.autumn.getBillingPortal({
  returnUrl: '/settings',
})
```

### Creating Custom Plugins

You can create your own plugins to extend the client:

```typescript
import type { ClientPlugin } from '@bloom/client-v2'

const myPlugin = (): ClientPlugin => {
  return {
    id: 'my-plugin',
    getActions: (fetchFn) => {
      return {
        myFeature: {
          myMethod: async (body: { foo: string }) => {
            return fetchFn({
              path: '/my-plugin/my-method',
              options: {
                method: 'POST',
                body: JSON.stringify(body),
              },
            })
          },
        },
      }
    },
  }
}

// Use it
const client = bloomClient({
  plugins: [myPlugin()],
})

await client.myFeature.myMethod({ foo: 'bar' })
```

## Configuration

### Custom Headers

```typescript
const client = bloomClient({
  headers: {
    'X-Custom-Header': 'value',
  },
})
```

### Error Handling

```typescript
const client = bloomClient({
  onError: (error) => {
    console.error('Bloom error:', error.message)
    // Show toast notification, etc.
  },
  onSuccess: (data) => {
    console.log('Success:', data)
  },
})
```

### Response Format

All methods return a standardized response:

```typescript
type BloomResponse<T> = {
  data: T | null
  error: BloomError | null
}

type BloomError = {
  code: string        // Error code (e.g., 'UNAUTHENTICATED')
  message: string     // Human-readable message
  status: number      // HTTP status code
}
```

## TypeScript

### Available Type Exports

```typescript
import type {
  // Client types
  BloomClient,
  BloomResponse,
  BloomError,
  ClientConfig,
  ClientPlugin,

  // Auth types
  AuthMethods,
  User,
  Session,

  // Plugin types
  AutumnMethods,
} from '@bloom/client-v2'
```

### Usage Example

```typescript
import type { User, Session, BloomResponse } from '@bloom/client-v2'

const { data, error }: BloomResponse<{ user: User; session: Session }> =
  await client.auth.login({ email, password })

if (data) {
  const user: User = data.user
  const session: Session = data.session
}
```

## Framework Integration

This client works with **any JavaScript framework** (React, Vue, Svelte, Solid, vanilla JS). No framework-specific wrappers needed - just import and use!

```typescript
// React
function LoginForm() {
  const [email, setEmail] = useState('')
  const login = async () => {
    const { data, error } = await client.auth.login({ email, password })
    if (error) console.error(error.message)
  }
  // ...
}

// Vue
const email = ref('')
const login = async () => {
  const { data, error } = await client.auth.login({
    email: email.value,
    password
  })
}

// Svelte
let email = ''
async function login() {
  const { data, error } = await client.auth.login({ email, password })
}
```

## License

GNU Affero General Public License v3.0
