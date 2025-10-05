<img src=".github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom - Security

Bloom implements modern security best practices for authentication and session management. This document explains the security mechanisms and design decisions.

## Password Security

### Argon2id Hashing

Bloom uses **Argon2id** instead of bcrypt for password hashing. Argon2id won the 2015 Password Hashing Competition and provides superior security against modern attack vectors.

**Why Argon2id over bcrypt?**

| Feature | bcrypt | Argon2id |
|---------|--------|----------|
| **Year** | 1999 | 2015 |
| **Memory-hard** | No (~4 KB) | Yes (19 MB configurable) |
| **GPU resistance** | Moderate | Strong |
| **ASIC resistance** | Weak | Strong |
| **Side-channel resistance** | Moderate | Strong |
| **Configurable** | Work factor only | Memory + Time + Parallelism |

**Bloom's Argon2id Configuration:**

```typescript
const ARGON2_CONFIG = {
  type: argon2.argon2id,      // Hybrid mode (best of argon2i + argon2d)
  memoryCost: 19 * 1024,      // 19 MB RAM per hash
  timeCost: 2,                // 2 iterations
  parallelism: 1,             // 1 thread
  hashLength: 32,             // 32-byte output (256 bits)
};
```

**Attack Resistance:**

- **Memory-hard**: Requires 19 MB RAM per hash attempt, making GPU/ASIC attacks ~4,750x more expensive than bcrypt
- **Tunable**: Can increase memory/time cost as hardware improves
- **Side-channel resistant**: Protected against cache-timing attacks

**Performance Impact:**

On modern hardware, Argon2id with these settings can hash ~10,000 passwords per second on a GPU, compared to ~100,000 for bcrypt. This 10x slowdown for attackers provides significant security improvement while remaining fast enough for legitimate authentication (< 100ms per hash).

### Salt Generation

Every password receives a **unique random salt** to prevent rainbow table attacks and ensure identical passwords produce different hashes.

**How it works:**

```typescript
// Registration - Generate new salt
const salt = randomBytes(32);  // 32 bytes (256 bits) of entropy
const hash = await argon2.hash(password, { salt });

// Store both in database
UserCredentials.create({
  password_hash: hash,
  salt: salt.toString('base64'),
});
```

```typescript
// Login - Use existing salt
const credentials = await UserCredentials.findOne({ user_id });
const saltBuffer = Buffer.from(credentials.salt, 'base64');
const newHash = await argon2.hash(password, { salt: saltBuffer });

// Constant-time comparison
return timingSafeEqual(Buffer.from(credentials.password_hash), Buffer.from(newHash));
```

**Key points:**

- Salt is generated with `crypto.randomBytes()` (cryptographically secure)
- Each user gets a unique salt, even with identical passwords
- Salt is stored in plaintext alongside the hash (not a secret)
- Salt never changes unless the password changes
- Same password + same salt = same hash (deterministic)

**Why this works:**

Without salt, two users with password "hello" would have identical hashes. An attacker could precompute hashes for common passwords (rainbow tables) and crack many accounts at once.

With salt, two users with password "hello" have different hashes because different salts are used. Rainbow tables become useless because the attacker needs a different table for every possible salt value (2^256 possibilities).

### Password Validation

Bloom implements multi-layer password validation to prevent dictionary attacks while maintaining good UX.

**Validation Layers:**

1. **Complexity Requirements** (Zod schema validation)
   - 8-256 characters
   - At least one lowercase letter
   - At least one uppercase letter
   - At least one number
   - At least one special character

2. **Common Password Blacklist** (80+ entries)
   - Rejects common passwords that pass complexity requirements
   - Examples: `Password123!`, `Welcome123!`, `Admin@123`, `Qwerty123!`
   - Case-insensitive matching
   - See `packages/core/src/utils/common-passwords.ts`

3. **Entropy Validation** (50+ bits required)
   - Calculates password randomness based on character set and length
   - Formula: `entropy = length × log2(charset_size)`
   - Charset size: 26 (lowercase) + 26 (uppercase) + 10 (digits) + 32 (special chars) = 94
   - Example: 12-char password with all character types = ~79 bits entropy ✅
   - Example: 8-char password with predictable pattern = ~40 bits entropy ❌

**Error Messages:**

Bloom provides clear, actionable error messages:

- "Password must be at least 8 characters"
- "This password is too common and appears in breach databases. Please choose a more unique password."
- "Password is not random enough. Try using a longer password with more varied characters."

## Session Security

### Cookie-based Sessions

Bloom uses cookie-based sessions with server-side storage in Redis or MongoDB.

**Session Architecture:**

```typescript
// Generate session
const sessionId = randomBytes(32).toString('hex');  // 256 bits entropy

// Store in database
Session.create({
  session_id: sessionId,
  user_id: user._id,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ip_address: ctx.request.ip,
  user_agent: ctx.request.userAgent,
  browser: deviceInfo.browser,
  os: deviceInfo.os,
  device_type: deviceInfo.deviceType,
});

// Set cookie
response.cookies.set('bloom.sid', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
});
```

