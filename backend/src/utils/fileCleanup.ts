import fs from "fs";
import path from "path";

export function scheduleFileDeletion(filePath: string, cleanupAfterMs: number): void {
  // Ensure the file exists before scheduling.
  try {
    if (!fs.existsSync(filePath)) return;
  } catch {
    return;
  }

  setTimeout(async () => {
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // Ignore if already deleted.
    }
  }, cleanupAfterMs).unref();
}

async function deleteOldFilesInDir(dirPath: string, olderThanMs: number): Promise<void> {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const now = Date.now();
    await Promise.all(
      entries.map(async (ent) => {
        if (!ent.isFile()) return;
        const fullPath = path.join(dirPath, ent.name);
        const stat = await fs.promises.stat(fullPath);
        const ageMs = now - stat.mtimeMs;
        if (ageMs >= olderThanMs) {
          await fs.promises.unlink(fullPath).catch(() => undefined);
        }
      })
    );
  } catch {
    // Directory might not exist yet.
  }
}

export function startPeriodicCleanup(uploadDir: string, generatedDir: string, olderThanMs: number): void {
  const safeDirs = [uploadDir, generatedDir].filter(Boolean);
  for (const d of safeDirs) {
    try {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    } catch {
      // ignore
    }
  }

  // Run every 10 minutes.
  const interval = setInterval(() => {
    void Promise.all(safeDirs.map((dir) => deleteOldFilesInDir(dir, olderThanMs))).catch(() => undefined);
  }, 10 * 60 * 1000);
  interval.unref();
}

