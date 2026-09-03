// External dependencies
import mongoose, { Schema, Document } from 'mongoose';

// Internal dependencies
import { BillRecord } from '@prismbill/shared-type';
import itemSchema from './itemModel';
/**
 * Mongoose document shape for stored bills.
 */
export interface BillDocument extends BillRecord, Document {}

export const billSchema = new Schema<BillDocument>({
    merchantName: { type: String, required: true },
    date: { type: String, required: true },
    imageUrl: { type: String, required: true },
    subtotal: { type: Number },
    tax: { type: Number },
    tip: { type: Number },
    total: { type: Number, required: true },
    items: [itemSchema],
    participants: [
        {
            participantId: { type: String, required: true },
            name: { type: String, required: true },
            finalOwed: { type: Number, required: true },
        },
    ],
    status: { type: String, enum: ['processing', 'review', 'finalized'], default: 'processing' },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date },
});

export default mongoose.model<BillDocument>('Bill', billSchema);
