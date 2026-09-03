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

    if (
        errorDetails.status === 401 &&
        errorMessage.includes('invalid authentication credentials.')
    ) {
        geminiError.statusCode = 401;
        geminiError.errorMessage = 'Invalid gemini api key.';
        geminiError.errorName = 'GEMINI_INVALID_SECRETS';
    } else if (
        /rate limit|quota|traffic|unavailable|try again later/i.test(errorMessage) ||
        errorDetails.status === 'UNAVAILABLE' ||
        errorDetails.status === 503
    ) {
        geminiError.statusCode = 503;
        geminiError.errorMessage = 'Model having high traffic. Try again letter.';
        geminiError.errorName = 'GEMINI_MODEL_REJECTION';
    } else if (
        (errorDetails.status === 404 && errorDetails.name === 'NotFoundError') ||
        /^(?=.*model)(?=.*not)(?=.*found)/i.test(errorMessage)
    ) {
        geminiError.statusCode = 404;
        geminiError.errorMessage = 'Gemini model not found.';
        geminiError.errorName = 'GEMINI_MODEL_NOT_FOUND';
    } else if (errorDetails.status === 403 || /permission denied/i.test(errorMessage)) {
        geminiError.statusCode = 403;
        geminiError.errorMessage = 'Gemini API key lacks permission.';
        geminiError.errorName = 'GEMINI_PERMISSION_DENIED';
    } else if (errorDetails.status === 400 && /failed precondition|billing/i.test(errorMessage)) {
        // Precondition / billing disabled.
        geminiError.statusCode = 400;
        geminiError.errorMessage = 'Billing or prerequisites not satisfied.';
        geminiError.errorName = 'GEMINI_FAILED_PRECONDITION';
    } else if (errorDetails.status === 400 || /invalid argument|bad request/i.test(errorMessage)) {
        // Invalid arguments / bad request
        geminiError.statusCode = 400;
        geminiError.errorMessage = 'Invalid request payload or parameters.';
        geminiError.errorName = 'GEMINI_INVALID_ARGUMENT';
    } else if (
        errorDetails.status === 504 ||
        /abort|deadline exceeded|timeout/i.test(errorMessage)
    ) {
        // Deadline exceeded (timeout).
        geminiError.statusCode = 504;
        geminiError.errorMessage = 'Gemini request exceeded time limit.';
        geminiError.errorName = 'GEMINI_TIMEOUT';
    } else if (errorDetails.status === 500 || /internal error/i.test(errorMessage)) {
        // Internal server errors.
        geminiError.statusCode = 500;
        geminiError.errorMessage = 'Gemini internal server error.';
        geminiError.errorName = 'GEMINI_INTERNAL_ERROR';
    } else if (errorMessage === 'Gemini returned an invalid receipt structure.') {
        geminiError.statusCode = 500;
        geminiError.errorMessage = 'Gemini returned an invalid receipt structure.';
        geminiError.errorName = 'GEMINI_INVALID_RECEIPT_STRUCTURE';
    }

    return new AppError(geminiError.errorMessage, geminiError.statusCode, geminiError.errorName);
};

export default mapGeminiError;
