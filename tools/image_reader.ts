import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

export default tool({
  description:
    "Read image file as base64 for vision models. Supports PNG, JPG, GIF, BMP, WEBP.",

  args: {
    path: z.string().describe("Path to image file (relative or absolute)"),
  },

  execute: async ({ path }, { /* directory */ }) => {
    const fs = await import("fs");
    const pathModule = await import("path");
    const processModule = await import("process");

    // Resolve path - using current working directory from process
    const fullPath = pathModule.resolve(processModule.cwd(), path);

    // Check exists
    if (!fs.existsSync(fullPath)) {
      return JSON.stringify({
        success: false,
        error: `File not found: ${fullPath}`,
      });
    }

    // Read and encode
    const buffer = fs.readFileSync(fullPath);
    const base64 = buffer.toString("base64");
    const ext = pathModule.extname(fullPath).toLowerCase();

    // MIME type
    const mime: { [key: string]: string } = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
      ".webp": "image/webp",
    };
    const mimeType = mime[ext] || "image/png";

    return JSON.stringify({
      success: true,
      base64,
      mime_type: mimeType,
      file_size: buffer.length,
      message: `✅ Loaded ${pathModule.basename(fullPath)} (${(buffer.length / 1024).toFixed(1)} KB)`,
    });
  },
});
