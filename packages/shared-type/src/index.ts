export interface BillSplit {
    id: string;
    amount: number;
    currency: string;
    participants: string[];
}

export interface SplitResult {
    total: number;
    perPerson: number;
    currency: string;
}
