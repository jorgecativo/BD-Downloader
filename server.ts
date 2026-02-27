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
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Enhanced middleware to handle subdirectory deployment (e.g., cPanel)
  app.use((req, res, next) => {
    // Log request for debugging in cPanel
    console.log(`[REQUEST] ${req.method} ${req.url}`);

    const apiIdx = req.url.indexOf('/api/');
    if (apiIdx > 0) {
      req.url = req.url.substring(apiIdx);
      return next();
    }

    const assetsIdx = req.url.indexOf('/assets/');
    if (assetsIdx > 0) {
      req.url = req.url.substring(assetsIdx);
      return next();
    }

    next();
  });

  // Ensure downloads directory exists
  const downloadsDir = path.join(process.cwd(), "downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Check and install binaries if missing
  const isWindows = process.platform === "win32";
  const ytdlpFileName = isWindows ? "yt-dlp.exe" : "yt-dlp";
  const ytdlpPath = path.join(process.cwd(), ytdlpFileName);
  const ffmpegPath = path.join(process.cwd(), isWindows ? "ffmpeg.exe" : "ffmpeg");

  // In-memory job tracking
  const jobs = new Map<string, { status: 'processing' | 'ready' | 'error'; progress?: number; filePath?: string; fileName?: string; error?: string }>();

  // Cleanup downloads utility
  const cleanupDownloadsDir = () => {
    try {
      if (fs.existsSync(downloadsDir)) {
        const files = fs.readdirSync(downloadsDir);
        for (const file of files) {
          const filePath = path.join(downloadsDir, file);
          const isProcessing = Array.from(jobs.values()).some(j => j.filePath === filePath && j.status === 'processing');
          if (!isProcessing && fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (err: any) { console.error("Cleanup error:", err.message); }
  };

  cleanupDownloadsDir();

  // FFmpeg check and install for Windows and Linux
  try {
    const ffmpegCmd = isWindows ? `"${ffmpegPath}" -version` : `${ffmpegPath} -version`;
    await execPromise(ffmpegCmd);
    console.log("FFmpeg is active");
  } catch (e) {
    console.log(`FFmpeg not found. Attempting to install for ${process.platform}...`);
    try {
      if (isWindows) {
        const ffmpegZip = path.join(process.cwd(), "ffmpeg.zip");
        const url = "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip";
        const res = await fetch(url);
        fs.writeFileSync(ffmpegZip, Buffer.from(await res.arrayBuffer()));
        await execPromise(`powershell -Command "Expand-Archive -Path '${ffmpegZip}' -DestinationPath '${process.cwd()}' -Force"`);
        const ffmpegDir = fs.readdirSync(process.cwd()).find(d => d.startsWith("ffmpeg-master"));
        if (ffmpegDir) {
          const bin = path.join(process.cwd(), ffmpegDir, "bin");
          fs.copyFileSync(path.join(bin, "ffmpeg.exe"), path.join(process.cwd(), "ffmpeg.exe"));
          fs.copyFileSync(path.join(bin, "ffprobe.exe"), path.join(process.cwd(), "ffprobe.exe"));
          fs.rmSync(path.join(process.cwd(), ffmpegDir), { recursive: true, force: true });
        }
        fs.unlinkSync(ffmpegZip);
      } else {
        // Linux (cPanel) - Download static 64-bit binary
        console.log("Downloading static FFmpeg for Linux...");
        const url = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";
        const tarPath = path.join(process.cwd(), "ffmpeg.tar.xz");
        const res = await fetch(url);
        fs.writeFileSync(tarPath, Buffer.from(await res.arrayBuffer()));
        await execPromise(`tar -xJf "${tarPath}" -C "${process.cwd()}"`);
        const ffmpegDir = fs.readdirSync(process.cwd()).find(d => d.startsWith("ffmpeg-") && d.includes("-static"));
        if (ffmpegDir) {
          fs.copyFileSync(path.join(process.cwd(), ffmpegDir, "ffmpeg"), path.join(process.cwd(), "ffmpeg"));
          fs.copyFileSync(path.join(process.cwd(), ffmpegDir, "ffprobe"), path.join(process.cwd(), "ffprobe"));
          fs.rmSync(path.join(process.cwd(), ffmpegDir), { recursive: true, force: true });
        }
        fs.unlinkSync(tarPath);
        await execPromise(`chmod +x "${path.join(process.cwd(), "ffmpeg")}" "${path.join(process.cwd(), "ffprobe")}"`);
      }
      console.log("FFmpeg installed successfully");
    } catch (err) { console.error("FFmpeg install failed:", err); }
  }

  // yt-dlp check and install
  try {
    await execPromise(isWindows ? `"${ytdlpPath}" --version` : `${ytdlpPath} --version`);
  } catch (e) {
    console.log("Installing yt-dlp...");
    const url = isWindows ? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" : "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
    const res = await fetch(url);
    fs.writeFileSync(ytdlpPath, Buffer.from(await res.arrayBuffer()));
    if (!isWindows) await execPromise(`chmod +x "${ytdlpPath}"`);
    console.log("yt-dlp installed");
  }

  const apiRouter = express.Router();

  apiRouter.get("/health", async (req, res) => {
    try {
      const { stdout } = await execPromise(isWindows ? `"${ytdlpPath}" --version` : `${ytdlpPath} --version`);
      res.json({ status: "ok", ytdlp: stdout.trim(), platform: process.platform });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  apiRouter.post("/metadata", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    try {
      console.log(`Metadata for: ${url}`);
      let data: any = null;
      try {
        const cmd = isWindows ? `"${ytdlpPath}" --no-playlist --dump-single-json "${url}"` : `${ytdlpPath} --no-playlist --dump-single-json "${url}"`;
        const { stdout } = await execPromise(cmd, { env: { ...process.env } });
        data = JSON.parse(stdout);
      } catch (e: any) {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          const resOembed = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
          if (resOembed.ok) {
            const o = await resOembed.json();
            data = { title: o.title, uploader: o.author_name, thumbnail: o.thumbnail_url, duration_string: "0:00" };
          }
        }
      }
      if (!data) throw new Error("Metadata failed");

      const formats = data.formats || [];
      const resolutionsSet = new Set<number>();
      const resolutionSizes: Record<number, number> = {};
      const bestAudio = formats.filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none').sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];
      const audioSize = bestAudio ? (bestAudio.filesize || bestAudio.filesize_approx || 0) : 0;

      formats.forEach((f: any) => {
        const h = parseInt(f.height || f.resolution?.split('x')[1] || "0");
        if (h > 0) {
          resolutionsSet.add(h);
          const vSize = f.filesize || f.filesize_approx || 0;
          if (vSize > 0) resolutionSizes[h] = Math.max(resolutionSizes[h] || 0, vSize + audioSize);
        }
      });

      if (!resolutionsSet.has(720)) resolutionsSet.add(720);
      if (!resolutionsSet.has(1080)) resolutionsSet.add(1080);
      if (!resolutionSizes[720]) resolutionSizes[720] = data.filesize || data.filesize_approx || (10 * 1024 * 1024);
      if (!resolutionSizes[1080]) resolutionSizes[1080] = (resolutionSizes[720] * 1.5);

      res.json({
        title: data.title || "Sem Título",
        channel: data.uploader || data.channel || "Canal Desconhecido",
        thumbnail: data.thumbnail || (data.thumbnails?.[data.thumbnails.length - 1]?.url) || "",
        duration: data.duration_string || "0:00",
        sizeBytes: data.filesize || data.filesize_approx || 0,
        resolutionSizes,
        platform: data.extractor_key || "Unknown",
        resolutions: Array.from(resolutionsSet).sort((a, b) => b - a),
        formats: Array.from(new Set(formats.filter((f: any) => f.vcodec !== 'none' && f.ext).map((f: any) => f.ext))) || ['mp4']
      });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  apiRouter.post("/process", async (req, res) => {
    cleanupDownloadsDir();
    const { url, format, quality, title } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    const jobId = uuidv4();
    const outputTemplate = path.join(downloadsDir, `${jobId}.%(ext)s`);
    jobs.set(jobId, { status: 'processing', progress: 0 });
    res.json({ jobId });

    const height = quality ? String(quality).match(/\d+/)?.[0] || "1080" : "1080";
    const ext = (format || "mp4").toLowerCase();
    const isAudio = ext.includes("mp3");

    const args = [
      "--no-playlist", "--no-warnings", "--no-check-certificate",
      "--ffmpeg-location", ffmpegPath,
      "-o", outputTemplate
    ];

    if (isAudio) {
      args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
    } else {
      args.push("-f", `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`, "--merge-output-format", ext);
    }
    args.push(url);

    const child = spawn(ytdlpPath, args);
    child.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/(\d+\.\d+)%/);
      if (match) {
        const progress = parseFloat(match[1]);
        const job = jobs.get(jobId);
        if (job) jobs.set(jobId, { ...job, progress });
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        const file = fs.readdirSync(downloadsDir).find(f => f.startsWith(jobId));
        if (file) {
          const filePath = path.join(downloadsDir, file);
          jobs.set(jobId, { status: 'ready', progress: 100, filePath, fileName: `${title || 'video'}${path.extname(file)}` });
        }
      } else {
        jobs.set(jobId, { status: 'error', error: `Exit code ${code}` });
      }
    });
  });

  apiRouter.get("/process/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
  });

  apiRouter.get("/serve/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || job.status !== 'ready' || !job.filePath) return res.status(404).json({ error: 'Not ready' });
    res.download(job.filePath, job.fileName!, (err) => {
      if (!err) {
        jobs.delete(req.params.jobId);
        cleanupDownloadsDir();
      }
    });
  });

  apiRouter.get("/history", (req, res) => {
    try { res.json(db.prepare("SELECT * FROM downloads ORDER BY date DESC").all()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.post("/history", (req, res) => {
    const i = req.body;
    try {
      db.prepare(`INSERT OR REPLACE INTO downloads (id, title, url, platform, format, quality, thumbnail, channel, status, progress, size, date, jobId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(i.id, i.title, i.url, i.platform, i.format, i.quality, i.thumbnail, i.channel, i.status, i.progress, i.size, i.date, i.jobId);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.delete("/history/completed", (req, res) => {
    try { db.prepare("DELETE FROM downloads WHERE status = 'completed'").run(); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.delete("/history/:id", (req, res) => {
    try { db.prepare("DELETE FROM downloads WHERE id = ?").run(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.use("/api", apiRouter);

  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.log("Starting in DEVELOPMENT mode (Vite)");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa", base: '/' });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode");
    app.use("/", express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch(err => {
  console.error("Startup error:", err);
  process.exit(1);
});
