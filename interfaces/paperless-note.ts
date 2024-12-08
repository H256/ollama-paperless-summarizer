export interface PaperlessNote {
    id: number;
    deleted_at?: Date;
    restored_at?: Date;
    transaction_id?: number;
    note?: string;
    created: Date;
    document?: number;
    user?: number;
}
