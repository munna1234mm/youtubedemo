import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Video, Send, Sparkles } from 'lucide-react';
import { User, Story, Reel } from '../types';
import { triggerHaptic, fireConfetti } from '../utils/telegram';

interface CreateStoryModalProps {
  currentUser: User;
  onClose: () => void;
  onAddStory: (story: Story) => void;
  onAddReel: (reel: Reel) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  currentUser,
  onClose,
  onAddStory,
  onAddReel,
}) => {
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [publishAs, setPublishAs] = useState<'story' | 'reel'>('story');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File, type: 'image' | 'video') => {
    setError(null);
    setMediaType(type);
    setSelectedFile(file);

    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
      setPublishAs('reel');
    }
    triggerHaptic('light');
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Image too large. Max 20MB.');
      return;
    }
    handleFileSelect(file, 'image');
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setError('Video too large. Max 100MB.');
      return;
    }
    handleFileSelect(file, 'video');
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    handleFileSelect(file, type);
  };

  const handlePublish = async () => {
    if (!mediaPreview) return;
    setUploading(true);
    setError(null);
    triggerHaptic('medium');

    try {
      let finalMediaUrl = mediaPreview;

      // If it's a video file and not yet uploaded, upload to server
      if (mediaType === 'video' && selectedFile) {
        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('title', caption || 'Story Video');
        formData.append('authorId', currentUser.id);
        formData.append('authorName', currentUser.name);
        formData.append('authorAvatar', currentUser.avatar);
        formData.append('authorUsername', currentUser.username);

        try {
          const res = await fetch('/api/upload/video', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.video?.url) {
              finalMediaUrl = data.video.url;
            }
          }
        } catch {
          // fallback to preview
        }
      }

      if (publishAs === 'story') {
        const newStory: Story = {
          id: `story_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          isPremium: currentUser.isPremium,
          mediaUrl: finalMediaUrl,
          mediaType,
          caption: caption || undefined,
          timestamp: 'Just now',
          likesCount: 0,
        };
        onAddStory(newStory);
      } else {
        const newReel: Reel = {
          id: `reel_${Date.now()}`,
          author: currentUser,
          videoUrl: finalMediaUrl,
          thumbnailUrl: currentUser.avatar,
          caption: caption || 'New Reel',
          audioName: `Original Audio · ${currentUser.name}`,
          likesCount: 1,
          commentsCount: 0,
          sharesCount: 0,
          isLiked: true,
        };
        onAddReel(newReel);
      }

      fireConfetti();
      triggerHaptic('success');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      setError(err.message || 'Failed to publish. Try again.');
      setUploading(false);
      triggerHaptic('warning');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-white font-['Outfit']">
          Create {publishAs === 'story' ? 'Story' : 'Reel'}
        </h2>
        <button
          onClick={handlePublish}
          disabled={!mediaPreview || uploading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-500 disabled:opacity-40 text-white text-sm font-bold active:scale-95 transition"
        >
          {uploading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Share
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!mediaPreview ? (
          /* Pick Media */
          <div className="flex flex-col items-center justify-center min-h-full gap-5 px-6 py-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-sky-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-1">Add to Your Story</h3>
              <p className="text-sm text-slate-400">Share a photo or video — visible for 24 hours</p>
            </div>

            <div className="w-full max-w-sm grid grid-cols-3 gap-3 mt-2">
              {/* Camera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 active:scale-95 transition"
              >
                <Camera className="w-7 h-7 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">Camera</span>
              </button>

              {/* Photo Gallery */}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 active:scale-95 transition"
              >
                <ImageIcon className="w-7 h-7 text-sky-400" />
                <span className="text-xs font-semibold text-slate-300">Photo</span>
              </button>

              {/* Video Gallery */}
              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 active:scale-95 transition"
              >
                <Video className="w-7 h-7 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300">Video</span>
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 w-full max-w-sm">
                {error}
              </p>
            )}
          </div>
        ) : (
          /* Preview & Caption */
          <div className="flex flex-col gap-0">
            {/* Media Preview */}
            <div className="relative w-full bg-black" style={{ minHeight: '55vw', maxHeight: '65vh' }}>
              {mediaType === 'image' ? (
                <img
                  src={mediaPreview}
                  alt="Story preview"
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '65vh' }}
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full"
                  style={{ maxHeight: '65vh' }}
                  playsInline
                />
              )}

              {/* Remove media button */}
              <button
                onClick={() => { setMediaPreview(null); setCaption(''); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Publish As toggle */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex gap-2 p-1 bg-slate-800 rounded-2xl">
                <button
                  onClick={() => setPublishAs('story')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                    publishAs === 'story'
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-400'
                  }`}
                >
                  📖 Story
                </button>
                <button
                  onClick={() => setPublishAs('reel')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                    publishAs === 'reel'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-slate-400'
                  }`}
                >
                  🎬 Reel
                </button>
              </div>
            </div>

            {/* Caption */}
            <div className="px-4 pb-4">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            {error && (
              <p className="mx-4 mb-4 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoPick}
      />
    </div>
  );
};
