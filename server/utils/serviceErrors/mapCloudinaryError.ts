// Internal dependencies
import AppError from '../appError';

interface CloudinaryErrorDetails {
    statusCode: number;
    errorMessage: string;
    errorName: string;
}

const mapCloudinaryError = (error: any) => {
    let cloudError: CloudinaryErrorDetails = {
        statusCode: error.http_code || 500,
        errorMessage: error.message || 'Unknown Cloudinary error occurred.',
        errorName: error.name || 'CLOUDINARY_ERROR',
    };

    if (error.http_code === 401 || /invalid cloud_|unauthorized/i.test(error.message)) {
        // Authentication errors
        cloudError.statusCode = 401;
        cloudError.errorMessage = 'Invalid Cloudinary API key or secret.';
        cloudError.errorName = 'CLOUDINARY_AUTH_ERROR';
    } else if (error.http_code === 403 || /access denied|forbidden/i.test(error.message)) {
        //  Permission / access denied
        cloudError.statusCode = 403;
        cloudError.errorMessage = 'Cloudinary API key lacks permission.';
        cloudError.errorName = 'CLOUDINARY_PERMISSION_DENIED';
    } else if (error.http_code === 404 || /not found/i.test(error.message)) {
        //  Resource not found
        cloudError.statusCode = 404;
        cloudError.errorMessage = 'Requested Cloudinary resource not found.';
        cloudError.errorName = 'CLOUDINARY_RESOURCE_NOT_FOUND';
    } else if (error.http_code === 400 || /invalid|bad request|unsupported/i.test(error.message)) {
        //  Invalid request / bad input
        cloudError.statusCode = 400;
        cloudError.errorMessage = 'Invalid request payload or unsupported parameter.';
        cloudError.errorName = 'CLOUDINARY_INVALID_REQUEST';
    } else if (
        error.http_code === 429 ||
        /quota|rate limit|storage exceeded/i.test(error.message)
    ) {
        //  Quota / storage exceeded
        cloudError.statusCode = 429;
        cloudError.errorMessage = 'Cloudinary quota or storage limit exceeded.';
        cloudError.errorName = 'CLOUDINARY_QUOTA_EXCEEDED';
    } else if (error.http_code === 500 || /internal server error/i.test(error.message)) {
        //  Internal server errors
        cloudError.statusCode = 500;
        cloudError.errorMessage = 'Cloudinary internal server error.';
        cloudError.errorName = 'CLOUDINARY_INTERNAL_ERROR';
    } else if (error.http_code === 503 || /unavailable|timeout/i.test(error.message)) {
        //  Timeout / service unavailable
        cloudError.statusCode = 503;
        cloudError.errorMessage = 'Cloudinary service unavailable or request timed out.';
        cloudError.errorName = 'CLOUDINARY_SERVICE_UNAVAILABLE';
    }

    return new AppError(cloudError.errorMessage, cloudError.statusCode, cloudError.errorName);
};

export default mapCloudinaryError;
