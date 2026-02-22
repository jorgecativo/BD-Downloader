import React, { useState, useEffect } from 'react';
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
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type } from "@google/genai";
import { DownloadItem, AppTab } from './types';

// --- Components ---

const getAI = () => {
  let apiKey = '';
  try {
    apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || '';
  } catch (e) {
    try {
      apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
    } catch (e2) { }
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

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
                        <span className="text-[9px] font-bold text-slate-400">{item.date.split(',')[0]}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onDownloadFile(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-10 h-10 bg-red-600 rounded-xl shadow-lg shadow-red-600/20">
          <Download className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight text-slate-900 leading-none">BD Downloader</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Premium Tool</span>
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
  const [quality, setQuality] = useState('1080p Full HD');
  const [playlist, setPlaylist] = useState(false);
  const [metadata, setMetadata] = useState<{ title: string; channel: string; thumbnail: string; duration: string } | null>(null);
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
      const response = await fetch('/api/metadata', {
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
    } catch (error: any) {
      console.error("Error fetching metadata:", error);
      // We don't alert here anymore as the server provides a fallback or we handle it silently
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
    <div className="max-w-5xl mx-auto w-full py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900 leading-tight">
          Baixe vídeos e áudios do <br />
          <span className="text-red-600">YouTube, TikTok e Instagram</span>
        </h1>
        <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto">
          Cole o link abaixo e escolha a qualidade desejada. Conversão rápida, sem limites e totalmente gratuita.
        </p>

        <div className="relative w-full shadow-2xl shadow-red-900/10 rounded-2xl overflow-hidden border border-slate-200 group focus-within:ring-4 ring-red-600/10 transition-all bg-white max-w-3xl mx-auto mb-8">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <LinkIcon className="text-slate-400 group-focus-within:text-red-600 transition-colors w-5 h-5" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 py-5 pl-16 pr-44 text-lg font-medium placeholder:text-slate-400 text-slate-800 outline-none"
            placeholder="Colar link aqui..."
          />
          <div className="absolute right-2 top-2 bottom-2">
            <button
              onClick={handleStart}
              disabled={!metadata || isFetching}
              className="h-full px-8 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? <Zap className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              <span className="hidden sm:inline">{isFetching ? 'BUSCANDO...' : 'INICIAR DOWNLOAD'}</span>
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <AnimatePresence>
          {metadata && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 shadow-xl flex flex-col md:flex-row gap-6 mb-12"
            >
              <div className="relative w-full md:w-72 aspect-video bg-slate-100 rounded-2xl overflow-hidden group">
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm shadow-red-600/20">Preview Ativo</span>
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
                <h2 className="text-xl font-black text-slate-900 leading-tight mb-3 line-clamp-2">{metadata.title || "Sem Título"}</h2>
                <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px] font-bold">
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row">
        <div className="flex-grow flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
          <div className="flex bg-slate-50 border-b border-slate-200">
            <button
              onClick={() => setMode('video')}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${mode === 'video' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <Monitor className="w-5 h-5" />
              Vídeo
            </button>
            <button
              onClick={() => setMode('audio')}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${mode === 'audio' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <Music className="w-5 h-5" />
              Áudio
            </button>
          </div>

          <div className="p-8 space-y-8">
            {mode === 'video' ? (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Formato
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['MP4', 'MKV', 'WEBM', 'AVI'].map(f => (
                      <div
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`format-card ${format === f ? 'active' : ''}`}
                      >
                        <span className="text-lg font-bold">{f}</span>
                        {f === 'MP4' && <span className="text-[10px] font-bold text-red-600 mt-1">PADRÃO</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Qualidade
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {['720p HD', '1080p Full HD', '1440p 2K', '4K Ultra'].map(q => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`quality-btn ${quality === q ? 'active' : ''} ${q === '4K Ultra' ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : ''}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Music className="w-4 h-4" /> Formato
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
                    <Settings className="w-4 h-4" /> Bitrate
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

        <div className="w-full md:w-80 bg-slate-50/50 p-8 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Play className="w-4 h-4 text-red-500" />
                YouTube Playlist
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

          <div className="mt-auto pt-6 border-t border-slate-200/60">
            <button
              onClick={handleStart}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-3 group"
            >
              <span>Iniciar Download</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4">Ao baixar, você concorda com nossos termos de uso.</p>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Zap, title: 'Ultra Rápido', desc: 'Servidores otimizados para downloads instantâneos.', color: 'text-red-600', bg: 'bg-red-50' },
          { icon: ShieldCheck, title: '100% Seguro', desc: 'Sem vírus, sem malwares. Verificado diariamente.', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Smartphone, title: 'Multi-Plataforma', desc: 'Compatível com todos os dispositivos e sistemas.', color: 'text-green-600', bg: 'bg-green-50' }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-full flex items-center justify-center mb-4`}>
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const History = ({ items, onDelete, onDownloadFile, title, icon: Icon, emptyMessage }: { items: DownloadItem[], onDelete: (id: string) => void, onDownloadFile: (item: DownloadItem) => void, title: string, icon: any, emptyMessage: string }) => {
  const TableHeader = () => (
    <thead className="bg-slate-50/80 border-b border-slate-200">
      <tr className="border-b border-slate-200">
        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Conteúdo</th>
        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Formato</th>
        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status & Progresso</th>
        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</th>
      </tr>
    </thead>
  );

  const ItemRow = ({ item }: { item: DownloadItem, key?: string }) => (
    <motion.tr
      key={item.id}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="hover:bg-slate-50/50 transition-colors group"
    >
      <td className="px-8 py-6">
        <div className="flex items-center gap-5">
          <div className="relative w-28 h-16 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
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
            <p className="text-sm font-bold text-slate-900 truncate max-w-md leading-tight">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-red-600">{item.channel}</span>
              <span className="text-slate-300 text-[10px]">•</span>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{item.url}</p>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-slate-700">{item.format}</span>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md w-fit">{item.quality}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">{item.size} Total</span>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="space-y-3 w-full max-w-xs">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              {item.status === 'processing' ? (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Processando</span>
                </>
              ) : item.status === 'ready' ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Pronto</span>
                </>
              ) : item.status === 'downloading' ? (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Baixando</span>
                </>
              ) : item.status === 'completed' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Concluído</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Erro</span>
                </>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">{item.progress}%</span>
              {item.speed && (item.status === 'downloading' || item.status === 'processing') && <span className="text-[10px] font-bold text-slate-400">/ {item.speed}</span>}
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-[2px] border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${item.status === 'processing' ? 'bg-amber-500' :
                item.status === 'completed' || item.status === 'downloading' ? 'bg-emerald-500' : 'bg-red-600'
                }`}
              style={{ width: `${item.progress}%` }}
            >
              {(item.status === 'downloading' || item.status === 'processing') && (
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] w-full"></div>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex justify-end items-center gap-2">
          {item.status === 'ready' && (
            <button
              onClick={() => onDownloadFile(item)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Salvar Arquivo
            </button>
          )}
          {item.status === 'completed' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-md">Concluído</span>
              <button
                onClick={() => onDownloadFile(item)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Salvar Arquivo
              </button>
            </div>
          )}
          {item.status === 'processing' && (
            <button className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-xs font-bold cursor-wait flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              Processando...
            </button>
          )}
          {item.status === 'downloading' && (
            <button className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold cursor-wait flex items-center gap-2">
              <Download className="w-3.5 h-3.5 animate-bounce" />
              Baixando...
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <TableHeader />
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                      <tr key="empty-state">
                        <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">
                          {emptyMessage}
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => <ItemRow key={item.id} item={item} />)
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Footer = () => (
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
);

// --- Main App ---

export default function App() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load history from DB
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        if (response.ok) {
          const data = await response.json();
          setDownloads(data);
        }
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
    };
    fetchHistory();
  }, []);

  const saveToHistory = async (item: DownloadItem) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (e) {
      console.error("Failed to save to history:", e);
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to delete from history:", e);
    }
  };

  const activeDownloads = downloads.filter(d => d.status === 'processing' || d.status === 'ready' || d.status === 'downloading');
  const completedDownloads = downloads.filter(d => d.status === 'completed');

  // Helper to trigger real browser download
  const triggerFileDownload = async (item: DownloadItem) => {
    // Update status to downloading (Green)
    setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'downloading', progress: 0, speed: 'Iniciando...' } : d));

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.url,
          format: item.format.split(' ')[0],
          quality: item.quality,
          title: item.title
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const reader = response.body?.getReader();
      const contentLength = +(response.headers.get('Content-Length') || 0);
      let receivedLength = 0;
      const chunks = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          const progress = contentLength ? Math.round((receivedLength / contentLength) * 100) : 50;
          setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, progress, speed: `${(receivedLength / (1024 * 1024)).toFixed(1)} MB` } : d));
        }
      }

      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
      } else {
        const extension = item.format.includes('Vídeo') ? 'mp4' : 'mp3';
        const resolution = item.quality.match(/\d+/)?.[0] || 'best';
        fileName = `${fileName}-${resolution}.${extension}`;
      }

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloads(prev => {
        const next = prev.map(d => d.id === item.id ? { ...d, status: 'completed', progress: 100 } : d);
        const updated = next.find(d => d.id === item.id);
        if (updated) saveToHistory(updated);
        return next;
      });
    } catch (error: any) {
      console.error("File download error:", error);
      setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'error' } : d));
      alert(`Erro ao baixar o arquivo: ${error.message}`);
    }
  };

  const handleDownload = (url: string, options: any, meta: any) => {
    const platform = meta.platform || (url.includes('youtube') ? 'YouTube' : url.includes('tiktok') ? 'TikTok' : 'Instagram');
    const id = Math.random().toString(36).substr(2, 9);

    const sizeMB = (meta.sizeBytes / (1024 * 1024)).toFixed(1);
    const sizeStr = options.mode === 'video' ? `${sizeMB} MB` : `${(parseFloat(sizeMB) * 0.1).toFixed(1)} MB`;

    const newItem: DownloadItem = {
      id,
      title: meta.title,
      channel: meta.channel,
      url: url,
      platform: platform as any,
      format: options.mode === 'video' ? `${options.format} Vídeo` : `${options.format} Áudio`,
      quality: options.quality,
      size: sizeStr,
      thumbnail: meta.thumbnail,
      status: 'processing', // Start with Orange processing
      progress: 0,
      speed: 'Aguardando...',
      date: new Date().toISOString()
    };

    setDownloads([newItem, ...downloads]);
    saveToHistory(newItem);

    // Scroll to progress section
    setTimeout(() => {
      const el = document.getElementById('progress');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDelete = (id: string) => {
    setDownloads(downloads.filter(d => d.id !== id));
    deleteFromHistory(id);
  };

  // Simulate progress and trigger download
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads(prev => {
        let changed = false;
        const next = prev.map(item => {
          if (item.status === 'processing') {
            changed = true;
            const increment = Math.floor(Math.random() * 10) + 2;
            const nextProgress = Math.min(100, item.progress + increment);

            const nextItem = {
              ...item,
              progress: nextProgress,
              status: nextProgress === 100 ? 'ready' : 'processing',
              speed: nextProgress === 100 ? 'Pronto' : 'Processando...'
            };
            if (nextProgress === 100) saveToHistory(nextItem);
            return nextItem;
          }
          return item;
        });
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [downloads]); // Add dependency to track updates

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} hasHistory={completedDownloads.length > 0} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        items={completedDownloads}
        onDelete={handleDelete}
        onDownloadFile={triggerFileDownload}
      />

      <main className="flex-grow pb-24">
        <div id="downloader">
          <Downloader onDownload={handleDownload} />
        </div>

        <AnimatePresence>
          {activeDownloads.length > 0 && (
            <motion.div
              id="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <History
                items={activeDownloads}
                onDelete={handleDelete}
                onDownloadFile={triggerFileDownload}
                title="Downloads em Progresso"
                icon={Clock}
                emptyMessage="Nenhum download em progresso."
              />
            </motion.div>
          )}

          {completedDownloads.length > 0 && (
            <motion.div
              id="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <History
                items={completedDownloads}
                onDelete={handleDelete}
                onDownloadFile={triggerFileDownload}
                title="Histórico de Downloads"
                icon={CheckCircle2}
                emptyMessage="Você ainda não concluiu nenhum download."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
