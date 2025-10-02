// MongoDB initialization script for Bloom authentication learning tool

db = db.getSiblingDB('bloom-auth');

// Create collections
db.createCollection('users');
db.createCollection('sessions');
db.createCollection('tokens');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ created_at: 1 });

db.sessions.createIndex({ session_id: 1 }, { unique: true });
db.sessions.createIndex({ user_id: 1 });
db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

db.tokens.createIndex({ token_hash: 1 }, { unique: true });
db.tokens.createIndex({ user_id: 1 });
db.tokens.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
db.tokens.createIndex({ type: 1 });

print('Bloom authentication database initialized successfully!');