// External dependencies
import { GoogleGenAI } from '@google/genai';

// Internal dependencies
import { ModelId, FailoverOptions, ExtractedReceipt } from './geminiTypes';
import mapGeminiError from '../../utils/serviceErrors/mapGeminiError';
import withTimeout from '../../utils/withTimeout';

const getCurrentTime = (): number => Date.now();

const degradedUntil: Map<ModelId, number> = new Map();

const isDegraded = (modelId: ModelId): boolean => {
    const until = degradedUntil.get(modelId);
    return !!until && getCurrentTime() < until;
};

const markDegraded = (modelId: ModelId, cooldownTimeMs: number) =>
    degradedUntil.set(modelId, getCurrentTime() + cooldownTimeMs);

// Prompt for AI model to extract receipt data from OCR text.
const prompt = `
        You are parsing raw OCR text from a photographed receipt. The text may have
        misaligned spacing or OCR errors. Extract ONLY purchasable line items —
        ignore store address, phone numbers, dates, subtotal/tax/total lines
        (report those separately), and any promotional text.

        For each item, assign one category from:
        groceries, beverages, household, dining, personal-care, other.

        Return ONLY valid JSON with this shape and do not add any extra text or commentary or formatting:
        
        {
            "merchantName": string | null,
            "date": string | null,
            "items": [{ "itemId": string, "name": string, "price": number, "quantity": number, "category": string }],
            "subtotal": number | null,
            "tax": number | null,
            "tip": number | null,
            "total": number | null,
            "currency": string | null
        }

        Raw OCR text:
    `;
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isNullableString = (value: unknown): value is string | null =>
    value === null || typeof value === 'string';

const isNullableNumber = (value: unknown): value is number | null =>
    value === null || (typeof value === 'number' && Number.isFinite(value));

const isExtractedReceipt = (value: unknown): value is ExtractedReceipt => {
    if (!isRecord(value) || !Array.isArray(value.items)) {
        return false;
    }

    const hasValidItems = value.items.every(
        (item) =>
            isRecord(item) &&
            typeof item.itemId === 'string' &&
            typeof item.name === 'string' &&
            typeof item.price === 'number' &&
            Number.isFinite(item.price) &&
            typeof item.quantity === 'number' &&
            Number.isFinite(item.quantity) &&
            typeof item.category === 'string'
    );

    return (
        hasValidItems &&
        isNullableString(value.merchantName) &&
        isNullableString(value.date) &&
        isNullableNumber(value.subtotal) &&
        isNullableNumber(value.tax) &&
        isNullableNumber(value.tip) &&
        isNullableNumber(value.total) &&
        isNullableString(value.currency)
    );
};

const parseExtractedReceipt = (responseText: string): ExtractedReceipt => {
    const parsedData: unknown = JSON.parse(responseText);

    if (!isExtractedReceipt(parsedData)) {
        throw new Error('Gemini returned an invalid receipt structure.');
    }

    return parsedData;
};

const extractReceiptData = async (
    failoverOptions: FailoverOptions,
    rawText: string
): Promise<ExtractedReceipt> => {
    const { models, maxAttemptsPerModel = 2, cooldownTimeMs = 120_000 } = failoverOptions;

    for (const model of models) {
        if (isDegraded(model)) {
            continue;
        }

        let attempt = 0;
        while (attempt < maxAttemptsPerModel) {
            attempt++;
            try {
                // Call the Gemini API with the current model.
                const response = await withTimeout(
                    (abortSignal) =>
                        aiClient.models.generateContent({
                            model,
                            contents: prompt + rawText,
                            config: { abortSignal },
                        }),
                    40_000
                );

                const responseText = response.text?.trim();

                if (!responseText) {
                    throw new Error('Gemini returned an empty response.');
                }

                return parseExtractedReceipt(responseText);
            } catch (error: unknown) {
                const geminiError = mapGeminiError(error);

                if (geminiError.name === 'GEMINI_MODEL_REJECTION') {
                    if (attempt >= maxAttemptsPerModel) {
                        markDegraded(model, cooldownTimeMs);
                        attempt = 0;
                        break;
                    }
                } else if (geminiError.name === 'GEMINI_TIMEOUT') {
                    markDegraded(model, cooldownTimeMs);
                    attempt = 0;
                    break;
                } else {
                    throw geminiError;
                }
            }
        }
    }

    throw new Error('No Gemini model was available to extract receipt data.');
};

export default extractReceiptData;
