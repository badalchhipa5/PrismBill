// Internal dependencies
import { GeminiErrorDetails } from '../../services/gemini/geminiTypes';

import AppError from '../appError';
import type { ServiceErrorInput } from '../../types/errors';

const mapGeminiError = (error: unknown) => {
    const errorDetails = (
        typeof error === 'object' && error !== null ? error : {}
    ) as ServiceErrorInput;
    const errorMessage = errorDetails.message ?? '';
    const geminiError: GeminiErrorDetails = {
        statusCode: typeof errorDetails.status === 'number' ? errorDetails.status : 500,
        errorMessage: errorMessage || 'Unknown gemini error occurred.',
        errorName: errorDetails.name || 'GEMINI_ERROR',
    };

    if (errorDetails.status === 401 && errorMessage.includes('invalid authentication credentials.')) {
        geminiError.statusCode = 401;
        geminiError.errorMessage = 'Invalid gemini api key.';
        geminiError.errorName = 'GEMINI_INVALID_SECRETS';
    }

    if (
        /rate limit|quota|traffic|unavailable|try again later/i.test(errorMessage) ||
        errorDetails.status === 'UNAVAILABLE' ||
        errorDetails.status === 503
    ) {
        geminiError.statusCode = 503;
        geminiError.errorMessage = 'Model having high traffic. Try again letter.';
        geminiError.errorName = 'GEMINI_MODEL_REJECTION';
    }

    if (
        (errorDetails.status === 404 && errorDetails.name === 'NotFoundError') ||
        /^(?=.*model)(?=.*not)(?=.*found)/i.test(errorMessage)
    ) {
        geminiError.statusCode = 404;
        geminiError.errorMessage = 'Gemini model not found.';
        geminiError.errorName = 'GEMINI_MODEL_NOT_FOUND';
    }

    // Permission / Authorization errors.
    if (errorDetails.status === 403 || /permission denied/i.test(errorMessage)) {
        geminiError.statusCode = 403;
        geminiError.errorMessage = 'Gemini API key lacks permission.';
        geminiError.errorName = 'GEMINI_PERMISSION_DENIED';
    }

    // Invalid arguments / bad request
    if (errorDetails.status === 400 || /invalid argument|bad request/i.test(errorMessage)) {
        geminiError.statusCode = 400;
        geminiError.errorMessage = 'Invalid request payload or parameters.';
        geminiError.errorName = 'GEMINI_INVALID_ARGUMENT';
    }

    // Precondition / billing disabled.
    if (errorDetails.status === 400 && /failed precondition|billing/i.test(errorMessage)) {
        geminiError.statusCode = 400;
        geminiError.errorMessage = 'Billing or prerequisites not satisfied.';
        geminiError.errorName = 'GEMINI_FAILED_PRECONDITION';
    }

    // Deadline exceeded (timeout).
    if (errorDetails.status === 504 || /abort|deadline exceeded|timeout/i.test(errorMessage)) {
        geminiError.statusCode = 504;
        geminiError.errorMessage = 'Gemini request exceeded time limit.';
        geminiError.errorName = 'GEMINI_TIMEOUT';
    }

    // Internal server errors.
    if (errorDetails.status === 500 || /internal error/i.test(errorMessage)) {
        geminiError.statusCode = 500;
        geminiError.errorMessage = 'Gemini internal server error.';
        geminiError.errorName = 'GEMINI_INTERNAL_ERROR';
    }

    return new AppError(geminiError.errorMessage, geminiError.statusCode, geminiError.errorName);
};

export default mapGeminiError;
