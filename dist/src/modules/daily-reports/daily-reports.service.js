"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const role_enum_1 = require("../../common/enums/role.enum");
const mail_service_1 = require("../../mail/mail.service");
function toUTCDate(dateStr) {
    return new Date(dateStr.split('T')[0] + 'T00:00:00.000Z');
}
function todayUTC() {
    return new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
}
let DailyReportsService = class DailyReportsService {
    prisma;
    mail;
    constructor(prisma, mail) {
        this.prisma = prisma;
        this.mail = mail;
    }
    async computeVisitCounts(userId, date) {
        const [totalVisits, doctorVisits, chemistVisits] = await Promise.all([
            this.prisma.visit.count({ where: { userId, visitDate: date } }),
            this.prisma.visit.count({ where: { userId, visitDate: date, visitType: 'DOCTOR' } }),
            this.prisma.visit.count({ where: { userId, visitDate: date, visitType: 'CHEMIST' } }),
        ]);
        return { totalVisits, doctorVisits, chemistVisits };
    }
    async create(userId, dto) {
        const date = toUTCDate(dto.date);
        const existing = await this.prisma.dailyReport.findUnique({
            where: { userId_date: { userId, date } },
        });
        if (existing)
            throw new common_1.ConflictException('Report for this date already exists. Use update instead.');
        const counts = await this.computeVisitCounts(userId, date);
        const report = await this.prisma.dailyReport.create({
            data: {
                userId,
                date,
                ...counts,
                productsDiscussed: dto.productsDiscussed,
                competitorActivity: dto.competitorActivity,
                highlights: dto.highlights,
                challenges: dto.challenges,
                remarks: dto.remarks,
                status: dto.status || 'DRAFT',
                submittedAt: dto.status === 'SUBMITTED' ? new Date() : undefined,
            },
            include: { user: { select: { id: true, name: true } } },
        });
        this.mail.notifyDailyReport(report);
        return report;
    }
    async update(id, dto, currentUser) {
        const report = await this.prisma.dailyReport.findUnique({ where: { id } });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        if ((currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) &&
            report.userId !== currentUser.id) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (report.status === 'SUBMITTED' && dto.status !== 'SUBMITTED') {
            throw new common_1.BadRequestException('Cannot edit a submitted report');
        }
        const counts = await this.computeVisitCounts(report.userId, report.date);
        return this.prisma.dailyReport.update({
            where: { id },
            data: {
                ...dto,
                ...counts,
                submittedAt: dto.status === 'SUBMITTED' ? new Date() : report.submittedAt,
            },
            include: { user: { select: { id: true, name: true } } },
        });
    }
    async submit(id, currentUser) {
        const report = await this.prisma.dailyReport.findUnique({ where: { id } });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        if ((currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) &&
            report.userId !== currentUser.id) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (report.status === 'SUBMITTED') {
            throw new common_1.BadRequestException('Report already submitted');
        }
        const counts = await this.computeVisitCounts(report.userId, report.date);
        const submitted = await this.prisma.dailyReport.update({
            where: { id },
            data: { status: 'SUBMITTED', submittedAt: new Date(), ...counts },
            include: { user: { select: { id: true, name: true } } },
        });
        this.mail.notifyDailyReport(submitted);
        return submitted;
    }
    async findAll(query, currentUser) {
        const { page = 1, limit = 20, from, to, status } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            where.userId = currentUser.id;
        }
        else if (query.userId) {
            where.userId = query.userId;
        }
        if (status)
            where.status = status;
        if (from || to) {
            where.date = {};
            if (from)
                where.date.gte = toUTCDate(from);
            if (to)
                where.date.lte = toUTCDate(to);
        }
        const [data, total] = await Promise.all([
            this.prisma.dailyReport.findMany({
                where,
                skip,
                take,
                include: { user: { select: { id: true, name: true } } },
                orderBy: { date: 'desc' },
            }),
            this.prisma.dailyReport.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async findOne(id, currentUser) {
        const report = await this.prisma.dailyReport.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true } } },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        if ((currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) &&
            report.userId !== currentUser.id) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const freshCounts = await this.computeVisitCounts(report.userId, report.date);
        return { ...report, ...freshCounts };
    }
    async getMyTodayReport(userId) {
        const today = todayUTC();
        const report = await this.prisma.dailyReport.findUnique({
            where: { userId_date: { userId, date: today } },
            include: { user: { select: { id: true, name: true } } },
        });
        if (!report)
            return null;
        const freshCounts = await this.computeVisitCounts(userId, report.date);
        return { ...report, ...freshCounts };
    }
};
exports.DailyReportsService = DailyReportsService;
exports.DailyReportsService = DailyReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], DailyReportsService);
//# sourceMappingURL=daily-reports.service.js.map