import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

const makePrisma = () => ({
  territory: { findMany: jest.fn() },
});

const mockTerritory = {
  id: 1,
  name: 'North Zone',
  code: 'NZ',
  city: { name: 'Noida', district: { name: 'Gautam Buddha Nagar', state: { name: 'Uttar Pradesh' } } },
  employeeTerritories: [],
  _count: { doctors: 3, chemists: 2, visits: 40 },
};

describe('DashboardService — territory stats', () => {
  let service: DashboardService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(DashboardService);
  });

  // Doctors and chemists are soft-deleted by flipping isActive to false, so an
  // unfiltered relation count reports records the user has already deleted.
  it('counts only active doctors and chemists', async () => {
    prisma.territory.findMany.mockResolvedValue([]);

    await service.getTerritoryStats();

    const { include } = prisma.territory.findMany.mock.calls[0][0];
    expect(include._count.select.doctors).toEqual({ where: { isActive: true } });
    expect(include._count.select.chemists).toEqual({ where: { isActive: true } });
  });

  // Visits carry no soft-delete flag — they are historical fact and stay counted
  // even once the doctor or chemist they were logged against is deleted.
  it('counts every visit, deleted counterparty or not', async () => {
    prisma.territory.findMany.mockResolvedValue([]);

    await service.getTerritoryStats();

    const { include } = prisma.territory.findMany.mock.calls[0][0];
    expect(include._count.select.visits).toBe(true);
  });

  it('only reports active territories', async () => {
    prisma.territory.findMany.mockResolvedValue([]);

    await service.getTerritoryStats();

    expect(prisma.territory.findMany.mock.calls[0][0].where).toEqual({ isActive: true });
  });

  it('maps the counts onto the response', async () => {
    prisma.territory.findMany.mockResolvedValue([mockTerritory]);

    const [stats] = await service.getTerritoryStats();

    expect(stats.stats).toEqual({ doctors: 3, chemists: 2, totalVisits: 40 });
  });
});
