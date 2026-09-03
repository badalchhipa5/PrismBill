// External dependencies
import { Bill, Item } from '@prismbill/shared-type';

type Nullable<T> = { [P in keyof T]: T[P] | null };

export type ModelId = string;

export interface FailoverOptions {
    models: ModelId[];
    maxAttemptsPerModel: number;
    cooldownTimeMs: number;
}

export interface ExtractedItem extends Item {
    ocrConfidence: number;
}

export interface ExtractedReceipt extends Nullable<Bill> {
    items: ExtractedItem[];
}

export interface GeminiErrorDetails {
    statusCode: number;
    errorName: string;
    errorMessage: string;
}
