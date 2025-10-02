"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientConfig = void 0;
exports.setClientConfig = setClientConfig;
exports.clientConfig = {
    baseUrl: "http://localhost:5000",
};
function setClientConfig(config) {
    exports.clientConfig = { ...exports.clientConfig, ...config };
}
