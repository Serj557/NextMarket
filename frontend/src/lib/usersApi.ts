import { requestJson, type ApiResult } from './http'

export type UserDto = {
  id: string
  email: string
  name: string
  createdAt: string
}

export async function getUserById(userId: string): Promise<ApiResult<UserDto>> {
  return requestJson<UserDto>(`/api/users/${encodeURIComponent(userId)}`)
}

export async function getMe(): Promise<ApiResult<UserDto>> {
  return requestJson<UserDto>('/api/users/me')
}

