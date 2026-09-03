// Internal dependencies
import AppError from '../appError';

interface OcrErrorDetails {
    statusCode: number;
    errorMessage: string;
    errorName: string;
}

const mapOcrError = (error: any) => {
    let ocrError: OcrErrorDetails = {
        statusCode: 500,
        errorMessage: error.message || 'Unexpected OCR error occurred.',
        errorName: error.name || 'OCR_ERROR',
    };

    // Network/resource errors
    if (error.name === 'NetworkError' || /failed to load/i.test(error.message)) {
        ocrError.statusCode = 503;
        ocrError.errorMessage = 'OCR engine network failure.';
        ocrError.errorName = 'OCR_NET_FAIL';
    }

    // Worker/runtime errors
    if (error.name === 'WorkerError' || /worker terminated/i.test(error.message)) {
        ocrError.statusCode = 500;
        ocrError.errorMessage = 'OCR worker crashed.';
        ocrError.errorName = 'OCR_WORKER_FAIL';
    }

    if (error.name === 'RuntimeError' || /memory allocation/i.test(error.message)) {
        ocrError.statusCode = 500;
        ocrError.errorMessage = 'OCR engine runtime failure.';
        ocrError.errorName = 'OCR_ENGINE_FAIL';
    }

    // Parameter errors
    if (error.name === 'BAD_PARAMETER' || /invalid option/i.test(error.message)) {
        ocrError.statusCode = 400;
        ocrError.errorMessage = 'Invalid parameter passed to OCR.';
        ocrError.errorName = 'OCR_PARAM_FAIL';
    }

    // Recognition errors
    if (error.name === 'RecognitionError' || /recognition failed/i.test(error.message)) {
        ocrError.statusCode = 422;
        ocrError.errorMessage = 'OCR recognition failed.';
        ocrError.errorName = 'OCR_RECOGNITION_FAIL';
    }

    // File/image errors
    if (/CANTOPENFILE/i.test(error.message)) {
        ocrError.statusCode = 404;
        ocrError.errorMessage = 'OCR file not accessible.';
        ocrError.errorName = 'OCR_FILE_FAIL';
    }

    if (/unsupported image format/i.test(error.message)) {
        ocrError.statusCode = 415;
        ocrError.errorMessage = 'OCR unsupported image format.';
        ocrError.errorName = 'OCR_UNSUPPORTED_FORMAT';
    }

    // Confidence threshold
    if (/confidence below threshold/i.test(error.message)) {
        ocrError.statusCode = 422;
        ocrError.errorMessage = 'OCR confidence too low.';
        ocrError.errorName = 'OCR_LOW_CONFIDENCE';
    }

    return new AppError(ocrError.errorMessage, ocrError.statusCode, ocrError.errorName);
};

export default mapOcrError;
