package validation

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-playground/validator/v10"
)

// DecodeAndValidate reads the HTTP request body, parses it as JSON into the
// provided destination struct, and validates it against the struct's validate tags.
//
// This is the main function you'll use in handlers. It combines three steps:
// 1. Read the request body
// 2. Parse it as JSON into the struct
// 3. Validate the struct against rules defined in validate tags
//
// Returns:
//   - nil if decoding and validation both succeed
//   - ErrInvalidJSON if the body cannot be parsed as JSON
//   - ValidationErrors if validation rules are violated
//
// Example usage:
//
//	var req LoginRequest
//	if err := DecodeAndValidate(r, &req); err != nil {
//	    validation.WriteValidationError(w, err)
//	    return
//	}
//
// Note: the destination must be a pointer (&req) so the function can fill in the values.
func DecodeAndValidate(r *http.Request, dest interface{}) error {
	// json.NewDecoder reads directly from the request body.
	// It doesn't need to be buffered like reading into a byte slice first.
	if err := json.NewDecoder(r.Body).Decode(dest); err != nil {
		return ErrInvalidJSON
	}

	// ValidateStruct checks all the validate tags on the struct.
	if err := ValidateStruct(dest); err != nil {
		// Check if it's a validation error (as opposed to some other error).
		// errors.As() is like instanceof in Java/C#, but for Go errors.
		var validationErrs validator.ValidationErrors
		if errors.As(err, &validationErrs) {
			// Wrap with our custom type to preserve the struct for JSON field name lookup.
			return ValidationErrors{ValidationErrors: validationErrs, Struct: dest}
		}
		// This shouldn't happen with go-playground/validator, but handle it anyway.
		return err
	}
	return nil
}

// WriteValidationError writes an HTTP error response based on the error type.
//
// It handles three cases:
//   - ValidationErrors -> 400 with detailed field-level error information
//   - ErrInvalidJSON -> 400 with JSON parsing error details
//   - Other errors -> 400 with a generic message
//
// The response is always JSON with Content-Type: application/json header.
func WriteValidationError(w http.ResponseWriter, err error) {
	if err == nil {
		return
	}

	// Try to unwrap as our custom ValidationErrors type.
	var validationErrs ValidationErrors
	if errors.As(err, &validationErrs) {
		// Convert validation errors to our API response format.
		// We pass the validated struct so we can show JSON field names in errors.
		resp := FieldErrorsToErrorResponse(newFieldErrors(validationErrs.ValidationErrors, validationErrs.Struct))
		writeJSON(w, http.StatusBadRequest, resp)
		return
	}

	// Check if it's our sentinel JSON parsing error.
	// errors.Is() checks if an error matches a specific error value.
	if errors.Is(err, ErrInvalidJSON) {
		resp := NewInvalidJSONError(nil)
		writeJSON(w, http.StatusBadRequest, resp)
		return
	}

	// Fallback for unexpected error types.
	resp := ErrorResponse{
		Error: "Invalid request",
		Code:  CodeInvalidJSON,
	}
	writeJSON(w, http.StatusBadRequest, resp)
}

// writeJSON is an internal helper that sets headers and encodes data as JSON.
// This avoids repeating the same three lines of code in every handler.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// Ignore encode errors here — if encoding fails, we can't do much anyway.
	// In production, you might want to log this error.
	json.NewEncoder(w).Encode(data)
}

// RespondJSON is a convenience wrapper for writing successful JSON responses.
// It sets the Content-Type header and encodes the data in one call.
//
// Example usage:
//
//	RespondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
//
// This is equivalent to:
//
//	w.Header().Set("Content-Type", "application/json")
//	w.WriteHeader(http.StatusOK)
//	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
	writeJSON(w, status, data)
}