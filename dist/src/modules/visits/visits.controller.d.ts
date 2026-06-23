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
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
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
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            productName: string;
            quantity: string | null;
            visitId: string;
            details: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        locationCapturedAt: Date | null;
        userId: string;
        chemistId: string | null;
        status: import("@prisma/client").$Enums.VisitStatus;
        notes: string | null;
        doctorId: string | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
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
            chemist: {
                id: string;
                shopName: string;
                ownerName: string;
            } | null;
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
            doctor: {
                id: string;
                name: string;
                email: string | null;
                specialization: string | null;
                clinicName: string | null;
            } | null;
            products: {
                id: number;
                createdAt: Date;
                productName: string;
                quantity: string | null;
                visitId: string;
                details: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            territoryId: number | null;
            locationCapturedAt: Date | null;
            userId: string;
            chemistId: string | null;
            status: import("@prisma/client").$Enums.VisitStatus;
            notes: string | null;
            doctorId: string | null;
            visitDate: Date;
            visitType: import("@prisma/client").$Enums.VisitType;
            visitTime: Date;
            lat: import("@prisma/client-runtime-utils").Decimal | null;
            lng: import("@prisma/client-runtime-utils").Decimal | null;
            locationAddress: string | null;
            purpose: string | null;
            followUpDate: Date | null;
            followUpNotes: string | null;
            followUpDone: boolean;
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
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
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
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            productName: string;
            quantity: string | null;
            visitId: string;
            details: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        locationCapturedAt: Date | null;
        userId: string;
        chemistId: string | null;
        status: import("@prisma/client").$Enums.VisitStatus;
        notes: string | null;
        doctorId: string | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
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
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
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
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            productName: string;
            quantity: string | null;
            visitId: string;
            details: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        locationCapturedAt: Date | null;
        userId: string;
        chemistId: string | null;
        status: import("@prisma/client").$Enums.VisitStatus;
        notes: string | null;
        doctorId: string | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
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
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
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
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            productName: string;
            quantity: string | null;
            visitId: string;
            details: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        locationCapturedAt: Date | null;
        userId: string;
        chemistId: string | null;
        status: import("@prisma/client").$Enums.VisitStatus;
        notes: string | null;
        doctorId: string | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
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
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
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
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            productName: string;
            quantity: string | null;
            visitId: string;
            details: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        locationCapturedAt: Date | null;
        userId: string;
        chemistId: string | null;
        status: import("@prisma/client").$Enums.VisitStatus;
        notes: string | null;
        doctorId: string | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
    }>;
    uploadImages(id: string, files: Express.Multer.File[], currentUser: any): Promise<({
        user: {
            id: string;
            name: string;
            employeeCode: string | null;
        };
        territory: {
            id: number;
            name: string;
        } | null;
        chemist: {
            id: string;
            shopName: string;
            ownerName: string;
        } | null;
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
        doctor: {
            id: string;
            name: string;
            email: string | null;
            specialization: string | null;
            clinicName: string | null;
        } | null;
        products: {
            id: number;
            createdAt: Date;
            productName: string;
            quantity: string | null;
            visitId: string;
            details: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        locationCapturedAt: Date | null;
        userId: string;
        chemistId: string | null;
        status: import("@prisma/client").$Enums.VisitStatus;
        notes: string | null;
        doctorId: string | null;
        visitDate: Date;
        visitType: import("@prisma/client").$Enums.VisitType;
        visitTime: Date;
        lat: import("@prisma/client-runtime-utils").Decimal | null;
        lng: import("@prisma/client-runtime-utils").Decimal | null;
        locationAddress: string | null;
        purpose: string | null;
        followUpDate: Date | null;
        followUpNotes: string | null;
        followUpDone: boolean;
    }) | null>;
    deleteImage(id: string, imageId: number, currentUser: any): Promise<{
        message: string;
    }>;
}
