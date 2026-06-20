export declare class PaginationDto {
    page?: number;
    limit?: number;
    search?: string;
}
export declare function paginate(page?: number, limit?: number): {
    skip: number;
    take: number;
};
export declare function buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number): {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};
