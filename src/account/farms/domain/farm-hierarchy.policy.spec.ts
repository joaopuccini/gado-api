import { FarmHierarchyPolicy } from './farm-hierarchy.policy';

const FARMS = [
  { id: 10, parentId: null, active: true },
  { id: 20, parentId: 10, active: true },
  { id: 30, parentId: 10, active: true },
  { id: 40, parentId: 10, active: false },
  { id: 50, parentId: null, active: true },
] as const;

const expectErrorCode = (operation: () => unknown, code: string): void => {
  try {
    operation();
  } catch (error: unknown) {
    expect(error).toMatchObject({ code });
    return;
  }

  throw new Error(`Expected operation to throw ${code}`);
};

describe('FarmHierarchyPolicy', () => {
  const policy = new FarmHierarchyPolicy();

  it.each(['DONO', 'GESTOR'])(
    '%s at a root sees only linked active children',
    (role) => {
      expect(
        policy.resolveAccessibleFarmIds({
          selectedFarmId: 10,
          selectedRole: role,
          membershipFarmIds: [10, 20, 40],
          farms: FARMS,
        }),
      ).toEqual([10, 20]);
    },
  );

  it('a child selection never expands to its parent or sibling', () => {
    expect(
      policy.resolveAccessibleFarmIds({
        selectedFarmId: 20,
        selectedRole: 'DONO',
        membershipFarmIds: [10, 20, 30],
        farms: FARMS,
      }),
    ).toEqual([20]);
  });

  it('a non-manager root selection does not expand to children', () => {
    expect(
      policy.resolveAccessibleFarmIds({
        selectedFarmId: 10,
        selectedRole: 'COLABORADOR',
        membershipFarmIds: [10, 20],
        farms: FARMS,
      }),
    ).toEqual([10]);
  });

  it('fails closed when the selected farm is inactive or not linked', () => {
    expectErrorCode(
      () =>
        policy.resolveAccessibleFarmIds({
          selectedFarmId: 40,
          selectedRole: 'DONO',
          membershipFarmIds: [40],
          farms: FARMS,
        }),
      'farmInactive',
    );
    expectErrorCode(
      () =>
        policy.resolveAccessibleFarmIds({
          selectedFarmId: 50,
          selectedRole: 'DONO',
          membershipFarmIds: [10],
          farms: FARMS,
        }),
      'farmAccessDenied',
    );
  });

  it('accepts only an active root as parent', () => {
    expect(() =>
      policy.assertValidParent({
        farmId: undefined,
        parentId: 10,
        farms: FARMS,
      }),
    ).not.toThrow();
    expectErrorCode(
      () =>
        policy.assertValidParent({
          farmId: undefined,
          parentId: 20,
          farms: FARMS,
        }),
      'invalidFarmHierarchy',
    );
    expectErrorCode(
      () =>
        policy.assertValidParent({
          farmId: undefined,
          parentId: 40,
          farms: FARMS,
        }),
      'invalidFarmHierarchy',
    );
  });

  it('rejects self-parent and a cycle when editing hierarchy', () => {
    expectErrorCode(
      () =>
        policy.assertValidParent({ farmId: 10, parentId: 10, farms: FARMS }),
      'invalidFarmHierarchy',
    );
    expectErrorCode(
      () =>
        policy.assertValidParent({ farmId: 10, parentId: 20, farms: FARMS }),
      'invalidFarmHierarchy',
    );
  });

  it('returns an immutable access list', () => {
    const result = policy.resolveAccessibleFarmIds({
      selectedFarmId: 10,
      selectedRole: 'DONO',
      membershipFarmIds: [10, 20],
      farms: FARMS,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });
});
