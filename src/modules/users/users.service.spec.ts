import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../../mail/mail.service';

jest.mock('bcryptjs');
const bcryptCompare = bcrypt.compare as jest.Mock;
const bcryptHash = bcrypt.hash as jest.Mock;

const mockRole = { id: 'role-mr', name: 'MR' };
const mockAdminRole = { id: 'role-admin', name: 'ADMIN' };
const mockSuperAdminRole = { id: 'role-sa', name: 'SUPER_ADMIN' };

const mockUser = {
  id: 'user-1',
  name: 'Test MR',
  email: 'mr@example.com',
  phone: '9876543210',
  passwordHash: 'hashed_old_password',
  isActive: true,
  employeeCode: 'EMP001',
  profilePhoto: null,
  dateOfJoining: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: mockRole,
  createdBy: null,
  employeeTerritories: [],
};

const makePrisma = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  salesPersonChemist: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
  },
  chemist: {
    findMany: jest.fn(),
  },
});

const makeAuth = () => ({
  generateWelcomeToken: jest.fn().mockReturnValue('welcome.token'),
});

const makeMail = () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  notifyUserUpdated: jest.fn(),
  notifyUserStatusChanged: jest.fn(),
  notifyChemistAssignment: jest.fn(),
  notifyChemistUnassignment: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;
  let mail: ReturnType<typeof makeMail>;

  beforeEach(async () => {
    prisma = makePrisma();
    mail = makeMail();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: makeAuth() },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ─── changePassword ──────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('updates passwordHash when current password is correct', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(true);
      bcryptHash.mockResolvedValue('hashed_new_password');
      prisma.user.update.mockResolvedValue({ ...mockUser, passwordHash: 'hashed_new_password' });

      const result = await service.changePassword('user-1', {
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword1',
      });

      expect(bcryptCompare).toHaveBeenCalledWith('OldPassword1', mockUser.passwordHash);
      expect(bcryptHash).toHaveBeenCalledWith('NewPassword1', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'hashed_new_password' },
      });
      expect(result).toHaveProperty('message');
    });

    it('throws BadRequestException when current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(false);

      await expect(service.changePassword('user-1', {
        currentPassword: 'WrongPassword1',
        newPassword: 'NewPassword1',
      })).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('ghost-id', {
        currentPassword: 'Password1',
        newPassword: 'NewPassword1',
      })).rejects.toThrow(NotFoundException);
    });

    it('does not expose passwordHash in response', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(true);
      bcryptHash.mockResolvedValue('hashed_new_password');
      prisma.user.update.mockResolvedValue({});

      const result = await service.changePassword('user-1', {
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword1',
      });

      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  // ─── adminResetPassword ──────────────────────────────────────────────────────

  describe('adminResetPassword', () => {
    it('resets password for any user when called by SUPER_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptHash.mockResolvedValue('hashed_new_password');
      prisma.user.update.mockResolvedValue({});

      const superAdmin = { role: { name: 'SUPER_ADMIN' } };
      const result = await service.adminResetPassword('user-1', 'NewPassword1', superAdmin);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'hashed_new_password' },
      });
      expect(result).toHaveProperty('message');
    });

    it('throws ForbiddenException when ADMIN tries to reset SUPER_ADMIN password', async () => {
      const superAdminUser = { ...mockUser, role: mockSuperAdminRole };
      prisma.user.findUnique.mockResolvedValue(superAdminUser);

      const adminUser = { role: { name: 'ADMIN' } };

      await expect(service.adminResetPassword('superadmin-id', 'NewPassword1', adminUser))
        .rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.adminResetPassword('ghost-id', 'NewPassword1', { role: { name: 'SUPER_ADMIN' } }))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── update (role change) ────────────────────────────────────────────────────

  describe('update', () => {
    it('updates user role when requested by SUPER_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.role.findUnique.mockResolvedValue(mockAdminRole);
      prisma.user.update.mockResolvedValue({ ...mockUser, role: mockAdminRole });

      const superAdmin = { role: { name: 'SUPER_ADMIN' } };
      await service.update('user-1', { role: 'ADMIN' as any }, superAdmin);

      expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { name: 'ADMIN' } });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ roleId: mockAdminRole.id }) }),
      );
    });

    it('throws ForbiddenException when ADMIN tries to promote to SUPER_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const adminUser = { role: { name: 'ADMIN' } };

      await expect(service.update('user-1', { role: 'SUPER_ADMIN' as any }, adminUser))
        .rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when ADMIN tries to modify a SUPER_ADMIN user', async () => {
      const superAdminUser = { ...mockUser, role: mockSuperAdminRole };
      prisma.user.findUnique.mockResolvedValue(superAdminUser);

      const adminUser = { role: { name: 'ADMIN' } };

      await expect(service.update('superadmin-id', { role: 'ADMIN' as any }, adminUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when role does not exist in DB', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.update('user-1', { role: 'NONEXISTENT' as any }, { role: { name: 'SUPER_ADMIN' } }))
        .rejects.toThrow(BadRequestException);
    });

    it('checks for phone conflict when phone is changed', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.findFirst.mockResolvedValue({ id: 'other-user', phone: '9999999999' });

      await expect(service.update('user-1', { phone: '9999999999' }, {}))
        .rejects.toThrow(ConflictException);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates user, hashes password, and sends welcome email', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.user.findUnique
        .mockResolvedValueOnce(null)  // email check
        .mockResolvedValueOnce(null); // phone check
      bcryptHash.mockResolvedValue('hashed_pass');
      prisma.user.create.mockResolvedValue({ ...mockUser, id: 'new-user' });

      await service.create(
        { name: 'New MR', email: 'new@example.com', phone: '9111111111', password: 'Password1', role: 'MR' as any },
        'admin-id',
      );

      expect(bcryptHash).toHaveBeenCalledWith('Password1', 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ passwordHash: 'hashed_pass' }) }),
      );
      expect(mail.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email is already in use', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser)  // email taken
        .mockResolvedValueOnce(null);

      await expect(service.create(
        { name: 'New MR', email: 'mr@example.com', phone: '9000000000', password: 'Password1', role: 'MR' as any },
        'admin-id',
      )).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when role is not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(
        { name: 'New MR', email: 'new@example.com', phone: '9000000000', password: 'Password1', role: 'INVALID' as any },
        'admin-id',
      )).rejects.toThrow(BadRequestException);
    });
  });

  // ─── sendPasswordResetLink ───────────────────────────────────────────────────

  describe('sendPasswordResetLink', () => {
    it('sends reset email to active user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const superAdmin = { role: { name: 'SUPER_ADMIN' }, name: 'Super Admin' };
      const result = await service.sendPasswordResetLink('user-1', superAdmin);

      expect(mail.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('message');
    });

    it('throws BadRequestException when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.sendPasswordResetLink('user-1', { role: { name: 'SUPER_ADMIN' }, name: 'SA' }))
        .rejects.toThrow(BadRequestException);

      expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when ADMIN tries to send reset link to SUPER_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, role: mockSuperAdminRole });

      const adminUser = { role: { name: 'ADMIN' }, name: 'Admin' };

      await expect(service.sendPasswordResetLink('superadmin-id', adminUser))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
