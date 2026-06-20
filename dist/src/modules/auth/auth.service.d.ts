import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    validateUser(email: string, password: string): Promise<({
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
            description: string | null;
        };
    } & {
        id: string;
        name: string;
        email: string;
        phone: string;
        employeeCode: string | null;
        passwordHash: string;
        roleId: number;
        profilePhoto: string | null;
        dateOfJoining: Date | null;
        isActive: boolean;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    login(user: any): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: any;
            employeeCode: any;
            profilePhoto: any;
        };
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: any;
            employeeCode: any;
            profilePhoto: any;
        };
    }>;
    logout(userId: string, refreshToken?: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<{
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
            description: string | null;
        };
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
        id: string;
        name: string;
        email: string;
        phone: string;
        employeeCode: string | null;
        roleId: number;
        profilePhoto: string | null;
        dateOfJoining: Date | null;
        isActive: boolean;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
