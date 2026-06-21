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
        shopName: string;
        ownerName: string;
        alternatePhone: string | null;
        gstNumber: string | null;
        address: string | null;
        territoryId: number | null;
        addedById: string | null;
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
        shopName: string;
        ownerName: string;
        alternatePhone: string | null;
        gstNumber: string | null;
        address: string | null;
        territoryId: number | null;
        addedById: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
