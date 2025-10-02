"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bloomServer = bloomServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_2 = require("@bloom/node/express");
/**
 * Creates a zero-config Express server with Bloom authentication
 * @param config Server configuration including auth instance
 * @returns Server instance with app, addRoute, and start methods
 */
function bloomServer(config) {
    const app = (0, express_1.default)();
    const { auth } = config;
    if (config.helmet !== false) {
        const helmetOptions = typeof config.helmet === 'object' ? config.helmet : {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        };
        app.use((0, helmet_1.default)(helmetOptions));
    }
    if (config.cors !== false) {
        const corsOptions = typeof config.cors === 'object' ? config.cors : {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            optionsSuccessStatus: 200,
        };
        app.use((0, cors_1.default)(corsOptions));
    }
    app.use((0, cookie_parser_1.default)());
    const sessionSecret = auth.config.session?.secret || process.env.SESSION_SECRET || 'bloom-dev-secret-change-in-production';
    const sessionCookieName = auth.config.session?.cookieName || 'bloom.sid';
    const sessionMaxAge = auth.config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000;
    const mongoUri = auth.config.database?.uri || process.env.MONGODB_URI || 'mongodb://bloom:bloom-dev-password@localhost:27017/bloom-auth';
    app.use((0, express_session_1.default)({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: connect_mongo_1.default.create({
            mongoUrl: mongoUri,
            touchAfter: 24 * 3600,
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: sessionMaxAge,
            sameSite: 'lax',
        },
        name: sessionCookieName,
    }));
    app.all('/api/auth/*', (0, express_2.toExpressHandler)(auth));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'bloom-auth-server',
            version: '1.0.0'
        });
    });
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(err.status || 500).json({
            error: {
                message: err.message || 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
            },
        });
    });
    /**
     * Add a route to the server
     * @param path Route path
     * @param handler Route handler
     * @param options Options including protected flag
     */
    const addRoute = (path, handler, options) => {
        if (options?.protected) {
            app.use(path, (0, express_2.requireAuth)(), handler);
        }
        else {
            app.use(path, handler);
        }
    };
    /**
     * Start the server
     * @param port Port number to listen on
     */
    const start = async (port) => {
        const serverPort = port || config.port || parseInt(process.env.PORT || '5000', 10);
        try {
            if (!mongoose_1.default.connection.readyState) {
                await mongoose_1.default.connect(mongoUri, {
                    maxPoolSize: 10,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                });
                console.log('✅ Connected to MongoDB successfully');
            }
            app.listen(serverPort, () => {
                console.log(`🚀 Bloom authentication server running on port ${serverPort}`);
                console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
                if (config.onReady) {
                    config.onReady(serverPort);
                }
            });
            mongoose_1.default.connection.on('error', (error) => {
                console.error('MongoDB connection error:', error);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.warn('MongoDB disconnected');
            });
        }
        catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    };
    return {
        app,
        addRoute,
        start,
    };
}
//# sourceMappingURL=index.js.map