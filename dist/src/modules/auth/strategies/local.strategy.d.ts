import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<{
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
