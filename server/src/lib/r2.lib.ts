import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.config.js";
import type { ObjectHead, PresignedDownload, PresignedUpload } from "../types/r2.types.js";

// Upper bound accepted for a meal photo. Mobile downscales to ~1024px JPEG
// before upload, so legitimate uploads stay far below this; the cap only
// stops abuse and accidental RAW/high-res uploads from burning bandwidth.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MEAL_KEY_PREFIX = "meals/";

type R2Config = {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
};

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
  );
}

function requireR2Config(): R2Config {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new Error(
      "R2 object storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.",
    );
  }
  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET,
  };
}

let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (client) return client;
  const config = requireR2Config();
  client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return client;
}

/** Builds a private, user-scoped object key for a new meal upload. */
export function buildMealImageKey(userId: string): string {
  return `${MEAL_KEY_PREFIX}${userId}/${randomUUID()}.jpg`;
}

/**
 * Guards against cross-user key access: the key must live under the
 * caller's own `meals/<userId>/` prefix and must not contain traversal.
 */
export function isUserImageKey(key: string, userId: string): boolean {
  return (
    key.startsWith(`${MEAL_KEY_PREFIX}${userId}/`) && key.endsWith(".jpg") && !key.includes("..")
  );
}

/** Short-lived PUT URL so mobile uploads straight to the private bucket. */
export async function createUploadUrl(key: string): Promise<PresignedUpload> {
  const config = requireR2Config();
  const expiresInSec = env.R2_PRESIGN_PUT_TTL_SEC;
  const uploadUrl = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: "image/jpeg",
    }),
    { expiresIn: expiresInSec },
  );
  return { key, uploadUrl, expiresInSec };
}

/** Short-lived GET URL for viewing a private object (never public). */
export async function createDownloadUrl(key: string): Promise<PresignedDownload> {
  const config = requireR2Config();
  const expiresInSec = env.R2_PRESIGN_GET_TTL_SEC;
  const downloadUrl = await getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: config.bucket, Key: key }),
    { expiresIn: expiresInSec },
  );
  return { downloadUrl, expiresInSec };
}

/** Resolves to null when the object does not exist. */
export async function headObject(key: string): Promise<ObjectHead | null> {
  const config = requireR2Config();
  try {
    const head = await getR2Client().send(
      new HeadObjectCommand({ Bucket: config.bucket, Key: key }),
    );
    return {
      contentLength: head.ContentLength ?? 0,
      contentType: head.ContentType,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: unknown }).name === "NotFound"
    ) {
      return null;
    }
    throw error;
  }
}

/** Downloads the full object into memory (meal photos are size-capped). */
export async function downloadObject(key: string): Promise<Buffer> {
  const config = requireR2Config();
  const response = await getR2Client().send(
    new GetObjectCommand({ Bucket: config.bucket, Key: key }),
  );
  if (!response.Body) {
    throw new Error(`R2 object has empty body: ${key}`);
  }
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

/** Deletes a single private object (meal/account deletion). Idempotent. */
export async function deleteObject(key: string): Promise<void> {
  const config = requireR2Config();
  await getR2Client().send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

export type R2ObjectInfo = {
  readonly key: string;
  readonly lastModified: Date | undefined;
};

export type R2ListPage = {
  readonly objects: readonly R2ObjectInfo[];
  readonly nextToken: string | undefined;
};

/** Lists keys under a prefix (one page, up to maxKeys). */
export async function listObjects(
  prefix: string,
  maxKeys = 1000,
  continuationToken?: string,
): Promise<R2ListPage> {
  const config = requireR2Config();
  const response = await getR2Client().send(
    new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    }),
  );
  return {
    objects: (response.Contents ?? [])
      .filter((o) => o.Key !== undefined)
      .map((o) => ({ key: o.Key as string, lastModified: o.LastModified })),
    nextToken: response.IsTruncated ? response.NextContinuationToken : undefined,
  };
}

/** Batch-deletes up to 1000 keys per call (S3 limit); chunks larger lists. */
export async function deleteObjects(keys: readonly string[]): Promise<number> {
  if (keys.length === 0) return 0;
  const config = requireR2Config();
  let deleted = 0;
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000).map((Key) => ({ Key }));
    const response = await getR2Client().send(
      new DeleteObjectsCommand({ Bucket: config.bucket, Delete: { Objects: chunk } }),
    );
    deleted += response.Deleted?.length ?? 0;
  }
  return deleted;
}
