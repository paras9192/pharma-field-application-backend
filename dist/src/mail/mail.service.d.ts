import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class MailService {
    private config;
    private prisma;
    private readonly logger;
    private transporter;
    constructor(config: ConfigService, prisma: PrismaService);
    private getSuperAdminEmails;
    private send;
    sendWelcomeEmail(user: {
        name: string;
        email: string;
        employeeCode?: string | null;
    }, token: string): void;
    notifyDailyReport(report: {
        id: string;
        date: Date;
        status: string;
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        highlights?: string | null;
        challenges?: string | null;
        remarks?: string | null;
        user: {
            name: string;
        };
    }): Promise<void>;
    notifyVisit(visit: {
        id: string;
        visitType: string;
        visitDate: Date;
        purpose?: string | null;
        notes?: string | null;
        user: {
            name: string;
            employeeCode?: string | null;
        };
        doctor?: {
            name: string;
            specialization?: string | null;
            email?: string | null;
            clinicName?: string | null;
        } | null;
        chemist?: {
            shopName: string;
            ownerName?: string | null;
        } | null;
        territory?: {
            name: string;
        } | null;
    }): Promise<void>;
    notifyDoctor(visit: {
        visitDate: Date;
        notes?: string | null;
        products: {
            productName: string;
            details?: string | null;
            quantity?: string | null;
        }[];
        user: {
            name: string;
        };
        doctor?: {
            name: string;
            email: string | null;
            specialization?: string | null;
            clinicName?: string | null;
        } | null;
    }): Promise<void>;
}
