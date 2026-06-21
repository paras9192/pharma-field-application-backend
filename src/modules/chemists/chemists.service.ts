import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChemistDto } from './dto/create-chemist.dto';
import { UpdateChemistDto } from './dto/update-chemist.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class ChemistsService {
  constructor(private prisma: PrismaService) {}

  async getAssignedChemistIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.salesPersonChemist.findMany({
      where: { userId },
      select: { chemistId: true },
    });
    return rows.map((r) => r.chemistId);
  }

  private withAssignedSalesPerson<T extends { salesPersons?: { user: { id: string; name: string } }[] }>(
    chemist: T,
  ) {
    const { salesPersons, ...rest } = chemist as any;
    return {
      ...rest,
      assignedSalesPerson: salesPersons?.[0]?.user ?? null,
    };
  }

  async create(dto: CreateChemistDto, addedById: string) {
    return this.prisma.chemist.create({
      data: { ...dto, addedById },
      include: { territory: true, addedBy: { select: { id: true, name: true } } },
    });
  }

  async findAll(
    query: PaginationDto & { territoryId?: number; isActive?: string },
    currentUser?: any,
  ) {
    const { page = 1, limit = 20, search, territoryId, isActive } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (currentUser?.role?.name === Role.SALES_PERSON) {
      const assignedIds = await this.getAssignedChemistIds(currentUser.id);
      where.id = { in: assignedIds };
    }

    if (search) {
      where.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (territoryId) where.territoryId = Number(territoryId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.chemist.findMany({
        where,
        skip,
        take,
        include: {
          territory: true,
          addedBy: { select: { id: true, name: true } },
          salesPersons: { select: { user: { select: { id: true, name: true } } }, take: 1 },
        },
        orderBy: { shopName: 'asc' },
      }),
      this.prisma.chemist.count({ where }),
    ]);

    return buildPaginatedResponse(data.map((c) => this.withAssignedSalesPerson(c)), total, page, limit);
  }

  async findOne(id: string) {
    const chemist = await this.prisma.chemist.findUnique({
      where: { id },
      include: {
        territory: { include: { city: { include: { district: { include: { state: true } } } } } },
        addedBy: { select: { id: true, name: true } },
        salesPersons: { select: { user: { select: { id: true, name: true } } }, take: 1 },
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 10,
          include: { products: true, user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!chemist) throw new NotFoundException('Chemist not found');
    return this.withAssignedSalesPerson(chemist);
  }

  async update(id: string, dto: UpdateChemistDto) {
    await this.findOne(id);
    return this.prisma.chemist.update({
      where: { id },
      data: dto,
      include: { territory: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.chemist.update({ where: { id }, data: { isActive: false } });
    return { message: 'Chemist deactivated successfully' };
  }
}
