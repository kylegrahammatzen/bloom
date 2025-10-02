"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.attachUser = attachUser;
require("express-session");
function requireAuth(options = {}) {
    return async (req, res, next) => {
        try {
            if (!req.session || !req.session.userId) {
                if (options.onUnauthorized) {
                    return options.onUnauthorized(req, res);
                }
                if (options.redirectTo) {
                    return res.redirect(options.redirectTo);
                }
                return res.status(401).json({
                    error: {
                        message: 'Authentication required',
                    },
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
function attachUser() {
    return async (req, res, next) => {
        try {
            if (req.session && req.session.userId) {
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
