/**
 * @typedef {Object} FieldError
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/validation/errors.go
 *      "FieldError struct" (lines 13-18)
 *
 * @property {string} field - Field name that failed validation (JSON field name)
 * @property {string} tag - Validation tag that failed (e.g., "required", "min")
 * @property {string} [value] - Actual value that failed validation
 * @property {string} message - Human-readable error message
 */

/**
 * @typedef {Object} ErrorResponse
 * @see https://github.com/your-org/jellybloggo/blob/main/backend/internal/validation/errors.go
 *      "ErrorResponse struct" (lines 22-31)
 *
 * Standard error format returned by the API.
 *
 * @property {string} error - Short description of what went wrong
 * @property {string} code - Machine-readable error code (e.g., VALIDATION_ERROR, INVALID_CREDENTIALS)
 * @property {FieldError[]} [details] - Individual field errors for validation failures
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: Array<{
    field: string;
    tag: string;
    value?: string;
    message: string;
  }>;
}

/** Common error codes returned by the API */
export const ErrorCodes = {
  VALIDATION: "VALIDATION_ERROR",
  INVALID_JSON: "INVALID_JSON",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;