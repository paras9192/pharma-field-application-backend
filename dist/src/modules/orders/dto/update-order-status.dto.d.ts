export declare enum OrderStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    DISPATCHED = "DISPATCHED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    notes?: string;
}
