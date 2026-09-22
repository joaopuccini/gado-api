import { FarmHierarchyPolicy } from './farm-hierarchy.policy';

const FARMS = [
  { id: 10, parentId: null, active: true },
  { id: 20, parentId: 10, active: true },
  { id: 30, parentId: 10, active: true },
  { id: 40, parentId: 10, active: false },
  { id: 50, parentId: null, active: true },
] as const;

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
    expect(() =>
      policy.resolveAccessibleFarmIds({
        selectedFarmId: 40,
        selectedRole: 'DONO',
        membershipFarmIds: [40],
        farms: FARMS,
      }),
    ).toThrow(expect.objectContaining({ code: 'farmInactive' }));
    expect(() =>
      policy.resolveAccessibleFarmIds({
        selectedFarmId: 50,
        selectedRole: 'DONO',
        membershipFarmIds: [10],
        farms: FARMS,
      }),
    ).toThrow(expect.objectContaining({ code: 'farmAccessDenied' }));
  });

  it('accepts only an active root as parent', () => {
    expect(() =>
      policy.assertValidParent({
        farmId: undefined,
        parentId: 10,
        farms: FARMS,
      }),
    ).not.toThrow();
    expect(() =>
      policy.assertValidParent({
        farmId: undefined,
        parentId: 20,
        farms: FARMS,
      }),
    ).toThrow(expect.objectContaining({ code: 'invalidFarmHierarchy' }));
    expect(() =>
      policy.assertValidParent({
        farmId: undefined,
        parentId: 40,
        farms: FARMS,
      }),
    ).toThrow(expect.objectContaining({ code: 'invalidFarmHierarchy' }));
  });

  it('rejects self-parent and a cycle when editing hierarchy', () => {
    expect(() =>
      policy.assertValidParent({ farmId: 10, parentId: 10, farms: FARMS }),
    ).toThrow(expect.objectContaining({ code: 'invalidFarmHierarchy' }));
    expect(() =>
      policy.assertValidParent({ farmId: 10, parentId: 20, farms: FARMS }),
    ).toThrow(expect.objectContaining({ code: 'invalidFarmHierarchy' }));
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
