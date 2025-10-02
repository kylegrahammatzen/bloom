"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bloomAuth = bloomAuth;
const models_1 = require("./models");
const crypto_1 = require("./utils/crypto");
const rateLimit_1 = require("./utils/rateLimit");
const rou3_1 = require("rou3");
function bloomAuth(config = {}) {
    const defaultConfig = {
        session: {
            expiresIn: 7 * 24 * 60 * 60 * 1000,
            cookieName: 'bloom.sid',
            ...config.session,
        },
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
            ...config.emailAndPassword,
        },
        rateLimit: {
            enabled: true,
            ...config.rateLimit,
        },
        callbacks: config.callbacks || {},
        plugins: config.plugins || [],
    };
    const auth = {
        config: defaultConfig,
        handler: createHandler(defaultConfig),
        getSession: async (sessionId) => {
            const session = await models_1.Session.findOne({ session_id: sessionId });
            if (!session)
                return null;
            const user = await models_1.User.findById(session.user_id);
            if (!user)
                return null;
            return {
                id: session.session_id,
                userId: session.user_id.toString(),
                expiresAt: session.expires_at,
                createdAt: session.created_at,
                lastAccessedAt: session.last_accessed,
                ipAddress: session.ip_address,
                userAgent: session.user_agent,
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    email_verified: user.email_verified,
                    name: user.name,
                    image: user.image,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                    last_login: user.last_login,
                },
            };
        },
        verifySession: async (sessionId) => {
            return auth.getSession(sessionId);
        },
    };
    if (defaultConfig.plugins) {
        for (const plugin of defaultConfig.plugins) {
            if (plugin.init) {
                plugin.init(auth);
            }
        }
    }
    return auth;
}
function createHandler(config) {
    const router = (0, rou3_1.createRouter)();
    // Define auth routes
    (0, rou3_1.addRoute)(router, 'POST', '/register', async (ctx) => handleRegister(ctx, config));
    (0, rou3_1.addRoute)(router, 'POST', '/login', async (ctx) => handleLogin(ctx, config));
    (0, rou3_1.addRoute)(router, 'POST', '/logout', async (ctx) => handleLogout(ctx));
    (0, rou3_1.addRoute)(router, 'GET', '/me', async (ctx) => handleGetSession(ctx));
    (0, rou3_1.addRoute)(router, 'POST', '/verify-email', async (ctx) => handleVerifyEmail(ctx));
    (0, rou3_1.addRoute)(router, 'POST', '/request-password-reset', async (ctx) => handleRequestPasswordReset(ctx, config));
    (0, rou3_1.addRoute)(router, 'POST', '/reset-password', async (ctx) => handleResetPassword(ctx));
    (0, rou3_1.addRoute)(router, 'DELETE', '/account', async (ctx) => handleDeleteAccount(ctx));
    return async (ctx) => {
        const method = ctx.request.method;
        const path = ctx.request.path || ctx.request.url || '';
        const normalizedPath = path.replace(/^\/api\/auth/, '');
        try {
            const match = (0, rou3_1.findRoute)(router, method, normalizedPath);
            if (!match) {
                return {
                    status: 404,
                    body: { error: { message: 'Endpoint not found' } },
                };
            }
            const handler = match.data;
            return await handler(ctx);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Internal server error');
            if (config.callbacks?.onError) {
                await config.callbacks.onError({
                    error: err,
                    endpoint: normalizedPath,
                    method,
                    path,
                    userId: ctx.session?.userId,
                    ip: ctx.request.ip
                });
            }
            return {
                status: 500,
                body: { error: { message: err.message } },
            };
        }
    };
}
async function handleRegister(ctx, config) {
    const { email, password } = ctx.request.body;
    // Rate limiting
    if (config.rateLimit?.enabled && config.rateLimit.registration) {
        const rateLimitConfig = config.rateLimit.registration;
        if (rateLimitConfig.max && rateLimitConfig.window) {
            const rateLimitKey = `register:${ctx.request.ip || 'unknown'}`;
            const rateLimit = (0, rateLimit_1.checkRateLimit)(rateLimitKey, {
                max: rateLimitConfig.max,
                window: rateLimitConfig.window
            });
            if (rateLimit.isLimited) {
                if (config.callbacks?.onRateLimit) {
                    await config.callbacks.onRateLimit({
                        ip: ctx.request.ip || 'unknown',
                        endpoint: '/register',
                        limit: { max: rateLimitConfig.max, window: rateLimitConfig.window },
                        userId: ctx.session?.userId
                    });
                }
                return {
                    status: 429,
                    body: {
                        error: {
                            message: 'Too many registration attempts. Please try again later.',
                            resetAt: rateLimit.resetAt
                        }
                    },
                };
            }
            (0, rateLimit_1.trackAttempt)(rateLimitKey);
        }
    }
    if (!email || !(0, crypto_1.isValidEmail)(email)) {
        return {
            status: 400,
            body: { error: { message: 'Invalid email format' } },
        };
    }
    if (!password || password.length < 8 || password.length > 256) {
        return {
            status: 400,
            body: { error: { message: 'Password must be between 8 and 256 characters' } },
        };
    }
    const normalizedEmail = (0, crypto_1.normalizeEmail)(email);
    const passwordCheck = (0, crypto_1.checkPasswordStrength)(password);
    if (!passwordCheck.isStrong) {
        return {
            status: 400,
            body: {
                error: {
                    message: 'Password does not meet security requirements',
                    details: passwordCheck.issues,
                },
            },
        };
    }
    const existingUser = await models_1.User.findOne({ email: normalizedEmail });
    if (existingUser) {
        return {
            status: 409,
            body: { error: { message: 'An account with this email already exists' } },
        };
    }
    const user = new models_1.User({ email: normalizedEmail });
    await user.save();
    const { hash, salt } = await (0, crypto_1.hashPassword)(password);
    const credentials = new models_1.UserCredentials({
        user_id: user._id,
        password_hash: hash,
        salt,
    });
    await credentials.save();
    const token = (0, crypto_1.generateSecureToken)();
    const tokenHash = (0, crypto_1.hashToken)(token);
    const verificationToken = new models_1.Token({
        token_hash: tokenHash,
        type: 'email_verification',
        user_id: user._id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await verificationToken.save();
    const sessionId = (0, crypto_1.generateSessionId)();
    const session = new models_1.Session({
        session_id: sessionId,
        user_id: user._id,
        expires_at: new Date(Date.now() + (config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000)),
        user_agent: ctx.request.userAgent || ctx.request.headers?.['user-agent'],
        ip_address: ctx.request.ip,
    });
    await session.save();
    const responseData = {
        message: 'Registration successful',
        user: {
            id: user._id,
            email: user.email,
            email_verified: user.email_verified,
            name: user.name,
            image: user.image,
            created_at: user.created_at,
            updated_at: user.updated_at,
        },
        session: {
            id: session.session_id,
            userId: session.user_id.toString(),
            expiresAt: session.expires_at,
            createdAt: session.created_at,
            lastAccessedAt: session.last_accessed,
            ipAddress: session.ip_address,
            userAgent: session.user_agent,
        },
    };
    if (config.callbacks?.onRegister) {
        await config.callbacks.onRegister({ user: responseData.user, session: responseData.session });
    }
    return {
        status: 201,
        body: responseData,
        sessionData: {
            userId: user._id.toString(),
            sessionId: sessionId,
        },
    };
}
async function handleLogin(ctx, config) {
    const { email, password } = ctx.request.body;
    // Rate limiting
    if (config.rateLimit?.enabled && config.rateLimit.login) {
        const rateLimitConfig = config.rateLimit.login;
        if (rateLimitConfig.max && rateLimitConfig.window) {
            const rateLimitKey = `login:${ctx.request.ip || 'unknown'}`;
            const rateLimit = (0, rateLimit_1.checkRateLimit)(rateLimitKey, {
                max: rateLimitConfig.max,
                window: rateLimitConfig.window
            });
            if (rateLimit.isLimited) {
                if (config.callbacks?.onRateLimit) {
                    await config.callbacks.onRateLimit({
                        ip: ctx.request.ip || 'unknown',
                        endpoint: '/login',
                        limit: { max: rateLimitConfig.max, window: rateLimitConfig.window },
                        userId: ctx.session?.userId
                    });
                }
                return {
                    status: 429,
                    body: {
                        error: {
                            message: 'Too many login attempts. Please try again later.',
                            resetAt: rateLimit.resetAt
                        }
                    },
                };
            }
            (0, rateLimit_1.trackAttempt)(rateLimitKey);
        }
    }
    if (!email || !password) {
        return {
            status: 400,
            body: { error: { message: 'Invalid credentials' } },
        };
    }
    const normalizedEmail = (0, crypto_1.normalizeEmail)(email);
    const user = await models_1.User.findOne({ email: normalizedEmail });
    if (!user) {
        return {
            status: 401,
            body: { error: { message: 'Invalid credentials' } },
        };
    }
    const credentials = await models_1.UserCredentials.findOne({ user_id: user._id });
    if (!credentials) {
        return {
            status: 401,
            body: { error: { message: 'Invalid credentials' } },
        };
    }
    if (credentials.isAccountLocked()) {
        return {
            status: 423,
            body: { error: { message: 'Account is temporarily locked' } },
        };
    }
    const isValidPassword = await (0, crypto_1.verifyPassword)(password, credentials.password_hash, credentials.salt);
    if (!isValidPassword) {
        await credentials.incrementLoginAttempts();
        return {
            status: 401,
            body: { error: { message: 'Invalid credentials' } },
        };
    }
    await credentials.resetLoginAttempts();
    user.last_login = new Date();
    await user.save();
    const sessionId = (0, crypto_1.generateSessionId)();
    const newSession = new models_1.Session({
        session_id: sessionId,
        user_id: user._id,
        expires_at: new Date(Date.now() + (config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000)),
        user_agent: ctx.request.userAgent || ctx.request.headers?.['user-agent'],
        ip_address: ctx.request.ip,
    });
    await newSession.save();
    const responseData = {
        message: 'Login successful',
        user: {
            id: user._id,
            email: user.email,
            email_verified: user.email_verified,
            name: user.name,
            image: user.image,
            created_at: user.created_at,
            updated_at: user.updated_at,
            last_login: user.last_login,
        },
        session: {
            id: newSession.session_id,
            userId: newSession.user_id.toString(),
            expiresAt: newSession.expires_at,
            createdAt: newSession.created_at,
            lastAccessedAt: newSession.last_accessed,
            ipAddress: newSession.ip_address,
            userAgent: newSession.user_agent,
        },
    };
    if (config.callbacks?.onSignIn) {
        await config.callbacks.onSignIn({ user: responseData.user, session: responseData.session });
    }
    return {
        status: 200,
        body: responseData,
        sessionData: {
            userId: user._id.toString(),
            sessionId: sessionId,
        },
    };
}
async function handleLogout(ctx) {
    if (ctx.session?.sessionId) {
        await models_1.Session.deleteOne({ session_id: ctx.session.sessionId });
    }
    return {
        status: 200,
        body: { message: 'Logout successful' },
        clearSession: true,
    };
}
async function handleGetSession(ctx) {
    if (!ctx.session?.userId) {
        return {
            status: 401,
            body: { error: { message: 'Not authenticated' } },
        };
    }
    const user = await models_1.User.findById(ctx.session.userId);
    if (!user) {
        return {
            status: 404,
            body: { error: { message: 'User not found' } },
        };
    }
    const userSession = await models_1.Session.findOne({ session_id: ctx.session.sessionId });
    if (!userSession) {
        return {
            status: 404,
            body: { error: { message: 'Session not found' } },
        };
    }
    return {
        status: 200,
        body: {
            user: {
                id: user._id,
                email: user.email,
                email_verified: user.email_verified,
                name: user.name,
                image: user.image,
                created_at: user.created_at,
                updated_at: user.updated_at,
                last_login: user.last_login,
            },
            session: {
                id: userSession.session_id,
                userId: userSession.user_id.toString(),
                expiresAt: userSession.expires_at,
                createdAt: userSession.created_at,
                lastAccessedAt: userSession.last_accessed,
                ipAddress: userSession.ip_address,
                userAgent: userSession.user_agent,
            },
        },
    };
}
async function handleVerifyEmail(ctx) {
    const { token } = ctx.request.body;
    if (!token) {
        return {
            status: 400,
            body: { error: { message: 'Verification token is required' } },
        };
    }
    const tokenHash = (0, crypto_1.hashToken)(token);
    const verificationToken = await models_1.Token.findOne({
        token_hash: tokenHash,
        type: 'email_verification',
    });
    if (!verificationToken || !verificationToken.isValid()) {
        return {
            status: 400,
            body: { error: { message: 'Invalid or expired verification token' } },
        };
    }
    const user = await models_1.User.findById(verificationToken.user_id);
    if (!user) {
        return {
            status: 404,
            body: { error: { message: 'User not found' } },
        };
    }
    user.email_verified = true;
    await user.save();
    await verificationToken.markAsUsed();
    return {
        status: 200,
        body: {
            message: 'Email verified successfully',
            user: {
                id: user._id,
                email: user.email,
                email_verified: user.email_verified,
            },
        },
    };
}
async function handleRequestPasswordReset(ctx, config) {
    const { email } = ctx.request.body;
    // Rate limiting
    if (config.rateLimit?.enabled && config.rateLimit.passwordReset) {
        const rateLimitConfig = config.rateLimit.passwordReset;
        if (rateLimitConfig.max && rateLimitConfig.window) {
            const rateLimitKey = `password-reset:${ctx.request.ip || 'unknown'}`;
            const rateLimit = (0, rateLimit_1.checkRateLimit)(rateLimitKey, {
                max: rateLimitConfig.max,
                window: rateLimitConfig.window
            });
            if (rateLimit.isLimited) {
                if (config.callbacks?.onRateLimit) {
                    await config.callbacks.onRateLimit({
                        ip: ctx.request.ip || 'unknown',
                        endpoint: '/request-password-reset',
                        limit: { max: rateLimitConfig.max, window: rateLimitConfig.window },
                        userId: ctx.session?.userId
                    });
                }
                return {
                    status: 429,
                    body: {
                        error: {
                            message: 'Too many password reset attempts. Please try again later.',
                            resetAt: rateLimit.resetAt
                        }
                    },
                };
            }
            (0, rateLimit_1.trackAttempt)(rateLimitKey);
        }
    }
    if (!email || !(0, crypto_1.isValidEmail)(email)) {
        return {
            status: 400,
            body: { error: { message: 'Invalid email format' } },
        };
    }
    const normalizedEmail = (0, crypto_1.normalizeEmail)(email);
    const user = await models_1.User.findOne({ email: normalizedEmail });
    const successResponse = {
        message: 'If an account with this email exists, a password reset link has been sent.',
    };
    if (!user) {
        return { status: 200, body: successResponse };
    }
    const token = (0, crypto_1.generateSecureToken)();
    const tokenHash = (0, crypto_1.hashToken)(token);
    const resetToken = new models_1.Token({
        token_hash: tokenHash,
        type: 'password_reset',
        user_id: user._id,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });
    await resetToken.save();
    return {
        status: 200,
        body: successResponse,
    };
}
async function handleResetPassword(ctx) {
    const { token, password } = ctx.request.body;
    if (!token || !password) {
        return {
            status: 400,
            body: { error: { message: 'Token and password are required' } },
        };
    }
    const passwordCheck = (0, crypto_1.checkPasswordStrength)(password);
    if (!passwordCheck.isStrong) {
        return {
            status: 400,
            body: {
                error: {
                    message: 'Password does not meet security requirements',
                    details: passwordCheck.issues,
                },
            },
        };
    }
    const tokenHash = (0, crypto_1.hashToken)(token);
    const resetToken = await models_1.Token.findOne({
        token_hash: tokenHash,
        type: 'password_reset',
    });
    if (!resetToken || !resetToken.isValid()) {
        return {
            status: 400,
            body: { error: { message: 'Invalid or expired reset token' } },
        };
    }
    const user = await models_1.User.findById(resetToken.user_id);
    if (!user) {
        return {
            status: 404,
            body: { error: { message: 'User not found' } },
        };
    }
    const { hash, salt } = await (0, crypto_1.hashPassword)(password);
    await models_1.UserCredentials.updateOne({ user_id: user._id }, { $set: { password_hash: hash, salt: salt } });
    await resetToken.markAsUsed();
    await models_1.Session.deleteMany({ user_id: user._id });
    return {
        status: 200,
        body: { message: 'Password reset successful' },
    };
}
async function handleDeleteAccount(ctx) {
    if (!ctx.session?.userId) {
        return {
            status: 401,
            body: { error: { message: 'Not authenticated' } },
        };
    }
    const userId = ctx.session.userId;
    await models_1.Session.deleteMany({ user_id: userId });
    await models_1.Token.deleteMany({ user_id: userId });
    await models_1.UserCredentials.deleteOne({ user_id: userId });
    await models_1.User.findByIdAndDelete(userId);
    return {
        status: 200,
        body: { message: 'Account deleted successfully' },
        clearSession: true,
    };
}
