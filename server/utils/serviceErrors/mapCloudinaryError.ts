// Internal dependencies
import AppError from '../appError';
import type { ServiceErrorDetails, ServiceErrorInput } from '../../types/errors';

const mapCloudinaryError = (error: unknown) => {
    const errorDetails = (
        typeof error === 'object' && error !== null ? error : {}
    ) as ServiceErrorInput;
    const errorMessage = errorDetails.message ?? '';
    const cloudError: ServiceErrorDetails = {
        statusCode: errorDetails.http_code || 500,
        errorMessage: errorMessage || 'Unknown Cloudinary error occurred.',
        errorName: errorDetails.name || 'CLOUDINARY_ERROR',
    };

    if (errorDetails.http_code === 401 || /invalid cloud_|unauthorized/i.test(errorMessage)) {
        // Authentication errors
        cloudError.statusCode = 401;
        cloudError.errorMessage = 'Invalid Cloudinary API key or secret.';
        cloudError.errorName = 'CLOUDINARY_AUTH_ERROR';
    } else if (errorDetails.http_code === 403 || /access denied|forbidden/i.test(errorMessage)) {
        //  Permission / access denied
        cloudError.statusCode = 403;
        cloudError.errorMessage = 'Cloudinary API key lacks permission.';
        cloudError.errorName = 'CLOUDINARY_PERMISSION_DENIED';
    } else if (errorDetails.http_code === 404 || /not found/i.test(errorMessage)) {
        //  Resource not found
        cloudError.statusCode = 404;
        cloudError.errorMessage = 'Requested Cloudinary resource not found.';
        cloudError.errorName = 'CLOUDINARY_RESOURCE_NOT_FOUND';
    } else if (errorDetails.http_code === 400 || /invalid|bad request|unsupported/i.test(errorMessage)) {
        //  Invalid request / bad input
        cloudError.statusCode = 400;
        cloudError.errorMessage = 'Invalid request payload or unsupported parameter.';
        cloudError.errorName = 'CLOUDINARY_INVALID_REQUEST';
    } else if (
        errorDetails.http_code === 429 ||
        /quota|rate limit|storage exceeded/i.test(errorMessage)
    ) {
        //  Quota / storage exceeded
        cloudError.statusCode = 429;
        cloudError.errorMessage = 'Cloudinary quota or storage limit exceeded.';
        cloudError.errorName = 'CLOUDINARY_QUOTA_EXCEEDED';
    } else if (errorDetails.http_code === 500 || /internal server error/i.test(errorMessage)) {
        //  Internal server errors
        cloudError.statusCode = 500;
        cloudError.errorMessage = 'Cloudinary internal server error.';
        cloudError.errorName = 'CLOUDINARY_INTERNAL_ERROR';
    } else if (errorDetails.http_code === 503 || /unavailable|timeout/i.test(errorMessage)) {
        //  Timeout / service unavailable
        cloudError.statusCode = 503;
        cloudError.errorMessage = 'Cloudinary service unavailable or request timed out.';
        cloudError.errorName = 'CLOUDINARY_SERVICE_UNAVAILABLE';
    }

    return new AppError(cloudError.errorMessage, cloudError.statusCode, cloudError.errorName);
};

export default mapCloudinaryError;
