import { describe, expect, it, jest } from '@jest/globals';

import { billSchema } from '../model/billModel';
import itemSchema from '../model/itemModel';
import { UserModel } from '../model/userModel';
import AppError from '../utils/appError';

const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('Mongoose schemas and user methods', () => {
    it('defines required bill and item fields and split/status enums', () => {
        expect(billSchema.path('merchantName').isRequired).toBe(true);
        expect(billSchema.path('total').isRequired).toBe(true);
        expect(billSchema.path('splitMethod').enumValues).toEqual(['equalShare', 'perItem']);
        expect(billSchema.path('status').enumValues).toEqual(['processing', 'review', 'finalized']);
        expect(itemSchema.path('itemId').isRequired).toBe(true);
        expect(itemSchema.path('quantity').isRequired).toBe(true);
    });

    it('creates password reset hashes and expiry timestamps', () => {
        const user = new UserModel({
            userEmail: 'ada@example.com',
            userName: 'Ada',
            userPassword: 'password123',
            userConfirmPassword: 'password123',
        });
        const token = user.createPasswordResetToken();
        expect(token).toHaveLength(64);
        expect(user.userPasswordResetToken).toHaveLength(64);
        expect(user.userPasswordResetExpireAt?.getTime()).toBeGreaterThan(Date.now());
    });

    it('detects passwords changed after a JWT timestamp', () => {
        const user = new UserModel({ userPasswordChangedAt: new Date(Date.now()) });
        expect(user.isPasswordChangedAfter(Math.floor(Date.now() / 1000) - 10)).toBe(true);
        expect(user.isPasswordChangedAfter(Math.floor(Date.now() / 1000) + 10)).toBe(false);
    });
});

describe('global error controller', () => {
    it('returns detailed development errors', async () => {
        const globalError = (await import('../controllers/errorController')).default;
        const res = response();
        globalError(
            new AppError('bad input', 400, 'BAD_INPUT'),
            {} as never,
            res as never,
            jest.fn()
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'bad input' }));
    });

    it('normalizes unknown errors as server errors', async () => {
        const globalError = (await import('../controllers/errorController')).default;
        const res = response();
        globalError(new Error('unexpected'), {} as never, res as never, jest.fn());
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
});
