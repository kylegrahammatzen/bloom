# Database Schema

MongoDB collections for the Bloom authentication server.

## Users

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password_hash: String,
  salt: String,
  created_at: Date,
  updated_at: Date,
  email_verified: Boolean,
  last_login: Date,
  failed_login_attempts: Number,
  locked_until: Date
}
```

## Sessions

```javascript
{
  _id: ObjectId,
  session_id: String (unique),
  user_id: ObjectId,
  expires_at: Date,
  user_agent: String,
  ip_address: String,
  created_at: Date,
  last_accessed: Date
}
```

## Tokens

```javascript
{
  _id: ObjectId,
  token_hash: String (unique),
  type: String, // 'email_verification' or 'password_reset'
  user_id: ObjectId,
  expires_at: Date,
  used_at: Date,
  created_at: Date
}
```

## Indexes

- Users: `email` (unique), `created_at`, `locked_until`
- Sessions: `session_id` (unique), `user_id`, `expires_at` (TTL)
- Tokens: `token_hash` (unique), `user_id`, `expires_at` (TTL)