import React, { useState, useRef } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Camera, 
  Sparkles, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { User } from '../types';
import { getTelegramWebApp, triggerHaptic, fireConfetti } from '../utils/telegram';

interface AuthModalProps {
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, onClose }) => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  
  /* Form fields */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Handle Profile Photo upload (converts to base64) */
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
        triggerHaptic('success');
      }
    };
    reader.readAsDataURL(file);
  };

  /* 1-Click Telegram Login */
  const handleTelegramLogin = async () => {
    setLoading(true);
    setError(null);
    triggerHaptic('medium');

    try {
      const tg = getTelegramWebApp();
      let tgUserData = tg?.initDataUnsafe?.user;

      if (!tgUserData) {
        // If testing in standard web browser
        const promptName = prompt('Enter your Telegram Name or Handle:', 'Munna') || 'TeleUser';
        tgUserData = {
          id: Math.floor(Math.random() * 899999 + 100000),
          first_name: promptName,
          username: promptName.toLowerCase().replace(/\s+/g, '_'),
          photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          is_premium: true,
        };
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUser: tgUserData }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          triggerHaptic('success');
          fireConfetti();
          onLoginSuccess(data.user);
          return;
        }
      }
      setError('Failed to connect with Telegram');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Email & Password Submit */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    triggerHaptic('medium');

    try {
      if (authMode === 'signup') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setError('Please fill in your name, email, and password.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            username: username || email.split('@')[0],
            avatar: avatarUrl,
            bio: bio || 'TeleBook Member 🚀',
          }),
        });

        const data = await res.json();
        if (res.ok && data.user) {
          triggerHaptic('success');
          fireConfetti();
          onLoginSuccess(data.user);
        } else {
          setError(data.error || 'Registration failed.');
        }
      } else {
        /* Login */
        if (!email.trim() || !password.trim()) {
          setError('Please enter your email and password.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok && data.user) {
          triggerHaptic('success');
          fireConfetti();
          onLoginSuccess(data.user);
        } else {
          setError(data.error || 'Invalid credentials.');
        }
      }
    } catch {
      setError('Network connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-950/60 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 font-black text-lg">
              TB
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">
                Welcome to TeleBook
              </h2>
              <p className="text-[11px] text-slate-400">
                {authMode === 'signup' ? 'Create your social account' : 'Log in to your account'}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* 1. Continue with Telegram Button */}
          <div>
            <button
              type="button"
              onClick={handleTelegramLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-sky-500/25 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4 fill-white" />
              <span>Continue with Telegram (1-Click Login)</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold shrink-0">
              Or with Email & Password
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setAuthMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                authMode === 'signup'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setAuthMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                authMode === 'login'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            
            {authMode === 'signup' && (
              <>
                {/* Profile Photo Picker & Live Edit */}
                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
                  <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                    <img
                      src={avatarUrl}
                      alt="avatar preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-sky-400 shadow-md group-hover:opacity-80 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">Profile Photo</p>
                    <p className="text-[10px] text-slate-400">Click to upload custom picture</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-sky-400 text-xs font-bold rounded-lg transition"
                  >
                    Browse
                  </button>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Your Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Developer Munna"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Username (@handle)</label>
                  <input
                    type="text"
                    placeholder="e.g. munna_dev"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {authMode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Bio / Tagline</label>
                <input
                  type="text"
                  placeholder="Tell others what you do..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Processing…</span>
              ) : authMode === 'signup' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create Account & Join Live</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Log In to Account</span>
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
