// Internal dependencies
import { GeminiErrorDetails } from '../../services/gemini/geminiTypes';

import AppError from '../appError';

const mapGeminiErrors = (error: any) => {
    let geminiError: GeminiErrorDetails = {
        statusCode: error.status || 500,
        errorMessage: error.message || 'Unknown gemini error occur.',
        errorName: error.name || 'GEMINI_ERROR',
    };

    if (error.status === 401 && error.message.includes('invalid authentication credentials.')) {
        geminiError.statusCode = 401;
        geminiError.errorMessage = 'Invalid gemini api key.';
        geminiError.errorName = 'GEMINI_INVALID_SECRETS';
    }

    if (
        /rate limit|quota|traffic|unavailable|try again later/i.test(error.message) ||
        error.status === 'UNAVAILABLE' ||
        error.status === 503
    ) {
        geminiError.statusCode = 503;
        geminiError.errorMessage = 'Model having high traffic. Try again letter.';
        geminiError.errorName = 'GEMINI_MODEL_REJECTION';
    }

    if (
        (error.status === 404 && error.name === 'NotFoundError') ||
        /^(?=.*model)(?=.*not)(?=.*found)/i.test(error.message)
    ) {
        geminiError.statusCode = 404;
        geminiError.errorMessage = 'Gemini model not found.';
        geminiError.errorName = 'GEMINI_MODEL_NOT_FOUND';
    }

    // Permission / Authorization errors.
    if (error.status === 403 || /permission denied/i.test(error.message)) {
        geminiError.statusCode = 403;
        geminiError.errorMessage = 'Gemini API key lacks permission.';
        geminiError.errorName = 'GEMINI_PERMISSION_DENIED';
    }

    // Invalid arguments / bad request
    if (error.status === 400 || /invalid argument|bad request/i.test(error.message)) {
        geminiError.statusCode = 400;
        geminiError.errorMessage = 'Invalid request payload or parameters.';
        geminiError.errorName = 'GEMINI_INVALID_ARGUMENT';
    }

    // Precondition / billing disabled.
    if (error.status === 400 && /failed precondition|billing/i.test(error.message)) {
        geminiError.statusCode = 400;
        geminiError.errorMessage = 'Billing or prerequisites not satisfied.';
        geminiError.errorName = 'GEMINI_FAILED_PRECONDITION';
    }

    // Deadline exceeded (timeout).
    if (error.status === 504 || /abort|deadline exceeded|timeout/i.test(error.message)) {
        geminiError.statusCode = 504;
        geminiError.errorMessage = 'Gemini request exceeded time limit.';
        geminiError.errorName = 'GEMINI_TIMEOUT';
    }

    // Internal server errors.
    if (error.status === 500 || /internal error/i.test(error.message)) {
        geminiError.statusCode = 500;
        geminiError.errorMessage = 'Gemini internal server error.';
        geminiError.errorName = 'GEMINI_INTERNAL_ERROR';
    }

    return new AppError(geminiError.errorMessage, geminiError.statusCode, geminiError.errorName);
};

export default mapGeminiErrors;
