export declare enum SettlementType {
    GOODS_RETURN = "GOODS_RETURN",
    CREDIT_NOTE = "CREDIT_NOTE",
    DISCOUNT = "DISCOUNT"
}
export declare class CreateSettlementDto {
    billId: string;
    type: SettlementType;
    amount: number;
    notes?: string;
}
