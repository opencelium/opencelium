import type {Component} from "react";

export type Role = {
  groupId: number
  name: string
  description: string
  icon: null | string
  components: Component[]
}

export type Permission = 'READ' | 'DELETE' | 'CREATE' | 'UPDATE';

export type Component = {
  componentId: number
  name: string
  permissions: Permission[]
}

export type RoleUpdateDTO = Omit<Role, "components"> & {
  components: number[],
  mappedComponents: Component[],
}
