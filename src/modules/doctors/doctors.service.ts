import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/s3/s3.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';

const DOCTOR_INCLUDE = {
  territory: true,
  addedBy: { select: { id: true, name: true } },
  images: {
    select: { id: true, url: true, filename: true, createdAt: true,
      uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  async create(dto: CreateDoctorDto, addedById: string) {
    const { latitude, longitude, locationCapturedAt, birthday, anniversary, ...rest } = dto;
    return this.prisma.doctor.create({
      data: {
        ...rest,
        addedById,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        locationCapturedAt: locationCapturedAt ? new Date(locationCapturedAt) : undefined,
        birthday: birthday ? new Date(birthday) : undefined,
        anniversary: anniversary ? new Date(anniversary) : undefined,
      },
      include: DOCTOR_INCLUDE,
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
        include: DOCTOR_INCLUDE,
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
        images: {
          select: { id: true, url: true, filename: true, createdAt: true,
            uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
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

  async update(id: string, dto: UpdateDoctorDto, currentUser: any) {
    const doctor = await this.findOne(id);

    if (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) {
      if (doctor.addedBy?.id !== currentUser.id) {
        throw new ForbiddenException('You can only edit doctors you created');
      }
    }

    const { birthday, anniversary, ...rest } = dto;
    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...rest,
        ...(birthday !== undefined ? { birthday: new Date(birthday) } : {}),
        ...(anniversary !== undefined ? { anniversary: new Date(anniversary) } : {}),
      },
      include: DOCTOR_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.doctor.update({ where: { id }, data: { isActive: false } });
    return { message: 'Doctor deactivated successfully' };
  }

  async uploadImages(id: string, files: Array<{ path: string; filename: string }>, currentUser: any) {
    await this.findOne(id);

    await this.prisma.doctorImage.createMany({
      data: files.map((f) => ({
        doctorId: id,
        url: f.path,
        filename: f.filename,
        uploadedById: currentUser.id,
      })),
    });

    return this.findOne(id);
  }

  async deleteImage(doctorId: string, imageId: number, currentUser: any) {
    const image = await this.prisma.doctorImage.findFirst({ where: { id: imageId, doctorId } });
    if (!image) throw new NotFoundException('Image not found on this doctor');

    if (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) {
      if (image.uploadedById !== currentUser.id) {
        throw new ForbiddenException('You can only delete images you uploaded');
      }
    }

    await this.s3.deleteObject(image.url).catch(() => {});
    await this.prisma.doctorImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted' };
  }
}
