import type { User } from "@/entities/user/model/types"

export type RuleContext = {
  user: User
  entity?: unknown
}

export type PermissionRule = (ctx: RuleContext) => boolean