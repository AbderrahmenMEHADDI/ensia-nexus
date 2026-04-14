import { useRef, useEffect } from 'react';
import { Hash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessageItem from './ChatMessageItem';
import type { ChatMessage, User } from '@/types';

interface ChatMessageListProps {
  groupedMessages: { date: string; msgs: ChatMessage[] }[];
  currentUser: User | null;
  deletingMessageIds: number[];
  onDeleteMessage: (id: number) => void;
  formatTime: (date: string) => string;
  canDeleteMessage: (msg: ChatMessage) => boolean;
  selectedRoomName: string;
}

const ChatMessageList = ({
  groupedMessages,
  currentUser,
  deletingMessageIds,
  onDeleteMessage,
  formatTime,
  canDeleteMessage,
  selectedRoomName,
}: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupedMessages]);

  return (
    <ScrollArea className="flex-1 scrollbar-premium">
      <div className="min-h-full flex flex-col justify-end">
        <div className="max-w-4xl w-full mx-auto px-6 py-8 space-y-8">
          {groupedMessages.length > 0 ? (
            groupedMessages.map(group => (
            <div key={group.date}>
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 bg-background/80 py-1 rounded-full border border-border/40 backdrop-blur-sm">
                  {group.date}
                </span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>
              <div className="space-y-1">
                {group.msgs.map((msg, i) => {
                  const prevMsg = i > 0 ? group.msgs[i - 1] : null;
                  const sameAuthor = prevMsg?.sender_user_id === msg.sender_user_id && 
                                   (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000);
                  const isMe = msg.sender_user_id === currentUser?.id;
                  const canDelete = canDeleteMessage(msg);
                  const isDeleting = deletingMessageIds.includes(msg.id);

                  return (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      isMe={isMe}
                      sameAuthor={sameAuthor}
                      canDelete={canDelete}
                      isDeleting={isDeleting}
                      onDelete={onDeleteMessage}
                      formatTime={formatTime}
                    />
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
              <Hash className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Start the conversation in #{selectedRoomName}</p>
          </div>
        )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
