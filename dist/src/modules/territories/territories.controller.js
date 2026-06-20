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
exports.TerritoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const territories_service_1 = require("./territories.service");
const create_state_dto_1 = require("./dto/create-state.dto");
const create_district_dto_1 = require("./dto/create-district.dto");
const create_city_dto_1 = require("./dto/create-city.dto");
const create_territory_dto_1 = require("./dto/create-territory.dto");
const assign_territory_dto_1 = require("./dto/assign-territory.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let TerritoriesController = class TerritoriesController {
    territoriesService;
    constructor(territoriesService) {
        this.territoriesService = territoriesService;
    }
    getFullHierarchy() {
        return this.territoriesService.getFullHierarchy();
    }
    createState(dto) {
        return this.territoriesService.createState(dto);
    }
    findAllStates() {
        return this.territoriesService.findAllStates();
    }
    findStateWithDistricts(id) {
        return this.territoriesService.findStateWithDistricts(id);
    }
    createDistrict(dto) {
        return this.territoriesService.createDistrict(dto);
    }
    findDistrictsByState(stateId) {
        return this.territoriesService.findDistrictsByState(stateId);
    }
    findDistrictWithCities(id) {
        return this.territoriesService.findDistrictWithCities(id);
    }
    createCity(dto) {
        return this.territoriesService.createCity(dto);
    }
    findCitiesByDistrict(districtId) {
        return this.territoriesService.findCitiesByDistrict(districtId);
    }
    createTerritory(dto) {
        return this.territoriesService.createTerritory(dto);
    }
    findAllTerritories(query) {
        return this.territoriesService.findAllTerritories(query);
    }
    assignTerritory(dto, currentUserId) {
        return this.territoriesService.assignTerritory(dto, currentUserId);
    }
    unassignTerritory(userId, territoryId) {
        return this.territoriesService.unassignTerritory(userId, territoryId);
    }
    getUserTerritories(userId) {
        return this.territoriesService.getUserTerritories(userId);
    }
    findOneTerritory(id) {
        return this.territoriesService.findOneTerritory(id);
    }
    updateTerritory(id, data) {
        return this.territoriesService.updateTerritory(id, data);
    }
};
exports.TerritoriesController = TerritoriesController;
__decorate([
    (0, common_1.Get)('hierarchy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full State > District > City > Territory hierarchy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "getFullHierarchy", null);
__decorate([
    (0, common_1.Post)('states'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a state' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_state_dto_1.CreateStateDto]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "createState", null);
__decorate([
    (0, common_1.Get)('states'),
    (0, swagger_1.ApiOperation)({ summary: 'List all states' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "findAllStates", null);
__decorate([
    (0, common_1.Get)('states/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get state with its districts' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "findStateWithDistricts", null);
__decorate([
    (0, common_1.Post)('districts'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a district' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_district_dto_1.CreateDistrictDto]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "createDistrict", null);
__decorate([
    (0, common_1.Get)('districts'),
    (0, swagger_1.ApiOperation)({ summary: 'List districts by state' }),
    __param(0, (0, common_1.Query)('stateId', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "findDistrictsByState", null);
__decorate([
    (0, common_1.Get)('districts/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get district with its cities' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "findDistrictWithCities", null);
__decorate([
    (0, common_1.Post)('cities'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a city' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_city_dto_1.CreateCityDto]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "createCity", null);
__decorate([
    (0, common_1.Get)('cities'),
    (0, swagger_1.ApiOperation)({ summary: 'List cities by district' }),
    __param(0, (0, common_1.Query)('districtId', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "findCitiesByDistrict", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a territory' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_territory_dto_1.CreateTerritoryDto]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "createTerritory", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all territories' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "findAllTerritories", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Assign territory to an employee' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_territory_dto_1.AssignTerritoryDto, String]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "assignTerritory", null);
__decorate([
    (0, common_1.Delete)('assign/:userId/:territoryId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Unassign territory from an employee' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('territoryId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "unassignTerritory", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get territories assigned to a user' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "getUserTerritories", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get territory details with assigned employees' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "findOneTerritory", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update territory' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TerritoriesController.prototype, "updateTerritory", null);
exports.TerritoriesController = TerritoriesController = __decorate([
    (0, swagger_1.ApiTags)('Territories'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('territories'),
    __metadata("design:paramtypes", [territories_service_1.TerritoriesService])
], TerritoriesController);
//# sourceMappingURL=territories.controller.js.map