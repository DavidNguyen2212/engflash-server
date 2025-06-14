export enum PostgresErrorCode {
    UniqueViolation = '23505',
    ForeignKeyViolation = '23503',
    NotNullViolation = '23502',
    CheckViolation = '23514',
    DeadlockDetected = '40P01',
    LockNotAvailable = '55P03',
    SerializationFailure = '40001',
}

export const MAX_RETRIES = 3
export const RETRYABLE_ERROR_CODES = ['40001', '40P01']; // serialization_failure, deadlock
  