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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const daily_reports_service_1 = require("./daily-reports.service");
const create_daily_report_dto_1 = require("./dto/create-daily-report.dto");
const update_daily_report_dto_1 = require("./dto/update-daily-report.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let DailyReportsController = class DailyReportsController {
    dailyReportsService;
    constructor(dailyReportsService) {
        this.dailyReportsService = dailyReportsService;
    }
    create(currentUser, dto) {
        return this.dailyReportsService.create(currentUser.id, dto);
    }
    findAll(currentUser, query) {
        return this.dailyReportsService.findAll(query, currentUser);
    }
    getMyTodayReport(userId) {
        return this.dailyReportsService.getMyTodayReport(userId);
    }
    findOne(id, currentUser) {
        return this.dailyReportsService.findOne(id, currentUser);
    }
    update(id, dto, currentUser) {
        return this.dailyReportsService.update(id, dto, currentUser);
    }
    submit(id, currentUser) {
        return this.dailyReportsService.submit(id, currentUser);
    }
};
exports.DailyReportsController = DailyReportsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a daily working report' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_daily_report_dto_1.CreateDailyReportDto]),
    __metadata("design:returntype", void 0)
], DailyReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List daily reports' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED'] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DailyReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, swagger_1.ApiOperation)({ summary: "Get today's report (auto-creates if missing)" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DailyReportsController.prototype, "getMyTodayReport", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific daily report' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DailyReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a daily report' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_daily_report_dto_1.UpdateDailyReportDto, Object]),
    __metadata("design:returntype", void 0)
], DailyReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a daily report' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DailyReportsController.prototype, "submit", null);
exports.DailyReportsController = DailyReportsController = __decorate([
    (0, swagger_1.ApiTags)('Daily Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('daily-reports'),
    __metadata("design:paramtypes", [daily_reports_service_1.DailyReportsService])
], DailyReportsController);
//# sourceMappingURL=daily-reports.controller.js.map