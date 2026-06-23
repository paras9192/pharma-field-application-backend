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
exports.ChemistsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path_1 = require("path");
const chemists_service_1 = require("./chemists.service");
const create_chemist_dto_1 = require("./dto/create-chemist.dto");
const update_chemist_dto_1 = require("./dto/update-chemist.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const chemistImageStorage = (0, multer_1.diskStorage)({
    destination: './uploads/chemists',
    filename: (_req, file, cb) => {
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `chemist-${suffix}${(0, path_1.extname)(file.originalname)}`);
    },
});
let ChemistsController = class ChemistsController {
    chemistsService;
    constructor(chemistsService) {
        this.chemistsService = chemistsService;
    }
    create(dto, currentUser) {
        return this.chemistsService.create(dto, currentUser.id);
    }
    findAll(query, currentUser) {
        return this.chemistsService.findAll(query, currentUser);
    }
    findOne(id) {
        return this.chemistsService.findOne(id);
    }
    update(id, dto, currentUser) {
        return this.chemistsService.update(id, dto, currentUser);
    }
    remove(id) {
        return this.chemistsService.remove(id);
    }
    uploadImages(id, files, currentUser) {
        if (!files || files.length === 0)
            throw new common_1.BadRequestException('No files uploaded');
        const invalid = files.filter((f) => !ALLOWED_IMAGE_TYPES.test((0, path_1.extname)(f.originalname)));
        if (invalid.length > 0)
            throw new common_1.BadRequestException('Only JPG, JPEG, PNG, or WEBP files are allowed');
        const mapped = files.map((f) => ({ path: `/uploads/chemists/${f.filename}`, filename: f.originalname }));
        return this.chemistsService.uploadImages(id, mapped, currentUser);
    }
    deleteImage(id, imageId, currentUser) {
        return this.chemistsService.deleteImage(id, imageId, currentUser);
    }
};
exports.ChemistsController = ChemistsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new chemist/customer' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_chemist_dto_1.CreateChemistDto, Object]),
    __metadata("design:returntype", void 0)
], ChemistsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List chemists (SALES_PERSON sees only their assigned chemists)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChemistsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chemist details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChemistsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update chemist details (MR/Sales Person can only edit their own records)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_chemist_dto_1.UpdateChemistDto, Object]),
    __metadata("design:returntype", void 0)
], ChemistsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a chemist' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChemistsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/images'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload chemist images (jpg/jpeg/png/webp, max 5 MB each, max 10 files)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        storage: chemistImageStorage,
        limits: { fileSize: MAX_FILE_SIZE },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", void 0)
], ChemistsController.prototype, "uploadImages", null);
__decorate([
    (0, common_1.Delete)(':id/images/:imageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a chemist image' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('imageId', common_1.ParseIntPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], ChemistsController.prototype, "deleteImage", null);
exports.ChemistsController = ChemistsController = __decorate([
    (0, swagger_1.ApiTags)('Chemists'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('chemists'),
    __metadata("design:paramtypes", [chemists_service_1.ChemistsService])
], ChemistsController);
//# sourceMappingURL=chemists.controller.js.map