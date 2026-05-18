
import { RULES } from '@shared/permissions/rules'
import type { Permission } from './types'
import type { User } from '@/entities/user/model/types'
import { ROLE_PERMISSIONS } from './rolePermissions'

type CanParams<E = unknown> = {
  permission: Permission
  user?: User | null
  entity?: E
}

export function can<E>({
  permission,
  user,
  entity,
}: CanParams<E>): boolean {
  if (!user) return false

  // 1️⃣ RBAC
  const hasStaticPermission = user.roles.some((role) =>
    ROLE_PERMISSIONS[role]?.includes(permission),
  )

  if (!hasStaticPermission) return false

  // 2️⃣ ABAC (optional)
  const rule = RULES[permission]
  if (!rule) return true

  return rule({ user, entity })
}
