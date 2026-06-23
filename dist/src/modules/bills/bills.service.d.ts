import { PrismaService } from '../../prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ChemistsService } from '../chemists/chemists.service';
export declare class BillsService {
    private prisma;
    private chemistsService;
    constructor(prisma: PrismaService, chemistsService: ChemistsService);
    private generateBillNumber;
    create(userId: string, dto: CreateBillDto, currentUser: any): Promise<{
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
        images: {
            url: string;
            id: number;
            createdAt: Date;
            filename: string;
            uploadedBy: {
                id: string;
                name: string;
            };
        }[];
        order: {
            id: string;
            orderNumber: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        } | null;
        payments: {
            id: string;
            notes: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            referenceNumber: string | null;
            paymentMode: import("@prisma/client").$Enums.PaymentMode;
            collectedAt: Date;
        }[];
        settlements: {
            id: string;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            };
            amount: import("@prisma/client-runtime-utils").Decimal;
            type: import("@prisma/client").$Enums.SettlementType;
            reason: string | null;
        }[];
    } & {
        id: string;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
        chemistId: string;
        status: import("@prisma/client").$Enums.BillStatus;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        notes: string | null;
        billNumber: string;
        orderId: string | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal;
        dueAmount: import("@prisma/client-runtime-utils").Decimal;
        dueDate: Date | null;
    }>;
    findAll(query: PaginationDto & {
        chemistId?: string;
        status?: string;
        from?: string;
        to?: string;
    }, currentUser: any): Promise<{
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
            images: {
                url: string;
                id: number;
                createdAt: Date;
                filename: string;
                uploadedBy: {
                    id: string;
                    name: string;
                };
            }[];
            order: {
                id: string;
                orderNumber: string;
                status: import("@prisma/client").$Enums.OrderStatus;
            } | null;
            payments: {
                id: string;
                notes: string | null;
                amount: import("@prisma/client-runtime-utils").Decimal;
                referenceNumber: string | null;
                paymentMode: import("@prisma/client").$Enums.PaymentMode;
                collectedAt: Date;
            }[];
            settlements: {
                id: string;
                createdAt: Date;
                createdBy: {
                    id: string;
                    name: string;
                };
                amount: import("@prisma/client-runtime-utils").Decimal;
                type: import("@prisma/client").$Enums.SettlementType;
                reason: string | null;
            }[];
        } & {
            id: string;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
            chemistId: string;
            status: import("@prisma/client").$Enums.BillStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            billNumber: string;
            orderId: string | null;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            dueAmount: import("@prisma/client-runtime-utils").Decimal;
            dueDate: Date | null;
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
        images: {
            url: string;
            id: number;
            createdAt: Date;
            filename: string;
            uploadedBy: {
                id: string;
                name: string;
            };
        }[];
        order: {
            id: string;
            orderNumber: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        } | null;
        payments: {
            id: string;
            notes: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            referenceNumber: string | null;
            paymentMode: import("@prisma/client").$Enums.PaymentMode;
            collectedAt: Date;
        }[];
        settlements: {
            id: string;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            };
            amount: import("@prisma/client-runtime-utils").Decimal;
            type: import("@prisma/client").$Enums.SettlementType;
            reason: string | null;
        }[];
    } & {
        id: string;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
        chemistId: string;
        status: import("@prisma/client").$Enums.BillStatus;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        notes: string | null;
        billNumber: string;
        orderId: string | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal;
        dueAmount: import("@prisma/client-runtime-utils").Decimal;
        dueDate: Date | null;
    }>;
    uploadBillImages(id: string, files: Array<{
        path: string;
        filename: string;
    }>, currentUser: any): Promise<({
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
        images: {
            url: string;
            id: number;
            createdAt: Date;
            filename: string;
            uploadedBy: {
                id: string;
                name: string;
            };
        }[];
        order: {
            id: string;
            orderNumber: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        } | null;
        payments: {
            id: string;
            notes: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            referenceNumber: string | null;
            paymentMode: import("@prisma/client").$Enums.PaymentMode;
            collectedAt: Date;
        }[];
        settlements: {
            id: string;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            };
            amount: import("@prisma/client-runtime-utils").Decimal;
            type: import("@prisma/client").$Enums.SettlementType;
            reason: string | null;
        }[];
    } & {
        id: string;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
        chemistId: string;
        status: import("@prisma/client").$Enums.BillStatus;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        notes: string | null;
        billNumber: string;
        orderId: string | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal;
        dueAmount: import("@prisma/client-runtime-utils").Decimal;
        dueDate: Date | null;
    }) | null>;
    deleteBillImage(billId: string, imageId: number): Promise<{
        message: string;
    }>;
    createSettlement(userId: string, dto: CreateSettlementDto, currentUser: any): Promise<{
        createdBy: {
            id: string;
            name: string;
        };
        bill: {
            id: string;
            status: import("@prisma/client").$Enums.BillStatus;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            billNumber: string;
            dueAmount: import("@prisma/client-runtime-utils").Decimal;
        };
    } & {
        id: string;
        createdById: string;
        createdAt: Date;
        amount: import("@prisma/client-runtime-utils").Decimal;
        billId: string;
        type: import("@prisma/client").$Enums.SettlementType;
        reason: string | null;
    }>;
    getSettlements(billId: string, currentUser: any): Promise<({
        createdBy: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
    } & {
        id: string;
        createdById: string;
        createdAt: Date;
        amount: import("@prisma/client-runtime-utils").Decimal;
        billId: string;
        type: import("@prisma/client").$Enums.SettlementType;
        reason: string | null;
    })[]>;
}
