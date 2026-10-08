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

export type RoleUpdateDTO = Omit<Role, "components" | "icon"> & {
  components: number[],
  mappedComponents: Component[],
  // File = upload/replace, null = delete, string = the unchanged stored path.
  icon: string | File | null,
  // The icon path loaded from the server, echoed back by the role PUT so a save
  // never clears it. Real icon changes go through the dedicated icon endpoints.
  iconOriginal: string | null,
}
