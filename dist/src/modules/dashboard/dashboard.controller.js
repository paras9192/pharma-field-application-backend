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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getAdminDashboard(date) {
        return this.dashboardService.getAdminDashboard(date);
    }
    getMyDashboard(userId, date) {
        return this.dashboardService.getEmployeeDashboard(userId, date);
    }
    getTerritoryStats() {
        return this.dashboardService.getTerritoryStats();
    }
    getEmployeePerformance(from, to) {
        return this.dashboardService.getEmployeePerformance(from, to);
    }
    getSuperAdminDashboard(date) {
        return this.dashboardService.getSuperAdminDashboard(date);
    }
    getPaymentDashboard(currentUser, month, year, from, to, status, chemistId, collectedById) {
        return this.dashboardService.getPaymentDashboard(currentUser, {
            month: month ? Number(month) : undefined,
            year: year ? Number(year) : undefined,
            from,
            to,
            status,
            chemistId,
            collectedById,
        });
    }
    getSalesPersonDashboard(currentUser, userId, date) {
        const targetId = currentUser.role.name === role_enum_1.Role.SALES_PERSON ? currentUser.id : (userId ?? currentUser.id);
        return this.dashboardService.getSalesPersonDashboard(targetId, date);
    }
    getMRDashboard(currentUser, userId, date) {
        const targetId = currentUser.role.name === role_enum_1.Role.MR ? currentUser.id : (userId ?? currentUser.id);
        return this.dashboardService.getMRDashboard(targetId, date);
    }
    getAlerts(currentUser) {
        return this.dashboardService.getAlerts(currentUser);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('admin'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin/Super Admin dashboard with daily overview' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getAdminDashboard", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Employee personal dashboard (visits, attendance, follow-ups)' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getMyDashboard", null);
__decorate([
    (0, common_1.Get)('territories'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Territory coverage stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getTerritoryStats", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Employee performance report for a date range' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getEmployeePerformance", null);
__decorate([
    (0, common_1.Get)('super-admin'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Super Admin overview — full org KPIs, revenue/collection trends, leaderboards, alerts',
    }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Target date (defaults to today)' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getSuperAdminDashboard", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN, role_enum_1.Role.SALES_PERSON),
    (0, swagger_1.ApiOperation)({
        summary: 'Payment analytics — KPIs, aging buckets, salesperson ranking, upcoming collections, high-risk accounts',
    }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false, description: 'Month number 1-12 (use with year)' }),
    (0, swagger_1.ApiQuery)({ name: 'year', required: false, description: 'Full year e.g. 2026 (use with month)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Custom range start date YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Custom range end date YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter bills by status: UNPAID | PARTIAL | PAID' }),
    (0, swagger_1.ApiQuery)({ name: 'chemistId', required: false, description: 'Filter by chemist ID' }),
    (0, swagger_1.ApiQuery)({ name: 'collectedById', required: false, description: 'Filter by collector user ID (SA/Admin only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('chemistId')),
    __param(7, (0, common_1.Query)('collectedById')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getPaymentDashboard", null);
__decorate([
    (0, common_1.Get)('sales-person'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN, role_enum_1.Role.SALES_PERSON),
    (0, swagger_1.ApiOperation)({
        summary: 'Sales Person dashboard — collection tasks, overdue bills, today\'s schedule, monthly performance',
        description: 'SALES_PERSON sees their own data. SUPER_ADMIN/ADMIN can pass ?userId= to view any salesperson.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Target user ID (SUPER_ADMIN/ADMIN only)' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getSalesPersonDashboard", null);
__decorate([
    (0, common_1.Get)('mr'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN, role_enum_1.Role.MR),
    (0, swagger_1.ApiOperation)({
        summary: 'MR dashboard — visit KPIs, today\'s schedule, follow-ups, monthly productivity',
        description: 'MR sees their own data. SUPER_ADMIN/ADMIN can pass ?userId= to view any MR.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Target user ID (SUPER_ADMIN/ADMIN only)' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getMRDashboard", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, swagger_1.ApiOperation)({
        summary: 'Role-aware system alerts — overdue bills, absent employees, pending follow-ups, missing check-ins',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getAlerts", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map