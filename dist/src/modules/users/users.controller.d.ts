import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { AssignChemistsDto } from './dto/assign-chemists.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto, currentUserId: string): Promise<{
        id: string;
        name: string;
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        phone: string;
        employeeCode: string | null;
        profilePhoto: string | null;
        dateOfJoining: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: {
            id: string;
            name: string;
        } | null;
    }>;
    findAll(query: PaginationDto & {
        role?: Role;
        isActive?: string;
    }): Promise<{
        data: {
            id: string;
            name: string;
            role: {
                id: number;
                name: import("@prisma/client").$Enums.RoleName;
            };
            email: string;
            phone: string;
            employeeCode: string | null;
            profilePhoto: string | null;
            dateOfJoining: Date | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        phone: string;
        employeeCode: string | null;
        profilePhoto: string | null;
        dateOfJoining: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: {
            id: string;
            name: string;
        } | null;
        employeeTerritories: ({
            territory: {
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
            };
        } & {
            id: number;
            territoryId: number;
            userId: string;
            assignedById: string | null;
            assignedAt: Date;
        })[];
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        phone: string;
        employeeCode: string | null;
        profilePhoto: string | null;
        dateOfJoining: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: {
            id: string;
            name: string;
        } | null;
    }>;
    toggleActive(id: string): Promise<{
        id: string;
        name: string;
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        phone: string;
        employeeCode: string | null;
        profilePhoto: string | null;
        dateOfJoining: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: {
            id: string;
            name: string;
        } | null;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(id: string, dto: AdminResetPasswordDto, currentUser: any): Promise<{
        message: string;
    }>;
    getAssignedChemists(id: string): Promise<({
        chemist: {
            id: string;
            phone: string;
            isActive: boolean;
            territory: {
                id: number;
                name: string;
            } | null;
            shopName: string;
            ownerName: string;
            gstNumber: string | null;
            address: string | null;
        };
        assignedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: number;
        userId: string;
        chemistId: string;
        assignedById: string | null;
        assignedAt: Date;
    })[]>;
    assignChemists(id: string, dto: AssignChemistsDto, adminId: string): Promise<({
        chemist: {
            id: string;
            phone: string;
            isActive: boolean;
            territory: {
                id: number;
                name: string;
            } | null;
            shopName: string;
            ownerName: string;
            gstNumber: string | null;
            address: string | null;
        };
        assignedBy: {
            id: string;
            name: string;
        } | null;
    } & {
        id: number;
        userId: string;
        chemistId: string;
        assignedById: string | null;
        assignedAt: Date;
    })[]>;
    unassignChemist(id: string, chemistId: string): Promise<{
        message: string;
    }>;
}
