import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../../mail/mail.service';
export declare class UsersService {
    private prisma;
    private authService;
    private mail;
    constructor(prisma: PrismaService, authService: AuthService, mail: MailService);
    create(dto: CreateUserDto, createdById: string): Promise<{
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
    getAssignedChemists(userId: string): Promise<({
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
    assignChemists(userId: string, chemistIds: string[], assignedById: string): Promise<({
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
    unassignChemist(userId: string, chemistId: string): Promise<{
        message: string;
    }>;
    adminResetPassword(userId: string, newPassword: string, currentUser: any): Promise<{
        message: string;
    }>;
}
