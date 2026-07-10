import { ImageError } from "../errors/domain-errors.js";

const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const DATA_URI_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

export function stripImageDataUri(image: string): string {
  return image.replace(DATA_URI_PATTERN, "");
}

export function isBase64Image(value: string): boolean {
  const image = stripImageDataUri(value).trim();
  return image.length > 0 && image.length % 4 === 0 && BASE64_IMAGE_PATTERN.test(image);
}

export function toImageDataUri(image: string, mimeType = "image/png"): string {
  const trimmedImage = image.trim();

  if (DATA_URI_PATTERN.test(trimmedImage)) {
    return trimmedImage;
  }

  if (!isBase64Image(trimmedImage)) {
    throw new ImageError("Invalid image payload. Provide a base64 encoded image.");
  }

  return `data:${mimeType};base64,${trimmedImage}`;
}

