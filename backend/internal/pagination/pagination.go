package pagination

type Pagination struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
	SortBy     string `json:"sort_by"`
	SortDir    string `json:"sort_dir"`
}

type Response[T any] struct {
	Content    []T        `json:"content"`
	Pagination Pagination `json:"pagination"`
}
