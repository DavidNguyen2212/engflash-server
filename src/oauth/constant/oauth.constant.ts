export const OAUTH_CONFIG = {
  PASSWORD_LENGTH: 12,
  RFTOKEN_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // (ms)
  ACTOKEN_MAX_AGE: 5 * 60 * 1000, // (ms)
};

export const REDIS_CONFIG = {
  RFTOKEN_MAX_AGE: 30 * 24 * 60 * 60, // (s)
  SESSION_MAX_AGE: 5 * 60, // (s)
};
