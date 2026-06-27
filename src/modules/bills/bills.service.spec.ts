import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChemistsService } from '../chemists/chemists.service';
import { S3Service } from '../../common/s3/s3.service';

const mockChemist = { id: 'chemist-1', shopName: 'MediShop', ownerName: 'Owner', phone: '9876543210' };

const mockBill = {
  id: 'bill-1',
  billNumber: 'BILL-20260624-1234',
  originalBillId: 'ORG-001',
  chemistId: 'chemist-1',
  totalAmount: 5000,
  dueAmount: 5000,
  dueDate: null,
  notes: null,
  createdById: 'user-1',
  chemist: mockChemist,
  order: null,
  createdBy: { id: 'user-1', name: 'Test User', employeeCode: 'EMP001' },
  payments: [],
  settlements: [],
  images: [],
};

const makePrisma = () => ({
  bill: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  chemist: {
    findUnique: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  billSettlement: {
    create: jest.fn(),
  },
  billImage: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
});

const makeChemistService = () => ({
  findOne: jest.fn(),
});

const makeS3 = () => ({
  deleteFile: jest.fn(),
  getSignedUrl: jest.fn(),
  uploadFile: jest.fn(),
});

describe('BillsService', () => {
  let service: BillsService;
  let prisma: ReturnType<typeof makePrisma>;

  const mrUser = { id: 'user-1', role: { name: 'MR' } };
  const asmUser = { id: 'user-2', role: { name: 'ASM' } };
  const adminUser = { id: 'user-3', role: { name: 'ADMIN' } };
  const salesUser = { id: 'user-4', role: { name: 'SALES_PERSON' } };

  beforeEach(async () => {
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ChemistsService, useValue: makeChemistService() },
        { provide: S3Service, useValue: makeS3() },
      ],
    }).compile();

    service = module.get<BillsService>(BillsService);
    jest.clearAllMocks();
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { chemistId: 'chemist-1', totalAmount: 5000, originalBillId: 'ORG-001' };

    it('throws UnauthorizedException for MR users', async () => {
      await expect(service.create('user-1', dto as any, mrUser))
        .rejects.toThrow(UnauthorizedException);

      expect(prisma.bill.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for SALES_PERSON users', async () => {
      await expect(service.create('user-4', dto as any, salesUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('allows ADMIN to create bill with originalBillId', async () => {
      prisma.chemist.findUnique.mockResolvedValue(mockChemist);
      prisma.bill.create.mockResolvedValue(mockBill);

      const result = await service.create('user-3', dto as any, adminUser);

      expect(prisma.bill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ originalBillId: 'ORG-001' }),
        }),
      );
      expect(result).toHaveProperty('id');
    });

    it('allows ASM to create a bill', async () => {
      prisma.chemist.findUnique.mockResolvedValue(mockChemist);
      prisma.bill.create.mockResolvedValue(mockBill);

      await expect(service.create('user-2', dto as any, asmUser)).resolves.toBeDefined();
    });

    it('throws NotFoundException when chemist does not exist', async () => {
      prisma.chemist.findUnique.mockResolvedValue(null);

      await expect(service.create('user-3', dto as any, adminUser))
        .rejects.toThrow(NotFoundException);
    });

    it('generates a billNumber automatically', async () => {
      prisma.chemist.findUnique.mockResolvedValue(mockChemist);
      prisma.bill.create.mockResolvedValue(mockBill);

      await service.create('user-3', dto as any, adminUser);

      const createCall = prisma.bill.create.mock.calls[0][0];
      expect(createCall.data.billNumber).toMatch(/^BILL-\d{8}-\d{4}$/);
    });

    it('stores undefined when originalBillId is not provided', async () => {
      prisma.chemist.findUnique.mockResolvedValue(mockChemist);
      prisma.bill.create.mockResolvedValue({ ...mockBill, originalBillId: null });

      await service.create('user-3', { chemistId: 'chemist-1', totalAmount: 5000 } as any, adminUser);

      const createCall = prisma.bill.create.mock.calls[0][0];
      expect(createCall.data.originalBillId).toBeUndefined();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns bill when found by ADMIN', async () => {
      prisma.bill.findUnique.mockResolvedValue(mockBill);

      const result = await service.findOne('bill-1', adminUser);

      expect(result).toEqual(mockBill);
    });

    it('returns bill when found by MR (MR can view bills)', async () => {
      prisma.bill.findUnique.mockResolvedValue(mockBill);

      const result = await service.findOne('bill-1', mrUser);

      expect(result).toEqual(mockBill);
    });

    it('throws NotFoundException when bill does not exist', async () => {
      prisma.bill.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost-id', adminUser))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated bills for ADMIN', async () => {
      prisma.bill.findMany.mockResolvedValue([mockBill]);
      prisma.bill.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 } as any, adminUser);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });

    it('returns paginated bills for MR (no role restriction on listing)', async () => {
      prisma.bill.findMany.mockResolvedValue([mockBill]);
      prisma.bill.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 } as any, mrUser);

      expect(result).toHaveProperty('data');
      expect(result.meta.total).toBe(1);
    });
  });
});
