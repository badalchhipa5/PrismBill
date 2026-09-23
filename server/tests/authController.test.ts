import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const findOne = jest.fn();
const findById = jest.fn();
const create = jest.fn();
const sendEmail = jest.fn();

jest.unstable_mockModule('../model/userModel', () => ({
    UserModel: { findOne, findById, create },
}));
jest.unstable_mockModule('../utils/email', () => ({ sendEmail }));

const {
    validateToken,
    signJwt,
    sendAuthTokenResponse,
    requireAuthentication,
    signUp,
    logIn,
    forgotPassword,
    resetPassword,
    changePassword,
} = await import('../controllers/authController');

const response = () => ({
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
});

const next = () => jest.fn();

describe('auth controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('signs and validates JWTs and writes the auth response', async () => {
        const token = signJwt('user-1');
        await expect(validateToken(token)).resolves.toMatchObject({ id: 'user-1' });

        const res = response();
        sendAuthTokenResponse(
            { id: 'user-1', userName: 'Ada', userEmail: 'ada@example.com' } as never,
            res as never,
            201
        );
        expect(res.cookie).toHaveBeenCalledWith('jwt', expect.any(String), expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('rejects missing tokens and unknown users', async () => {
        const missingNext = next();
        await requireAuthentication({ cookies: {} } as never, response() as never, missingNext);
        expect(missingNext.mock.calls[0][0]).toMatchObject({ statusCode: 401 });

        findOne.mockResolvedValueOnce(null);
        const unknownNext = next();
        await requireAuthentication(
            { cookies: { jwt: signJwt('missing') } } as never,
            response() as never,
            unknownNext
        );
        expect(unknownNext.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
    });

    it('signs up users and rejects invalid login credentials', async () => {
        const user = { id: 'user-1', userName: 'Ada', userEmail: 'ada@example.com' };
        create.mockResolvedValueOnce(user);
        const signupResponse = response();
        await signUp({ body: user } as never, signupResponse as never, next());
        expect(create).toHaveBeenCalledWith({
            userName: user.userName,
            userEmail: user.userEmail,
            userPassword: undefined,
            userConfirmPassword: undefined,
        });
        expect(signupResponse.status).toHaveBeenCalledWith(201);

        const select = jest.fn().mockResolvedValueOnce(null);
        findOne.mockReturnValueOnce({ select });
        const loginNext = next();
        await logIn({ body: {} } as never, response() as never, loginNext);
        expect(loginNext.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
    });

    it('handles password reset and password change success paths', async () => {
        const user = {
            userEmail: 'ada@example.com',
            createPasswordResetToken: jest.fn().mockReturnValue('reset-token'),
            save: jest.fn().mockResolvedValue(undefined),
        };
        findOne.mockResolvedValueOnce(user);
        const forgotResponse = response();
        await forgotPassword(
            {
                body: { userEmail: user.userEmail },
                protocol: 'https',
                get: jest.fn().mockReturnValue('example.com'),
            } as never,
            forgotResponse as never,
            next()
        );
        expect(sendEmail).toHaveBeenCalled();
        expect(forgotResponse.status).toHaveBeenCalledWith(200);

        const resetUser = { ...user, userPassword: '', userConfirmPassword: '' };
        findOne.mockResolvedValueOnce(resetUser);
        const resetResponse = response();
        await resetPassword(
            {
                params: { token: 'reset-token' },
                body: { userPassword: 'new', userConfirmPassword: 'new' },
            } as never,
            resetResponse as never,
            next()
        );
        expect(resetUser.save).toHaveBeenCalled();
        expect(resetResponse.status).toHaveBeenCalledWith(200);

        const currentUser = {
            _id: 'user-1',
            verifyPassword: jest.fn().mockResolvedValue(true),
        };
        const selectCurrent = jest.fn().mockResolvedValueOnce(currentUser);
        findById.mockReturnValueOnce({ select: selectCurrent });
        currentUser.save = jest.fn().mockResolvedValue(undefined);
        const changeResponse = response();
        await changePassword(
            {
                user: currentUser,
                body: { currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' },
            } as never,
            changeResponse as never,
            next()
        );
        expect(currentUser.save).toHaveBeenCalled();
        expect(changeResponse.status).toHaveBeenCalledWith(200);
    });
});
