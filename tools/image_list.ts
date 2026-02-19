import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

export default tool({
  description: "List images in directory with optional pattern filter",
  
  args: {
    dir: z.string().describe("Directory path"),
    pattern: z.string().optional().describe("Filter pattern (e.g., *heatmap*)")
  },
  
  execute: async ({ dir, pattern }, { /* directory */ }) => {
    const fs = await import("fs");
    const path = await import("path");
    const processModule = await import("process");

    const fullDir = path.resolve(processModule.cwd(), dir);
    
    if (!fs.existsSync(fullDir)) {
      return JSON.stringify({ success: false, error: `Directory not found: ${fullDir}` });
    }
    
    // Read directory
    const files = fs.readdirSync(fullDir);
    
    // Image extensions
    const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];
    
    // Convert glob pattern to regex
    const regex = new RegExp("^" + (pattern || "").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
    
    // Filter images
    const images = files
      .filter(f => imageExts.includes(path.extname(f).toLowerCase()))
      .filter(f => regex.test(f))
      .map(f => {
        const stat = fs.statSync(path.join(fullDir, f));
        return {
          name: f,
          path: path.join(fullDir, f),
          size_kb: (stat.size / 1024).toFixed(1)
        };
      });
    
    return JSON.stringify({
      success: true,
      count: images.length,
      images
    });
  }
});