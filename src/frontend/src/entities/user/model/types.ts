
export type User = {
  userId: number
  email: string | null
  username: string | null
  userDetail: UserDetail
  userGroup: UserGroup
  totpEnabled?: boolean
}

export type UserDetail = {
  name: string,
  surname: string,
  department: string,
  organization: string,
  phoneNumber: string,
}

export type UserGroup = {
  groupId: number
  name: string
}

export type UserCreateDto = Omit<User, 'id' | 'userGroup'> & {
  userGroup: number,
}
export type UserUpdateDto = Partial<UserCreateDto>
