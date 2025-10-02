import type { Request, Response, NextFunction, Router } from 'express';
import type { BloomAuth } from '@bloom/core';
export declare function toExpressHandler(auth: BloomAuth): Router;
export declare function createExpressHandler(auth: BloomAuth): (req: Request, res: Response, next: NextFunction) => Promise<void>;
