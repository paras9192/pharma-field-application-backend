export declare class OrderItemDto {
    productName: string;
    quantity: number;
    rate: number;
    notes?: string;
}
export declare class CreateOrderDto {
    chemistId: string;
    expectedDelivery?: string;
    notes?: string;
    items: OrderItemDto[];
}
