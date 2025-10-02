import type { BloomAuth } from '@bloom/core';
import type { CorsOptions } from 'cors';
import type { HelmetOptions } from 'helmet';
import type { Router, RequestHandler, Application } from 'express';
export type BloomServerConfig = {
    auth: BloomAuth;
    port?: number;
    cors?: CorsOptions | boolean;
    helmet?: HelmetOptions | boolean;
    onReady?: (port: number) => void;
};
export type RouteConfig = {
    path: string;
    handler: Router | RequestHandler;
    protected?: boolean;
};
export type BloomServerInstance = {
    app: Application;
    addRoute: (path: string, handler: Router | RequestHandler, options?: {
        protected?: boolean;
    }) => void;
    start: (port?: number) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map