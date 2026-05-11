package validation

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

// validate is a package-level singleton — a single instance of the validator.
// In Go, a "singleton" is just a package-level variable. It's created once
// when the package is first imported, and reused for all subsequent validations.
var validate *validator.Validate

// init is a special function that runs automatically when the package is imported.
// It's used here to initialize the singleton validator with all default rules.
func init() {
	validate = validator.New()
	// We use "v8" tag name instead of the default "validate".
	// By default, go-playground/validator reads the "validate" struct tag,
	// but swaggo (the Swagger generator) also reads "validate" tags to
	// generate OpenAPI constraints (minLength, maxLength, required, etc.).
	// This causes Swagger UI to validate requests locally before sending
	// them to the server, which prevents testing server-side validation.
	// By using a custom tag name "v8", we keep server-side validation intact
	// while letting swaggo ignore these tags entirely. The validation rules
	// are documented in Go field comments for the OpenAPI spec.
	validate.SetTagName("v8")
}

// ValidateStruct checks a struct against validation rules defined in struct tags.
// Struct tags are metadata added after field declarations, e.g.:
//
//	type User struct {
//	    Email string `json:"email" validate:"required,email"`
//	}
//
// This function returns nil if all validations pass, or validator.ValidationErrors
// (a list of errors) if any validation fails.
func ValidateStruct(s interface{}) error {
	return validate.Struct(s)
}

// ValidateField validates a single value against a validation tag.
// Unlike ValidateStruct, this doesn't need a struct — useful for validating
// individual values like query parameters.
//
// Example:
//
//	err := ValidateField("user@example.com", "required,email")
func ValidateField(field interface{}, tag string) error {
	return validate.Var(field, tag)
}

// humanReadableTag converts internal validator tag names to human-readable text.
// For example, the tag "email" becomes "must be a valid email address".
// This makes error messages friendlier for API consumers.
func humanReadableTag(tag string) string {
	switch tag {
	case "required":
		return "is required"
	case "email":
		return "must be a valid email address"
	case "uuid":
		return "must be a valid UUID"
	case "numeric":
		return "must be a number"
	case "alpha":
		return "must contain only letters"
	case "alphanum":
		return "must contain only letters and numbers"
	case "url":
		return "must be a valid URL"
	case "uri":
		return "must be a valid URI"
	default:
		// For unknown tags, return the tag name as-is (e.g., "min", "max")
		return tag
	}
}

// getJSONFieldName looks up the JSON field name from a struct definition.
// This is needed because Go struct field names (e.g., "Login") are different
// from JSON field names (e.g., "login"). We want error messages to show the
// JSON name that clients actually see.
//
// For example, for this struct:
//   type LoginRequest struct {
//       Login string `json:"login"`
//   }
//
// This function would return "login" when given "Login" as input.
func getJSONFieldName(structType reflect.Type, goFieldName string) string {
	for i := 0; i < structType.NumField(); i++ {
		field := structType.Field(i)
		if field.Name == goFieldName {
			// field.Tag.Get("json") returns the value of the json tag
			tag := field.Tag.Get("json")
			// Empty tag or "-" means this field is not exposed in JSON
			if tag == "" || tag == "-" {
				return ""
			}
			// JSON tags can have options, e.g., "login,omitempty"
			// The comma separates the field name from options
			if idx := strings.Index(tag, ","); idx != -1 {
				tag = tag[:idx]
			}
			if tag != "" {
				return tag
			}
		}
	}
	return ""
}

// buildMessage constructs a human-readable error message for a validation error.
// It combines the field name, validation tag, and optional parameter into a
// complete sentence that explains what went wrong.
//
// Examples:
//   - buildMessage("password", "min", "8") -> "password must be at least 8 characters"
//   - buildMessage("email", "required", "") -> "email is required"
//   - buildMessage("role", "oneof", "admin user") -> "role must be one of [admin user]"
func buildMessage(fieldName, tag, param string) string {
	switch tag {
	case "min":
		if param != "" {
			return fmt.Sprintf("%s must be at least %s characters", fieldName, param)
		}
		return fmt.Sprintf("%s is too short", fieldName)
	case "max":
		if param != "" {
			return fmt.Sprintf("%s must be at most %s characters", fieldName, param)
		}
		return fmt.Sprintf("%s is too long", fieldName)
	case "len":
		if param != "" {
			return fmt.Sprintf("%s must be exactly %s characters long", fieldName, param)
		}
		return fmt.Sprintf("%s has invalid length", fieldName)
	case "oneof":
		return fmt.Sprintf("%s must be one of [%s]", fieldName, param)
	case "eq":
		return fmt.Sprintf("%s must be equal to %s", fieldName, param)
	case "ne":
		return fmt.Sprintf("%s must not be equal to %s", fieldName, param)
	case "gt":
		return fmt.Sprintf("%s must be greater than %s", fieldName, param)
	case "gte":
		return fmt.Sprintf("%s must be greater than or equal to %s", fieldName, param)
	case "lt":
		return fmt.Sprintf("%s must be less than %s", fieldName, param)
	case "lte":
		return fmt.Sprintf("%s must be less than or equal to %s", fieldName, param)
	default:
		readable := humanReadableTag(tag)
		if fieldName != "" {
			return fmt.Sprintf("%s %s", fieldName, readable)
		}
		return readable
	}
}