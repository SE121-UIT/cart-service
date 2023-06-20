import { Request, Response } from 'express';
import { assertUnsignedBigInt } from './validation';
import { ResJSON } from 'src/shoppingCarts/routes';
import createError from 'http-errors';

//////////////////////////////////////
/// ETAG
//////////////////////////////////////

type WeakETag = `W/${string}`;
type ETag = WeakETag | string;

export const WeakETagRegex = /W\/"(\d+.*)"/;

export const enum ETagErrors {
  WRONG_WEAK_ETAG_FORMAT = 'WRONG_WEAK_ETAG_FORMAT',
  MISSING_IF_MATCH_HEADER = 'MISSING_IF_MATCH_HEADER',
}

export const isWeakETag = (etag: ETag): etag is WeakETag => {
  return WeakETagRegex.test(etag);
};

export const getWeakETagValue = (etag: ETag): WeakETag => {
  const weak = WeakETagRegex.exec(etag);
  if (weak == null || weak.length == 0)
    throw createError.BadRequest(ETagErrors.WRONG_WEAK_ETAG_FORMAT);
  return weak[1] as WeakETag;
};

export const toWeakETag = (value: number | bigint | string): WeakETag => {
  return `W/"${value}"`;
};

export const getETagFromIfMatch = (request: Request): ETag => {
  const etag = request.headers['if-match'];

  if (etag === undefined) {
    throw createError.BadRequest(ETagErrors.MISSING_IF_MATCH_HEADER);
  }

  return etag;
};

export const getWeakETagValueFromIfMatch = (request: Request): WeakETag => {
  const etag = getETagFromIfMatch(request);

  if (!isWeakETag(etag)) {
    throw createError.BadRequest(ETagErrors.WRONG_WEAK_ETAG_FORMAT);
  }

  return getWeakETagValue(etag);
};

export const getExpectedRevisionFromETag = (request: Request): bigint =>
  assertUnsignedBigInt(getWeakETagValueFromIfMatch(request));

//////////////////////////////////////
/// HTTP Helpers
//////////////////////////////////////

export const sendCreated = (
  response: Response<ResJSON>,
  createdId: string,
  urlPrefix?: string
): void => {
  response.setHeader('Location', `${urlPrefix ?? response.req.url}/${createdId}`);
  response.status(201).json({
    statusCode: 201,
    message: 'Success',
    data: {
      shoppingCardId: createdId,
    },
  });
};
