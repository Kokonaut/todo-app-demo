// Todo entity
export interface Todo {
  id: string
  userId: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

// API Request types
export interface CreateTodoRequest {
  title: string
}

export interface UpdateTodoRequest {
  title?: string
  completed?: boolean
}

// API Response types
export interface ApiError {
  error: string
  message: string
}

// Auth types
export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
}
