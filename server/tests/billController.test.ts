import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import fs from 'fs';

const create = jest.fn();
const findById = jest.fn();
const performOcrOnReceipt = jest.fn();
const extractReceiptData = jest.fn();

jest.unstable_mockModule('../model/billModel', () => ({ default: { create, findById } }));
jest.unstable_mockModule('../services/ocr', () => ({ default: performOcrOnReceipt }));
jest.unstable_mockModule('../services/gemini/gemini', () => ({ default: extractReceiptData }));

const { addReceipt, addMembersToBill } = await import('../controllers/billController');

const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('bill controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(fs, 'unlink').mockImplementation((_path, callback) => callback(null));
    });

    it('rejects receipt requests without an uploaded file', async () => {
        const res = response();
        await addReceipt({ file: undefined } as never, res as never, jest.fn());
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('processes a receipt, saves it, links it to the user, and cleans up', async () => {
        performOcrOnReceipt.mockResolvedValueOnce('ocr text');
        extractReceiptData.mockResolvedValueOnce({
            merchantName: 'Market',
            date: '2026-01-01',
            subtotal: 10,
            tax: 1,
            tip: 0,
            total: 11,
            items: [
                { itemId: 'item-1', name: 'Milk', price: 10, quantity: 1, category: 'groceries' },
            ],
        });
        const bill = { _id: { toString: () => 'bill-1' } };
        create.mockResolvedValueOnce(bill);
        const user = { userBills: [], save: jest.fn().mockResolvedValue(undefined) };
        const res = response();
        await addReceipt(
            { file: { filename: 'receipt.png', path: 'tmp/receipt.png' }, user } as never,
            res as never,
            jest.fn()
        );

        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({ merchantName: 'Market', total: 11 })
        );
        expect(user.userBills).toEqual(['bill-1']);
        expect(user.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('splits a bill equally and persists member assignments', async () => {
        const bill = {
            total: 100,
            items: [{ name: 'Bread', price: 20, quantity: 2 }],
            members: [],
            save: jest.fn().mockResolvedValue(undefined),
        };
        findById.mockResolvedValueOnce(bill);
        const res = response();
        await addMembersToBill(
            {
                body: {
                    billId: 'bill-1',
                    splitMethod: 'equalShare',
                    members: [{ name: 'Ada' }, { name: 'Grace' }],
                },
            } as never,
            res as never,
            jest.fn()
        );
        expect(bill.members).toHaveLength(2);
        expect(bill.members[0].finalOwned).toBe(50);
        expect(bill.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('validates per-item assignments and reports missing bills', async () => {
        findById.mockResolvedValueOnce(null);
        const notFoundNext = jest.fn();
        await addMembersToBill(
            {
                body: {
                    billId: 'missing',
                    splitMethod: 'perItem',
                    members: [{ name: 'Ada', item: 'Milk' }],
                },
            } as never,
            response() as never,
            notFoundNext
        ).catch((error) => expect(error).toMatchObject({ statusCode: 404 }));

        const bill = {
            total: 10,
            items: [{ name: 'Milk', price: 10, quantity: 2 }],
            members: [],
            save: jest.fn().mockResolvedValue(undefined),
        };
        findById.mockResolvedValueOnce(bill);
        const res = response();
        await addMembersToBill(
            {
                body: {
                    billId: 'bill-1',
                    splitMethod: 'perItem',
                    members: [{ name: 'Ada', item: 'Milk', itemQuantity: 1 }],
                },
            } as never,
            res as never,
            jest.fn()
        );
        expect(bill.items[0].assignedTo).toEqual(['Ada']);
        expect(bill.members[0].finalOwned).toBe(5);
    });
});
