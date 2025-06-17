export interface PaginationOptions {
  page: number;
  size: number;
  sortBy?: 'ASC' | 'DESC';
  isFavorite?: boolean;
}
