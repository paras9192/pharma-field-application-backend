import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
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
    }>;
}
export {};
