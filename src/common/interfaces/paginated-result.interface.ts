export interface PaginatedResult<T> {
  data: T[];
  count: number;
  currentPage: number;
  totalPages: number;
}
