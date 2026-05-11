package validation

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

// FieldError represents a single validation error for one field.
// It contains all the information needed to display a clear error message to the API user.
type FieldError struct {
	// Field is the name of the JSON field that failed validation (e.g., "login", "password").
	Field string `json:"field"`
	// Tag is the validation rule that failed (e.g., "required", "min", "email").
	Tag string `json:"tag"`
	// Value is the actual value that was sent in the request.
	// This is useful for debugging, but may be omitted if it's sensitive (like passwords).
	Value string `json:"value,omitempty"`
	// Param is the parameter for the validation rule (e.g., "8" for min=8, "admin" for oneof=admin).
	Param string `json:"param,omitempty"`
	// Message is a human-readable description of what went wrong.
	// This is what should be displayed to the end user.
	Message string `json:"message"`
}

// ErrorResponse is the standard error format returned by the API when validation fails.
// It follows a structure similar to RFC 7807 Problem Details.
type ErrorResponse struct {
	// Error is a short description of what went wrong.
	Error string `json:"error"`
	// Code is a machine-readable error code for programmatic handling.
	// Examples: "VALIDATION_ERROR", "INVALID_JSON"
	Code string `json:"code"`
	// Details contains individual field errors when validation fails.
	// This is nil for non-validation errors.
	Details []FieldError `json:"details,omitempty"`
}

// Error codes returned by validation functions. These are used in ErrorResponse.Code.
const (
	CodeValidation  = "VALIDATION_ERROR"
	CodeInvalidJSON = "INVALID_JSON"
)

// ErrInvalidJSON is a sentinel error used to indicate that the request body
// could not be parsed as valid JSON. It's different from validation errors
// because it happens before validation even starts.
//
// A "sentinel error" in Go is a predefined error value that can be compared
// using errors.Is() to determine what kind of error occurred.
var ErrInvalidJSON = fmt.Errorf("invalid request body: expected valid JSON")

// ValidationErrors wraps the standard validator.ValidationErrors and adds
// the original struct that was validated. This is needed because the validator
// library loses type information when returning errors — we need the original
// struct to look up JSON field names.
//
// This embeds validator.ValidationErrors, which means ValidationErrors
// "is" a validator.ValidationErrors. It also implements error (via Unwrap),
// so it can be used anywhere an error is expected.
type ValidationErrors struct {
	// Embedding validator.ValidationErrors makes all its methods available.
	// It's like inheritance in OOP languages.
	validator.ValidationErrors
	// Struct holds the original struct that was validated.
	// This is used to look up JSON field names for better error messages.
	Struct interface{}
}

// Unwrap implements the error unwrapping interface.
// This allows errors.Is() and errors.As() to work with the embedded error.
func (e ValidationErrors) Unwrap() error {
	return e.ValidationErrors
}

// NewFieldErrors converts validator.ValidationErrors into our custom FieldError slice.
// The second parameter is the struct that was validated — if provided, field names
// will be the JSON field names (e.g., "login"); if nil, Go field names are used (e.g., "Login").
func NewFieldErrors(validationErrs validator.ValidationErrors) []FieldError {
	return newFieldErrors(validationErrs, nil)
}

// newFieldErrors is the internal implementation that does the actual conversion.
// It uses reflection to extract the JSON field name from the struct definition.
func newFieldErrors(validationErrs validator.ValidationErrors, s interface{}) []FieldError {
	errors := make([]FieldError, 0, len(validationErrs))

	// Get the reflect.Type of the validated struct.
	// reflect.Type represents the "type" of a value (like a class in OOP).
	// reflect.Value represents the actual "value" (like an instance).
	var structType reflect.Type
	if s != nil {
		v := reflect.ValueOf(s)
		// If it's a pointer, get the value it points to
		if v.Kind() == reflect.Ptr {
			v = v.Elem()
		}
		// Only structs have fields we can look up
		if v.Kind() == reflect.Struct {
			structType = v.Type()
		}
	}

	// Iterate over each validation error and convert it to our format.
	for _, err := range validationErrs {
		field := err.Field()
		tag := err.Tag()
		param := err.Param()
		value := ""

		// err.Value() returns the actual value that failed validation.
		// We convert it to string for the error response.
		if err.Value() != nil {
			value = fmt.Sprintf("%v", err.Value())
		}

		// Try to get the JSON field name if we have access to the struct type.
		fieldName := field
		if structType != nil {
			if jsonName := getJSONFieldName(structType, field); jsonName != "" {
				fieldName = jsonName
			}
		}

		// Build the human-readable message.
		message := buildMessage(fieldName, tag, param)

		errors = append(errors, FieldError{
			Field:   fieldName,
			Tag:     tag,
			Value:   value,
			Param:   param,
			Message: message,
		})
	}

	return errors
}

// FieldErrorsToErrorResponse creates a full ErrorResponse from a list of field errors.
// This is the final step — convert our internal error format to the API response format.
func FieldErrorsToErrorResponse(fieldErrors []FieldError) ErrorResponse {
	return ErrorResponse{
		Error:   "Validation failed",
		Code:    CodeValidation,
		Details: fieldErrors,
	}
}

// NewInvalidJSONError creates an ErrorResponse for JSON parsing errors.
// Unlike validation errors, there's only one kind of JSON error, so it's a simple function.
func NewInvalidJSONError(cause error) ErrorResponse {
	detail := "Unable to parse request body"
	if cause != nil {
		// Remove quotes from error messages to make them more readable
		detail = strings.ReplaceAll(cause.Error(), "\"", "'")
	}
	return ErrorResponse{
		Error: "Invalid request body",
		Code:  CodeInvalidJSON,
		Details: []FieldError{
			{Field: "_body", Tag: "json", Message: detail},
		},
	}
}