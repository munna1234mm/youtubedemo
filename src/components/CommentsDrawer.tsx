import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Heart, 
  Sparkles, 
  Image as ImageIcon, 
  Smile, 
  CornerDownRight, 
  Mic 
} from 'lucide-react';
import { Comment, User } from '../types';
import { triggerHaptic, fireConfetti } from '../utils/telegram';

interface CommentsDrawerProps {
  postAuthorName: string;
  comments: Comment[];
  currentUser: User;
  onClose: () => void;
  onAddComment: (text: string, parentCommentId?: string, image?: string) => void;
  onLikeComment: (commentId: string) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  postAuthorName,
  comments,
  currentUser,
  onClose,
  onAddComment,
  onLikeComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const sampleGifs = [
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !attachedImage) return;

    triggerHaptic('success');
    onAddComment(commentText, replyingTo?.id, attachedImage || undefined);
    setCommentText('');
    setReplyingTo(null);
    setAttachedImage(null);
  };

  const handleVoiceSim = () => {
    triggerHaptic('medium');
    setCommentText('🎤 [Voice Message 0:14]');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] h-[75vh]">
        
        {/* Drawer Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-['Outfit']">
              Comments on {postAuthorName}'s post
            </h3>
            <span className="text-[11px] text-slate-400">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8">
              <Sparkles className="w-8 h-8 text-sky-400 mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">No comments yet</p>
              <p className="text-xs text-slate-500 mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* Main Comment */}
                <div className="flex items-start gap-2.5 group">
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl px-3.5 py-2.5 inline-block max-w-full">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{comment.userName}</span>
                        {comment.isPremium && (
                          <span className="text-sky-400 text-[10px]">★</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5 break-words whitespace-pre-wrap">
                        {comment.text}
                      </p>
                      {comment.image && (
                        <img
                          src={comment.image}
                          alt="attached"
                          className="mt-2 rounded-xl max-h-36 object-cover border border-slate-700"
                        />
                      )}
                    </div>

                    {/* Comment Actions: Like / Reply / Timestamp */}
                    <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-slate-400 font-medium">
                      <span>{comment.timestamp}</span>
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onLikeComment(comment.id);
                        }}
                        className={`hover:underline transition ${
                          comment.isLiked ? 'text-rose-400 font-bold' : 'hover:text-slate-200'
                        }`}
                      >
                        {comment.isLiked ? 'Liked' : 'Like'}
                        {comment.likesCount > 0 && ` (${comment.likesCount})`}
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setReplyingTo({ id: comment.id, name: comment.userName });
                        }}
                        className="hover:underline hover:text-slate-200"
                      >
                        Reply
                      </button>
                    </div>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2 pl-4 border-l-2 border-slate-800 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-2">
                            <img
                              src={reply.userAvatar}
                              alt={reply.userName}
                              className="w-6 h-6 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-1.5 inline-block">
                                <span className="font-bold text-[11px] text-white">
                                  {reply.userName}
                                </span>
                                <p className="text-[11px] text-slate-200 mt-0.5">{reply.text}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 ml-2">{reply.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="px-4 py-1.5 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <CornerDownRight className="w-3.5 h-3.5 text-sky-400" />
              Replying to <span className="font-bold text-white">{replyingTo.name}</span>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Attached image preview */}
        {attachedImage && (
          <div className="px-4 py-2 bg-slate-800 flex items-center gap-2 border-t border-slate-700">
            <img src={attachedImage} alt="preview" className="w-10 h-10 object-cover rounded-lg" />
            <span className="text-xs text-slate-300 flex-1">Image attached</span>
            <button
              onClick={() => setAttachedImage(null)}
              className="text-slate-400 hover:text-rose-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
          />

          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a comment..."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs rounded-full pl-3.5 pr-20 py-2 border border-slate-700 focus:outline-none focus:border-sky-500"
            />
            
            {/* Quick Actions inside input */}
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleVoiceSim}
                className="p-1 text-slate-400 hover:text-sky-400 transition"
                title="Voice memo"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAttachedImage(sampleGifs[0])}
                className="p-1 text-slate-400 hover:text-emerald-400 transition"
                title="Attach photo"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!commentText.trim() && !attachedImage}
            className={`p-2 rounded-full transition ${
              commentText.trim() || attachedImage
                ? 'bg-sky-500 text-white hover:bg-sky-400'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
