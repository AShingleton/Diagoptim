import { z } from "zod";

// ---------------------------------------------------------------------------
// Generic API response wrappers
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    statusCode: number;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Sorting & filtering helpers
// ---------------------------------------------------------------------------

export type SortDirection = "asc" | "desc";

export interface SortOption {
  field: string;
  direction: SortDirection;
}

export interface FilterOption {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in";
  value: string | number | boolean | string[];
}

// ---------------------------------------------------------------------------
// Authenticated request context (set by middleware)
// ---------------------------------------------------------------------------

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export type UserRole = "owner" | "admin" | "member" | "viewer";

// ---------------------------------------------------------------------------
// Zod validation schemas – reusable across API routes
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});

export type SortInput = z.infer<typeof sortSchema>;

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

export const dateRangeSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((data) => data.from <= data.to, {
    message: "'from' date must be before or equal to 'to' date",
  });

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
});

export type SearchInput = z.infer<typeof searchSchema>;

// ---------------------------------------------------------------------------
// Rate-limit metadata returned via headers
// ---------------------------------------------------------------------------

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp (seconds)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a successful API response */
export function ok<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { success: true, data, meta };
}

/** Build a paginated API response */
export function paginated<T>(data: T[], meta: PaginationMeta): PaginatedResponse<T> {
  return { success: true, data, meta };
}

/** Build an error API response */
export function apiError(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, string[]>,
): ApiError {
  return {
    success: false,
    error: { code, message, statusCode, details },
  };
}

// ---------------------------------------------------------------------------
// Standard error codes
// ---------------------------------------------------------------------------

export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
