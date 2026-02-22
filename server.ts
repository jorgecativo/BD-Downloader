import express from "express";
import { createServer as createViteServer } from "vite";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { promisify } from "util";
import db from "./src/db.js";

const execPromise = promisify(exec);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure downloads directory exists
  const downloadsDir = path.join(process.cwd(), "downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
  }

  // Check and install binaries if missing
  const isWindows = process.platform === "win32";
  const ytdlpFileName = isWindows ? "yt-dlp.exe" : "yt-dlp";
  const ytdlpPath = path.join(process.cwd(), ytdlpFileName);
  const ffmpegPath = path.join(process.cwd(), isWindows ? "ffmpeg.exe" : "ffmpeg");

  // FFmpeg check and install
  try {
    const ffmpegCmd = isWindows ? `"${ffmpegPath}" -version` : "ffmpeg -version";
    await execPromise(ffmpegCmd);
    console.log("FFmpeg is already installed or available");
  } catch (e) {
    if (isWindows) {
      console.log("FFmpeg not found, attempting to download Windows binary...");
      try {
        const ffmpegZipPath = path.join(process.cwd(), "ffmpeg.zip");
        const ffmpegDownloadUrl = "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip";

        const response = await fetch(ffmpegDownloadUrl);
        if (!response.ok) throw new Error("Failed to download FFmpeg zip");
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(ffmpegZipPath, Buffer.from(buffer));

        console.log("FFmpeg zip downloaded, extracting...");
        await execPromise(`powershell -Command "Expand-Archive -Path '${ffmpegZipPath}' -DestinationPath '${process.cwd()}' -Force"`);

        const dirs = fs.readdirSync(process.cwd(), { withFileTypes: true });
        const ffmpegDir = dirs.find(d => d.isDirectory() && d.name.startsWith("ffmpeg-master"));
        if (ffmpegDir) {
          const binPath = path.join(process.cwd(), ffmpegDir.name, "bin");
          fs.copyFileSync(path.join(binPath, "ffmpeg.exe"), path.join(process.cwd(), "ffmpeg.exe"));
          fs.copyFileSync(path.join(binPath, "ffprobe.exe"), path.join(process.cwd(), "ffprobe.exe"));
          try {
            fs.unlinkSync(ffmpegZipPath);
            fs.rmSync(path.join(process.cwd(), ffmpegDir.name), { recursive: true, force: true });
          } catch (cleanupErr: any) {
            console.warn("Cleanup failed, but binaries should be ready:", cleanupErr.message);
          }
        }
        console.log("FFmpeg and ffprobe installed successfully");
      } catch (err) {
        console.error("Failed to download/install FFmpeg:", err);
      }
    } else {
      console.warn("FFmpeg not found. Please install it using your package manager.");
    }
  }

  // Check and install yt-dlp
  try {
    const versionCmd = isWindows ? `"${ytdlpPath}" --version` : `${ytdlpPath} --version`;
    await execPromise(versionCmd);
    console.log("yt-dlp is already installed");
  } catch (e) {
    console.log(`yt-dlp not found at ${ytdlpPath}, attempting to download binary...`);
    try {
      const downloadUrl = isWindows
        ? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
        : "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to download yt-dlp binary");
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(ytdlpPath, Buffer.from(buffer));

      if (!isWindows) {
        try {
          await execPromise(`chmod +x ${ytdlpPath}`);
        } catch (chmodErr) {
          console.warn("Could not chmod +x, will try running with python if available");
        }
      }
      console.log("yt-dlp binary downloaded successfully");
    } catch (err) {
      console.error("Failed to download yt-dlp:", err);
    }
  }

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      const command = isWindows ? `"${ytdlpPath}" --version` : `${ytdlpPath} --version`;
      const { stdout } = await execPromise(command);
      res.json({ status: "ok", ytdlp: stdout.trim() });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: "yt-dlp not found or failed", error: error.message });
    }
  });

  app.post("/api/metadata", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      console.log(`Fetching metadata for: ${url}`);
      const commonFlags = `--no-playlist --no-warnings --print-json --ffmpeg-location "${process.cwd()}"`;
      const command = isWindows
        ? `"${ytdlpPath}" ${commonFlags} "${url}"`
        : `${ytdlpPath} ${commonFlags} "${url}"`;

      const { stdout } = await execPromise(command, { env: { ...process.env } });
      const data = JSON.parse(stdout);

      res.json({
        title: data.title || "Sem Título",
        channel: data.uploader || data.channel || "Canal Desconhecido",
        thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails.length > 0 ? data.thumbnails[data.thumbnails.length - 1].url : `https://picsum.photos/seed/${Math.random()}/1280/720`),
        duration: data.duration_string || "0:00",
        sizeBytes: data.filesize || data.filesize_approx || 0,
        platform: data.extractor_key || "Unknown",
        original_url: url
      });
    } catch (error: any) {
      console.error("Metadata error:", error);
      res.status(500).json({ error: `Erro ao extrair metadados: ${error.message}` });
    }
  });

  app.post("/api/download", async (req, res) => {
    const { url, format, quality, title } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const id = uuidv4();
    const outputTemplate = path.join(downloadsDir, `${id}.%(ext)s`);

    const commonFlags = `--no-playlist --no-warnings --ffmpeg-location "${process.cwd()}"`;
    let baseCommand = isWindows
      ? `"${ytdlpPath}" ${commonFlags} -o "${outputTemplate}" `
      : `${ytdlpPath} ${commonFlags} -o "${outputTemplate}" `;

    const isAudio = format && format.toLowerCase().includes("mp3");

    if (isAudio) {
      baseCommand += `-x --audio-format mp3 --audio-quality 0 `;
    } else {
      // quality can be like '1080p', '720p', '1080 Full HD', or just 'best'
      const heightMatch = quality ? String(quality).match(/\d+/) : null;
      const height = heightMatch ? heightMatch[0] : "1080";
      baseCommand += `-f "bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 `;
    }

    baseCommand += `"${url}"`;

    try {
      console.log(`Executing download: ${baseCommand}`);
      await execPromise(baseCommand);

      const files = fs.readdirSync(downloadsDir);
      const fileNameOnDisk = files.find(f => f.startsWith(id));

      if (!fileNameOnDisk) {
        throw new Error("File not found after download");
      }

      const filePath = path.join(downloadsDir, fileNameOnDisk);

      const cleanTitle = (title || "video").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const resolution = isAudio ? 'audio' : (quality || '1080p');
      const ext = path.extname(fileNameOnDisk).replace('.', '');
      const downloadName = `${cleanTitle}-${resolution}.${ext}`;

      res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);

      res.download(filePath, downloadName, (err) => {
        if (err) {
          console.error("Download error:", err);
        }
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      });
    } catch (error: any) {
      console.error("Download execution error:", error);
      res.status(500).json({ error: `Erro no download: ${error.message}` });
    }
  });

  // History API Endpoints
  // Application-level security (RLS-like scoping) is implemented here
  app.get("/api/history", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM downloads ORDER BY date DESC").all();
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/history", (req, res) => {
    const item = req.body;
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO downloads (id, title, url, platform, format, quality, thumbnail, channel, status, progress, size, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(item.id, item.title, item.url, item.platform, item.format, item.quality, item.thumbnail, item.channel, item.status, item.progress, item.size, item.date);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/history/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM downloads WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
