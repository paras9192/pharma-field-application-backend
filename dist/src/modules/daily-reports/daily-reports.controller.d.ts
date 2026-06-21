import { DailyReportsService } from './daily-reports.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class DailyReportsController {
    private dailyReportsService;
    constructor(dailyReportsService: DailyReportsService);
    create(currentUser: any, dto: CreateDailyReportDto): Promise<{
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        date: Date;
        productsDiscussed: string | null;
        competitorActivity: string | null;
        highlights: string | null;
        challenges: string | null;
        remarks: string | null;
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        submittedAt: Date | null;
    }>;
    findAll(currentUser: any, query: PaginationDto & {
        userId?: string;
        from?: string;
        to?: string;
        status?: string;
    }): Promise<{
        data: ({
            user: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.ReportStatus;
            date: Date;
            productsDiscussed: string | null;
            competitorActivity: string | null;
            highlights: string | null;
            challenges: string | null;
            remarks: string | null;
            totalVisits: number;
            doctorVisits: number;
            chemistVisits: number;
            submittedAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getMyTodayReport(userId: string): Promise<({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        date: Date;
        productsDiscussed: string | null;
        competitorActivity: string | null;
        highlights: string | null;
        challenges: string | null;
        remarks: string | null;
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        submittedAt: Date | null;
    }) | null>;
    findOne(id: string, currentUser: any): Promise<{
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        date: Date;
        productsDiscussed: string | null;
        competitorActivity: string | null;
        highlights: string | null;
        challenges: string | null;
        remarks: string | null;
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        submittedAt: Date | null;
    }>;
    update(id: string, dto: UpdateDailyReportDto, currentUser: any): Promise<{
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        date: Date;
        productsDiscussed: string | null;
        competitorActivity: string | null;
        highlights: string | null;
        challenges: string | null;
        remarks: string | null;
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        submittedAt: Date | null;
    }>;
    submit(id: string, currentUser: any): Promise<{
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        date: Date;
        productsDiscussed: string | null;
        competitorActivity: string | null;
        highlights: string | null;
        challenges: string | null;
        remarks: string | null;
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        submittedAt: Date | null;
    }>;
}
