// Internal dependencies
import { Item } from './item';

export type BillStatus = 'processing' | 'review' | 'finalized';

export interface Participant {
    participantId: string;
    name: string;
    finalOwed: number;
}

export interface Bill {
    merchantName: string;
    date: string;
    items: Item[];
    subtotal?: number | undefined;
    tax: number;
    tip?: number;
    total: number;
    currency?: string | null;
}

export interface BillRecord extends Bill {
    id: string;
    userId: string;
    imageUrl: string;
    participants: Participant[];
    status: BillStatus;
    createdAt: Date;
    updatedAt: Date;
}
