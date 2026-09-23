import { describe, expect, it } from '@jest/globals';

import upload from '../middleware/upload';
import billRouter from '../routes/billRouter';
import userRouter from '../routes/userRouter';

describe('HTTP wiring', () => {
    it('configures multer disk storage middleware', () => {
        expect(typeof upload.single).toBe('function');
        expect(typeof upload.array).toBe('function');
    });

    it('registers bill and user router stacks', () => {
        expect(billRouter.stack.length).toBeGreaterThan(0);
        expect(userRouter.stack.length).toBeGreaterThan(0);
        expect(billRouter.stack.some((layer) => layer.route?.path === '/addReceipt')).toBe(true);
        expect(userRouter.stack.some((layer) => layer.route?.path === '/login')).toBe(true);
    });
});
