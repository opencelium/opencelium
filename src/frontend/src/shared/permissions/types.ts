import type { ACTIONS, ENTITIES } from "./constants"
import type { ROLES } from "./roles"

export type Role = typeof ROLES[number]

export type Entity = typeof ENTITIES[number]
export type Action = typeof ACTIONS[number]


export type Permission = `${Entity}.${Action}`
