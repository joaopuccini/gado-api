export interface AcceptedOrganizationUser {
  readonly globalUserId: string;
  readonly name: string;
  readonly email: string;
}

export interface OrganizationMemberDirectory {
  findAccepted(
    organizationId: string,
    globalUserId: string,
  ): Promise<AcceptedOrganizationUser | null>;
}

export interface TeamMemberView {
  readonly localUserId: number;
  readonly globalUserId: string;
  readonly farmId: number;
  readonly role: string;
  readonly profileId: number | null;
  readonly active: boolean;
}

export interface ProfileView {
  readonly id: number;
  readonly farmId: number;
  readonly name: string;
  readonly description: string | null;
  readonly systemRole: string | null;
  readonly active: boolean;
  readonly permissionIds: readonly number[];
}

export interface TeamSummaryRecord {
  readonly farms: readonly { readonly id: number; readonly name: string }[];
  readonly members: readonly {
    readonly localUserId: number;
    readonly globalUserId: string;
    readonly name: string;
    readonly email: string;
    readonly farmIds: readonly number[];
    readonly role: string;
    readonly profileId: number | null;
    readonly active: boolean;
  }[];
  readonly profiles: readonly ProfileView[];
  readonly permissions: readonly {
    readonly id: number;
    readonly code: string;
    readonly name: string;
  }[];
}

export interface TeamMembershipRepository {
  assignMembership(input: {
    user: AcceptedOrganizationUser;
    farmId: number;
    role: string;
    profileId: number | null;
  }): Promise<TeamMemberView>;
  deactivateMembership(input: {
    localUserId: number;
    farmId: number;
  }): Promise<TeamMemberView | null>;
}

export interface ProfileRepository {
  findActiveRole(localUserId: number, farmId: number): Promise<string | null>;
  findByName(farmId: number, name: string): Promise<ProfileView | null>;
  findById(farmId: number, profileId: number): Promise<ProfileView | null>;
  findActivePermissionIds(ids: readonly number[]): Promise<readonly number[]>;
  create(input: {
    farmId: number;
    name: string;
    description: string | null;
    permissionIds: readonly number[];
  }): Promise<ProfileView>;
  update(
    profileId: number,
    input: {
      name: string;
      description: string | null;
      permissionIds: readonly number[];
    },
  ): Promise<ProfileView>;
}

export interface TeamRepository
  extends TeamMembershipRepository, ProfileRepository {
  getSummary(farmIds: readonly number[]): Promise<TeamSummaryRecord>;
}

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');
export const ORGANIZATION_MEMBER_DIRECTORY = Symbol(
  'ORGANIZATION_MEMBER_DIRECTORY',
);
