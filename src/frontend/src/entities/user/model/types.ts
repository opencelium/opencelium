
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
  profilePicture?: string | null,
}

export type UserGroup = {
  groupId: number
  name: string
}

export type UserCreateDto = Omit<User, 'id' | 'userGroup'> & {
  userGroup: number,
}
export type UserUpdateDto = Partial<UserCreateDto> & {
  // The wizard image's pending pick. Kept apart from `userDetail.profilePicture`,
  // which the backend parses as a stored path, and uploaded by an after-save action.
  profilePicture?: string | File | null,
  // Snapshot of the stored path, so the delete after-action can tell a cleared picture
  // from one that never existed.
  profilePictureOriginal?: string | null,
}
