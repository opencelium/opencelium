export const ROLES = ['admin', 'operator', 'viewer'] as const

export type Role = typeof ROLES[number]
