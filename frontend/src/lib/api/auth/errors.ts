import type { ErrorResponse } from "@/lib/api/dto";

/**
 * API error with code for programmatic handling.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: ErrorResponse["details"]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Parse error response from API.
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let errorResponse: ErrorResponse | null = null;

  try {
    errorResponse = await response.json();
  } catch {
    // Response is not JSON
  }

  const message = errorResponse?.error || `HTTP ${response.status}`;
  const code = errorResponse?.code || "";
  const details = errorResponse?.details;

  return new ApiError(message, code, response.status, details);
}