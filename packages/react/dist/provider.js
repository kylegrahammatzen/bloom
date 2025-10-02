"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloomProvider = BloomProvider;
exports.useAuth = useAuth;
const react_1 = __importStar(require("react"));
const client_1 = require("@bloom/client");
const AuthContext = (0, react_1.createContext)(undefined);
function BloomProvider({ children, baseURL, config }) {
    const [session, setSession] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const client = (0, react_1.useMemo)(() => {
        return (0, client_1.createBloomClient)(config || { baseUrl: baseURL });
    }, [baseURL, config]);
    const fetchUser = async () => {
        const response = await client.getSession();
        if (response.data) {
            setSession(response.data);
        }
        else {
            setSession(null);
        }
        setIsLoading(false);
    };
    (0, react_1.useEffect)(() => {
        fetchUser();
    }, []);
    const value = {
        user: session?.user ?? null,
        session,
        isLoading,
        isSignedIn: session !== null,
        signIn: client.signIn,
        signOut: client.signOut,
        signUp: client.signUp,
        deleteAccount: client.deleteAccount,
        refetch: fetchUser,
    };
    return react_1.default.createElement(AuthContext.Provider, { value: value }, children);
}
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within BloomProvider");
    }
    return context;
}
