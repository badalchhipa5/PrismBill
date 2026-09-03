// External dependencies
import { type RequestHandler } from 'express';

// Internal dependencies
import { UserModel } from '../model/userModel';

import { AUTH_ERROR_MESSAGES } from '../utils/errorMessages';
import AppError from '../utils/appError';

export const getProfile: RequestHandler = async (req, res, next) => {
    try {
        // Get user Details.
        const currentUser = req.user;

        return res.status(200).json({
            status: 'success',
            data: {
                userName: currentUser?.userName,
                userEmail: currentUser?.userEmail,
                userAccountStatus: currentUser?.userAccountStatus,
                userBills: currentUser?.userBills,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            return next(new AppError(AUTH_ERROR_MESSAGES.notLoggedIn, 401));
        }

        const { userName, userEmail } = req.body;
        const updatedUser = await UserModel.findByIdAndUpdate(
            currentUser._id,
            { userName, userEmail },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
    try {
        // Get current user from Req and delete from DB.
        const currentUser = req.user;

        if (!currentUser) {
            return next(new AppError(AUTH_ERROR_MESSAGES.notLoggedIn, 401));
        }

        currentUser.userAccountDeletionRequestedAt = new Date();
        currentUser.userAccountStatus = 'archive';
        await currentUser.save?.();

        //  Send response after deleting user.
        return res.status(200).json({
            status: 'success',
            message:
                'Your account has been scheduled for deletion. It will be permanently deleted after 90 days. You can reactivate your account by logging in before the deletion date.',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return next(new AppError(AUTH_ERROR_MESSAGES.deleteUserFailed, 400));
    }
};
