export interface MaterialAssignment {
    concepto: string;
    materialId: string;
    manualPrice?: number;
}

export interface ExtraItem {
    id: string;
    materialId: string;
    quantity: number;
    manualPrice?: number;
}
