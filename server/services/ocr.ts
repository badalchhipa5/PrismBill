// External dependencies
import { createWorker } from 'tesseract.js';

// Internal dependencies
import { getDirectoryDetails } from '../utils/dirname';
import { AUTH_ERROR_MESSAGES } from '../utils/errorMessages';
import mapOcrError from '../utils/serviceErrors/mapOcrError';

const { __dirname, path } = getDirectoryDetails(import.meta.url);

/**
 * Runs OCR on a stored receipt image and returns the extracted text.
 */
export default async function performOcrOnReceipt(imageName: string): Promise<string> {
    const worker = await createWorker('eng');

    try {
        const imagePath = path.join(__dirname, '..', 'tmp', 'uploads', imageName);
        const { data } = await worker.recognize(imagePath);

        if (data.confidence < 50) {
            throw new Error(AUTH_ERROR_MESSAGES.lowOcrConfidence);
        }
        return data.text?.trim();
    } catch (error) {
        throw mapOcrError(error as Error);
    } finally {
        await worker.terminate();
    }
}
