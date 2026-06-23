import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class DoctorsController {
    private doctorsService;
    constructor(doctorsService: DoctorsService);
    create(dto: CreateDoctorDto, currentUser: any): Promise<{
        territory: {
            id: number;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            cityId: number;
        } | null;
        addedBy: {
            id: string;
            name: string;
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
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        alternatePhone: string | null;
        address: string | null;
        territoryId: number | null;
        addedById: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        locationCapturedAt: Date | null;
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
    }>;
    findAll(query: PaginationDto & {
        territoryId?: number;
        isActive?: string;
    }): Promise<{
        data: ({
            territory: {
                id: number;
                name: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string | null;
                cityId: number;
            } | null;
            addedBy: {
                id: string;
                name: string;
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
        } & {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            alternatePhone: string | null;
            address: string | null;
            territoryId: number | null;
            addedById: string | null;
            latitude: import("@prisma/client-runtime-utils").Decimal | null;
            longitude: import("@prisma/client-runtime-utils").Decimal | null;
            locationCapturedAt: Date | null;
            specialization: string | null;
            clinicName: string | null;
            hospitalName: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        visits: ({
            user: {
                id: string;
                name: string;
            };
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
        territory: ({
            city: {
                district: {
                    state: {
                        id: number;
                        name: string;
                        createdAt: Date;
                        code: string;
                    };
                } & {
                    id: number;
                    name: string;
                    createdAt: Date;
                    stateId: number;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                districtId: number;
            };
        } & {
            id: number;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            cityId: number;
        }) | null;
        addedBy: {
            id: string;
            name: string;
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
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        alternatePhone: string | null;
        address: string | null;
        territoryId: number | null;
        addedById: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        locationCapturedAt: Date | null;
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
    }>;
    update(id: string, dto: UpdateDoctorDto, currentUser: any): Promise<{
        territory: {
            id: number;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            cityId: number;
        } | null;
        addedBy: {
            id: string;
            name: string;
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
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        alternatePhone: string | null;
        address: string | null;
        territoryId: number | null;
        addedById: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        locationCapturedAt: Date | null;
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    uploadImages(id: string, files: Express.Multer.File[], currentUser: any): Promise<{
        visits: ({
            user: {
                id: string;
                name: string;
            };
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
        territory: ({
            city: {
                district: {
                    state: {
                        id: number;
                        name: string;
                        createdAt: Date;
                        code: string;
                    };
                } & {
                    id: number;
                    name: string;
                    createdAt: Date;
                    stateId: number;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                districtId: number;
            };
        } & {
            id: number;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            cityId: number;
        }) | null;
        addedBy: {
            id: string;
            name: string;
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
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        alternatePhone: string | null;
        address: string | null;
        territoryId: number | null;
        addedById: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        locationCapturedAt: Date | null;
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
    }>;
    deleteImage(id: string, imageId: number, currentUser: any): Promise<{
        message: string;
    }>;
}
