import { ChemistsService } from './chemists.service';
import { CreateChemistDto } from './dto/create-chemist.dto';
import { UpdateChemistDto } from './dto/update-chemist.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class ChemistsController {
    private chemistsService;
    constructor(chemistsService: ChemistsService);
    create(dto: CreateChemistDto, userId: string): Promise<{
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
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        alternatePhone: string | null;
        address: string | null;
        addedById: string | null;
        shopName: string;
        ownerName: string;
        gstNumber: string | null;
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
            email: string | null;
            phone: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            territoryId: number | null;
            alternatePhone: string | null;
            address: string | null;
            addedById: string | null;
            shopName: string;
            ownerName: string;
            gstNumber: string | null;
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
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        alternatePhone: string | null;
        address: string | null;
        addedById: string | null;
        shopName: string;
        ownerName: string;
        gstNumber: string | null;
    }>;
    update(id: string, dto: UpdateChemistDto): Promise<{
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
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        territoryId: number | null;
        alternatePhone: string | null;
        address: string | null;
        addedById: string | null;
        shopName: string;
        ownerName: string;
        gstNumber: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
