import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  Image as ImageIcon, 
  Smile, 
  CheckCheck, 
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { User, Message } from '../types';
import { triggerHaptic, fireConfetti } from '../utils/telegram';

interface ChatModalProps {
  participant: User;
  currentUser: User;
  onClose: () => void;
  onTipStars: (amount: number, recipientName: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  participant,
  currentUser,
  onClose,
  onTipStars,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch real conversation from server
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?user1=${currentUser.id}&user2=${participant.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Default welcoming greeting if first time
          setMessages([
            {
              id: 'm_welcome',
              senderId: participant.id,
              receiverId: currentUser.id,
              text: `Hello ${currentUser.name}! 👋 Great to connect on TeleBook!`,
              timestamp: 'Just now',
              isRead: true,
            },
          ]);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, [participant.id, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');
    triggerHaptic('light');

    const tempMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      receiverId: participant.id,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: participant.id,
          text: textToSend,
        }),
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full sm:max-w-md h-[90vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white">{participant.name}</span>
                {participant.isVerified && (
                  <span className="text-sky-400 text-xs">✓</span>
                )}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold block">
                @{participant.username} · Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onTipStars(50, participant.name);
              }}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-500/40 text-amber-300 hover:border-yellow-400 text-xs font-bold transition flex items-center gap-1"
              title="Tip TG Stars"
            >
              <Sparkles className="w-3.5 h-3.5 fill-yellow-400" />
              <span>Tip</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              <span>Connecting inbox…</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-sky-500 text-white rounded-br-none shadow-md shadow-sky-500/10'
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`text-[9px] mt-1 flex items-center gap-1 justify-end ${
                        isMine ? 'text-sky-100' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-sky-200" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs px-2">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] ml-1">{participant.name.split(' ')[0]} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Write a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-bold transition shrink-0 shadow-md shadow-sky-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
