export interface PaginatedResult<T> {
    data: T[];
    count: number;
    meta: {
          total: number,
          page: number,
          limit: number,
    }
}
