package validation

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/go-playground/validator/v10"
)

// TestRequest is a sample struct used for testing validation.
// It has various field types and validation rules to exercise different scenarios.
type TestRequest struct {
	Name  string `json:"name"  v8:"required"`
	Email string `json:"email" v8:"required,email"`
	Age   int    `json:"age"   v8:"gte=0,lte=150"`
}

// TestValidateStruct_Valid tests that a fully valid struct passes validation.
func TestValidateStruct_Valid(t *testing.T) {
	req := TestRequest{
		Name:  "John",
		Email: "john@example.com",
		Age:   30,
	}
	err := ValidateStruct(req)
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
}

// TestValidateStruct_InvalidEmail tests that invalid email format is caught.
func TestValidateStruct_InvalidEmail(t *testing.T) {
	req := TestRequest{
		Name:  "John",
		Email: "not-an-email",
		Age:   30,
	}
	err := ValidateStruct(req)
	if err == nil {
		t.Fatal("expected validation error")
	}

	// validator.ValidationErrors is a slice (array) of individual field errors.
	validationErrs, ok := err.(validator.ValidationErrors)
	if !ok {
		t.Fatalf("expected validator.ValidationErrors, got %T", err)
	}

	// When we pass the struct to newFieldErrors, it converts Go field names
	// to JSON field names ("Email" -> "email").
	fieldErrs := newFieldErrors(validationErrs, req)
	if len(fieldErrs) != 1 {
		t.Fatalf("expected 1 field error, got %d", len(fieldErrs))
	}

	if fieldErrs[0].Field != "email" {
		t.Errorf("expected field 'email', got '%s'", fieldErrs[0].Field)
	}
	if fieldErrs[0].Tag != "email" {
		t.Errorf("expected tag 'email', got '%s'", fieldErrs[0].Tag)
	}
}

// TestValidateStruct_MultipleErrors tests that multiple validation errors
// are all captured, not just the first one.
func TestValidateStruct_MultipleErrors(t *testing.T) {
	req := TestRequest{
		Name:  "",         // fails required
		Email: "invalid",  // fails email
		Age:   -5,         // fails gte=0
	}
	err := ValidateStruct(req)
	if err == nil {
		t.Fatal("expected validation error")
	}

	validationErrs := err.(validator.ValidationErrors)
	fieldErrs := newFieldErrors(validationErrs, req)

	if len(fieldErrs) != 3 {
		t.Fatalf("expected 3 field errors, got %d: %+v", len(fieldErrs), fieldErrs)
	}
}

// TestDecodeAndValidate_ValidJSON tests that valid JSON is parsed correctly
// and validation rules are applied.
func TestDecodeAndValidate_ValidJSON(t *testing.T) {
	body := `{"name":"Alice","email":"alice@example.com","age":25}`
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	var dest TestRequest
	err := DecodeAndValidate(req, &dest)
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if dest.Name != "Alice" {
		t.Errorf("expected name 'Alice', got '%s'", dest.Name)
	}
}

// TestDecodeAndValidate_InvalidJSON tests that malformed JSON returns ErrInvalidJSON.
func TestDecodeAndValidate_InvalidJSON(t *testing.T) {
	body := `{invalid json}`
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	var dest TestRequest
	err := DecodeAndValidate(req, &dest)
	if err != ErrInvalidJSON {
		t.Errorf("expected ErrInvalidJSON, got %v", err)
	}
}

// TestDecodeAndValidate_ValidationErrors tests that validation errors
// after JSON parsing are returned as our custom ValidationErrors type.
func TestDecodeAndValidate_ValidationErrors(t *testing.T) {
	body := `{"name":"","email":"bad","age":200}`
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	var dest TestRequest
	err := DecodeAndValidate(req, &dest)
	if err == nil {
		t.Fatal("expected validation error")
	}

	// DecodeAndValidate returns our custom ValidationErrors type, not the raw one.
	validationErrs, ok := err.(ValidationErrors)
	if !ok {
		t.Fatalf("expected ValidationErrors, got %T", err)
	}

	// Verify we can access the struct that was validated.
	if validationErrs.Struct == nil {
		t.Error("expected Struct to be populated")
	}

	fieldErrs := newFieldErrors(validationErrs.ValidationErrors, validationErrs.Struct)
	if len(fieldErrs) != 3 {
		t.Fatalf("expected 3 field errors, got %d", len(fieldErrs))
	}
}

// TestWriteValidationError_ValidationErrors tests that validation errors
// produce the correct HTTP response format.
func TestWriteValidationError_ValidationErrors(t *testing.T) {
	body := `{"name":"","email":"bad"}`
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	var dest TestRequest
	err := DecodeAndValidate(req, &dest)
	if err == nil {
		t.Fatal("expected validation error")
	}

	// httptest.NewRecorder() creates a mock ResponseWriter for testing.
	w := httptest.NewRecorder()
	WriteValidationError(w, err)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}

	if w.Header().Get("Content-Type") != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", w.Header().Get("Content-Type"))
	}

	var resp ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Code != CodeValidation {
		t.Errorf("expected code VALIDATION_ERROR, got %s", resp.Code)
	}
	if resp.Error != "Validation failed" {
		t.Errorf("expected error 'Validation failed', got '%s'", resp.Error)
	}
	if len(resp.Details) == 0 {
		t.Error("expected details to be non-empty")
	}

	// Verify the details contain actual field information.
	for _, detail := range resp.Details {
		if detail.Message == "" {
			t.Error("expected each detail to have a message")
		}
	}
}

