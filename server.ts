import express from "express";
import { createServer as createViteServer } from "vite";
import { exec, spawn } from "child_process";
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

  // In-memory job tracking map: jobId -> { status, filePath, fileName, error }
  const jobs = new Map<string, { status: 'processing' | 'ready' | 'error'; progress?: number; filePath?: string; fileName?: string; error?: string }>();

  // Cleanup downloads directory utility
  const cleanupDownloadsDir = () => {
    try {
      if (fs.existsSync(downloadsDir)) {
        const files = fs.readdirSync(downloadsDir);
        const activeFiles = new Set<string>();
        jobs.forEach(job => {
          if ((job.status === 'processing' || job.status === 'ready') && job.filePath) {
            activeFiles.add(path.basename(job.filePath));
          }
        });

        for (const file of files) {
          if (activeFiles.has(file)) continue;
          const filePath = path.join(downloadsDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
        console.log("Downloads directory cleaned (Active files protected)");
      }
    } catch (err: any) {
      console.error("Error cleaning downloads directory:", err.message);
    }
  };

  // Run initial cleanup
  cleanupDownloadsDir();

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
  const apiRouter = express.Router();

  apiRouter.get("/health", async (req, res) => {
    try {
      const command = isWindows ? `"${ytdlpPath}" --version` : `${ytdlpPath} --version`;
      const { stdout } = await execPromise(command);
      res.json({ status: "ok", ytdlp: stdout.trim() });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: "yt-dlp not found or failed", error: error.message });
    }
  });

  apiRouter.post("/metadata", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      console.log(`Fetching metadata for: ${url}`);

      let data: any = null;
      let errorMsg = "";

      try {
        const commonFlags = `--no-playlist --no-warnings --no-check-certificates --skip-download --dump-single-json`;
        const command = isWindows ? `"${ytdlpPath}" ${commonFlags} "${url}"` : `${ytdlpPath} ${commonFlags} "${url}"`;
        const { stdout } = await execPromise(command, { env: { ...process.env } });
        data = JSON.parse(stdout);
      } catch (ytError: any) {
        console.warn("yt-dlp metadata failed, trying OEmbed fallback:", ytError.message);
        errorMsg = ytError.message;
      }

      if (!data && (url.includes("youtube.com") || url.includes("youtu.be"))) {
        try {
          const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
          const response = await fetch(oembedUrl);
          if (response.ok) {
            const oembedData: any = await response.json();
            data = {
              title: oembedData.title,
              uploader: oembedData.author_name,
              thumbnail: oembedData.thumbnail_url,
              duration_string: "0:00",
              filesize_approx: 0,
              extractor_key: "YouTube (OEmbed)"
            };
          }
        } catch (oembedError: any) {
          console.error("OEmbed fallback failed:", oembedError.message);
        }
      }

      if (!data) throw new Error(errorMsg || "Não foi possível extrair metadados.");

      const formats = data.formats || [];
      const resolutionsSet = new Set<number>();
      formats.forEach((f: any) => {
        const h = parseInt(f.height || f.resolution?.split('x')[1] || "0");
        if ([720, 1080, 1440, 2160].includes(h)) resolutionsSet.add(h);
      });
      if (!resolutionsSet.has(720)) resolutionsSet.add(720);
      if (!resolutionsSet.has(1080)) resolutionsSet.add(1080);
      let availableResolutions = Array.from(resolutionsSet).sort((a, b) => b - a);

      const availableExts = Array.from(new Set(
        formats.filter((f: any) => f.vcodec && f.vcodec !== 'none' && f.ext).map((f: any) => f.ext)
      ));

      res.json({
        title: data.title || "Sem Título",
        channel: data.uploader || data.channel || "Canal Desconhecido",
        thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails.length > 0 ? data.thumbnails[data.thumbnails.length - 1].url : ""),
        duration: data.duration_string || "0:00",
        sizeBytes: data.filesize || data.filesize_approx || 0,
        platform: data.extractor_key || "Unknown",
        original_url: url,
        resolutions: availableResolutions,
        formats: availableExts.length > 0 ? availableExts : ['mp4', 'mkv', 'webm']
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/process", async (req, res) => {
    cleanupDownloadsDir(); // SMART CLEANUP
    const { url, format, quality, title } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const jobId = uuidv4();
    const outputTemplate = path.join(downloadsDir, `${jobId}.%(ext)s`);
    const isAudio = format && format.toLowerCase().includes("mp3");

    jobs.set(jobId, { status: 'processing', progress: 0 });
    res.json({ jobId });

    const args = [
      "--no-playlist", "--no-warnings", "--no-mtime",
      "--ffmpeg-location", process.cwd(),
      "--concurrent-fragments", "10", "--buffer-size", "16M",
      "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "-o", outputTemplate
    ];

    if (isAudio) {
      args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
    } else {
      const height = quality ? String(quality).match(/\d+/)?.[0] || "1080" : "1080";
      const ext = (format || "mp4").toLowerCase();
      const formatStr = `best[height<=${height}][ext=mp4][vcodec!=none][acodec!=none]/bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}]/best`;
      args.push("-f", formatStr, "--merge-output-format", ext, "--postprocessor-args", "Merger:-c copy");
    }
    args.push(url);

    const child = spawn(ytdlpPath, args);
    child.stdout.on('data', (data) => {
      const match = data.toString().match(/(\d+\.\d+)%/);
      if (match) {
        const progress = parseFloat(match[1]);
        const job = jobs.get(jobId);
        if (job) jobs.set(jobId, { ...job, progress });
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        const files = fs.readdirSync(downloadsDir);
        const file = files.find(f => f.startsWith(jobId));
        if (file) {
          const filePath = path.join(downloadsDir, file);
          jobs.set(jobId, { status: 'ready', progress: 100, filePath, fileName: `${title || 'video'}.${path.extname(file).slice(1)}` });
        }
      } else {
        jobs.set(jobId, { status: 'error', error: `Exit code ${code}` });
      }
    });
  });

  apiRouter.get("/process/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ status: 'error', error: 'Not found' });
    res.json({ status: job.status, progress: job.progress || 0, error: job.error });
  });

  apiRouter.get("/serve/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || job.status !== 'ready' || !job.filePath) return res.status(404).json({ error: 'Not ready' });

    res.download(job.filePath, job.fileName!, (err) => {
      if (!err) {
        cleanupDownloadsDir(); // Cleanup after successful serve
        jobs.delete(req.params.jobId);
      }
    });
  });

  apiRouter.get("/history", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM downloads ORDER BY date DESC").all());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.post("/history", (req, res) => {
    const item = req.body;
    try {
      db.prepare(`INSERT OR REPLACE INTO downloads (id, title, url, platform, format, quality, thumbnail, channel, status, progress, size, date, jobId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(item.id, item.title, item.url, item.platform, item.format, item.quality, item.thumbnail, item.channel, item.status, item.progress, item.size, item.date, item.jobId);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.delete("/history/completed", (req, res) => {
    try {
      db.prepare("DELETE FROM downloads WHERE status = 'completed'").run();
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.delete("/history/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM downloads WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.use("/api", apiRouter);
  app.use("/BD-Downloader/api", apiRouter);

  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, "index.html"));

  if (!isProduction) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa", base: '/BD-Downloader/' });
    app.use(vite.middlewares);
  } else {
    app.use("/BD-Downloader", express.static(distPath));
    app.get("/BD-Downloader/*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
    app.get("/", (req, res) => res.redirect("/BD-Downloader/"));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
