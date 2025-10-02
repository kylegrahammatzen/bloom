"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toExpressHandler = toExpressHandler;
exports.createExpressHandler = createExpressHandler;
const express_1 = __importDefault(require("express"));
function toExpressHandler(auth) {
    const router = express_1.default.Router();
    // Add body parsing middleware for auth routes
    router.use(express_1.default.json({ limit: '10mb' }));
    router.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Main handler for all auth routes
    router.use(async (req, res, next) => {
        try {
            // Extract IP address (handle proxies)
            const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.socket.remoteAddress
                || req.ip;
            // Extract user agent
            const userAgent = req.headers['user-agent'];
            // Build framework-agnostic context
            const context = {
                request: {
                    method: req.method,
                    path: req.path,
                    url: req.url,
                    body: req.body,
                    headers: req.headers,
                    ip,
                    userAgent,
                },
                session: req.session && {
                    userId: req.session.userId,
                    sessionId: req.session.sessionId,
                },
            };
            // Call core auth handler
            const result = await auth.handler(context);
            // Handle session data
            if (result.sessionData && req.session) {
                req.session.userId = result.sessionData.userId;
                req.session.sessionId = result.sessionData.sessionId;
            }
            // Clear session if requested
            if (result.clearSession && req.session) {
                req.session.destroy((err) => {
                    if (err)
                        console.error('Session destruction error:', err);
                });
                res.clearCookie(auth.config.session?.cookieName || 'bloom.sid');
            }
            // Send response
            res.status(result.status).json(result.body);
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
function createExpressHandler(auth) {
    return async (req, res, next) => {
        try {
            const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.socket.remoteAddress
                || req.ip;
            const context = {
                request: {
                    method: req.method,
                    path: req.path,
                    url: req.url,
                    body: req.body,
                    headers: req.headers,
                    ip,
                    userAgent: req.headers['user-agent'],
                },
                session: req.session && {
                    userId: req.session.userId,
                    sessionId: req.session.sessionId,
                },
            };
            const result = await auth.handler(context);
            if (result && typeof result === 'object' && 'status' in result) {
                if (result.sessionData && req.session) {
                    req.session.userId = result.sessionData.userId;
                    req.session.sessionId = result.sessionData.sessionId;
                }
                if (result.clearSession && req.session) {
                    req.session.destroy((err) => {
                        if (err)
                            console.error('Session destruction error:', err);
                    });
                    res.clearCookie(auth.config.session?.cookieName || 'bloom.sid');
                }
                res.status(result.status).json(result.body);
            }
            else {
                next();
            }
        }
        catch (error) {
            next(error);
        }
    };
}
