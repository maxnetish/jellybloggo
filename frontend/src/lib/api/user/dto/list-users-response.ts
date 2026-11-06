import type { Response } from "@/lib/api/pagination/dto";
import type { UserResponse } from "./user-response";

/**
 * Paginated response for listing users.
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/users/model.go
 *      "UserListResponse struct" (lines 108-111)
 */
export type ListUsersResponse = Response<UserResponse>;