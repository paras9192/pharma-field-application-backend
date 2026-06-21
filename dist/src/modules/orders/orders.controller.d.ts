import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    create(currentUser: any, dto: CreateOrderDto): Promise<{
        createdBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        chemist: {
            id: string;
            phone: string;
            shopName: string;
            ownerName: string;
        };
        bills: {
            id: string;
            status: import("@prisma/client").$Enums.BillStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            billNumber: string;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
        }[];
        deliveredBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        } | null;
        items: {
            id: number;
            notes: string | null;
            productName: string;
            quantity: number;
            rate: import("@prisma/client-runtime-utils").Decimal;
            amount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
        }[];
    } & {
        id: string;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
        chemistId: string;
        orderNumber: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        orderDate: Date;
        expectedDelivery: Date | null;
        deliveredAt: Date | null;
        deliveredById: string | null;
        notes: string | null;
    }>;
    findAll(currentUser: any, query: PaginationDto & {
        chemistId?: string;
        status?: string;
        from?: string;
        to?: string;
    }): Promise<{
        data: ({
            createdBy: {
                id: string;
                name: string;
                employeeCode: string | null;
            };
            chemist: {
                id: string;
                phone: string;
                shopName: string;
                ownerName: string;
            };
            bills: {
                id: string;
                status: import("@prisma/client").$Enums.BillStatus;
                totalAmount: import("@prisma/client-runtime-utils").Decimal;
                billNumber: string;
                paidAmount: import("@prisma/client-runtime-utils").Decimal;
            }[];
            deliveredBy: {
                id: string;
                name: string;
                employeeCode: string | null;
            } | null;
            items: {
                id: number;
                notes: string | null;
                productName: string;
                quantity: number;
                rate: import("@prisma/client-runtime-utils").Decimal;
                amount: import("@prisma/client-runtime-utils").Decimal;
                orderId: string;
            }[];
        } & {
            id: string;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
            chemistId: string;
            orderNumber: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            orderDate: Date;
            expectedDelivery: Date | null;
            deliveredAt: Date | null;
            deliveredById: string | null;
            notes: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, currentUser: any): Promise<{
        createdBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        chemist: {
            id: string;
            phone: string;
            shopName: string;
            ownerName: string;
        };
        bills: {
            id: string;
            status: import("@prisma/client").$Enums.BillStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            billNumber: string;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
        }[];
        deliveredBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        } | null;
        items: {
            id: number;
            notes: string | null;
            productName: string;
            quantity: number;
            rate: import("@prisma/client-runtime-utils").Decimal;
            amount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
        }[];
    } & {
        id: string;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
        chemistId: string;
        orderNumber: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        orderDate: Date;
        expectedDelivery: Date | null;
        deliveredAt: Date | null;
        deliveredById: string | null;
        notes: string | null;
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto, currentUser: any): Promise<{
        createdBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        chemist: {
            id: string;
            phone: string;
            shopName: string;
            ownerName: string;
        };
        bills: {
            id: string;
            status: import("@prisma/client").$Enums.BillStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            billNumber: string;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
        }[];
        deliveredBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        } | null;
        items: {
            id: number;
            notes: string | null;
            productName: string;
            quantity: number;
            rate: import("@prisma/client-runtime-utils").Decimal;
            amount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
        }[];
    } & {
        id: string;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
        chemistId: string;
        orderNumber: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        orderDate: Date;
        expectedDelivery: Date | null;
        deliveredAt: Date | null;
        deliveredById: string | null;
        notes: string | null;
    }>;
}
