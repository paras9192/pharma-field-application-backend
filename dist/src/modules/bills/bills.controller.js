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
exports.BillsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path_1 = require("path");
const bills_service_1 = require("./bills.service");
const create_bill_dto_1 = require("./dto/create-bill.dto");
const create_settlement_dto_1 = require("./dto/create-settlement.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const ALLOWED_TYPES = /\.(jpg|jpeg|png|pdf|webp)$/i;
const billImageStorage = (0, multer_1.diskStorage)({
    destination: './uploads/bills',
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `bill-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
    },
});
let BillsController = class BillsController {
    billsService;
    constructor(billsService) {
        this.billsService = billsService;
    }
    create(currentUser, dto) {
        return this.billsService.create(currentUser.id, dto, currentUser);
    }
    findAll(currentUser, query) {
        return this.billsService.findAll(query, currentUser);
    }
    findOne(id, currentUser) {
        return this.billsService.findOne(id, currentUser);
    }
    uploadBillImages(id, files, currentUser) {
        if (!files || files.length === 0)
            throw new common_1.BadRequestException('No files uploaded');
        const invalid = files.filter((f) => !ALLOWED_TYPES.test((0, path_1.extname)(f.originalname)));
        if (invalid.length > 0) {
            throw new common_1.BadRequestException('Only JPG, PNG, PDF, or WEBP files are allowed');
        }
        const mapped = files.map((f) => ({
            path: `/uploads/bills/${f.filename}`,
            filename: f.originalname,
        }));
        return this.billsService.uploadBillImages(id, mapped, currentUser);
    }
    deleteBillImage(id, imageId) {
        return this.billsService.deleteBillImage(id, imageId);
    }
    createSettlement(currentUser, dto) {
        return this.billsService.createSettlement(currentUser.id, dto, currentUser);
    }
    getSettlements(id, currentUser) {
        return this.billsService.getSettlements(id, currentUser);
    }
};
exports.BillsController = BillsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a bill — SA/Admin only. SP → 403, MR → 401' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_bill_dto_1.CreateBillDto]),
    __metadata("design:returntype", void 0)
], BillsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List bills' }),
    (0, swagger_1.ApiQuery)({ name: 'chemistId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['UNPAID', 'PARTIAL', 'PAID'] }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BillsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bill details with payment history, settlements and images' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BillsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/upload'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN, role_enum_1.Role.SALES_PERSON, role_enum_1.Role.MR),
    (0, swagger_1.ApiOperation)({ summary: 'Upload one or more bill images / PDF scans (max 10 files, 10 MB each)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                files: { type: 'array', items: { type: 'string', format: 'binary' } },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        storage: billImageStorage,
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", void 0)
], BillsController.prototype, "uploadBillImages", null);
__decorate([
    (0, common_1.Delete)(':id/images/:imageId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN, role_enum_1.Role.SALES_PERSON, role_enum_1.Role.MR),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a specific bill image' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('imageId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], BillsController.prototype, "deleteBillImage", null);
__decorate([
    (0, common_1.Post)('settlements'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SALES_PERSON, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Record a settlement (goods return, credit note, discount) against a bill' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_settlement_dto_1.CreateSettlementDto]),
    __metadata("design:returntype", void 0)
], BillsController.prototype, "createSettlement", null);
__decorate([
    (0, common_1.Get)(':id/settlements'),
    (0, swagger_1.ApiOperation)({ summary: 'List all settlements for a bill' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BillsController.prototype, "getSettlements", null);
exports.BillsController = BillsController = __decorate([
    (0, swagger_1.ApiTags)('Bills'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('bills'),
    __metadata("design:paramtypes", [bills_service_1.BillsService])
], BillsController);
//# sourceMappingURL=bills.controller.js.map