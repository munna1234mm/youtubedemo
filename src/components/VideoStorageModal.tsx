import React, { useState, useEffect, useRef } from 'react';
import {
  X, Film, Check, Trash2, Play, Copy,
  FileVideo, RefreshCw, ChevronRight, Sparkles
} from 'lucide-react';
import { User, Reel, Story, Post } from '../types';
import { triggerHaptic, fireConfetti } from '../utils/telegram';

/* ─── Types ─────────────────────────────────────────────── */
export interface StoredVideoItem {
  id: string;
  title: string;
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  authorId: string;
  storageProvider: string;
}

interface VideoStorageModalProps {
  currentUser: User;
  onClose: () => void;
  onAddReel: (reel: Reel) => void;
  onAddStory: (story: Story) => void;
  onAddPost: (post: Partial<Post>) => void;
  onStartBackgroundUpload?: (task: {
    file: File | null;
    previewUrl: string;
    title: string;
    caption: string;
    target: 'reels' | 'stories' | 'post';
  }) => void;
}

/* ─── Upload status steps (Facebook-style) ───────────────── */
const UPLOAD_STEPS = [
  { pct: 10, label: 'Preparing your video…' },
  { pct: 30, label: 'Uploading…' },
  { pct: 55, label: 'Processing…' },
  { pct: 75, label: 'Optimizing quality…' },
  { pct: 90, label: 'Almost done…' },
  { pct: 100, label: 'Published! 🎉' },
];

