import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class DoctorsController {
    private doctorsService;
    constructor(doctorsService: DoctorsService);
    create(dto: CreateDoctorDto, userId: string): Promise<{
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
        territoryId: number | null;
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
        alternatePhone: string | null;
        address: string | null;
        addedById: string | null;
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
            territoryId: number | null;
            specialization: string | null;
            clinicName: string | null;
            hospitalName: string | null;
            alternatePhone: string | null;
            address: string | null;
            addedById: string | null;
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
        territoryId: number | null;
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
        alternatePhone: string | null;
        address: string | null;
        addedById: string | null;
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
        territoryId: number | null;
        specialization: string | null;
        clinicName: string | null;
        hospitalName: string | null;
        alternatePhone: string | null;
        address: string | null;
        addedById: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
