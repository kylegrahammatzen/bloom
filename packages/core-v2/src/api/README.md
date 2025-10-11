# Bloom Core V2 - API Reference

Server-side API methods for authentication operations.

---

## getSession

Get the current user session from framework headers.

```typescript
const session = await auth.api.getSession({
  headers: await headers()
})

if (session) {
  console.log(session.user.email)
  console.log(session.session.id)
}
```

**Returns:** `{ user: User; session: Session } | null`

---

## register

Register a new user with email/password.

**HTTP:** `POST /auth/register`

```typescript
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    name: 'John Doe'
  })
})
```

**Request:**
- `email` (string, required)
- `password` (string, required)
- `name` (string, optional)

**Response:** `{ user: User; session: Session }`

---

## login

Login user with email/password.

**HTTP:** `POST /auth/login`

```typescript
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  })
})
```

**Request:**
- `email` (string, required)
- `password` (string, required)

**Response:** `{ user: User; session: Session }`

---

## logout

Logout current session.

**HTTP:** `POST /auth/logout`

```typescript
const response = await fetch('/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
```

**Response:** `{ success: true }`

---

## getSessions

Get all sessions for the current user.

**HTTP:** `GET /auth/sessions`

```typescript
const response = await fetch('/auth/sessions', {
  credentials: 'include'
})
```

**Response:** `{ sessions: Session[] }`

---

## deleteSession

Delete a specific session by ID.

**HTTP:** `DELETE /auth/sessions/:id`

```typescript
const response = await fetch('/auth/sessions/abc123', {
  method: 'DELETE',
  credentials: 'include'
})
```

**Response:** `{ success: true, message: 'Session revoked successfully' }`

---

## deleteAllSessions

Delete all sessions except the current one.

**HTTP:** `DELETE /auth/sessions`

```typescript
const response = await fetch('/auth/sessions', {
  method: 'DELETE',
  credentials: 'include'
})
```

**Response:** `{ success: true, message: '3 session(s) revoked successfully', count: 3 }`

---

## sendVerificationEmail

Send email verification token.

**HTTP:** `POST /auth/send-verification-email`

```typescript
const response = await fetch('/auth/send-verification-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com'
  })
})
```

**Request:**
- `email` (string, required)

**Response:** `{ token: string }` (token should be emailed to user)

---

## verifyEmail

Verify email with token.

**HTTP:** `POST /auth/verify-email`

```typescript
const response = await fetch('/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'verification-token-here'
  })
})
```

**Request:**
- `token` (string, required)

**Response:** `{ success: true }`

---

## requestPasswordReset

Request password reset token.

**HTTP:** `POST /auth/request-password-reset`

```typescript
const response = await fetch('/auth/request-password-reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com'
  })
})
```

**Request:**
- `email` (string, required)

**Response:** `{ token: string }` (token should be emailed to user)

---

## resetPassword

Reset password with token.

**HTTP:** `POST /auth/reset-password`

```typescript
const response = await fetch('/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'reset-token-here',
    password: 'newsecurepassword'
  })
})
```

**Request:**
- `token` (string, required)
- `password` (string, required)

**Response:** `{ success: true }`
