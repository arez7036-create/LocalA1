export interface UserRead {
  id: number
  email: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  rate_limit: number
  rate_window: number
  created_at: string
}