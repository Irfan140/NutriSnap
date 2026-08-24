const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const DATA_URI_PATTERN = /^data:image\/([a-zA-Z0-9.+-]+);base64,/;

// Maximum accepted base64 image size.
// 200 KB keeps token usage low (~800-1,500 input tokens) to stay within
// Groq free-tier TPM limits (8,000 TPM for qwen/qwen3.6-27b).
export const MAX_IMAGE_BASE64_LENGTH = 200 * 1024;

export function stripImageDataUri(image: string): string {
  return image.replace(DATA_URI_PATTERN, "");
}

export function isBase64Image(value: string): boolean {
  const image = stripImageDataUri(value).trim();
  return image.length > 0 && image.length % 4 === 0 && BASE64_IMAGE_PATTERN.test(image);
}

export function isImageTooLarge(image: string): boolean {
  return stripImageDataUri(image).trim().length > MAX_IMAGE_BASE64_LENGTH;
}

function decodeBase64(base64: string): Uint8Array | null {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

type ImageSignature = {
  readonly mimeType: string;
  readonly matches: (bytes: Uint8Array) => boolean;
};

const IMAGE_SIGNATURES: readonly ImageSignature[] = [
  {
    mimeType: "image/jpeg",
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mimeType: "image/png",
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mimeType: "image/webp",
    matches: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // "WEBP"
  },
  {
    mimeType: "image/gif",
    matches: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && // "GIF8"
      (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61, // "7a" or "9a"
  },
];

/**
 * Detects the image MIME type from the raw bytes of a base64 string.
 * Returns `null` when the content is not a supported image format.
 */
export function detectImageMimeType(base64: string): string | null {
  const bytes = decodeBase64(base64);
  if (bytes === null) {
    return null;
  }

  for (const signature of IMAGE_SIGNATURES) {
    if (signature.matches(bytes)) {
      return signature.mimeType;
    }
  }

  return null;
}

export function toImageDataUri(image: string): string | null {
  const trimmedImage = image.trim();

  if (DATA_URI_PATTERN.test(trimmedImage)) {
    return trimmedImage;
  }

  if (!isBase64Image(trimmedImage)) {
    return null;
  }

  const mimeType = detectImageMimeType(trimmedImage);
  if (mimeType === null) {
    return null;
  }

  return `data:${mimeType};base64,${trimmedImage}`;
}

