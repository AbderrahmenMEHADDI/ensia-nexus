import { Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatMessage } from '@/types';
import { ProfileAvatar } from '@/components/ProfileAvatar';

interface ChatMessageItemProps {
  message: ChatMessage;
  isMe: boolean;
  sameAuthor: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: (id: number) => void;
  formatTime: (date: string) => string;
}

const ChatMessageItem = ({
  message,
  isMe,
  sameAuthor,
  canDelete,
  isDeleting,
  onDelete,
  formatTime,
}: ChatMessageItemProps) => {
  const getAvatarColor = (name?: string) => {
    if (!name) return 'bg-muted';
    const colors = [
      'bg-blue-500/20 text-blue-500 border-blue-500/20',
      'bg-purple-500/20 text-purple-500 border-purple-500/20',
      'bg-emerald-500/20 text-emerald-500 border-emerald-500/20',
      'bg-orange-500/20 text-orange-500 border-orange-500/20',
      'bg-pink-500/20 text-pink-500 border-pink-500/20',
      'bg-cyan-500/20 text-cyan-500 border-cyan-500/20',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarColorClass = isMe 
    ? 'bg-primary text-primary-foreground shadow-primary/20' 
    : getAvatarColor(message.sender_name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-4 ${sameAuthor ? 'mt-0.5' : 'mt-6'} group relative`}
    >
      {!sameAuthor ? (
        <ProfileAvatar
          userId={message.sender_user_id}
          name={message.sender_name}
          className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold shadow-md border select-none transition-transform group-hover:scale-105 duration-300 ${avatarColorClass}`}
          textClassName="text-xs font-bold"
        />
      ) : (
        <div className="w-10 shrink-0 flex justify-end pr-3 select-none">
          <span className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors">
            {formatTime(message.created_at)}
          </span>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {!sameAuthor && (
          <div className="flex items-baseline gap-3 mb-1.5">
            <span className={`text-sm font-bold tracking-tight ${isMe ? 'text-primary' : 'text-foreground/90'}`}>
              {message.sender_name}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-tighter italic">{formatTime(message.created_at)}</span>
          </div>
        )}
        
        <div className="relative group/content max-w-[85%]">
          <div className={`text-sm leading-relaxed p-3 rounded-2xl shadow-sm transition-all duration-300 ${
            isMe 
              ? 'bg-primary/10 text-foreground border border-primary/20 rounded-tl-none hover:bg-primary/[0.12]' 
              : 'bg-muted/70 text-foreground/90 border border-border/60 rounded-tl-none hover:bg-muted/80'
          } ${sameAuthor ? '!rounded-tl-2xl' : ''}`}>
            {message.content}
          </div>
          
          {canDelete && (
            <div className={`absolute -right-12 top-0 opacity-0 group-hover/content:opacity-100 transition-opacity`}>
              <button
                onClick={() => onDelete(message.id)}
                disabled={isDeleting}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60 bg-background border border-border rounded-lg shadow-sm"
                aria-label="Delete message"
                title="Delete message"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessageItem;
