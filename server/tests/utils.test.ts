import { describe, expect, it, jest } from '@jest/globals';
import AppError from '../utils/appError';
import withTimeout from '../utils/withTimeout';
import requireEnvVariable from '../utils/requireEnvVariable';
import { getDirectoryDetails, getDirName } from '../utils/dirname';
import checkRequestBody from '../middleware/checkRequestBody';
import mapOcrError from '../utils/serviceErrors/mapOcrError';
import mapGeminiError from '../utils/serviceErrors/mapGeminiError';
import mapCloudinaryError from '../utils/serviceErrors/mapCloudinaryError';

const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('AppError', () => {
    it('sets HTTP metadata for client and server errors', () => {
        const clientError = new AppError('bad input', 400, 'BAD_INPUT');
        const serverError = new AppError('broken', 500);

        expect(clientError).toMatchObject({
            message: 'bad input',
            name: 'BAD_INPUT',
            status: 'fail',
            statusCode: 400,
            isOperational: true,
        });
        expect(serverError.status).toBe('error');
    });
});

describe('utility functions', () => {
    it('returns required environment variables and rejects missing values', () => {
        process.env.TEST_REQUIRED_VALUE = 'present';
        expect(requireEnvVariable('TEST_REQUIRED_VALUE')).toBe('present');

        delete process.env.TEST_REQUIRED_VALUE;
        expect(() => requireEnvVariable('TEST_REQUIRED_VALUE')).toThrow(
            'Missing required environment variable: TEST_REQUIRED_VALUE'
        );
    });

    it('resolves ES module filename and directory details', () => {
        const details = getDirectoryDetails('file:///D:/tmp/example/module.ts');
        expect(details.__filename).toContain('module.ts');
        expect(details.__dirname).toContain('example');
        expect(details.path.basename(details.__filename)).toBe('module.ts');
        expect(getDirName).toBe(getDirectoryDetails);
    });

    it('passes an abort signal to an operation', async () => {
        const operation = jest.fn(async (signal: AbortSignal) => {
            expect(signal.aborted).toBe(false);
            return 'done';
        });

        await expect(withTimeout(operation, 100)).resolves.toBe('done');
        expect(operation).toHaveBeenCalledTimes(1);
    });
});

describe('checkRequestBody', () => {
    it('rejects an empty body and accepts a populated body', () => {
        const next = jest.fn();
        checkRequestBody({ body: {} } as never, response() as never, next);
        expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });

        const nextForValidBody = jest.fn();
        checkRequestBody({ body: { value: 1 } } as never, response() as never, nextForValidBody);
        expect(nextForValidBody).toHaveBeenCalledWith();
    });
});

describe('service error mappers', () => {
    it.each([
        [mapOcrError, { name: 'NetworkError', message: 'network' }, 'OCR_NET_FAIL', 503],
        [mapOcrError, { message: 'CANTOPENFILE' }, 'OCR_FILE_FAIL', 404],
        [
            mapGeminiError,
            { status: 401, message: 'invalid authentication credentials.' },
            'GEMINI_INVALID_SECRETS',
            401,
        ],
        [mapGeminiError, { status: 503, message: 'busy' }, 'GEMINI_MODEL_REJECTION', 503],
        [
            mapCloudinaryError,
            { http_code: 401, message: 'unauthorized' },
            'CLOUDINARY_AUTH_ERROR',
            401,
        ],
        [
            mapCloudinaryError,
            { http_code: 429, message: 'quota exceeded' },
            'CLOUDINARY_QUOTA_EXCEEDED',
            429,
        ],
    ])('maps known failures to operational AppErrors', (mapper, input, name, statusCode) => {
        expect(mapper(input)).toMatchObject({ name, statusCode, isOperational: true });
    });
});
