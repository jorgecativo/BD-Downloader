import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  History as HistoryIcon,
  Link as LinkIcon,
  Settings,
  Play,
  Music,
  Monitor,
  Smartphone,
  ShieldCheck,
  Zap,
  ChevronRight,
  Trash2,
  Pause,
  MoreHorizontal,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Package,
  Menu,
  ExternalLink,
  Plus,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadItem, AppTab } from './types';

const formatSize = (bytes: number) => {
  if (!bytes || bytes === 0) return 'Estimação Indisponível';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- Components ---

const Sidebar = ({ isOpen, onClose, items, onDelete, onDownloadFile }: {
  isOpen: boolean,
  onClose: () => void,
  items: DownloadItem[],
  onDelete: (id: string) => void,
  onDownloadFile: (item: DownloadItem) => void
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-[70] flex flex-col shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-none">Histórico</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recentes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <Package className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">Nenhum download concluído</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-red-200 hover:bg-red-50/30 transition-all">
                      <div className="flex gap-3">
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight mb-1">{item.title}</h3>
                          <p className="text-[9px] font-bold text-red-600 truncate">{item.channel}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/50">
                        <span className="text-[9px] font-black text-slate-500">
                          {new Date(item.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onDownloadFile(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {item.status !== 'completed' && item.status !== 'ready' ? (
                            <button
                              onClick={() => onDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onDownloadFile(item)}
                              className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg transition-colors hover:bg-emerald-100"
                              title="Abrir"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={onClose}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                FECHAR HISTÓRICO
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Navbar = ({ onOpenSidebar, hasHistory }: { onOpenSidebar: () => void, hasHistory: boolean }) => (
  <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-8 h-8 bg-red-600 rounded-lg shadow-lg shadow-red-600/20">
          <Download className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-tight text-slate-900 leading-none">BD Downloader</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Versão Paga</span>
            <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">v3.8.0</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-red-600 relative group"
            title="Ver Histórico"
          >
            <Menu className="w-6 h-6" />
            {hasHistory && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full group-hover:scale-110 transition-transform"></span>
            )}
          </button>
          <div className="h-8 w-px bg-slate-200 mx-1"></div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
            <span className="text-slate-500 font-bold text-xs">JC</span>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

const Downloader = ({ onDownload }: { onDownload: (url: string, options: any, metadata: any) => void }) => {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'video' | 'audio'>('video');
  const [format, setFormat] = useState('MP4');
  const [quality, setQuality] = useState('1080p');
  const [playlist, setPlaylist] = useState(false);
  const [metadata, setMetadata] = useState<{ title: string; channel: string; thumbnail: string; duration: string; resolutions: number[]; formats: string[] } | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (url.startsWith('http')) {
        fetchMetadata(url);
      } else {
        setMetadata(null);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [url]);

  const fetchMetadata = async (targetUrl: string) => {
    setIsFetching(true);
    try {
      const response = await fetch('api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch metadata');
      }

      const data = await response.json();
      setMetadata(data);

      // Auto-select best quality and standard format
      if (data.formats && data.formats.length > 0) {
        const preferred = data.formats.includes('mp4') ? 'mp4' : data.formats[0];
        setFormat(preferred.toUpperCase());
      }
      if (data.resolutions && data.resolutions.length > 0) {
        // Try to find 1080p, otherwise use the first one (highest)
        const has1080 = data.resolutions.find((r: number) => r === 1080);
        setQuality(has1080 ? '1080p' : `${data.resolutions[0]}p`);
      }
    } catch (error: any) {
      console.error("Error fetching metadata:", error);
      setMetadata(null);
    } finally {
      setIsFetching(false);
    }
  };

  const handleStart = () => {
    console.log("Iniciando download para:", url);
    if (!url || !metadata) {
      console.warn("URL ou Metadados ausentes", { url, metadata });
      return;
    }
    onDownload(url, { mode, format, quality, playlist }, metadata);
    setUrl('');
    setMetadata(null);
  };

  const getYouTubeId = (url: string) => {
    try {
      if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
      if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
      return url.split('/').pop() || '';
    } catch (e) {
      return '';
    }
  };

  const youtubeId = getYouTubeId(url);

  return (
    <div className="max-w-5xl mx-auto w-full py-6 px-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-slate-900 leading-tight">
          Baixe vídeos e áudios do <br />
          <span className="text-red-600">YouTube, TikTok e Instagram</span>
        </h1>
        <p className="text-slate-500 text-base mb-6 max-w-2xl mx-auto">
          Cole o link abaixo e escolha a qualidade desejada.
        </p>

        <div className="relative w-full shadow-xl shadow-red-900/5 rounded-2xl overflow-hidden border border-slate-200 group focus-within:ring-4 ring-red-600/10 transition-all bg-white max-w-3xl mx-auto mb-4">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <LinkIcon className="text-slate-400 group-focus-within:text-red-600 transition-colors w-4 h-4" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 py-3 pl-14 pr-44 text-sm font-medium placeholder:text-slate-400 text-slate-800 outline-none"
            placeholder="Colar link aqui..."
          />
          <div className="absolute right-1.5 top-1.5 bottom-1.5">
            <button
              onClick={handleStart}
              disabled={isFetching}
              className={`h-full px-6 text-white font-black text-[10px] rounded-xl active:scale-95 transition-all flex items-center gap-2 shadow-lg uppercase tracking-widest ${metadata ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'} disabled:opacity-50`}
            >
              {isFetching ? <Zap className="w-3.5 h-3.5 animate-spin text-white" /> : (metadata ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Search className="w-3.5 h-3.5 text-white" />)}
              <span className="hidden sm:inline">
                {isFetching ? 'BUSCANDO...' : (metadata ? 'LOCALIZADO' : 'LOCALIZAR VÍDEO')}
              </span>
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <AnimatePresence>
          {metadata && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-3 shadow-lg flex flex-col md:flex-row gap-4 mb-4"
            >
              <div className="relative w-full md:w-56 aspect-video bg-slate-100 rounded-xl overflow-hidden group">
                {url.includes('youtube.com') || url.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full pointer-events-none"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                ) : (
                  <>
                    <img
                      src={metadata.thumbnail}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-red-600 fill-current" />
                      </div>
                    </div>
                  </>
                )}
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">
                  {metadata.duration}
                </div>
              </div>
              <div className="flex-grow text-left flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm shadow-red-600/20">Preview Ativo</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-900 text-xs font-bold flex items-center gap-1">
                      <Music className="w-3 h-3 text-slate-400" />
                      {metadata.channel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider">Link Verificado</span>
                  </div>
                </div>
                <h2 className="text-base font-black text-slate-900 leading-tight mb-2 line-clamp-1">{metadata.title || "Sem Título"}</h2>
                <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[9px] font-bold">
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Extração Rápida
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                    Criptografia SSL
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                    Mobile Ready
                  </span>
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100 font-black">
                    <Package className="w-3.5 h-3.5 text-emerald-500" />
                    TAMANHO: {formatSize(metadata.resolutionSizes ? metadata.resolutionSizes[parseInt(quality)] : metadata.sizeBytes)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {metadata && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row"
          >
            <div className="flex-grow flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
              <div className="flex bg-slate-50 border-b border-slate-200">
                <button
                  onClick={() => setMode('video')}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${mode === 'video' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <Monitor className="w-4 h-4" />
                  Vídeo
                </button>
                <button
                  onClick={() => setMode('audio')}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${mode === 'audio' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <Music className="w-4 h-4" />
                  Áudio
                </button>
              </div>

              <div className="p-4 space-y-4">
                {mode === 'video' ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Formato disponível
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(metadata.formats || ['MP4']).map(f => {
                          const ext = f.toUpperCase();
                          return (
                            <div
                              key={f}
                              onClick={() => setFormat(ext)}
                              className={`format-card ${format === ext ? 'active' : ''}`}
                            >
                              <span className="text-lg font-bold">{ext}</span>
                              {ext === 'MP4' && <span className="text-[10px] font-bold text-red-600 mt-1">PADRÃO</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4" /> Resolução
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {(metadata.resolutions && metadata.resolutions.length > 0
                          ? metadata.resolutions.map(r => `${r}p`)
                          : ['720p', '1080p']
                        ).map(q => {
                          const isUltra = q.includes('2160') || q.includes('1440');
                          const label = q.includes('2160') ? '4K Ultra HD' :
                            q.includes('1440') ? '2K Quad HD' :
                              q.includes('1080') ? 'Full HD' :
                                q.includes('720') ? 'HD Ready' : '';

                          return (
                            <button
                              key={q}
                              onClick={() => setQuality(q)}
                              className={`quality-btn ${quality === q ? 'active' : ''} ${isUltra ? 'ultra' : ''}`}
                            >
                              <span className="leading-none">{q}</span>
                              {label && <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5 opacity-80">{label}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Music className="w-4 h-4" /> Formato de Áudio
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {['MP3', 'M4A', 'WAV', 'FLAC', 'AAC'].map(f => (
                          <div
                            key={f}
                            onClick={() => setFormat(f)}
                            className={`format-card ${format === f ? 'active' : ''}`}
                          >
                            <span className="text-lg font-bold">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Qualidade / Bitrate
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {['128 kbps', '192 kbps', '320 kbps', 'Lossless'].map(b => (
                          <button
                            key={b}
                            onClick={() => setQuality(b)}
                            className={`quality-btn ${quality === b ? 'active' : ''} ${b === 'Lossless' ? 'text-purple-600 border-purple-100 bg-purple-50 hover:bg-purple-100' : ''}`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-64 bg-slate-50/50 p-4 flex flex-col gap-4">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-red-500" />
                    Playlist
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={playlist}
                      onChange={(e) => setPlaylist(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Ative para baixar playlists inteiras de uma vez.</p>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-200/60">
                <button
                  onClick={handleStart}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group uppercase tracking-widest text-[11px]"
                >
                  <span>Iniciar Download</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-[8px] text-slate-400 mt-2">Jorge Cativo - v3.8.0</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: 'Ultra Rápido', desc: 'Servidores otimizados para downloads instantâneos.', color: 'text-red-600', bg: 'bg-red-50' },
          { icon: ShieldCheck, title: '100% Seguro', desc: 'Sem vírus, sem malwares. Verificado diariamente.', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Smartphone, title: 'Multi-Plataforma', desc: 'Compatível com todos os dispositivos e sistemas.', color: 'text-green-600', bg: 'bg-green-50' }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-full flex items-center justify-center mb-3`}>
              <item.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1.5 text-sm">{item.title}</h3>
            <p className="text-[12px] text-slate-500 leading-relaxed max-w-[180px]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TableHeader = React.memo(() => (
  <thead className="bg-slate-50/80 border-b border-slate-200">
    <tr className="border-b border-slate-200">
      <th className="w-[45%] px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">Conteúdo</th>
      <th className="w-[15%] px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Formato</th>
      <th className="w-[25%] px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
      <th className="w-[15%] px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</th>
    </tr>
  </thead>
));

const ItemRow = React.memo(({ item, onDelete, onDownloadFile }: { item: DownloadItem, onDelete: (id: string) => void, onDownloadFile: (item: DownloadItem) => void }) => (
  <motion.tr
    key={item.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, x: -20 }}
    className="hover:bg-slate-50/50 transition-colors group"
  >
    <td className="px-3 py-4">
      <div className="flex items-center gap-3">
        <div className="relative w-20 h-12 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
          <img
            src={item.thumbnail}
            alt="Thumbnail"
            className="w-full h-full object-cover rounded-xl shadow-sm border border-slate-200"
          />
          <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center border-2 border-white shadow-md z-10 ${item.platform === 'YouTube' ? 'bg-red-600' :
            item.platform === 'TikTok' ? 'bg-black' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
            }`}>
            {item.format.includes('Áudio') ? <Music className="text-white w-4 h-4" /> : <Play className="text-white w-4 h-4 fill-current" />}
          </div>
        </div>
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${item.platform === 'YouTube' ? 'bg-red-50 text-red-600' :
              item.platform === 'TikTok' ? 'bg-slate-100 text-slate-900' : 'bg-pink-50 text-pink-600'
              }`}>
              {item.platform}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate leading-tight">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-bold text-red-600 truncate max-w-[60px]">{item.channel}</span>
            <span className="text-slate-300 text-[9px]">•</span>
            <p className="text-[9px] text-slate-400 font-medium truncate">{item.url}</p>
          </div>
        </div>
      </div>
    </td>
    <td className="px-3 py-4 text-center">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-bold text-slate-700">{item.format}</span>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{item.quality}</span>
      </div>
    </td>
    <td className="px-3 py-4">
      <div className="space-y-2 w-full max-w-[140px] mx-auto">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2">
            <div className={`w-0.5 h-0.5 rounded-full ${item.status === 'ready' ? 'bg-white' : 'bg-white animate-pulse'}`} />
            <span className={`text-[7px] font-black uppercase tracking-tight px-1 py-0.5 rounded shadow-sm ${(item.status === 'ready' || item.status === 'completed') ? 'bg-emerald-500 text-white' : 'bg-rose-400 text-white'}`}>
              {(item.status === 'ready' || item.status === 'completed') ? 'Concluído!' : 'Processando'}
            </span>
          </div>
          <span className={`text-[9px] font-black ${item.status === 'ready' ? 'text-emerald-700' : 'text-rose-700'}`}>{item.progress}%</span>
        </div>
        <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${item.status === 'ready' ? 'bg-emerald-500' : 'bg-rose-400'}`}
            style={{ width: `${item.progress}%` }}
          >
            {(item.status === 'downloading' || item.status === 'processing') && (
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] w-full"></div>
            )}
          </div>
        </div>
        <div className="text-center mt-0.5">
          <span className={`text-[7px] font-black italic tracking-tight ${item.status === 'ready' ? 'text-emerald-500' : 'text-rose-400'}`}>{item.speed}</span>
        </div>
      </div>
    </td>
    <td className="px-3 py-4 text-right">
      <div className="flex justify-end items-center gap-1.5">
        {item.status === 'ready' && (
          <button
            onClick={() => onDownloadFile(item)}
            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-100 uppercase tracking-tight"
          >
            <Download className="w-3 h-3" />
            BAIXAR AGORA
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  </motion.tr>
));

const ResultsTable = ({ items, onDelete, onDownloadFile }: { items: DownloadItem[], onDelete: (id: string) => void, onDownloadFile: (item: DownloadItem) => void }) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
    <div className="overflow-x-hidden">
      <table className="w-full border-collapse table-fixed">
        <TableHeader />
        <tbody className="divide-y divide-slate-100">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <tr key="empty-state">
                <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">
                  Nenhum download na fila.
                </td>
              </tr>
            ) : (
              items.map((item) => <ItemRow key={item.id} item={item} onDelete={onDelete} onDownloadFile={onDownloadFile} />)
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  </div>
);

const History = React.memo(({ items, onDelete, onDownloadFile, onClearAll, title, icon: Icon, emptyMessage, variant = 'red' }: { items: DownloadItem[], onDelete: (id: string) => void, onDownloadFile: (item: DownloadItem) => void, onClearAll?: () => void, title: string, icon: any, emptyMessage: string, variant?: 'red' | 'green' }) => {
  if (items.length === 0 && (title === 'Ações em Curso' || title === 'Ações')) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <section>
          <div className={`flex items-center justify-between mb-4 p-2 rounded-xl shadow-sm ${variant === 'green' ? 'bg-emerald-500 shadow-emerald-100/50' : 'bg-rose-400 shadow-rose-100/50'}`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white/20 text-white rounded flex items-center justify-center">
                <Icon className="w-3 h-3" />
              </div>
              <h2 className="text-xs font-black text-white uppercase tracking-widest">{title}</h2>
              <span className="bg-white/30 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">{items.length}</span>
            </div>
            {onClearAll && items.filter(i => i.status === 'completed').length > 0 && (
              <button
                onClick={onClearAll}
                className="px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Concluídos
              </button>
            )}
          </div>

          <ResultsTable
            items={items}
            onDelete={onDelete}
            onDownloadFile={onDownloadFile}
          />
        </section>
      </div>
    </div>
  );
});

const Footer = React.memo(() => (
  <footer className="w-full bg-white border-t border-slate-100 mt-auto">
    <div className="max-w-7xl mx-auto px-12 py-12 flex flex-col items-center gap-8">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
          <Download className="text-white w-5 h-5" />
        </div>
        <span className="text-sm font-bold text-slate-900">BD Downloader</span>
      </div>
      <p className="text-sm font-medium text-slate-400 text-center">© 2026 - Todos os direitos reservados a Jorge Cativo.</p>
      <div className="flex gap-8 text-xs font-bold text-slate-400">
        <a href="#" className="hover:text-red-600 transition-colors">Privacidade</a>
        <a href="#" className="hover:text-red-600 transition-colors">Termos</a>
        <a href="#" className="hover:text-red-600 transition-colors">Contato</a>
      </div>
    </div>
  </footer>
));

// --- Main App ---

export default function App() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [showDownloaderManual, setShowDownloaderManual] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const saveToHistory = useCallback(async (item: DownloadItem) => {
    try {
      await fetch('api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (e) {
      console.error("Failed to save to history:", e);
    }
  }, []);

  // Load history from DB
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('api/history');
        if (response.ok) {
          const data = await response.json();
          setDownloads(data);

          // Resume polling for any items still processing
          data.forEach((item: DownloadItem) => {
            if ((item.status === 'processing' || item.status === 'downloading') && item.jobId) {
              const poll = setInterval(async () => {
                try {
                  const statusRes = await fetch(`api/process/${item.jobId}`);
                  if (!statusRes.ok) {
                    if (statusRes.status === 404) {
                      clearInterval(poll);
                      setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'error', speed: 'Sessão expirada.' } : d));
                    }
                    return;
                  }
                  const statusData = await statusRes.json();
                  if (statusData.progress !== undefined) {
                    setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, progress: Math.floor(statusData.progress), speed: statusData.progress >= 100 ? 'Processando FFmpeg...' : 'Baixando...' } : d));
                  }
                  if (statusData.status === 'ready') {
                    clearInterval(poll);
                    setDownloads(prev => {
                      const next = prev.map(d => d.id === item.id ? { ...d, status: 'ready', progress: 100, speed: 'Pronto para salvar!' } : d);
                      const updated = next.find(x => x.id === item.id);
                      if (updated) saveToHistory(updated);
                      return next;
                    });
                  } else if (statusData.status === 'error') {
                    clearInterval(poll);
                    setDownloads(prev => {
                      const next = prev.map(d => d.id === item.id ? { ...d, status: 'error', speed: `Erro: ${statusData.error}` } : d);
                      const updated = next.find(x => x.id === item.id);
                      if (updated) saveToHistory(updated);
                      return next;
                    });
                  }
                } catch (e) {
                  clearInterval(poll);
                }
              }, 3000);
            }
          });
        }
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
    };
    fetchHistory();
  }, [saveToHistory]);

  const deleteFromHistory = useCallback(async (id: string) => {
    try {
      await fetch(`api/history/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to delete from history:", e);
    }
  }, []);

  const activeDownloads = downloads.filter(d => d.status === 'processing' || d.status === 'downloading');
  const history = downloads.filter(d => d.status === 'ready' || d.status === 'completed');

  // PHASE 2: Called when user clicks SALVAR ARQUIVO. Streams the already-processed file from server.
  const triggerFileDownload = useCallback(async (item: DownloadItem) => {
    try {
      const downloadUrl = `api/serve/${item.jobId}`;
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      // We don't set a.download here because the server provides it via Content-Disposition
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloads(prev => {
        const next = prev.map(d => d.id === item.id ? { ...d, status: 'completed', progress: 100, speed: 'Concluído!' } : d);
        const updated = next.find(d => d.id === item.id);
        if (updated) saveToHistory(updated);
        return next;
      });

      // Return home after download starts
      setTimeout(() => {
        setShowDownloaderManual(true);
      }, 1000);
    } catch (error: any) {
      console.error("File serve error:", error);
      // Restore to 'ready' so user can retry
      setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'ready', speed: 'Erro. Tente salvar novamente.' } : d));
      alert(`Erro ao transferir: ${error.message}`);
    }
  }, [saveToHistory]);

  // PHASE 1: Start REAL processing via /api/process. Polls every 3s for completion.
  const handleDownload = useCallback((url: string, options: any, meta: any) => {
    setShowDownloaderManual(false);
    const platform = meta.platform || (url.includes('youtube') ? 'YouTube' : url.includes('tiktok') ? 'TikTok' : 'Instagram');
    const id = Math.random().toString(36).substr(2, 9);

    const newItem: DownloadItem = {
      id,
      title: meta.title,
      channel: meta.channel,
      url,
      platform: platform as any,
      format: options.mode === 'video' ? `${options.format} Vídeo` : `${options.format} Áudio`,
      quality: options.quality,
      size: formatSize(meta.resolutionSizes ? meta.resolutionSizes[parseInt(options.quality)] : meta.sizeBytes),
      thumbnail: meta.thumbnail,
      status: 'processing',
      progress: 0,
      speed: 'Iniciando processamento...',
      date: new Date().toISOString()
    };

    setDownloads(prev => [newItem, ...prev]);
    saveToHistory(newItem);

    setTimeout(() => {
      const el = document.getElementById('progress');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Call /api/process — receives jobId immediately, yt-dlp runs in background
    fetch('api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format: options.format, quality: options.quality, title: meta.title })
    })
      .then(r => r.json())
      .then(({ jobId }) => {
        if (!jobId) throw new Error('Servidor não retornou jobId.');

        // ATTACH JOBID IMMEDIATELY so we can resume if needed
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, jobId } : d));

        // Poll server every 2 seconds to get real-time progress
        const poll = setInterval(async () => {
          try {
            const statusRes = await fetch(`api/process/${jobId}`);
            if (!statusRes.ok) {
              if (statusRes.status === 404) {
                clearInterval(poll);
                setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'error', speed: 'Job não encontrado no servidor.' } : d));
              }
              return;
            }
            const statusData = await statusRes.json();

            // Update progress in UI based on real server data
            if (statusData.progress !== undefined) {
              setDownloads(prev => prev.map(d => d.id === id ? {
                ...d,
                progress: Math.floor(statusData.progress),
                speed: statusData.progress >= 100 ? 'Processando (Merge)...' : 'Baixando Arquivos...'
              } : d));
            }

            if (statusData.status === 'ready') {
              clearInterval(poll);
              setDownloads(prev => {
                const next = prev.map(d => d.id === id
                  ? { ...d, status: 'ready', progress: 100, speed: 'Concluído!', jobId }
                  : d
                );
                const updated = next.find(x => x.id === id);
                if (updated) saveToHistory(updated);
                return next;
              });
            } else if (statusData.status === 'error') {
              clearInterval(poll);
              setDownloads(prev => {
                const next = prev.map(d => d.id === id
                  ? { ...d, status: 'error', speed: `Erro: ${statusData.error || 'Falha no processamento'}` }
                  : d
                );
                const updated = next.find(x => x.id === id);
                if (updated) saveToHistory(updated);
                return next;
              });
            }
          } catch (e) {
            console.error('Polling error:', e);
          }
        }, 1000);
      })
      .catch((err) => {
        console.error('Process start error:', err);
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'error', speed: 'Falha ao iniciar' } : d));
      });
  }, [saveToHistory]);

  const handleClearHistory = useCallback(async () => {
    if (!confirm('Deseja limpar todos os downloads concluídos do histórico?')) return;
    try {
      const res = await fetch('api/history/completed', { method: 'DELETE' });
      if (res.ok) {
        setDownloads(prev => prev.filter(d => d.status !== 'completed'));
      }
    } catch (e) {
      console.error("Failed to clear completed history:", e);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
    deleteFromHistory(id);
  }, [deleteFromHistory]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} hasHistory={history.some(d => d.status === 'completed')} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        items={history.filter(d => d.status === 'completed')}
        onDelete={handleDelete}
        onDownloadFile={triggerFileDownload}
      />

      <main className="flex-grow pb-24">
        <AnimatePresence mode="wait">
          {(showDownloaderManual || (activeDownloads.length === 0 && history.length === 0)) ? (
            <motion.div
              key="downloader-view"
              id="downloader"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <Downloader onDownload={handleDownload} />
            </motion.div>
          ) : (
            <motion.div
              key="active-jobs-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12"
            >
              <div className="max-w-5xl mx-auto px-6 mb-8 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Gerenciamento de Downloads</h2>
                <button
                  onClick={() => setShowDownloaderManual(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> NOVO DOWNLOAD
                </button>
              </div>

              <History
                items={activeDownloads}
                onDelete={handleDelete}
                onDownloadFile={triggerFileDownload}
                title="Ações em Curso"
                icon={PlayCircle}
                emptyMessage="Nenhum download ativo."
                version="3.8.0"
              />

              <History
                items={history}
                onDelete={handleDelete}
                onDownloadFile={triggerFileDownload}
                onClearAll={handleClearHistory}
                title="Downloads Disponíveis"
                icon={CheckCircle2}
                emptyMessage="Seu histórico está vazio."
                variant="green"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div >
  );
}
