import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const recognize = jest.fn();
const terminate = jest.fn().mockResolvedValue(undefined);
const createWorker = jest.fn().mockResolvedValue({ recognize, terminate });
jest.unstable_mockModule('tesseract.js', () => ({ createWorker }));

const upload = jest.fn();
jest.unstable_mockModule('cloudinary', () => ({ v2: { uploader: { upload } } }));

const ocr = await import('../services/ocr');
const uploadImageToCloudinary = (await import('../services/cloudinary')).default;

describe('OCR service', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns trimmed text and always terminates the worker', async () => {
        recognize.mockResolvedValueOnce({ data: { confidence: 95, text: '  receipt text  ' } });
        await expect(ocr.default('receipt.png')).resolves.toBe('receipt text');
        expect(terminate).toHaveBeenCalled();
    });

    it('maps low confidence errors and still terminates the worker', async () => {
        recognize.mockResolvedValueOnce({ data: { confidence: 20, text: 'bad' } });
        await expect(ocr.default('receipt.png')).rejects.toMatchObject({
            name: 'OCR_LOW_CONFIDENCE',
            statusCode: 422,
        });
        expect(terminate).toHaveBeenCalled();
    });
});

describe('Cloudinary service', () => {
    it('uploads a file with the expected public id and returns its secure URL', async () => {
        upload.mockResolvedValueOnce({ secure_url: 'https://cdn.example/receipt.png' });
        await expect(
            uploadImageToCloudinary({ path: '/tmp/receipt.png', filename: 'receipt.png' } as never)
        ).resolves.toBe('https://cdn.example/receipt.png');
        expect(upload).toHaveBeenCalledWith('/tmp/receipt.png', {
            public_id: 'receipt',
            folder: 'prism-bill-app',
        });
    });

    it('maps provider failures', async () => {
        upload.mockRejectedValueOnce({ http_code: 503, message: 'unavailable' });
        await expect(
            uploadImageToCloudinary({ path: '/tmp/receipt.png', filename: 'receipt.png' } as never)
        ).rejects.toMatchObject({ name: 'CLOUDINARY_SERVICE_UNAVAILABLE', statusCode: 503 });
    });
});

describe('Gemini service', () => {
    it('accepts a valid structured response', async () => {
        const generateContent = jest.fn().mockResolvedValue({
            text: JSON.stringify({
                merchantName: 'Market',
                date: null,
                items: [
                    { itemId: '1', name: 'Milk', price: 4, quantity: 1, category: 'groceries' },
                ],
                subtotal: 4,
                tax: 0,
                tip: null,
                total: 4,
                currency: 'USD',
            }),
        });
        jest.unstable_mockModule('@google/genai', () => ({
            GoogleGenAI: class {
                models = { generateContent };
            },
        }));

        const { default: extractReceiptData } = await import('../services/gemini/gemini');
        await expect(
            extractReceiptData(
                { models: ['gemini-test'], maxAttemptsPerModel: 1, cooldownTimeMs: 1 },
                'raw receipt'
            )
        ).resolves.toMatchObject({ merchantName: 'Market', total: 4 });
        expect(generateContent).toHaveBeenCalled();
    });
});
