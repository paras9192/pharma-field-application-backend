import { Role } from './role.enum';

// The frontend has an identical list in src/utils/roles.ts. These two drifting is
// what broke user updates: the DB and the frontend both knew about ASM and ZSM
// while this enum still listed four roles.
describe('Role', () => {
  it('covers every role in the Prisma RoleName enum', () => {
    expect(Object.values(Role).sort()).toEqual(
      ['ADMIN', 'ASM', 'MR', 'SALES_PERSON', 'SUPER_ADMIN', 'ZSM'].sort(),
    );
  });
});
