import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStateDto } from './dto/create-state.dto';
import { CreateDistrictDto } from './dto/create-district.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { AssignTerritoryDto } from './dto/assign-territory.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  // ─── States ───────────────────────────────────────────────────────────────

  async createState(dto: CreateStateDto) {
    const existing = await this.prisma.state.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('State code already exists');
    return this.prisma.state.create({ data: dto });
  }

  async findAllStates() {
    return this.prisma.state.findMany({ orderBy: { name: 'asc' } });
  }

  async findStateWithDistricts(id: number) {
    const state = await this.prisma.state.findUnique({
      where: { id },
      include: { districts: { orderBy: { name: 'asc' } } },
    });
    if (!state) throw new NotFoundException('State not found');
    return state;
  }

  // ─── Districts ────────────────────────────────────────────────────────────

  async createDistrict(dto: CreateDistrictDto) {
    const state = await this.prisma.state.findUnique({ where: { id: dto.stateId } });
    if (!state) throw new NotFoundException('State not found');

    const existing = await this.prisma.district.findUnique({
      where: { name_stateId: { name: dto.name, stateId: dto.stateId } },
    });
    if (existing) throw new ConflictException('District already exists in this state');

    return this.prisma.district.create({
      data: dto,
      include: { state: true },
    });
  }

  async findDistrictsByState(stateId: number) {
    return this.prisma.district.findMany({
      where: { stateId },
      include: { state: true },
      orderBy: { name: 'asc' },
    });
  }

  async findDistrictWithCities(id: number) {
    const district = await this.prisma.district.findUnique({
      where: { id },
      include: { state: true, cities: { orderBy: { name: 'asc' } } },
    });
    if (!district) throw new NotFoundException('District not found');
    return district;
  }

  // ─── Cities ───────────────────────────────────────────────────────────────

  async createCity(dto: CreateCityDto) {
    const district = await this.prisma.district.findUnique({ where: { id: dto.districtId } });
    if (!district) throw new NotFoundException('District not found');

    const existing = await this.prisma.city.findUnique({
      where: { name_districtId: { name: dto.name, districtId: dto.districtId } },
    });
    if (existing) throw new ConflictException('City already exists in this district');

    return this.prisma.city.create({
      data: dto,
      include: { district: { include: { state: true } } },
    });
  }

  async findCitiesByDistrict(districtId: number) {
    return this.prisma.city.findMany({
      where: { districtId },
      include: { district: { include: { state: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Territories ──────────────────────────────────────────────────────────

  async createTerritory(dto: CreateTerritoryDto) {
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city) throw new NotFoundException('City not found');

    if (dto.code) {
      const existing = await this.prisma.territory.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Territory code already exists');
    }

    return this.prisma.territory.create({
      data: dto,
      include: {
        city: { include: { district: { include: { state: true } } } },
      },
    });
  }

  async findAllTerritories(query: PaginationDto & { cityId?: number; isActive?: string }) {
    const { page = 1, limit = 20, search, cityId, isActive } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (cityId) where.cityId = Number(cityId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

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

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOneTerritory(id: number) {
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
    if (!territory) throw new NotFoundException('Territory not found');
    return territory;
  }

  async updateTerritory(id: number, data: Partial<CreateTerritoryDto> & { isActive?: boolean }) {
    await this.findOneTerritory(id);
    return this.prisma.territory.update({
      where: { id },
      data,
      include: { city: { include: { district: { include: { state: true } } } } },
    });
  }

  // ─── Employee Territory Assignment ────────────────────────────────────────

  async assignTerritory(dto: AssignTerritoryDto, assignedById: string) {
    const [user, territory] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.territory.findUnique({ where: { id: dto.territoryId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!territory) throw new NotFoundException('Territory not found');

    const existing = await this.prisma.employeeTerritory.findUnique({
      where: { userId_territoryId: { userId: dto.userId, territoryId: dto.territoryId } },
    });
    if (existing) throw new ConflictException('Territory already assigned to this user');

    return this.prisma.employeeTerritory.create({
      data: { userId: dto.userId, territoryId: dto.territoryId, assignedById },
      include: {
        territory: { include: { city: { include: { district: { include: { state: true } } } } } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async unassignTerritory(userId: string, territoryId: number) {
    const existing = await this.prisma.employeeTerritory.findUnique({
      where: { userId_territoryId: { userId, territoryId } },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    await this.prisma.employeeTerritory.delete({
      where: { userId_territoryId: { userId, territoryId } },
    });
    return { message: 'Territory unassigned successfully' };
  }

  async getUserTerritories(userId: string) {
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
}
