import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class VisitsController {
    private visitsService;
    constructor(visitsService: VisitsService);
    create(currentUser: any, dto: CreateVisitDto): Promise<{
        user: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        territory: {
            id: number;
            name: string;
        } | null;
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            visitId: string;
            productName: string;
            details: string | null;
            quantity: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        territoryId: number | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        doctorId: string | null;
        chemistId: string | null;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        notes: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
        status: import("@prisma/client").$Enums.VisitStatus;
    }>;
    findAll(currentUser: any, query: PaginationDto & {
        userId?: string;
        visitType?: string;
        from?: string;
        to?: string;
        territoryId?: number;
        followUpPending?: string;
    }): Promise<{
        data: ({
            user: {
                id: string;
                name: string;
                employeeCode: string | null;
            };
            territory: {
                id: number;
                name: string;
            } | null;
            doctor: {
                id: string;
                name: string;
                email: string | null;
                specialization: string | null;
                clinicName: string | null;
            } | null;
            chemist: {
                id: string;
                shopName: string;
                ownerName: string;
            } | null;
            products: {
                id: number;
                createdAt: Date;
                visitId: string;
                productName: string;
                details: string | null;
                quantity: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            territoryId: number | null;
            visitDate: Date;
            visitType: import("@prisma/client").$Enums.VisitType;
            doctorId: string | null;
            chemistId: string | null;
            visitTime: Date;
            lat: import("@prisma/client-runtime-utils").Decimal | null;
            lng: import("@prisma/client-runtime-utils").Decimal | null;
            locationAddress: string | null;
            purpose: string | null;
            notes: string | null;
            followUpDate: Date | null;
            followUpNotes: string | null;
            followUpDone: boolean;
            status: import("@prisma/client").$Enums.VisitStatus;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPendingFollowUps(currentUser: any): Promise<({
        user: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        territory: {
            id: number;
            name: string;
        } | null;
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            visitId: string;
            productName: string;
            details: string | null;
            quantity: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        territoryId: number | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        doctorId: string | null;
        chemistId: string | null;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        notes: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
        status: import("@prisma/client").$Enums.VisitStatus;
    })[]>;
    findOne(id: string, currentUser: any): Promise<{
        user: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        territory: {
            id: number;
            name: string;
        } | null;
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            visitId: string;
            productName: string;
            details: string | null;
            quantity: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        territoryId: number | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        doctorId: string | null;
        chemistId: string | null;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        notes: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
        status: import("@prisma/client").$Enums.VisitStatus;
    }>;
    update(id: string, dto: UpdateVisitDto, currentUser: any): Promise<{
        user: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        territory: {
            id: number;
            name: string;
        } | null;
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            visitId: string;
            productName: string;
            details: string | null;
            quantity: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        territoryId: number | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        doctorId: string | null;
        chemistId: string | null;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        notes: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
        status: import("@prisma/client").$Enums.VisitStatus;
    }>;
    markFollowUpDone(id: string, currentUser: any): Promise<{
        user: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        territory: {
            id: number;
            name: string;
        } | null;
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            visitId: string;
            productName: string;
            details: string | null;
            quantity: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        territoryId: number | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        doctorId: string | null;
        chemistId: string | null;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        notes: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
        status: import("@prisma/client").$Enums.VisitStatus;
    }>;
}
