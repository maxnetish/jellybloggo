package types

import (
	"database/sql/driver"
	"fmt"
	"time"
)

const dateFormat = "2006-01-02"

type Date struct {
	time.Time
}

func NewDate(t time.Time) Date {
	return Date{Time: t}
}

func NewDateFromPtr(t *time.Time) *Date {
	if t == nil {
		return nil
	}
	return &Date{Time: *t}
}

func (d Date) TimePtr() *time.Time {
	return &d.Time
}

func (d *Date) UnmarshalJSON(data []byte) error {
	s := string(data)
	if s == "null" || s == `""` {
		*d = Date{}
		return nil
	}

	if len(data) >= 2 && data[0] == '"' && data[len(data)-1] == '"' {
		s = string(data[1 : len(data)-1])
	}

	t, err := time.Parse(dateFormat, s)
	if err != nil {
		return fmt.Errorf("invalid date format, expected YYYY-MM-DD: %w", err)
	}
	d.Time = t
	return nil
}

func (d Date) MarshalJSON() ([]byte, error) {
	if d.Time.IsZero() {
		return []byte("null"), nil
	}
	return []byte(`"` + d.Time.Format(dateFormat) + `"`), nil
}

func (d *Date) Scan(value interface{}) error {
	if value == nil {
		*d = Date{}
		return nil
	}
	switch v := value.(type) {
	case time.Time:
		d.Time = v
		return nil
	default:
		return fmt.Errorf("cannot scan %T into Date", value)
	}
}

func (d Date) Value() (driver.Value, error) {
	if d.Time.IsZero() {
		return nil, nil
	}
	return d.Time, nil
}
