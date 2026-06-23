import { ChemistsService } from './chemists.service';
import { CreateChemistDto } from './dto/create-chemist.dto';
import { UpdateChemistDto } from './dto/update-chemist.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class ChemistsController {
    private chemistsService;
    constructor(chemistsService: ChemistsService);
    create(dto: CreateChemistDto, currentUser: any): Promise<{
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
        salesPersons: {
            user: {
                id: string;
                name: string;
            };
        }[];
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
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        shopName: string;
        ownerName: string;
        alternatePhone: string | null;
        gstNumber: string | null;
        address: string | null;
        territoryId: number | null;
        addedById: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        locationCapturedAt: Date | null;
    }>;
    findAll(query: PaginationDto & {
        territoryId?: number;
        isActive?: string;
    }, currentUser: any): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateChemistDto, currentUser: any): Promise<{
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
        salesPersons: {
            user: {
                id: string;
                name: string;
            };
        }[];
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
        email: string | null;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        shopName: string;
        ownerName: string;
        alternatePhone: string | null;
        gstNumber: string | null;
        address: string | null;
        territoryId: number | null;
        addedById: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        locationCapturedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    uploadImages(id: string, files: Express.Multer.File[], currentUser: any): Promise<any>;
    deleteImage(id: string, imageId: number, currentUser: any): Promise<{
        message: string;
    }>;
}
