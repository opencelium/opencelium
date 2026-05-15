import type { Role } from './roles'
import type { Permission } from './types'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'user.read',
    'user.create',
    'user.update',
    'user.delete',
    'connector.read',
    'connector.create',
    'connector.update',
    'connector.delete',
  ],
  operator: [
    'connector.read',
  ],
  viewer: [
    'connector.read',
  ],
}
