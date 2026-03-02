import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  chatRooms, chatMessages, currentUser, getUserById, projects,
  getTeamChatRooms, getChatRoomsByProject,
} from '@/data/mockData';
import type { ChatMessage, ChatRoom } from '@/types';
import { Hash, Send, Users, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const Chat = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const teamRooms = getTeamChatRooms();
  const projectsWithRooms = projects.filter(p => getChatRoomsByProject(p.id).length > 0);

  const roomMessages = messages.filter(m => m.room_id === selectedRoomId);
  const selectedRoom = chatRooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length, selectedRoomId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: messages.length + 1,
      room_id: selectedRoomId,
      sender_user_id: currentUser.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  roomMessages.forEach(msg => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Room List */}
      <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        </div>

        <ScrollArea className="flex-1 px-2">
          {/* Team rooms */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 px-2 mb-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team</span>
            </div>
            {teamRooms.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedRoomId === room.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{room.name}</span>
              </button>
            ))}
          </div>

          {/* Project rooms */}
          {projectsWithRooms.map(project => {
            const rooms = getChatRoomsByProject(project.id);
            return (
              <div key={project.id} className="mb-4">
                <div className="flex items-center gap-1.5 px-2 mb-1">
                  <FolderOpen className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                    {project.title.length > 20 ? project.title.slice(0, 20) + '…' : project.title}
                  </span>
                </div>
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedRoomId === room.id
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                  >
                    <Hash className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{room.name.split('—')[1]?.trim() || room.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </ScrollArea>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-12 flex items-center gap-2 px-4 border-b border-border shrink-0">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{selectedRoom?.name}</span>
        </div>

        {/* Message list */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-1">
            {groupedMessages.map(group => (
              <div key={group.date}>
                <div className="flex items-center gap-3 my-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground shrink-0">{group.date}</span>
                  <Separator className="flex-1" />
                </div>
                {group.msgs.map((msg, i) => {
                  const sender = getUserById(msg.sender_user_id);
                  const prevMsg = i > 0 ? group.msgs[i - 1] : null;
                  const sameAuthor = prevMsg?.sender_user_id === msg.sender_user_id;
                  const isMe = msg.sender_user_id === currentUser.id;

                  return (
                    <div key={msg.id} className={`flex gap-3 ${sameAuthor ? 'mt-0.5' : 'mt-3'} group`}>
                      {!sameAuthor ? (
                        <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground mt-0.5">
                          {sender?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {!sameAuthor && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className={`text-sm font-medium ${isMe ? 'text-primary' : 'text-foreground'}`}>
                              {sender?.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                          </div>
                        )}
                        <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${selectedRoom?.name || 'channel'}...`}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
