import CloudConvert from "cloudconvert";

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || "");

export interface PdfOptimizationResult {
  optimizedBuffer: Buffer;
  thumbnailBuffer: Buffer | null;
  originalSize: number;
  optimizedSize: number;
}

/**
 * Optimize a PDF using CloudConvert API and generate a thumbnail
 * This provides significant compression (typically 50-80% reduction)
 */
export async function optimizePdf(
  buffer: Buffer,
  filename: string
): Promise<PdfOptimizationResult> {
  const originalSize = buffer.length;

  // Skip optimization for small PDFs (< 100KB) - not worth the API call
  if (originalSize < 100 * 1024) {
    console.log(`PDF too small to optimize (${originalSize} bytes), skipping`);
    return {
      optimizedBuffer: buffer,
      thumbnailBuffer: null,
      originalSize,
      optimizedSize: originalSize,
    };
  }

  try {
    // Create a job with import, optimize, thumbnail, and export tasks
    const job = await cloudConvert.jobs.create({
      tasks: {
        "import-pdf": {
          operation: "import/base64",
          file: buffer.toString("base64"),
          filename: filename,
        },
        "optimize-pdf": {
          operation: "optimize",
          input: ["import-pdf"],
          input_format: "pdf",
          profile: "web", // Aggressive compression for web viewing
        },
        "thumbnail-pdf": {
          operation: "thumbnail",
          input: ["import-pdf"],
          output_format: "jpg",
          width: 400,
          height: 400,
          fit: "max",
          count: 1, // Only first page
        },
        "export-pdf": {
          operation: "export/url",
          input: ["optimize-pdf"],
          inline: false,
          archive_multiple_files: false,
        },
        "export-thumbnail": {
          operation: "export/url",
          input: ["thumbnail-pdf"],
          inline: false,
          archive_multiple_files: false,
        },
      },
    });

    console.log(`CloudConvert job created: ${job.id}`);

    // Wait for the job to complete
    const completedJob = await cloudConvert.jobs.wait(job.id);

    console.log(`CloudConvert job status: ${completedJob.status}`);

    // Check if job failed
    if (completedJob.status === "error") {
      const failedTask = completedJob.tasks?.find(t => t.status === "error");
      throw new Error(`CloudConvert job failed: ${failedTask?.message || "Unknown error"}`);
    }

    // Get export URLs
    const exportUrls = cloudConvert.jobs.getExportUrls(completedJob);
    console.log(`CloudConvert export URLs:`, JSON.stringify(exportUrls));

    // Find PDF and thumbnail URLs
    let pdfUrl: string | null = null;
    let thumbnailUrl: string | null = null;

    for (const file of exportUrls) {
      if (file.filename?.endsWith('.pdf')) {
        pdfUrl = file.url || null;
      } else if (file.filename?.endsWith('.jpg')) {
        thumbnailUrl = file.url || null;
      }
    }

    // Fallback: try to find manually
    if (!pdfUrl) {
      const pdfExportTask = completedJob.tasks?.find(
        (task) => task.name === "export-pdf" && task.status === "finished"
      );
      pdfUrl = pdfExportTask?.result?.files?.[0]?.url || null;
    }

    if (!thumbnailUrl) {
      const thumbnailExportTask = completedJob.tasks?.find(
        (task) => task.name === "export-thumbnail" && task.status === "finished"
      );
      thumbnailUrl = thumbnailExportTask?.result?.files?.[0]?.url || null;
    }

    if (!pdfUrl) {
      throw new Error("No optimized PDF URL in CloudConvert response");
    }

    console.log(`CloudConvert PDF URL: ${pdfUrl}`);
    console.log(`CloudConvert thumbnail URL: ${thumbnailUrl}`);

    // Download the optimized PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download optimized PDF: ${pdfResponse.status}`);
    }
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const optimizedBuffer = Buffer.from(pdfArrayBuffer);

    // Download thumbnail if available
    let thumbnailBuffer: Buffer | null = null;
    if (thumbnailUrl) {
      try {
        const thumbnailResponse = await fetch(thumbnailUrl);
        if (thumbnailResponse.ok) {
          const thumbnailArrayBuffer = await thumbnailResponse.arrayBuffer();
          thumbnailBuffer = Buffer.from(thumbnailArrayBuffer);
          console.log(`PDF thumbnail generated: ${thumbnailBuffer.length} bytes`);
        }
      } catch (thumbnailError) {
        console.error("Failed to download PDF thumbnail:", thumbnailError);
      }
    }

    return {
      optimizedBuffer,
      thumbnailBuffer,
      originalSize,
      optimizedSize: optimizedBuffer.length,
    };
  } catch (error) {
    console.error("CloudConvert PDF optimization failed:", error);
    // Return original buffer if optimization fails
    return {
      optimizedBuffer: buffer,
      thumbnailBuffer: null,
      originalSize,
      optimizedSize: originalSize,
    };
  }
}

/**
 * Check if CloudConvert API is configured
 */
export function isCloudConvertConfigured(): boolean {
  return !!process.env.CLOUDCONVERT_API_KEY;
}
