"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bloomClient = void 0;
exports.createBloomClient = createBloomClient;
const fetch_1 = require("./fetch");
const config_1 = require("./config");
function createBloomClient(config) {
    if (config) {
        (0, config_1.setClientConfig)(config);
    }
    return {
        signUp: {
            email: async (body, options) => {
                return (0, fetch_1.apiFetch)("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify(body),
                    requestOptions: options,
                });
            },
        },
        signIn: {
            email: async (body, options) => {
                return (0, fetch_1.apiFetch)("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify(body),
                    requestOptions: options,
                });
            },
        },
        signOut: async (options) => {
            return (0, fetch_1.apiFetch)("/api/auth/logout", {
                method: "POST",
                requestOptions: options,
            });
        },
        deleteAccount: async (options) => {
            return (0, fetch_1.apiFetch)("/api/auth/account", {
                method: "DELETE",
                requestOptions: options,
            });
        },
        getSession: async (options) => {
            return (0, fetch_1.apiFetch)("/api/auth/me", {
                requestOptions: options,
            });
        },
    };
}
// Default export for convenience
exports.bloomClient = createBloomClient();
