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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const dayjs_1 = __importDefault(require("dayjs"));
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkIn(userId, dto) {
        const today = (0, dayjs_1.default)().startOf('day').toDate();
        const existing = await this.prisma.attendance.findUnique({
            where: { userId_date: { userId, date: today } },
        });
        if (existing)
            throw new common_1.ConflictException('Already checked in for today');
        return this.prisma.attendance.create({
            data: {
                userId,
                date: today,
                checkInTime: new Date(),
                checkInLat: dto.lat,
                checkInLng: dto.lng,
                checkInAddress: dto.address,
                notes: dto.notes,
                status: 'PRESENT',
            },
            include: { user: { select: { id: true, name: true } } },
        });
    }
    async checkOut(userId, dto) {
        const today = (0, dayjs_1.default)().startOf('day').toDate();
        const attendance = await this.prisma.attendance.findUnique({
            where: { userId_date: { userId, date: today } },
        });
        if (!attendance)
            throw new common_1.BadRequestException('Not checked in today');
        if (attendance.checkOutTime)
            throw new common_1.ConflictException('Already checked out today');
        const checkOutTime = new Date();
        const checkInTime = attendance.checkInTime;
        const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        const status = workingHours < 4 ? 'HALF_DAY' : 'PRESENT';
        return this.prisma.attendance.update({
            where: { userId_date: { userId, date: today } },
            data: {
                checkOutTime,
                checkOutLat: dto.lat,
                checkOutLng: dto.lng,
                checkOutAddress: dto.address,
                workingHours,
                status,
                notes: dto.notes ?? attendance.notes,
            },
            include: { user: { select: { id: true, name: true } } },
        });
    }
    async getTodayAttendance(userId) {
        const today = (0, dayjs_1.default)().startOf('day').toDate();
        const record = await this.prisma.attendance.findUnique({
            where: { userId_date: { userId, date: today } },
            include: { user: { select: { id: true, name: true } } },
        });
        return record || null;
    }
    async getMyAttendance(userId, query) {
        return this.getAttendanceList({ ...query, userId });
    }
    async getAttendanceList(query) {
        const { page = 1, limit = 20, userId, from, to, date } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (userId)
            where.userId = userId;
        if (date) {
            where.date = (0, dayjs_1.default)(date).startOf('day').toDate();
        }
        else if (from || to) {
            where.date = {};
            if (from)
                where.date.gte = (0, dayjs_1.default)(from).startOf('day').toDate();
            if (to)
                where.date.lte = (0, dayjs_1.default)(to).endOf('day').toDate();
        }
        const [data, total] = await Promise.all([
            this.prisma.attendance.findMany({
                where,
                skip,
                take,
                include: { user: { select: { id: true, name: true, employeeCode: true } } },
                orderBy: { date: 'desc' },
            }),
            this.prisma.attendance.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async getAttendanceById(id) {
        const record = await this.prisma.attendance.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true } } },
        });
        if (!record)
            throw new common_1.NotFoundException('Attendance record not found');
        return record;
    }
    async getDailyPresent(date) {
        const targetDate = date
            ? (0, dayjs_1.default)(date).startOf('day').toDate()
            : (0, dayjs_1.default)().startOf('day').toDate();
        return this.prisma.attendance.findMany({
            where: { date: targetDate, status: { in: ['PRESENT', 'HALF_DAY'] } },
            include: {
                user: { select: { id: true, name: true, employeeCode: true, role: true } },
            },
        });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map