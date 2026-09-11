export type PresignedUpload = {
  readonly key: string;
  readonly uploadUrl: string;
  readonly expiresInSec: number;
};

export type PresignedDownload = {
  readonly downloadUrl: string;
  readonly expiresInSec: number;
};

export type ObjectHead = {
  readonly contentLength: number;
  readonly contentType: string | undefined;
};
