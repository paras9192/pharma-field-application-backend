import { PrismaService } from '../../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getAdminDashboard(date?: string): Promise<{
        date: string;
        summary: {
            totalEmployees: number;
            activeEmployees: number;
            presentToday: number;
            absentToday: number;
            totalVisitsToday: number;
            doctorVisitsToday: number;
            chemistVisitsToday: number;
            pendingFollowUps: number;
            reportsSubmittedToday: number;
            totalDoctors: number;
            totalChemists: number;
        };
        topPerformers: {
            user: {
                id: string;
                name: string;
                role: {
                    id: number;
                    name: import("@prisma/client").$Enums.RoleName;
                    description: string | null;
                };
                employeeCode: string | null;
            } | null;
            visitCount: number;
        }[];
        presentEmployees: ({
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
            notes: string | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            date: Date;
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
    }>;
    getEmployeeDashboard(userId: string, date?: string): Promise<{
        date: string;
        attendance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            notes: string | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            date: Date;
            checkInTime: Date | null;
            checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkInAddress: string | null;
            checkOutTime: Date | null;
            checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutAddress: string | null;
            workingHours: import("@prisma/client-runtime-utils").Decimal | null;
        } | null;
        summary: {
            todayVisits: number;
            doctorVisitsToday: number;
            chemistVisitsToday: number;
            pendingFollowUps: number;
            totalVisitsMonth: number;
            reportStatus: string;
        };
        recentVisits: ({
            doctor: {
                id: string;
                name: string;
            } | null;
            chemist: {
                id: string;
                shopName: string;
            } | null;
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
        upcomingFollowUps: ({
            doctor: {
                id: string;
                name: string;
            } | null;
            chemist: {
                id: string;
                shopName: string;
            } | null;
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
    }>;
    getTerritoryStats(): Promise<{
        id: number;
        name: string;
        code: string | null;
        location: {
            city: string;
            district: string;
            state: string;
        };
        assignedEmployees: number;
        employees: {
            id: string;
            name: string;
            role: {
                id: number;
                name: import("@prisma/client").$Enums.RoleName;
                description: string | null;
            };
        }[];
        stats: {
            doctors: number;
            chemists: number;
            totalVisits: number;
        };
    }[]>;
    getEmployeePerformance(from?: string, to?: string): Promise<{
        employee: {
            id: string;
            name: string;
            role: {
                id: number;
                name: import("@prisma/client").$Enums.RoleName;
                description: string | null;
            };
            employeeCode: string | null;
        };
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        daysPresent: number;
        reportsSubmitted: number;
    }[]>;
}
