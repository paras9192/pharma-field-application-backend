import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcryptjs');
const bcryptCompare = bcrypt.compare as jest.Mock;
const bcryptHash = bcrypt.hash as jest.Mock;

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '9876543210',
  passwordHash: 'hashed_password',
  isActive: true,
  employeeCode: 'EMP001',
  profilePhoto: null,
  role: { id: 'role-1', name: 'MR' },
};

const makePrisma = () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn().mockResolvedValue({}),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
});

const makeJwt = () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
});

const makeConfig = () => ({
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1d',
    };
    return map[key];
  }),
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let jwtService: ReturnType<typeof makeJwt>;

  beforeEach(async () => {
    prisma = makePrisma();
    jwtService = makeJwt();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: makeConfig() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── validateUser ───────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('returns user when credentials are correct', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'Password1');

      expect(result).toEqual(mockUser);
      expect(bcryptCompare).toHaveBeenCalledWith('Password1', mockUser.passwordHash);
    });

    it('returns null when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('missing@example.com', 'Password1');

      expect(result).toBeNull();
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('returns null when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.validateUser('test@example.com', 'Password1');

      expect(result).toBeNull();
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('returns null when password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'WrongPassword1');

      expect(result).toBeNull();
    });
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns accessToken, refreshToken, and user data', async () => {
      prisma.refreshToken.create.mockResolvedValue({});
      jwtService.sign.mockReturnValue('access.token.here');

      const result = await service.login(mockUser);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role.name,
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('stores a hashed refresh token (not the raw value)', async () => {
      prisma.refreshToken.create.mockResolvedValue({});
      jwtService.sign.mockReturnValue('access.token');

      const result = await service.login(mockUser);

      const createCall = prisma.refreshToken.create.mock.calls[0][0];
      expect(createCall.data.tokenHash).not.toEqual(result.refreshToken);
    });
  });

  // ─── setPassword ────────────────────────────────────────────────────────────

  describe('setPassword', () => {
    it('updates passwordHash when token is valid', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', type: 'set-password' });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptHash.mockResolvedValue('new_hashed_password');
      prisma.user.update.mockResolvedValue({ ...mockUser, passwordHash: 'new_hashed_password' });

      const result = await service.setPassword('valid.token', 'NewPassword1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new_hashed_password' },
      });
      expect(result).toHaveProperty('message');
    });

    it('throws ForbiddenException when JWT is invalid', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('jwt malformed'); });

      await expect(service.setPassword('bad.token', 'NewPassword1'))
        .rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when token type is not set-password', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', type: 'access' });

      await expect(service.setPassword('wrong-type.token', 'NewPassword1'))
        .rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when user is not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'ghost-id', type: 'set-password' });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.setPassword('valid.token', 'NewPassword1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ─── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('deletes the specific refresh token when provided', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('user-1', 'some-refresh-token');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
      );
    });

    it('deletes all refresh tokens when none is provided', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.logout('user-1');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
