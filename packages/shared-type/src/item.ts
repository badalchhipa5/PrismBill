export interface Item {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    ocrConfidence?: number;
    assignedTo: string[]; // participantIds
}