/* ─── Component ──────────────────────────────────────────── */
export const VideoStorageModal: React.FC<VideoStorageModalProps> = ({
  currentUser,
  onClose,
  onAddReel,
  onAddStory,
  onAddPost,
  onStartBackgroundUpload,
}) => {
  const [tab, setTab] = useState<'upload' | 'library'>('upload');
  const [videos, setVideos] = useState<StoredVideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* upload form */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [publishTarget, setPublishTarget] = useState<'reels' | 'stories' | 'post'>('reels');

  /* upload progress */
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* preset sample videos */
  const presets = [
    { name: 'Ocean Waves at Sunset', url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4' },
    { name: 'City Night Traffic Aerial', url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42861-large.mp4' },
    { name: 'Developer Working on Code', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-1606-large.mp4' },
  ];

  /* ── fetch saved videos ── */
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, []);

  /* ── file pick ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!videoTitle) setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
    setError(null);
    triggerHaptic('light');
  };

  const handlePreset = (p: { name: string; url: string }) => {
    setSelectedFile(null);
    setPreviewUrl(p.url);
    setVideoTitle(p.name);
    setError(null);
    triggerHaptic('light');
  };

  /* ── animated progress ── */
  const animateProgress = (steps: typeof UPLOAD_STEPS, onDone: () => void) => {
    let i = 0;
    const next = () => {
      if (i >= steps.length) { onDone(); return; }
      const s = steps[i++];
      setUploadPct(s.pct);
      setUploadLabel(s.label);
      const delay = s.pct < 90 ? 600 + Math.random() * 400 : 800;
      setTimeout(next, delay);
    };
    next();
  };

  /* ── upload & publish ── */
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;

    if (onStartBackgroundUpload) {
      triggerHaptic('success');
      onStartBackgroundUpload({
        file: selectedFile,
        previewUrl,
        title: videoTitle || 'Video',
        caption: videoCaption || '',
        target: publishTarget,
      });
      onClose();
      return;
    }

    setUploading(true);
    setDone(false);
    setError(null);
    setUploadPct(0);
    triggerHaptic('medium');

    animateProgress(UPLOAD_STEPS, async () => {
      try {
        let videoUrl = previewUrl;

        /* actual upload to server */
        if (selectedFile) {
          const formData = new FormData();
          formData.append('video', selectedFile);
          formData.append('title', videoTitle || 'My Video');
          formData.append('authorId', currentUser.id);
          formData.append('authorName', currentUser.name);
          formData.append('authorAvatar', currentUser.avatar);
          formData.append('authorUsername', currentUser.username);
          const res = await fetch('/api/upload/video', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.video?.url) videoUrl = data.video.url;
          }
        } else {
          /* preset URL reference */
          await fetch('/api/upload/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoUrl: previewUrl,
              title: videoTitle || 'Video',
              authorId: currentUser.id,
              authorName: currentUser.name,
              authorAvatar: currentUser.avatar,
              authorUsername: currentUser.username,
            }),
          });
        }

        /* publish */
        if (publishTarget === 'reels') {
          onAddReel({
            id: `reel_${Date.now()}`,
            author: currentUser,
            videoUrl,
            thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            caption: videoCaption || videoTitle || 'New Reel',
            audioName: `Original Audio · ${currentUser.name}`,
            likesCount: 1,
            commentsCount: 0,
            sharesCount: 0,
            isLiked: true,
          });
        } else if (publishTarget === 'stories') {
          onAddStory({
            id: `story_${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            isPremium: currentUser.isPremium,
            mediaUrl: videoUrl,
            mediaType: 'video',
            caption: videoCaption || videoTitle,
            timestamp: 'Just now',
            likesCount: 0,
          });
        } else {
          onAddPost({ content: `🎬 ${videoTitle}\n${videoCaption}`, videoUrl });
        }

        fireConfetti();
        triggerHaptic('success');
        setDone(true);
        await fetchVideos();
        setTimeout(() => onClose(), 1200);
      } catch (err: any) {
        setError('Something went wrong. Please try again.');
        setUploading(false);
        triggerHaptic('warning');
      }
    });
  };

  /* ── delete ── */
  const handleDelete = async (id: string) => {
    triggerHaptic('medium');
    try {
      await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch { /* silent */ }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    triggerHaptic('success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Film className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit']">Upload Video</h2>
              <p className="text-[11px] text-slate-500">Share to Reels, Stories or Feed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-800 shrink-0">
          {(['upload', 'library'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === 'library') fetchVideos(); triggerHaptic('selection'); }}
              className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
                tab === t ? 'text-sky-400 border-sky-400' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {t === 'upload' ? '⬆️ Upload' : `🎞️ My Videos (${videos.length})`}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ UPLOAD TAB ════ */}
          {tab === 'upload' && (
            <form onSubmit={handleUpload} className="p-4 space-y-4">

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              {/* ── Upload Progress (Facebook-style) ── */}
              {uploading && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* Status bar */}
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">{uploadLabel}</span>
                    <span className="text-xs font-bold text-sky-400">{uploadPct}%</span>
                  </div>
                  {/* Track */}
                  <div className="mx-4 mb-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${uploadPct}%`,
                        background: done
                          ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                          : 'linear-gradient(90deg,#38bdf8,#818cf8,#a78bfa)',
                        backgroundSize: '200% 100%',
                        animation: done ? 'none' : 'shimmer 1.5s linear infinite',
                      }}
                    />
                  </div>
                  {/* Preview thumbnail row */}
                  {previewUrl && (
                    <div className="flex items-center gap-3 px-4 pb-4 pt-1">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0">
                        <video src={previewUrl} className="w-full h-full object-cover" muted playsInline />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{videoTitle || 'Video'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {done ? '✅ Successfully published!' : 'Processing your video…'}
                        </p>
                      </div>
                      {done && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                    </div>
                  )}
                </div>
              )}

              {/* ── Media Picker (hidden while uploading) ── */}
              {!uploading && (
                <>
                  {previewUrl ? (
                    /* Preview */
                    <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                      <video src={previewUrl} controls className="w-full h-full object-contain" playsInline />
                      <button
                        type="button"
                        onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Picker UI */
                    <div className="space-y-2.5">
                      {/* Camera + Gallery */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const inp = document.createElement('input');
                            inp.type = 'file'; inp.accept = 'video/*';
                            inp.setAttribute('capture', 'environment');
                            inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFileChange({ target: { files: [f] } } as any); };
                            inp.click();
                          }}
                          className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-sky-500/50 active:scale-95 transition"
                        >
                          <span className="text-3xl">📷</span>
                          <div className="text-center">
                            <span className="text-xs font-bold text-white block">Record</span>
                            <span className="text-[10px] text-slate-500">Use camera</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-sky-500/50 active:scale-95 transition"
                        >
                          <span className="text-3xl">🎞️</span>
                          <div className="text-center">
                            <span className="text-xs font-bold text-white block">Gallery</span>
                            <span className="text-[10px] text-slate-500">Choose video</span>
                          </div>
                        </button>
                      </div>

                      {/* Presets */}
                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-500 font-semibold px-1">Or use a sample clip:</p>
                        {presets.map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handlePreset(p)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-sky-500/40 hover:bg-slate-800 active:scale-95 transition text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                              <Play className="w-4 h-4 text-sky-400 fill-sky-400" />
                            </div>
                            <span className="text-xs font-medium text-slate-200 flex-1 truncate">{p.name}</span>
                            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <input
                      type="text"
                      placeholder="Add a title…"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>

                  {/* Caption */}
                  <div>
                    <textarea
                      rows={2}
                      placeholder="Write a caption, add hashtags…"
                      value={videoCaption}
                      onChange={(e) => setVideoCaption(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 resize-none transition"
                    />
                  </div>

                  {/* Publish target */}
                  <div className="flex gap-2 p-1 bg-slate-800 rounded-2xl">
                    {([
                      { id: 'reels', icon: '🎬', label: 'Reel' },
                      { id: 'stories', icon: '⏱️', label: 'Story' },
                      { id: 'post', icon: '📝', label: 'Post' },
                    ] as const).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setPublishTarget(t.id); triggerHaptic('selection'); }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                          publishTarget === t.id
                            ? 'bg-sky-500 text-white shadow'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!previewUrl}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white hover:bg-sky-400 active:scale-[0.98] transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Share Now
                  </button>
                </>
              )}

              {/* hidden input */}
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            </form>
          )}

          {/* ════ LIBRARY TAB ════ */}
          {tab === 'library' && (
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                  <span className="text-xs text-slate-400">Loading your videos…</span>
                </div>
              ) : videos.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                    <FileVideo className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">No videos yet</p>
                    <p className="text-xs text-slate-500 mt-1">Upload your first video to get started</p>
                  </div>
                  <button
                    onClick={() => setTab('upload')}
                    className="px-5 py-2.5 rounded-full bg-sky-500 text-white text-xs font-bold active:scale-95 transition"
                  >
                    Upload Now
                  </button>
                </div>
              ) : (
                videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    {/* Thumb */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0">
                      <video src={vid.url} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{vid.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {(vid.size / (1024 * 1024)).toFixed(1)} MB · {new Date(vid.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(vid.url, vid.id)}
                        className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 active:scale-95 transition"
                      >
                        {copiedId === vid.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(vid.id)}
                        className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-red-600 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
