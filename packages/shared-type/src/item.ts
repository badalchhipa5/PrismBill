export interface Item {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
}

export interface ItemWithAssignments extends Item {
    assignedTo?: string[] | null;
}
