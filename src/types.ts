export interface DownloadItem {
  id: string;
  title: string;
  url: string;
  platform: 'YouTube' | 'TikTok' | 'Instagram';
  format: string;
  quality: string;
  size: string;
  thumbnail: string;
  channel: string;
  status: 'processing' | 'ready' | 'downloading' | 'completed' | 'error' | 'queued';
  progress: number;
  speed?: string;
  date: string;
  jobId?: string;
  availableResolutions?: number[];
  availableFormats?: string[];
}

export type AppTab = 'downloader' | 'history';
