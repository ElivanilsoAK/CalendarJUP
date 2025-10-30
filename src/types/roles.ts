export type UserRole = 'owner' | 'admin' | 'member';

export const USER_ROLES: Record<'OWNER' | 'ADMIN' | 'MEMBER', UserRole> = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};


