// External dependencies
import type { Response, Request, NextFunction } from 'express';

// Internal dependencies
import secrets from '../config/secrets';
import AppError from '../utils/appError';
import { APP_ERROR_MESSAGES } from '../utils/errorMessages';

type AppErrorLike = Error & {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    errors?: Record<string, { message?: string }>;
    code?: number;
};

const handleDevelopmentError = (err: AppError, res: Response) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err.errors,
    });
};

const handleProductionError = (err: AppError, res: Response): Response => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    return res.status(500).json({
        status: 'error',
        message: APP_ERROR_MESSAGES.somethingWentWrong,
    });
};

const handleValidationError = (err: AppErrorLike): AppError => {
    const validationErrors = Object.values(err.errors ?? {});
    const messages = validationErrors
        .map((validationError) => validationError.message)
        .filter((message): message is string => Boolean(message));

    const message = messages.length
        ? `Invalid input data: ${messages.join(', ')}`
        : APP_ERROR_MESSAGES.invalidInputData;

    return new AppError(message, 400, err.name, true);
};

const handleTokenExpiredError = (): AppError =>
    new AppError(APP_ERROR_MESSAGES.sessionExpired, 401, 'TokenExpiredError', true);

const handleMalformedTokenError = (): AppError =>
    new AppError(APP_ERROR_MESSAGES.malformedToken, 401, 'JsonWebTokenError', true);

const handleDuplicateKeyError = (): AppError =>
    new AppError(APP_ERROR_MESSAGES.duplicateUser, 409, 'DuplicateKeyError', true);

const normalizeError = (err: AppErrorLike): AppError => {
    const statusCode = err.statusCode ?? 500;
    const normalizedError = new AppError(
        err.message || 'Something went wrong.',
        statusCode,
        err.name,
        err.isOperational ?? false
    );

    normalizedError.name = err.name || 'Error';
    normalizedError.stack = err.stack;
    normalizedError.code = err.code;
    normalizedError.errors = err.errors;

    return normalizedError;
};

export default (err: AppErrorLike, req: Request, res: Response, next: NextFunction) => {
    const error = normalizeError(err);

    if (secrets.server.NODE_ENV.trim() === 'production') {
        let responseError: AppError = error;

        if (responseError.name === 'ValidationError') {
            responseError = handleValidationError(responseError);
        }

        if (responseError.code === 11000) {
            responseError = handleDuplicateKeyError();
        }

        if (responseError.name === 'TokenExpiredError') {
            responseError = handleTokenExpiredError();
        }

        if (
            responseError.name === 'JsonWebTokenError' ||
            responseError.message === 'jwt malformed'
        ) {
            responseError = handleMalformedTokenError();
        }

        return handleProductionError(responseError, res);
    }

    return handleDevelopmentError(error, res);
};
