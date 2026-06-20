import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDoctorDto, addedById: string) {
    return this.prisma.doctor.create({
      data: { ...dto, addedById },
      include: { territory: true, addedBy: { select: { id: true, name: true } } },
    });
  }

  async findAll(query: PaginationDto & { territoryId?: number; isActive?: string }) {
    const { page = 1, limit = 20, search, territoryId, isActive } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { clinicName: { contains: search, mode: 'insensitive' } },
        { hospitalName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (territoryId) where.territoryId = Number(territoryId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip,
        take,
        include: {
          territory: true,
          addedBy: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        territory: { include: { city: { include: { district: { include: { state: true } } } } } },
        addedBy: { select: { id: true, name: true } },
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 10,
          include: { products: true, user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.findOne(id);
    return this.prisma.doctor.update({
      where: { id },
      data: dto,
      include: { territory: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.doctor.update({ where: { id }, data: { isActive: false } });
    return { message: 'Doctor deactivated successfully' };
  }
}
