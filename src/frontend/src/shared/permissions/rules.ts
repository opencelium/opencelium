import type {Permission} from "@shared/permissions/types.ts";
import type { PermissionRule } from "./ruleTypes";



export const RULES: Partial<Record<Permission, PermissionRule>> = {
  // owner-based example
  'connector.update': ({ user, entity }) => {
    if (!entity || typeof entity !== 'object') return false

    // runtime narrowing
    if ('ownerId' in entity) {
      return entity.ownerId === user.id
    }

    return false
  },
  // role + entity condition example
  'user.update': ({ user, entity }) => {
    if (user.roles.includes('admin')) return true
    if (!entity || typeof entity !== 'object') return false

    return 'id' in entity && entity.id === user.id
  },
  // time-base / environment example
  'user.delete': ({ entity }) => {
    if (!entity || typeof entity !== 'object') return false

    if ('status' in entity) {
      return entity.status !== 'running'
    }
    return false
  }


}