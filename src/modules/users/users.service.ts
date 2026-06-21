import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../../mail/mail.service';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  employeeCode: true,
  profilePhoto: true,
  dateOfJoining: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private mail: MailService,
  ) {}

  async create(dto: CreateUserDto, createdById: string) {
    const [roleRecord, existingEmail, existingPhone] = await Promise.all([
      this.prisma.role.findUnique({ where: { name: dto.role } }),
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { phone: dto.phone } }),
    ]);

    if (!roleRecord) throw new BadRequestException(`Role ${dto.role} not found`);
    if (existingEmail) throw new ConflictException('Email already in use');
    if (existingPhone) throw new ConflictException('Phone already in use');

    if (dto.employeeCode) {
      const existing = await this.prisma.user.findUnique({
        where: { employeeCode: dto.employeeCode },
      });
      if (existing) throw new ConflictException('Employee code already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        roleId: roleRecord.id,
        employeeCode: dto.employeeCode,
        dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
        createdById,
      },
      select: USER_SELECT,
    });

    const token = this.authService.generateWelcomeToken(user.id, user.email);
    this.mail.sendWelcomeEmail(user, token);

    return user;
  }

  async findAll(query: PaginationDto & { role?: Role; isActive?: string }) {
    const { page = 1, limit = 20, search, role, isActive } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take, select: USER_SELECT, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        employeeTerritories: {
          include: {
            territory: {
              include: {
                city: { include: { district: { include: { state: true } } } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      });
      if (existing) throw new ConflictException('Phone already in use');
    }

    if (dto.employeeCode) {
      const existing = await this.prisma.user.findFirst({
        where: { employeeCode: dto.employeeCode, NOT: { id } },
      });
      if (existing) throw new ConflictException('Employee code already in use');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
      },
      select: USER_SELECT,
    });
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: USER_SELECT,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { message: 'Password changed successfully' };
  }

  async getAssignedChemists(userId: string) {
    await this.findOne(userId);
    return this.prisma.salesPersonChemist.findMany({
      where: { userId },
      include: {
        chemist: {
          select: {
            id: true, shopName: true, ownerName: true, phone: true,
            address: true, gstNumber: true, isActive: true,
            territory: { select: { id: true, name: true } },
          },
        },
        assignedBy: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async assignChemists(userId: string, chemistIds: string[], assignedById: string) {
    const user = await this.findOne(userId);
    if (user.role?.name !== Role.SALES_PERSON) {
      throw new BadRequestException('Chemists can only be assigned to SALES_PERSON role users');
    }

    const chemists = await this.prisma.chemist.findMany({
      where: { id: { in: chemistIds } },
      select: { id: true, shopName: true },
    });
    if (chemists.length !== chemistIds.length) {
      throw new NotFoundException('One or more chemist IDs not found');
    }

    // Remove any existing assignments for these chemists (auto-reassign)
    await this.prisma.salesPersonChemist.deleteMany({
      where: { chemistId: { in: chemistIds } },
    });

    await this.prisma.salesPersonChemist.createMany({
      data: chemistIds.map((chemistId) => ({ userId, chemistId, assignedById })),
    });

    return this.getAssignedChemists(userId);
  }

  async unassignChemist(userId: string, chemistId: string) {
    const record = await this.prisma.salesPersonChemist.findUnique({
      where: { userId_chemistId: { userId, chemistId } },
    });
    if (!record) throw new NotFoundException('Assignment not found');

    await this.prisma.salesPersonChemist.delete({
      where: { userId_chemistId: { userId, chemistId } },
    });

    return { message: 'Chemist unassigned successfully' };
  }

  async adminResetPassword(userId: string, newPassword: string, currentUser: any) {
    const target = await this.findOne(userId);
    if (
      currentUser.role.name === Role.ADMIN &&
      target.role?.name === Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Admins cannot reset a Super Admin password');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password reset successfully' };
  }
}
