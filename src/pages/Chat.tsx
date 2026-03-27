import { useState, useRef, useEffect } from 'react';
import { Hash, Send, Users, FolderOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { chatRepository } from '@/repositories/chatRepository';
import { apiRepository } from '@/repositories/apiRepository';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, ChatRoom, Project } from '@/types';

const Chat = () => {
  const { user: currentUser } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, projectsData] = await Promise.all([
          chatRepository.getRooms(),
          apiRepository.getProjects()
        ]);
        setRooms(roomsData);
        setProjects(projectsData);
        if (roomsData.length > 0) {
          setSelectedRoomId(roomsData[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Room selection & WebSocket handling
  useEffect(() => {
    if (!selectedRoomId) return;

    // Fetch history
    const fetchHistory = async () => {
      try {
        const history = await chatRepository.getMessages(selectedRoomId);
        setMessages(history);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
      }
    };
    fetchHistory();

    // Setup WebSocket
    const wsUrl = chatRepository.getWsUrl(selectedRoomId);
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => {
        // Avoid duplicates if we broadcast to sender too
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    
    ws.current.send(JSON.stringify({ content: newMessage.trim() }));
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

  const teamRooms = rooms.filter(r => r.type === 'TEAM');
  const projectsWithRooms = projects.filter(p => rooms.some(r => r.project_id === p.id));
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach(msg => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Room List */}
      <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        </div>

        <ScrollArea className="flex-1 px-2 py-4">
          {/* Team rooms */}
          {teamRooms.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 px-3 mb-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Communities</span>
              </div>
              {teamRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    selectedRoomId === room.id
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Hash className={`h-4 w-4 shrink-0 ${selectedRoomId === room.id ? 'text-primary' : 'text-muted-foreground/60'}`} />
                  <span className="truncate">{room.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Project rooms */}
          {projectsWithRooms.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 px-3 mb-2">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Projects</span>
              </div>
              {projectsWithRooms.map(project => {
                const projectRooms = rooms.filter(r => r.project_id === project.id);
                return (
                  <div key={project.id} className="mb-2">
                    <div className="px-3 py-1 mb-1">
                      <span className="text-[11px] font-medium text-muted-foreground/80 truncate block">
                        {project.title}
                      </span>
                    </div>
                    {projectRooms.map(room => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ml-2' ${
                          selectedRoomId === room.id
                            ? 'bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Hash className={`h-3.5 w-3.5 shrink-0 ${selectedRoomId === room.id ? 'text-primary' : 'text-muted-foreground/60'}`} />
                        <span className="truncate">{room.name}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          
          {rooms.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-muted-foreground italic">No channels found</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-sm">
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/30 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">{selectedRoom.name}</h3>
                  <p className="text-xs text-muted-foreground">Real-time collaboration</p>
                </div>
              </div>
            </div>

            {/* Message list */}
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
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

                          return (
                            <div key={msg.id} className={`flex gap-4 ${sameAuthor ? 'mt-0.5' : 'mt-6'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                              {!sameAuthor ? (
                                <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm ${
                                  isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {msg.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                </div>
                              ) : (
                                <div className="w-10 shrink-0 flex justify-end pr-2">
                                  <span className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors">
                                    {formatTime(msg.created_at)}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                {!sameAuthor && (
                                  <div className="flex items-baseline gap-3 mb-1">
                                    <span className={`text-sm font-bold tracking-tight ${isMe ? 'text-primary' : 'text-foreground'}`}>
                                      {msg.sender_name}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground/70">{formatTime(msg.created_at)}</span>
                                  </div>
                                )}
                                <div className={`text-sm leading-relaxed ${isMe ? 'text-foreground' : 'text-foreground/90'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            </div>
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
                    <p className="text-xs">Start the conversation in #{selectedRoom.name}</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-6 border-t border-border bg-card/30 backdrop-blur-md">
              <div className="max-w-4xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
                  <div className="relative flex gap-3 p-1 bg-background border border-border/60 rounded-2xl shadow-sm group-focus-within:border-primary/50 transition-all duration-300">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message #${selectedRoom.name}...`}
                      className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 h-12"
                    />
                    <Button 
                      size="icon" 
                      onClick={handleSend} 
                      disabled={!newMessage.trim()}
                      className="h-10 w-10 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex justify-between px-2">
                  <span className="text-[10px] text-muted-foreground/60 italic font-medium">
                    Press Enter to send
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-muted/5">
            <div className="h-20 w-20 rounded-[2.5rem] bg-card border border-border flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
              <Hash className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold tracking-tight mb-2">Select a channel</h3>
            <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">
              Choose a community or project channel from the sidebar to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
