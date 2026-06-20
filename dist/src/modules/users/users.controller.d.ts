import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
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
            userId: string;
            territoryId: number;
            assignedAt: Date;
            assignedById: string | null;
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
}
