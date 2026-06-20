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
exports.TerritoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let TerritoriesService = class TerritoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createState(dto) {
        const existing = await this.prisma.state.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException('State code already exists');
        return this.prisma.state.create({ data: dto });
    }
    async findAllStates() {
        return this.prisma.state.findMany({ orderBy: { name: 'asc' } });
    }
    async findStateWithDistricts(id) {
        const state = await this.prisma.state.findUnique({
            where: { id },
            include: { districts: { orderBy: { name: 'asc' } } },
        });
        if (!state)
            throw new common_1.NotFoundException('State not found');
        return state;
    }
    async createDistrict(dto) {
        const state = await this.prisma.state.findUnique({ where: { id: dto.stateId } });
        if (!state)
            throw new common_1.NotFoundException('State not found');
        const existing = await this.prisma.district.findUnique({
            where: { name_stateId: { name: dto.name, stateId: dto.stateId } },
        });
        if (existing)
            throw new common_1.ConflictException('District already exists in this state');
        return this.prisma.district.create({
            data: dto,
            include: { state: true },
        });
    }
    async findDistrictsByState(stateId) {
        return this.prisma.district.findMany({
            where: stateId ? { stateId } : {},
            include: { state: true },
            orderBy: { name: 'asc' },
        });
    }
    async findDistrictWithCities(id) {
        const district = await this.prisma.district.findUnique({
            where: { id },
            include: { state: true, cities: { orderBy: { name: 'asc' } } },
        });
        if (!district)
            throw new common_1.NotFoundException('District not found');
        return district;
    }
    async createCity(dto) {
        const district = await this.prisma.district.findUnique({ where: { id: dto.districtId } });
        if (!district)
            throw new common_1.NotFoundException('District not found');
        const existing = await this.prisma.city.findUnique({
            where: { name_districtId: { name: dto.name, districtId: dto.districtId } },
        });
        if (existing)
            throw new common_1.ConflictException('City already exists in this district');
        return this.prisma.city.create({
            data: dto,
            include: { district: { include: { state: true } } },
        });
    }
    async findCitiesByDistrict(districtId) {
        return this.prisma.city.findMany({
            where: districtId ? { districtId } : {},
            include: { district: { include: { state: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async createTerritory(dto) {
        const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
        if (!city)
            throw new common_1.NotFoundException('City not found');
        if (dto.code) {
            const existing = await this.prisma.territory.findUnique({ where: { code: dto.code } });
            if (existing)
                throw new common_1.ConflictException('Territory code already exists');
        }
        return this.prisma.territory.create({
            data: dto,
            include: {
                city: { include: { district: { include: { state: true } } } },
            },
        });
    }
    async findAllTerritories(query) {
        const { page = 1, limit = 20, search, cityId, isActive } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (cityId)
            where.cityId = Number(cityId);
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.territory.findMany({
                where,
                skip,
                take,
                include: { city: { include: { district: { include: { state: true } } } } },
                orderBy: { name: 'asc' },
            }),
            this.prisma.territory.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async findOneTerritory(id) {
        const territory = await this.prisma.territory.findUnique({
            where: { id },
            include: {
                city: { include: { district: { include: { state: true } } } },
                employeeTerritories: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                    },
                },
            },
        });
        if (!territory)
            throw new common_1.NotFoundException('Territory not found');
        return territory;
    }
    async updateTerritory(id, data) {
        await this.findOneTerritory(id);
        return this.prisma.territory.update({
            where: { id },
            data,
            include: { city: { include: { district: { include: { state: true } } } } },
        });
    }
    async assignTerritory(dto, assignedById) {
        const [user, territory] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: dto.userId } }),
            this.prisma.territory.findUnique({ where: { id: dto.territoryId } }),
        ]);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!territory)
            throw new common_1.NotFoundException('Territory not found');
        const existing = await this.prisma.employeeTerritory.findUnique({
            where: { userId_territoryId: { userId: dto.userId, territoryId: dto.territoryId } },
        });
        if (existing)
            throw new common_1.ConflictException('Territory already assigned to this user');
        return this.prisma.employeeTerritory.create({
            data: { userId: dto.userId, territoryId: dto.territoryId, assignedById },
            include: {
                territory: { include: { city: { include: { district: { include: { state: true } } } } } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
    }
    async unassignTerritory(userId, territoryId) {
        const existing = await this.prisma.employeeTerritory.findUnique({
            where: { userId_territoryId: { userId, territoryId } },
        });
        if (!existing)
            throw new common_1.NotFoundException('Assignment not found');
        await this.prisma.employeeTerritory.delete({
            where: { userId_territoryId: { userId, territoryId } },
        });
        return { message: 'Territory unassigned successfully' };
    }
    async getUserTerritories(userId) {
        return this.prisma.employeeTerritory.findMany({
            where: { userId },
            include: {
                territory: { include: { city: { include: { district: { include: { state: true } } } } } },
            },
        });
    }
    async getFullHierarchy() {
        return this.prisma.state.findMany({
            orderBy: { name: 'asc' },
            include: {
                districts: {
                    orderBy: { name: 'asc' },
                    include: {
                        cities: {
                            orderBy: { name: 'asc' },
                            include: {
                                territories: { orderBy: { name: 'asc' } },
                            },
                        },
                    },
                },
            },
        });
    }
};
exports.TerritoriesService = TerritoriesService;
exports.TerritoriesService = TerritoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TerritoriesService);
//# sourceMappingURL=territories.service.js.map