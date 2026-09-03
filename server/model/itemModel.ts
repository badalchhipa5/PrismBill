// External dependencies
import { Schema, Document } from 'mongoose';

// Internal dependencies
import { ItemWithAssignments } from '@prismbill/shared-type';

/**
 * Mongoose document shape for bill items.
 */
export interface ItemDocument extends ItemWithAssignments, Document {}

export default new Schema<ItemDocument>({
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    assignedTo: [{ type: String, required: true }],
});
