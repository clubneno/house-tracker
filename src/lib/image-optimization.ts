import sharp from "sharp";

export interface OptimizationResult {
  optimizedBuffer: Buffer;
  thumbnailBuffer: Buffer | null;
  originalSize: number;
  optimizedSize: number;
  thumbnailSize: number | null;
  format: string;
  width: number;
  height: number;
}

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  generateThumbnail?: boolean;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 80,
  thumbnailWidth: 400,
  thumbnailHeight: 400,
  generateThumbnail: true,
};

/**
 * Check if a file is an image based on MIME type
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/") && !mimeType.includes("svg");
}

/**
 * Get the output format for Sharp based on input MIME type
 */
function getOutputFormat(mimeType: string): "jpeg" | "png" | "webp" | "avif" {
  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  if (mimeType === "image/avif") {
    return "avif";
  }
  // Default to JPEG for everything else (including HEIC, BMP, etc.)
  return "jpeg";
}

/**
 * Optimize an image using Sharp
 * - Resizes to max dimensions while maintaining aspect ratio
 * - Compresses based on format
 * - Generates a thumbnail
 */
export async function optimizeImage(
  buffer: Buffer,
  mimeType: string,
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = buffer.length;

  // Get image metadata
  const metadata = await sharp(buffer).metadata();
  const outputFormat = getOutputFormat(mimeType);

  // Create Sharp instance for the main image
  let sharpInstance = sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(opts.maxWidth, opts.maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

  // Apply format-specific compression
  if (outputFormat === "jpeg") {
    sharpInstance = sharpInstance.jpeg({
      quality: opts.quality,
      progressive: true,
      mozjpeg: true,
    });
  } else if (outputFormat === "png") {
    sharpInstance = sharpInstance.png({
      quality: opts.quality,
      compressionLevel: 9,
      palette: true,
    });
  } else if (outputFormat === "webp") {
    sharpInstance = sharpInstance.webp({
      quality: opts.quality,
      effort: 6,
    });
  } else if (outputFormat === "avif") {
    sharpInstance = sharpInstance.avif({
      quality: opts.quality,
      effort: 6,
    });
  }

  const optimizedBuffer = await sharpInstance.toBuffer();
  const optimizedMetadata = await sharp(optimizedBuffer).metadata();

  // Generate thumbnail if requested
  let thumbnailBuffer: Buffer | null = null;
  let thumbnailSize: number | null = null;

  if (opts.generateThumbnail) {
    let thumbnailInstance = sharp(buffer)
      .rotate()
      .resize(opts.thumbnailWidth, opts.thumbnailHeight, {
        fit: "cover",
        position: "center",
      });

    // Use JPEG for thumbnails (good compression, wide compatibility)
    thumbnailInstance = thumbnailInstance.jpeg({
      quality: 70,
      progressive: true,
    });

    thumbnailBuffer = await thumbnailInstance.toBuffer();
    thumbnailSize = thumbnailBuffer.length;
  }

  return {
    optimizedBuffer,
    thumbnailBuffer,
    originalSize,
    optimizedSize: optimizedBuffer.length,
    thumbnailSize,
    format: outputFormat,
    width: optimizedMetadata.width || 0,
    height: optimizedMetadata.height || 0,
  };
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(originalSize: number, optimizedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round((1 - optimizedSize / originalSize) * 100);
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

