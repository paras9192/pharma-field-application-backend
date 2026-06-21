import { PrismaService } from '../../prisma/prisma.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    collect(userId: string, dto: CollectPaymentDto): Promise<{
        bill: {
            id: string;
            chemist: {
                id: string;
                shopName: string;
                ownerName: string;
            };
            status: import("@prisma/client").$Enums.BillStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            billNumber: string;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            dueAmount: import("@prisma/client-runtime-utils").Decimal;
        };
        collectedBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        referenceNumber: string | null;
        billId: string;
        paymentMode: import("@prisma/client").$Enums.PaymentMode;
        collectedById: string;
        collectedAt: Date;
    }>;
    findAll(query: PaginationDto & {
        billId?: string;
        collectedById?: string;
        from?: string;
        to?: string;
    }, currentUser: any): Promise<{
        data: ({
            bill: {
                id: string;
                chemist: {
                    id: string;
                    shopName: string;
                    ownerName: string;
                };
                status: import("@prisma/client").$Enums.BillStatus;
                totalAmount: import("@prisma/client-runtime-utils").Decimal;
                billNumber: string;
                paidAmount: import("@prisma/client-runtime-utils").Decimal;
                dueAmount: import("@prisma/client-runtime-utils").Decimal;
            };
            collectedBy: {
                id: string;
                name: string;
                employeeCode: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            notes: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            referenceNumber: string | null;
            billId: string;
            paymentMode: import("@prisma/client").$Enums.PaymentMode;
            collectedById: string;
            collectedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, currentUser: any): Promise<{
        bill: {
            id: string;
            chemist: {
                id: string;
                shopName: string;
                ownerName: string;
            };
            status: import("@prisma/client").$Enums.BillStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            billNumber: string;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            dueAmount: import("@prisma/client-runtime-utils").Decimal;
        };
        collectedBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        referenceNumber: string | null;
        billId: string;
        paymentMode: import("@prisma/client").$Enums.PaymentMode;
        collectedById: string;
        collectedAt: Date;
    }>;
    getCollectionSummary(currentUser: any, from?: string, to?: string): Promise<{
        totalCollected: number | import("@prisma/client-runtime-utils").Decimal;
        totalTransactions: number;
        byMode: {
            mode: import("@prisma/client").$Enums.PaymentMode;
            amount: number | import("@prisma/client-runtime-utils").Decimal;
            count: number;
        }[];
    }>;
}
