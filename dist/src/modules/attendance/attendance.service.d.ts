import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class AttendanceService {
    private prisma;
    constructor(prisma: PrismaService);
    checkIn(userId: string, dto: CheckInDto): Promise<{
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        date: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        checkInTime: Date | null;
        checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkInAddress: string | null;
        checkOutTime: Date | null;
        checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutAddress: string | null;
        workingHours: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    checkOut(userId: string, dto: CheckOutDto): Promise<{
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        date: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        checkInTime: Date | null;
        checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkInAddress: string | null;
        checkOutTime: Date | null;
        checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutAddress: string | null;
        workingHours: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    getTodayAttendance(userId: string): Promise<({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        date: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        checkInTime: Date | null;
        checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkInAddress: string | null;
        checkOutTime: Date | null;
        checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutAddress: string | null;
        workingHours: import("@prisma/client-runtime-utils").Decimal | null;
    }) | null>;
    getMyAttendance(userId: string, query: PaginationDto & {
        from?: string;
        to?: string;
    }): Promise<{
        data: ({
            user: {
                id: string;
                name: string;
                employeeCode: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            date: Date;
            notes: string | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            checkInTime: Date | null;
            checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkInAddress: string | null;
            checkOutTime: Date | null;
            checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutAddress: string | null;
            workingHours: import("@prisma/client-runtime-utils").Decimal | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAttendanceList(query: PaginationDto & {
        userId?: string;
        from?: string;
        to?: string;
        date?: string;
    }): Promise<{
        data: ({
            user: {
                id: string;
                name: string;
                employeeCode: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            date: Date;
            notes: string | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            checkInTime: Date | null;
            checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkInAddress: string | null;
            checkOutTime: Date | null;
            checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutAddress: string | null;
            workingHours: import("@prisma/client-runtime-utils").Decimal | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAttendanceById(id: string): Promise<{
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        date: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        checkInTime: Date | null;
        checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkInAddress: string | null;
        checkOutTime: Date | null;
        checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutAddress: string | null;
        workingHours: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    getDailyPresent(date?: string): Promise<({
        user: {
            id: string;
            name: string;
            role: {
                id: number;
                name: import("@prisma/client").$Enums.RoleName;
                description: string | null;
            };
            employeeCode: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        date: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        checkInTime: Date | null;
        checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkInAddress: string | null;
        checkOutTime: Date | null;
        checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
        checkOutAddress: string | null;
        workingHours: import("@prisma/client-runtime-utils").Decimal | null;
    })[]>;
}
