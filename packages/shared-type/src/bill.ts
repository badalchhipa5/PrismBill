import { Item } from './item';

export type BillStatus = 'processing' | 'review' | 'finalized';

export interface Participant {
    participantId: string;
    name: string;
    finalOwed: number;
}

export interface Bill {
    id: string;
    userId: string;
    merchantName: string;
    date: string;
    imageUrl: string;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    items: Item[];
    participants: Participant[];
    status: BillStatus;
    createdAt: string;
    updatedAt: string;
}
