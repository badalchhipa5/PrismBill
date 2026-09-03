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

export const extractReceiptData = async (failoverOptions: FailoverOptions, rawText: string) => {
    const { models, maxAttemptsPerModel = 2, cooldownTimeMs = 120_000 } = failoverOptions;

    for (let model of models) {
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

                const responseText = response.text?.trim() || '{}';

                return JSON.parse(responseText) as ExtractedReceipt;
            } catch (error: any) {
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
};
