import React, { useState } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  MoreHorizontal, 
  Bookmark, 
  Check, 
  Send, 
  Globe, 
  Users, 
  Lock, 
  Pin, 
  Flag 
} from 'lucide-react';
import { Post, ReactionType, User } from '../types';
import { triggerHaptic, fireConfetti, shareToTelegram } from '../utils/telegram';
import { ReactionsPopup, REACTIONS_DATA } from './ReactionsPopup';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onReact: (postId: string, reactionType: ReactionType) => void;
  onOpenComments: (postId: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onTipStars: (amount: number, recipientName: string) => void;
  onToggleSave: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onReact,
  onOpenComments,
  onVotePoll,
  onTipStars,
  onToggleSave,
}) => {
  const [showReactionsPopup, setShowReactionsPopup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const getReactionConfig = (type?: ReactionType) => {
    return REACTIONS_DATA.find((r) => r.type === type);
  };

  const currentReactionConfig = getReactionConfig(post.userReaction);

  const handleLikeClick = () => {
    if (post.userReaction) {
      // Toggle off or reset
      onReact(post.id, 'like');
    } else {
      triggerHaptic('medium');
      onReact(post.id, 'like');
    }
  };

  const handleShareToTelegram = () => {
    triggerHaptic('medium');
    const shareUrl = window.location.href;
    const text = `Check out this post by ${post.author.name} on TeleBook:\n"${post.content.slice(0, 100)}..."`;
    shareToTelegram(shareUrl, text);
    setShowShareModal(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    triggerHaptic('success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="bg-slate-900 border border-slate-800/90 rounded-2xl overflow-hidden shadow-md hover:border-slate-700/80 transition-all duration-200">
      
      {/* Header: Author Info, Time, Privacy, Menu */}
      <div className="p-3.5 flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm"
            />
            {post.author.isPremium && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-[9px] font-bold text-white flex items-center justify-center border border-slate-900 shadow">
                ★
              </span>
            )}
          </div>

          <div className="text-left leading-tight">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-white hover:underline cursor-pointer">
                {post.author.name}
              </span>
              {post.author.isVerified && (
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-[9px] text-white flex items-center justify-center font-bold">
                  ✓
                </span>
              )}
              {post.feeling && (
                <span className="text-xs text-slate-400 font-normal">
                  is feeling <span className="text-slate-200 font-medium">{post.feeling}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span>{post.timestamp}</span>
              <span>•</span>
              {post.location && (
                <>
                  <span className="text-slate-300 font-medium">{post.location}</span>
                  <span>•</span>
                </>
              )}
              <span title={post.privacy}>
                {post.privacy === 'public' && <Globe className="w-3 h-3 text-slate-400" />}
                {post.privacy === 'friends' && <Users className="w-3 h-3 text-slate-400" />}
                {post.privacy === 'telegram_contacts' && <Lock className="w-3 h-3 text-slate-400" />}
              </span>
            </div>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowMenu(!showMenu);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 py-1 text-xs">
              <button
                onClick={() => {
                  onToggleSave(post.id);
                  setShowMenu(false);
                  triggerHaptic('medium');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-700 text-left"
              >
                <Bookmark className="w-4 h-4 text-sky-400" />
                <span>{post.isSaved ? 'Remove from Saved' : 'Save Post'}</span>
              </button>
              <button
                onClick={() => {
                  handleCopyLink();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-700 text-left"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onTipStars(50, post.author.name);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-amber-300 hover:bg-slate-700 text-left font-semibold"
              >
                <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>Tip 50 TG Stars</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <div className="px-3.5 pb-2.5">
        <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-line break-words">
          {post.content}
        </p>
      </div>

      {/* Interactive Poll if present */}
      {post.poll && (
        <div className="px-3.5 pb-3">
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">{post.poll.question}</span>
              <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
                {post.poll.totalVotes} votes
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {post.poll.options.map((opt) => {
                const percentage = post.poll!.totalVotes > 0 
                  ? Math.round((opt.votes / post.poll!.totalVotes) * 100) 
                  : 0;
                const isSelected = post.poll?.userVotedOptionId === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      triggerHaptic('medium');
                      onVotePoll(post.id, opt.id);
                    }}
                    className={`w-full relative overflow-hidden rounded-lg p-2.5 text-xs text-left border transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
                        : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {/* Percentage Fill Bar */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${
                        isSelected ? 'bg-sky-500/25' : 'bg-slate-700/40'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        <span>{opt.text}</span>
                      </div>
                      <span className="font-bold text-xs text-slate-400">{percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Post Images Grid / Gallery */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-1 bg-black/40 ${
          post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
        }`}>
          {post.images.map((img, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden bg-slate-800 ${
                post.images!.length === 3 && idx === 0 ? 'col-span-2 max-h-72' : 'max-h-64'
              }`}
            >
              <img
                src={img}
                alt="post visual"
                className="w-full h-full object-cover hover:scale-102 transition duration-300 cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}

      {/* Post Stats: Reactions summary, comments count, stars count */}
      <div className="px-3.5 py-2 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80">
        
        {/* Left: Top Reaction Icons + Count */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center -space-x-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-[10px] text-white ring-2 ring-slate-900">
              👍
            </span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-[10px] text-white ring-2 ring-slate-900">
              ❤️
            </span>
            {post.starsDonated > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-[10px] text-white ring-2 ring-slate-900">
                ⭐
              </span>
            )}
          </div>
          <span className="font-semibold text-slate-300">
            {post.likesCount + (post.starsDonated > 0 ? 1 : 0)}
          </span>
        </div>

        {/* Right: Comments, Shares, Stars */}
        <div className="flex items-center gap-3">
          {post.starsDonated > 0 && (
            <span className="text-amber-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-yellow-400" />
              {post.starsDonated} Stars
            </span>
          )}
          <button
            onClick={() => onOpenComments(post.id)}
            className="hover:underline hover:text-slate-200"
          >
            {post.commentsCount} comments
          </button>
          <span>•</span>
          <span>{post.sharesCount} shares</span>
        </div>
      </div>

      {/* Action Buttons: Like / Comment / Tip Stars / Share */}
      <div className="p-1.5 grid grid-cols-4 gap-1 relative">
        
        {/* Reaction Pop-up */}
        {showReactionsPopup && (
          <ReactionsPopup
            onSelectReaction={(type) => {
              onReact(post.id, type);
              setShowReactionsPopup(false);
            }}
            onClose={() => setShowReactionsPopup(false)}
          />
        )}

        {/* Like / React Button */}
        <button
          onClick={handleLikeClick}
          onMouseEnter={() => setShowReactionsPopup(true)}
          onMouseLeave={() => {
            // small delay if needed
          }}
          className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition cursor-pointer hover:bg-slate-800 ${
            currentReactionConfig
              ? `${currentReactionConfig.color} font-bold`
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {currentReactionConfig ? (
            <span className="text-base leading-none">{currentReactionConfig.emoji}</span>
          ) : (
            <Heart className="w-4 h-4" />
          )}
          <span className="capitalize">{currentReactionConfig ? currentReactionConfig.label : 'Like'}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenComments(post.id);
          }}
          className="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>

        {/* Tip Telegram Stars Button */}
        <button
          onClick={() => {
            triggerHaptic('heavy');
            onTipStars(25, post.author.name);
          }}
          className="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition cursor-pointer"
          title="Send Telegram Stars Gift"
        >
          <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
          <span>Tip Stars</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowShareModal(true);
          }}
          className="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="p-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <span className="text-xs font-bold text-white">Share this post:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareToTelegram}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Send className="w-3 h-3" />
              <span>Forward to Telegram</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => setShowShareModal(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </article>
  );
};
