export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  userId: number;
  linkedId: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
