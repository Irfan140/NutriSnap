import * as ImageManipulator from "expo-image-manipulator";

/** Long edge capped so uploads stay small without losing meal detail. */
const MAX_DIMENSION = 1024;
/** JPEG quality that keeps food recognizable while staying compact. */
const JPEG_QUALITY = 0.7;

export type PreparedMealImage = {
  /** Local file URI of the normalized JPEG, ready for direct upload. */
  readonly uri: string;
  readonly width: number;
  readonly height: number;
};

/**
 * Normalizes a gallery pick for upload: downscales oversized photos and
 * converts everything (including iOS HEIC) to JPEG. Returns the new file URI.
 */
export async function prepareMealImage(
  uri: string,
  sourceWidth?: number,
  sourceHeight?: number,
): Promise<PreparedMealImage> {
  const needsResize =
    typeof sourceWidth === "number" && typeof sourceHeight === "number"
      ? sourceWidth > MAX_DIMENSION || sourceHeight > MAX_DIMENSION
      : true;

  // Constrain the long edge so portrait photos are not upscaled by a
  // width-only resize; omit dimensions when unknown (manipulator clamps).
  const resize =
    typeof sourceWidth === "number" &&
    typeof sourceHeight === "number" &&
    sourceWidth > 0 &&
    sourceHeight > 0
      ? sourceWidth >= sourceHeight
        ? { width: Math.min(sourceWidth, MAX_DIMENSION) }
        : { height: Math.min(sourceHeight, MAX_DIMENSION) }
      : { width: MAX_DIMENSION };

  const result = await ImageManipulator.manipulateAsync(
    uri,
    needsResize ? [{ resize }] : [],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return { uri: result.uri, width: result.width, height: result.height };
}