// TestWriteValidationError_InvalidJSON tests that JSON parsing errors
// produce the correct HTTP response format.
func TestWriteValidationError_InvalidJSON(t *testing.T) {
	body := `not json at all`
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	var dest TestRequest
	err := DecodeAndValidate(req, &dest)
	if err != ErrInvalidJSON {
		t.Fatalf("expected ErrInvalidJSON, got %v", err)
	}

	w := httptest.NewRecorder()
	WriteValidationError(w, err)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}

	var resp ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Code != CodeInvalidJSON {
		t.Errorf("expected code INVALID_JSON, got %s", resp.Code)
	}
}

// TestRespondJSON tests that the RespondJSON helper produces correct responses.
func TestRespondJSON(t *testing.T) {
	w := httptest.NewRecorder()
	data := map[string]string{"status": "ok", "message": "hello"}

	RespondJSON(w, http.StatusOK, data)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
	if w.Header().Get("Content-Type") != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", w.Header().Get("Content-Type"))
	}

	var result map[string]string
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if result["status"] != "ok" {
		t.Errorf("expected status 'ok', got '%s'", result["status"])
	}
}

// TestGetJSONFieldName tests that JSON field names are correctly extracted from struct tags.
func TestGetJSONFieldName(t *testing.T) {
	// Define a struct with various json tag patterns.
	// This is checked using reflection.
	type testStruct struct {
		Login       string `json:"login"`
		AccessToken string `json:"access_token"`
		UserID      string `json:"user_id"`
		Name        string `json:"-"`
		NoTag       string
	}

	st := reflect.TypeOf(testStruct{})

	tests := []struct {
		goFieldName string
		expected    string
	}{
		{"Login", "login"},
		{"AccessToken", "access_token"},
		{"UserID", "user_id"},
		{"Name", ""},       // "-" means excluded from JSON
		{"NoTag", ""},     // no json tag means empty
		{"Unknown", ""},   // unknown field means empty
	}

	for _, tc := range tests {
		result := getJSONFieldName(st, tc.goFieldName)
		if result != tc.expected {
			t.Errorf("getJSONFieldName(%s): expected %q, got %q", tc.goFieldName, tc.expected, result)
		}
	}
}

// TestBuildMessage tests that human-readable error messages are generated correctly.
func TestBuildMessage(t *testing.T) {
	tests := []struct {
		field, tag, param, expected string
	}{
		{"login", "required", "", "login is required"},
		{"password", "min", "8", "password must be at least 8 characters"},
		{"email", "email", "", "email must be a valid email address"},
		{"role", "oneof", "", "role must be a valid value"},
	}

	for _, tc := range tests {
		result := buildMessage(tc.field, tc.tag, tc.param)
		if result != tc.expected {
			t.Errorf("buildMessage(%s, %s, %s): expected %s, got %s", tc.field, tc.tag, tc.param, tc.expected, result)
		}
	}
}

// TestNewFieldErrors_FieldNames tests that JSON field names are used in error messages
// when a struct is provided.
func TestNewFieldErrors_FieldNames(t *testing.T) {
	req := TestRequest{
		Name:  "",
		Email: "not-an-email",
		Age:   30,
	}
	err := ValidateStruct(req)
	if err == nil {
		t.Fatal("expected validation error")
	}

	validationErrs := err.(validator.ValidationErrors)
	// Passing the struct so json field names are used
	fieldErrs := newFieldErrors(validationErrs, req)

	if len(fieldErrs) != 2 {
		t.Fatalf("expected 2 field errors, got %d", len(fieldErrs))
	}

	// Verify we get JSON field names ("name", "email") not Go names ("Name", "Email").
	if fieldErrs[0].Field != "name" {
		t.Errorf("expected field 'name', got '%s'", fieldErrs[0].Field)
	}
	if fieldErrs[0].Message != "name is required" {
		t.Errorf("expected message 'name is required', got '%s'", fieldErrs[0].Message)
	}
	if fieldErrs[1].Field != "email" {
		t.Errorf("expected field 'email', got '%s'", fieldErrs[1].Field)
	}
	if fieldErrs[1].Message != "email must be a valid email address" {
		t.Errorf("expected message 'email must be a valid email address', got '%s'", fieldErrs[1].Message)
	}
}

// TestValidationErrors_Unwrap tests that our custom ValidationErrors type
// properly unwraps to the underlying error for errors.Is() to work.
func TestValidationErrors_Unwrap(t *testing.T) {
	req := TestRequest{Name: "", Email: ""}
	err := ValidateStruct(req)
	if err == nil {
		t.Fatal("expected validation error")
	}

	validationErrs, ok := err.(validator.ValidationErrors)
	if !ok {
		t.Fatalf("expected validator.ValidationErrors, got %T", err)
	}

	// Wrap it in our custom type.
	wrapped := ValidationErrors{ValidationErrors: validationErrs, Struct: req}

	// Unwrap should return the inner error.
	unwrapped := wrapped.Unwrap()
	if unwrapped == nil {
		t.Error("expected Unwrap to return underlying error")
	}

	// The Unwrap method should return the same underlying ValidationErrors.
	if len(unwrapped.(validator.ValidationErrors)) != len(validationErrs) {
		t.Error("expected Unwrap to return equivalent ValidationErrors")
	}
}