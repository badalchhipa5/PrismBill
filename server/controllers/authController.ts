// External dependencies
import type { RequestHandler, Response } from 'express';
import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';

// Internal dependencies
import secrets from '../config/secrets';

import { UserModel } from '../model/userModel';
import type { AuthenticatedUser } from '../types/auth';
import { sendEmail } from '../utils/email';
import AppError from '../utils/appError';
import { AUTH_ERROR_MESSAGES } from '../utils/errorMessages';

export const validateToken = (token: string) =>
    new Promise((resolve, reject) => {
        try {
            const decoded = jwt.verify(token, secrets.jwt.JWT_SECRET);
            resolve(decoded);
        } catch (error) {
            reject(error);
        }
    });

export const signJwt = (id: string): string => {
    if (!secrets.jwt.JWT_SECRET) {
        throw new AppError(AUTH_ERROR_MESSAGES.secretMissing, 500);
    }

    return jwt.sign({ id }, secrets.jwt.JWT_SECRET, {
        expiresIn: secrets.jwt.JWT_EXPIRE,
    } as SignOptions);
};

export const sendAuthTokenResponse = (
    user: AuthenticatedUser,
    res: Response,
    statusCode: number
) => {
    const token = signJwt(user.id);
    return res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            userName: user.userName,
            userEmail: user.userEmail,
        },
    });
};

export const requireAuthentication: RequestHandler = async (req, res, next) => {
    try {
        // 1) Getting token and check if it's there.
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError(AUTH_ERROR_MESSAGES.notLoggedIn, 401));
        }

        // Extract user data based on token.
        const decoded = (await validateToken(token)) as JwtPayload;

        //  Find user.
        const currentUser = await UserModel.findOne({ _id: decoded.id });

        // Throw error if user doesn't exist.
        if (!currentUser) return next(new AppError(AUTH_ERROR_MESSAGES.notLoggedIn, 401));

        // Check if user have changed password after logging in.
        if (currentUser.isPasswordChangedAfter(decoded.iat as number)) {
            return next(new AppError(AUTH_ERROR_MESSAGES.passwordChanged, 401));
        }

        //  Store current user in req.
        req.user = currentUser;

        next();
    } catch (error) {
        return next(error);
    }
};

export const signUp: RequestHandler = async (req, res, next) => {
    try {
        const { userName, userEmail, userPassword, userConfirmPassword } = req.body;
        // Extract data from request body.

        const user = await UserModel.create({
            userName,
            userEmail,
            userPassword,
            userConfirmPassword,
        });

        sendAuthTokenResponse(user, res, 201);
    } catch (error) {
        return next(error);
    }
};

export const logIn: RequestHandler = async (req, res, next) => {
    try {
        // Extract email and password.
        const { userEmail, userPassword } = req.body;

        // Get user from DB.
        const user = await UserModel.findOne({ userEmail }).select('+userPassword');

        // Verify user and password.
        if (!user || !(await user?.verifyPassword(userPassword, user.userPassword)))
            return next(new AppError(AUTH_ERROR_MESSAGES.invalidCredentials, 401));

        // if account is under deletion period.
        if (user.userAccountStatus === 'archive') {
            user.userAccountStatus = 'active';
            user.userAccountDeletionRequestedAt = undefined;
            await user.save();
        }

        // Send JWT token to user.
        sendAuthTokenResponse(user, res, 200);
    } catch (error) {
        return next(error);
    }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
    const { userEmail } = req.body;
    const user = await UserModel.findOne({ userEmail });
    if (!user) {
        return next(new AppError(AUTH_ERROR_MESSAGES.userNotFound, 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        sendEmail({
            email: user.userEmail,
            subject: 'Password Reset Request',
            message: `You have requested a password reset. Click the link to reset your password: ${req.protocol}://${req.get('host')}/user/resetPassword/${resetToken}`,
        });

        return res.status(200).json({
            status: 'success',
            message:
                'We have sent a password reset link to your email. Please check your inbox. This link will expire in 10 minutes.',
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
    try {
        const resetToken = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

        const encryptedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const user = await UserModel.findOne({
            userPasswordResetToken: encryptedToken,
            userPasswordResetExpireAt: { $gt: new Date() },
        });

        if (!user) return next(new AppError(AUTH_ERROR_MESSAGES.invalidResetToken, 400));

        const { userPassword, userConfirmPassword } = req.body;
        user.userPassword = userPassword;
        user.userConfirmPassword = userConfirmPassword;
        user.userPasswordResetToken = undefined;
        user.userPasswordResetExpireAt = undefined;
        await user.save();

        const verificationToken = signJwt(user.id);

        return res.status(200).json({
            status: 'success',
            token: verificationToken,
        });
    } catch (error) {
        next(error);
    }
};

export const changePassword: RequestHandler = async (req, res, next) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            return next(new AppError(AUTH_ERROR_MESSAGES.notLoggedIn, 401));
        }
        const user = await UserModel.findById(currentUser._id).select('+userPassword');

        if (!user) {
            return next(new AppError(AUTH_ERROR_MESSAGES.userNotFound, 404));
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!(await user.verifyPassword(currentPassword, user.userPassword)))
            return next(new AppError(AUTH_ERROR_MESSAGES.invalidCurrentPassword, 401));

        user.userPassword = newPassword;
        user.userConfirmPassword = confirmPassword;
        await user.save();

        const verificationToken = signJwt(user.id);

        return res.status(200).json({
            status: 'success',
            token: verificationToken,
        });
    } catch (error) {
        next(error);
    }
};
