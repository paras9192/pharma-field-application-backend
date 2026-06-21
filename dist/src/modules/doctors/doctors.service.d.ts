import { PrismaService } from '../../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class DoctorsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateDoctorDto, addedById: string): Promise<{
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
            userId: string;
            chemistId: string | null;
            status: import("@prisma/client").$Enums.VisitStatus;
            notes: string | null;
            visitDate: Date;
            visitType: import("@prisma/client").$Enums.VisitType;
            doctorId: string | null;
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
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
    }>;
    update(id: string, dto: UpdateDoctorDto): Promise<{
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
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
