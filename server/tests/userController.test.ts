import { describe, expect, it, jest } from '@jest/globals';

const findById = jest.fn();
const findByIdAndUpdate = jest.fn();
jest.unstable_mockModule('../model/userModel', () => ({ UserModel: { findByIdAndUpdate } }));
jest.unstable_mockModule('../model/billModel', () => ({ default: { findById } }));

const { getProfile, updateProfile, deleteUser } = await import('../controllers/userController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('user controller', () => {
    it('returns profile details with populated bills', async () => {
        findById.mockResolvedValueOnce({ id: 'bill-1' });
        const res = response();
        await getProfile(
            {
                user: { userName: 'Ada', userEmail: 'ada@example.com', userBills: ['bill-1'] },
            } as never,
            res as never,
            jest.fn()
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    it('updates and archives the authenticated user', async () => {
        findByIdAndUpdate.mockResolvedValueOnce({ userName: 'Updated' });
        const updateResponse = response();
        await updateProfile(
            {
                user: { _id: 'user-1' },
                body: { userName: 'Updated', userEmail: 'new@example.com' },
            } as never,
            updateResponse as never,
            jest.fn()
        );
        expect(updateResponse.status).toHaveBeenCalledWith(200);

        const user = { save: jest.fn().mockResolvedValue(undefined) };
        const deleteResponse = response();
        await deleteUser({ user } as never, deleteResponse as never, jest.fn());
        expect(user.userAccountStatus).toBe('archive');
        expect(user.save).toHaveBeenCalled();
    });
});
