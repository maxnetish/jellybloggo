package types_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/maxnetish/jellybloggo/internal/types"
)

func TestDate_UnmarshalJSON(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{"valid date", `"2026-06-02"`, "2026-06-02", false},
		{"null", `null`, "", false},
		{"empty string", `""`, "", false},
		{"invalid format", `"06/02/2026"`, "", true},
		{"rfc3339 rejected", `"2026-06-02T00:00:00Z"`, "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var d types.Date
			err := json.Unmarshal([]byte(tt.input), &d)
			if (err != nil) != tt.wantErr {
				t.Fatalf("unexpected error: %v", err)
			}
			if tt.wantErr {
				return
			}
			if tt.want == "" {
				if !d.Time.IsZero() {
					t.Fatalf("expected zero time, got %v", d.Time)
				}
				return
			}
			got := d.Time.Format("2006-01-02")
			if got != tt.want {
				t.Fatalf("expected %s, got %s", tt.want, got)
			}
		})
	}
}

func TestDate_MarshalJSON(t *testing.T) {
	tests := []struct {
		name  string
		input types.Date
		want  string
	}{
		{"valid date", types.NewDate(time.Date(2026, 6, 2, 0, 0, 0, 0, time.UTC)), `"2026-06-02"`},
		{"zero value", types.Date{}, `null`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := json.Marshal(tt.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if string(got) != tt.want {
				t.Fatalf("expected %s, got %s", tt.want, got)
			}
		})
	}
}

func TestDate_RoundTrip(t *testing.T) {
	original := `"2025-12-31"`
	var d types.Date
	if err := json.Unmarshal([]byte(original), &d); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	got, err := json.Marshal(d)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if string(got) != original {
		t.Fatalf("expected %s, got %s", original, got)
	}
}

func TestDate_InStruct(t *testing.T) {
	type payload struct {
		BirthDate *types.Date `json:"birth_date,omitempty"`
	}

	t.Run("pointer date present", func(t *testing.T) {
		input := `{"birth_date":"2026-06-02"}`
		var p payload
		if err := json.Unmarshal([]byte(input), &p); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if p.BirthDate == nil {
			t.Fatal("expected non-nil BirthDate")
		}
		got := p.BirthDate.Time.Format("2006-01-02")
		if got != "2026-06-02" {
			t.Fatalf("expected 2026-06-02, got %s", got)
		}
	})

	t.Run("date omitted", func(t *testing.T) {
		input := `{}`
		var p payload
		if err := json.Unmarshal([]byte(input), &p); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if p.BirthDate != nil {
			t.Fatal("expected nil BirthDate")
		}
	})
}

func TestNewDateFromPtr(t *testing.T) {
	t.Run("nil input", func(t *testing.T) {
		if got := types.NewDateFromPtr(nil); got != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("non-nil input", func(t *testing.T) {
		tm := time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC)
		got := types.NewDateFromPtr(&tm)
		if got == nil {
			t.Fatal("expected non-nil")
		}
		if got.Time.Format("2006-01-02") != "2026-01-15" {
			t.Fatalf("unexpected date: %v", got.Time)
		}
	})
}
