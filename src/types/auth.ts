export type UserRole = "student" | "employee" | "admin";

export interface AuthUser {
  id: string;
  role: UserRole;
  identifier: string;
  name: string;
}

export interface SessionAuthResponse {
  ok: true;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  isInstitutional: boolean;
}

export interface MessageResponse {
  message?: string;
  ok?: boolean;
}

export interface ApiError {
  message: string;
  status: number;
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    "status" in err
  );
}