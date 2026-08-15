import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Film,
  Camera,
  Smile, 
  BarChart2, 
  Globe, 
  Users, 
  Lock, 
  Sparkles, 
  Plus, 
  Trash2, 
  MapPin, 
  UploadCloud,
  Check,
  Play
} from 'lucide-react';
import { User, Post, Poll } from '../types';
import { triggerHaptic, fireConfetti } from '../utils/telegram';

interface CreatePostModalProps {
  currentUser: User;
  onClose: () => void;
  onSubmitPost: (newPost: Partial<Post>) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  onClose,
  onSubmitPost,
}) => {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [feeling, setFeeling] = useState<string>('');
  const [showFeelings, setShowFeelings] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'telegram_contacts'>('public');
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  
  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const sampleFeelings = [
    { emoji: '🚀', name: 'excited' },
    { emoji: '💡', name: 'inspired' },
    { emoji: '🌴', name: 'traveling' },
    { emoji: '☕', name: 'relaxing' },
    { emoji: '💻', name: 'coding' },
    { emoji: '🔥', name: 'motivated' },
    { emoji: '✨', name: 'blessed' },
  ];

  const presetPhotos = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  ];

  const handleAddOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const updated = [...pollOptions];
    updated[index] = text;
    setPollOptions(updated);
  };

  // Direct Photo File Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImages((prev) => [...prev, url]);
      triggerHaptic('light');
    }
  };

  // Direct Video File Upload
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    setUploadProgress(20);
    triggerHaptic('medium');

    try {
      const localUrl = URL.createObjectURL(file);
      setSelectedVideo(localUrl);

      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', content.slice(0, 30) || 'Post Video');
      formData.append('authorId', currentUser.id);
      formData.append('authorName', currentUser.name);
      formData.append('authorAvatar', currentUser.avatar);
      formData.append('authorUsername', currentUser.username);

      setUploadProgress(60);
      const res = await fetch('/api/upload/video', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.video?.url) {
          setSelectedVideo(data.video.url);
        }
      }
      setUploadProgress(100);
      triggerHaptic('success');
    } catch {
      // Keep local preview if upload fails
    } finally {
      setTimeout(() => setUploadingMedia(false), 500);
    }
  };

  const handleAddImage = (url: string) => {
    if (url && !selectedImages.includes(url)) {
      setSelectedImages([...selectedImages, url]);
      setImageUrlInput('');
      setShowImageInput(false);
      triggerHaptic('light');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    triggerHaptic('light');
  };

  const handleAIAssist = () => {
    triggerHaptic('medium');
    const aiIdeas = [
      "Excited to announce our new Telegram Mini App built on TON! 🚀 Smooth UI, instant wallets, and viral referral loops. What features should we build next?",
      "Working on modern WebApp UX inside Telegram. Here are 3 lessons learned building for 900M+ global users... 💡✨",
      "Sunset views after a long sprint of development. Balance is key! 🌅☕ How is your weekend shaping up?",
    ];
    const randomIdea = aiIdeas[Math.floor(Math.random() * aiIdeas.length)];
    setContent(randomIdea);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedImages.length === 0 && !selectedVideo && !showPoll) return;

    let pollData: Poll | undefined = undefined;
    if (showPoll && pollQuestion.trim()) {
      const validOptions = pollOptions.filter((opt) => opt.trim().length > 0);
      if (validOptions.length >= 2) {
        pollData = {
          question: pollQuestion,
          options: validOptions.map((text, idx) => ({
            id: `opt_${Date.now()}_${idx}`,
            text,
            votes: 0,
            votedUserIds: [],
          })),
          totalVotes: 0,
        };
      }
    }

    const newPost: Partial<Post> = {
      author: currentUser,
      content,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      videoUrl: selectedVideo || undefined,
      feeling: feeling || undefined,
      location: location || undefined,
      privacy,
      poll: pollData,
      timestamp: 'Just now',
      likesCount: 0,
      reactionsSummary: {},
      commentsCount: 0,
      sharesCount: 0,
      starsDonated: 0,
    };

    triggerHaptic('success');
    fireConfetti();
    onSubmitPost(newPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white font-['Outfit']">Create Post</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          
          {/* User Profile Bar & Privacy */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-700"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">{currentUser.name}</span>
                {feeling && (
                  <span className="text-xs text-slate-400">
                    is feeling <strong className="text-amber-400">{feeling}</strong>
                  </span>
                )}
              </div>

              {/* Privacy Selector */}
              <div className="flex items-center gap-1 mt-0.5">
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="bg-slate-800 text-[11px] text-slate-300 font-medium px-2 py-0.5 rounded-lg border border-slate-700 focus:outline-none"
                >
                  <option value="public">🌐 Public (All Telegram Users)</option>
                  <option value="friends">👥 Mutual Friends Only</option>
                  <option value="telegram_contacts">🔒 Telegram Contacts</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Text Input */}
          <div className="relative">
            <textarea
              rows={4}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-base focus:outline-none resize-none border-none p-0"
              autoFocus
            />

            {/* AI Magic Helper */}
            <button
              type="button"
              onClick={handleAIAssist}
              className="absolute right-0 bottom-0 text-[11px] font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-2 py-1 rounded-full flex items-center gap-1 transition"
              title="Generate post idea with AI"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Inspire</span>
            </button>
          </div>

          {/* Video Upload Progress */}
          {uploadingMedia && (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-sky-500/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
                <span>Uploading Video…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Attached Video Preview */}
          {selectedVideo && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-700 group">
              <video src={selectedVideo} controls className="w-full h-full object-contain" playsInline />
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-rose-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached Images Preview */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {selectedImages.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden group h-32 bg-slate-800">
                  <img src={img} alt="attached" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Image URL Input Drawer */}
          {showImageInput && (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Add Image URL or Pick Sample</span>
                <button onClick={() => setShowImageInput(false)} className="text-slate-400 hover:text-white">
                  Cancel
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddImage(imageUrlInput)}
                  className="px-3 py-1.5 bg-sky-500 text-white text-xs font-bold rounded-lg hover:bg-sky-400 transition"
                >
                  Add
                </button>
              </div>
              
              {/* Presets */}
              <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
                {presetPhotos.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt="preset"
                    onClick={() => handleAddImage(preset)}
                    className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-105 border border-slate-700 transition shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Poll Builder Drawer */}
          {showPoll && (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-sky-400" />
                  Interactive Telegram Poll
                </span>
                <button onClick={() => setShowPoll(false)} className="text-slate-400 hover:text-rose-400">
                  Remove Poll
                </button>
              </div>
              <input
                type="text"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-semibold"
              />
              <div className="space-y-1.5">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(e.target.value, i)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(i)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-sky-400 font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              )}
            </div>
          )}

          {/* Location input */}
          {showLocationInput && (
            <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-xl border border-slate-700">
              <MapPin className="w-4 h-4 text-rose-400" />
              <input
                type="text"
                placeholder="Where are you? (e.g. Dubai Marina, Tokyo, London)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button onClick={() => setShowLocationInput(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Feelings Drawer */}
          {showFeelings && (
            <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">How are you feeling?</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleFeelings.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => {
                      setFeeling(f.name);
                      setShowFeelings(false);
                      triggerHaptic('light');
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition ${
                      feeling === f.name
                        ? 'bg-sky-500 text-white border-sky-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span>{f.emoji}</span>
                    <span className="capitalize">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-to-post action bar with direct Video, Photo, Camera buttons */}
          <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Add to post</span>
            <div className="flex items-center gap-1">
              
              {/* Direct Photo Gallery */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-slate-700 text-emerald-400 transition"
                title="Upload Photo from Phone"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Direct Video Upload */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-slate-700 text-purple-400 transition"
                title="Upload Video / Reel from Phone"
              >
                <Film className="w-5 h-5" />
              </button>

              {/* Camera Capture */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-slate-700 text-cyan-400 transition"
                title="Camera"
              >
                <Camera className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFeelings(!showFeelings);
                  triggerHaptic('selection');
                }}
                className="p-2 rounded-full hover:bg-slate-700 text-amber-400 transition"
                title="Feeling / Activity"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPoll(!showPoll);
                  triggerHaptic('selection');
                }}
                className="p-2 rounded-full hover:bg-slate-700 text-sky-400 transition"
                title="Poll"
              >
                <BarChart2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLocationInput(!showLocationInput);
                  triggerHaptic('selection');
                }}
                className="p-2 rounded-full hover:bg-slate-700 text-rose-400 transition"
                title="Location"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer / Submit Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() && selectedImages.length === 0 && !selectedVideo && !showPoll}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
              content.trim() || selectedImages.length > 0 || selectedVideo || showPoll
                ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white hover:brightness-110'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Post Update
          </button>
        </div>

      </div>

      {/* Hidden native file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file?.type.startsWith('video/')) {
            handleVideoSelect(e);
          } else if (file) {
            handlePhotoSelect(e);
          }
        }}
        className="hidden"
      />
    </div>
  );
};
