/**
 * Параметры сортировки для запросов
 */
export interface Sort<SortKey> {
  sort_dir?: SortDir;
  sort_by?: SortKey;
}
