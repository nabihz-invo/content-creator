/** API error envelope: { error: { code, message, details } } (docs/API.md). */

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "validation_failed"
  | "not_found"
  | "invalid_transition"
  | "approval_required"
  | "hash_mismatch"
  | "duplicate"
  | "idempotency_conflict"
  | "payload_too_large"
  | "rate_limited"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  validation_failed: 422,
  not_found: 404,
  invalid_transition: 409,
  approval_required: 409,
  hash_mismatch: 409,
  duplicate: 409,
  idempotency_conflict: 409,
  payload_too_large: 413,
  rate_limited: 429,
  internal: 500,
};

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }

  get status(): number {
    return STATUS[this.code];
  }

  toJSON() {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}

/**
 * Maps Postgres errors raised by our RPCs to API errors. RPCs raise
 * `P0001` with HINT = an ErrorCode; privilege errors are 42501.
 */
export function fromDbError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const e = err as { code?: string; hint?: string; message?: string };
  if (e?.code === "P0001" && e.hint && e.hint in STATUS) {
    return new ApiError(e.hint as ErrorCode, e.message ?? e.hint);
  }
  if (e?.code === "42501") return new ApiError("forbidden", "not allowed");
  if (e?.code === "23505") return new ApiError("duplicate", "already exists");
  if (e?.code === "22P02" || e?.code === "23514") {
    return new ApiError("validation_failed", e.message ?? "invalid value");
  }
  console.error("unexpected error", err);
  return new ApiError("internal", "internal error");
}
