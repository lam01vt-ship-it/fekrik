export type UserSummary = {
  id: string
  email: string
  fullName: string
  roles: string[]
  storeId: string | null
  areaIds: string[]
}

export type LoginResponse = {
  accessToken: string
  expiresInSeconds: number
  user: UserSummary
}

export type StoreRow = {
  id: string
  code: string
  name: string
  areaId: string
  areaCode: string
  areaName: string
}

export type AreaRow = {
  id: string
  code: string
  name: string
}

export type UserListItem = {
  id: string
  email: string
  fullName: string
  storeId: string | null
  roles: string[]
}