**Features:**

- **Instant revocation**: Sessions can be deleted from Redis/MongoDB for immediate logout
- **Multi-session management**: Users can view all active sessions and revoke specific devices
- **Compact cookies**: Only session ID is transmitted (32 bytes)
- **Sliding window expiration**: Sessions can be extended on user activity
- **Device tracking**: Stores IP address, browser, OS, and device type per session

### Secure Token Generation

All tokens in Bloom use cryptographically secure random generation.

**Token Types:**

| Token Type | Entropy | Format | Lifetime |
|------------|---------|--------|----------|
| Session ID | 256 bits | Hex (64 chars) | 7 days |
| Email verification | 120 bits | Base32 (24 chars) | 24 hours |
| Password reset | 120 bits | Base32 (24 chars) | 1 hour |

**Generation:**

```typescript
// Session ID - 256 bits
export function generateSessionId(): string {
  const bytes = randomBytes(32);  // 32 bytes = 256 bits
  return bytes.toString('hex');   // 64 hex characters
}

// Verification/reset tokens - 120 bits
export function generateSecureToken(): string {
  const bytes = randomBytes(15);  // 15 bytes = 120 bits
  return encodeBase32(bytes);     // 24 Base32 characters
}
```

**Token Storage:**

Tokens are hashed before storage to prevent database leaks:

```typescript
// Hash token with SHA-256
const tokenHash = createHash('sha256').update(token).digest('hex');

// Store hash, not plaintext token
Token.create({
  token_hash: tokenHash,
  type: 'email_verification',
  user_id: user._id,
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
});

// Verification compares hashes
const submitted = hashToken(submittedToken);
const stored = await Token.findOne({ token_hash: submitted });
```

**Why hash tokens?**

If an attacker gains read access to the database, they cannot use the tokens because only the hash is stored. The plaintext token is only known by the legitimate user (sent via email).

## Attack Prevention

### Rate Limiting

Bloom implements IP-based rate limiting to prevent brute force attacks.

**Default Limits:**

| Endpoint | Max Requests | Window | Consequence |
|----------|-------------|---------|-------------|
| Login | 10 | 60 seconds | 429 Too Many Requests |
| Registration | 10 | 60 seconds | 429 Too Many Requests |
| Password Reset | 10 | 60 seconds | 429 Too Many Requests |
| Email Verification | 10 | 60 seconds | 429 Too Many Requests |

**Implementation:**

```typescript
// Redis key: rateLimit:emailVerification:192.168.1.1
const key = `rateLimit:${action}:${ipAddress}`;
const count = await redis.incr(key);

if (count === 1) {
  await redis.expire(key, window / 1000);
}

if (count > max) {
  return new APIError(APIErrorCode.RATE_LIMITED).toResponse();
}
```

**Account Locking:**

After multiple failed login attempts, accounts are temporarily locked:

```typescript
// Increment on failed login
if (!isValidPassword) {
  await credentials.incrementLoginAttempts();
  // After 5 attempts, account locked for 15 minutes
}

// Reset on successful login
await credentials.resetLoginAttempts();
```

**Why IP-based?**

- **User-based**: Allows distributed attacks (create many accounts, attack from each)
- **IP-based**: Limits attacks from single source, even across multiple accounts

**Limitations:**

- Users behind shared IPs (corporate networks, VPNs) may hit limits faster
- Attackers can use distributed IPs to bypass
- Trade-off between security and UX

### Dictionary Attack Protection

Even with Argon2id hashing, weak passwords are vulnerable to dictionary attacks.

**Bloom's Defense Layers:**

1. **Common Password Blacklist**
   - 80+ common passwords that meet complexity requirements
   - Updated based on real-world breach data
   - Examples: `Password123!`, `Welcome123!`, `Admin@123`, `Letmein1!`

2. **Entropy Validation**
   - Calculates randomness: `entropy = length × log2(charset_size)`
   - Requires minimum 50 bits of entropy
   - Prevents predictable patterns like `Abc12345!`

3. **Rate Limiting**
   - Even if password is weak, rate limiting slows attacks
   - 10 attempts per 60 seconds = max 14,400 attempts/day per IP

**Attack Scenarios:**

| Password | Complexity | Blacklist | Entropy | Result |
|----------|-----------|-----------|---------|--------|
| `password` | Fail | N/A | N/A | Rejected: complexity |
| `Password123!` | Pass | Blacklisted | N/A | Rejected: common |
| `Abc12345!` | Pass | Pass | ~40 bits | Rejected: low entropy |
| `kR7$mP9nX#2wQ5vL` | Pass | Pass | ~104 bits | Accepted |

### Timing Attack Protection

Bloom uses constant-time comparison to prevent timing attacks during password verification.

**Vulnerable Code:**

```typescript
// DON'T DO THIS
if (hash === storedHash) {
  return true;
}
```

This returns faster when hashes differ at the beginning vs the end. An attacker can measure response times to guess the hash character by character.

**Secure Code:**

```typescript
// Constant-time comparison
return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
```

This always takes the same time regardless of where strings differ, preventing timing attacks.
