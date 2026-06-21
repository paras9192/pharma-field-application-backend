export declare enum PaymentMode {
    CASH = "CASH",
    CHEQUE = "CHEQUE",
    UPI = "UPI",
    NEFT = "NEFT",
    BANK_TRANSFER = "BANK_TRANSFER"
}
export declare class CollectPaymentDto {
    billId: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber?: string;
    notes?: string;
}
