import createError from 'http-errors';

//////////////////////////////////////
/// Validation
//////////////////////////////////////

export const enum ValidationErrors {
  NOT_A_NONEMPTY_STRING = 'NOT_A_NONEMPTY_STRING',
  NOT_A_POSITIVE_NUMBER = 'NOT_A_POSITIVE_NUMBER',
  NOT_AN_UNSIGNED_BIGINT = 'NOT_AN_UNSIGNED_BIGINT',
  NOT_AN_UUID = 'NOT_AN_UUID',
}

export const assertNotEmptyString = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw createError.BadRequest(ValidationErrors.NOT_A_NONEMPTY_STRING);
  }
  return value;
};

export const assertPositiveNumber = (value: unknown): number => {
  if (typeof value !== 'number' || value <= 0) {
    throw createError.BadRequest(ValidationErrors.NOT_A_POSITIVE_NUMBER);
  }
  return value;
};

export const assertUnsignedBigInt = (value: string): bigint => {
  const number = BigInt(value);
  if (number < 0) {
    throw createError.BadRequest(ValidationErrors.NOT_AN_UNSIGNED_BIGINT);
  }
  return number;
};

export const assertUuid = (uuid: string): string => {
  const isUuidValid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);

  if (!isUuidValid) {
    throw createError.BadRequest(ValidationErrors.NOT_AN_UUID);
  }

  return uuid;
};
