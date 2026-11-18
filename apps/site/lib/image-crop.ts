/**
 * getCroppedImg — canvas-based image cropper.
 *
 * Turns a source image + crop rectangle (as produced by react-easy-crop's
 * onCropComplete) into a JPEG data URL, sized to `outputSize` (default
 * 512×512) so uploads stay small and consistent regardless of the source.
 *
 * The output MUST fit inside our /api/profiles PATCH limit of ~450 KB
 * decoded; JPEG q=0.85 at 512×512 typically lands well under 100 KB.
 */
export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const OUTPUT_SIZE_DEFAULT = 512;
const OUTPUT_QUALITY_DEFAULT = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${String(e)}`));
    img.src = src;
  });
}

/**
 * Crop `imageSrc` to the given pixel rectangle and return a JPEG data URL.
 * Optionally rotate the image before cropping (degrees; 0 by default).
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotationDeg: number = 0,
  outputSize: number = OUTPUT_SIZE_DEFAULT,
  quality: number = OUTPUT_QUALITY_DEFAULT,
): Promise<string> {
  const image = await loadImage(imageSrc);

  // If rotated, we first render the rotated source onto an offscreen canvas
  // large enough to contain the rotated bounding box, then crop from that.
  const radians = (rotationDeg * Math.PI) / 180;
  const rotatedWidth = Math.abs(Math.cos(radians) * image.width) +
                       Math.abs(Math.sin(radians) * image.height);
  const rotatedHeight = Math.abs(Math.sin(radians) * image.width) +
                        Math.abs(Math.cos(radians) * image.height);

  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;
  const rctx = rotatedCanvas.getContext("2d")!;
  rctx.translate(rotatedWidth / 2, rotatedHeight / 2);
  rctx.rotate(radians);
  rctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Now crop from the rotated source into the final square output.
  const output = document.createElement("canvas");
  output.width = outputSize;
  output.height = outputSize;
  const octx = output.getContext("2d")!;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(
    rotatedCanvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, outputSize, outputSize,
  );

  // Use JPEG for a compact base64; profile pictures don't need alpha.
  return output.toDataURL("image/jpeg", quality);
}

/**
 * Estimate the size of a base64 data URL in bytes. Useful to warn the
 * user before submitting an oversize photo.
 */
export function estimateBase64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  // Base64 encodes 3 bytes as 4 chars, ignoring the "=" padding.
  const padding = (payload.match(/=+$/)?.[0] || "").length;
  return Math.floor((payload.length * 3) / 4) - padding;
}
