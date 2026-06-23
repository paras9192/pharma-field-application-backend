import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MailService } from '../../mail/mail.service';
export declare class DailyReportsService {
    private prisma;
    private mail;
    constructor(prisma: PrismaService, mail: MailService);
    private computeVisitCounts;
    create(userId: string, dto: CreateDailyReportDto): Promise<{
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
    findAll(query: PaginationDto & {
        userId?: string;
        from?: string;
        to?: string;
        status?: string;
    }, currentUser: any): Promise<{
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
    findOne(id: string, currentUser: any): Promise<{
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        user: {
            id: string;
            name: string;
        };
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
        submittedAt: Date | null;
    }>;
    getMyTodayReport(userId: string): Promise<{
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        user: {
            id: string;
            name: string;
        };
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
        submittedAt: Date | null;
    } | null>;
}
