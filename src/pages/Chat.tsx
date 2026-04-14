import { useState, useRef, useEffect, useMemo } from 'react';
import { Hash, Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatRepository } from '@/repositories/chatRepository';
import { apiRepository } from '@/repositories/apiRepository';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, ChatRoom, Project, ResearchLab, ResearchGroup, ResearchLabAdmin } from '@/types';
import { toast } from 'sonner';

// Sub-components
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatInput from '@/components/chat/ChatInput';

const Chat = () => {
  const { user: currentUser } = useAuth();

  // Data state
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [labAdmins, setLabAdmins] = useState<ResearchLabAdmin[]>([]);

  // UI state
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [deletingMessageIds, setDeletingMessageIds] = useState<number[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');

  // Create channel modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [createTarget, setCreateTarget] = useState<{
    type: 'LAB' | 'GROUP' | 'PROJECT';
    id: number;
    name: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const ws = useRef<WebSocket | null>(null);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, projectsData, labsData, groupsData] = await Promise.all([
          chatRepository.getRooms(),
          apiRepository.getProjects(),
          apiRepository.getLabs(),
          apiRepository.getGroups()
        ]);

        setRooms(roomsData);
        setProjects(projectsData);
        setLabs(labsData);
        setGroups(groupsData);

        try {
          const adminsData = await apiRepository.getLabAdmins();
          setLabAdmins(adminsData);
        } catch (adminError) {
          console.warn('Failed to fetch lab admins:', adminError);
          setLabAdmins([]);
        }

        if (roomsData.length > 0 && !selectedRoomId) {
          setSelectedRoomId(roomsData[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error);
        toast.error('Failed to load chat data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Room selection & WebSocket handling
  useEffect(() => {
    if (!selectedRoomId) return;

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

    const wsUrl = chatRepository.getWsUrl(selectedRoomId);
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === 'message_deleted' && typeof data.id === 'number') {
        setMessages(prev => prev.filter(m => m.id !== data.id));
        return;
      }
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    return () => {
      socket.close();
    };
  }, [selectedRoomId]);

  const handleSend = () => {
    if (!newMessage.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ content: newMessage.trim() }));
    setNewMessage('');
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (deletingMessageIds.includes(messageId)) return;
    setDeletingMessageIds(prev => [...prev, messageId]);
    try {
      await chatRepository.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    } finally {
      setDeletingMessageIds(prev => prev.filter(id => id !== messageId));
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !createTarget || !currentUser) return;
    setIsCreating(true);
    try {
      const payload: Partial<ChatRoom> = {
        name: newChannelName.trim(),
        type: createTarget.type,
      };
      if (createTarget.type === 'LAB') payload.lab_id = createTarget.id;
      if (createTarget.type === 'GROUP') payload.group_id = createTarget.id;
      if (createTarget.type === 'PROJECT') payload.project_id = createTarget.id;

      const newRoom = await chatRepository.createRoom(payload);
      setRooms(prev => [...prev, newRoom]);
      setSelectedRoomId(newRoom.id);
      setIsCreateModalOpen(false);
      setNewChannelName('');
      toast.success(`Channel #${newRoom.name} created!`);
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast.error('Failed to create channel');
    } finally {
      setIsCreating(false);
    }
  };

  const canDeleteMessage = (msg: ChatMessage) => {
    if (!currentUser) return false;
    return currentUser.role === 'ADMIN' || currentUser.id === msg.sender_user_id;
  };

  const canManageLab = (labId: number) => {
    if (currentUser?.role === 'ADMIN') return true;
    return labAdmins.some(a => a.lab_id === labId && a.user_id === currentUser?.id);
  };

  const canManageGroup = (groupId: number) => {
    if (currentUser?.role === 'ADMIN') return true;
    const group = groups.find(g => g.id === groupId);
    return group?.leader_user_id === currentUser?.id;
  };

  const canManageProject = (projectId: number) => {
    if (currentUser?.role === 'ADMIN') return true;
    const project = projects.find(p => p.id === projectId);
    return project?.created_by === currentUser?.id;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredMessages = useMemo(() => {
    if (!messageSearchQuery.trim()) return messages;
    return messages.filter(m =>
      m.content.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      m.sender_name?.toLowerCase().includes(messageSearchQuery.toLowerCase())
    );
  }, [messages, messageSearchQuery]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: ChatMessage[] }[] = [];
    filteredMessages.forEach(msg => {
      const date = formatDate(msg.created_at);
      const last = groups[groups.length - 1];
      if (last && last.date === date) {
        last.msgs.push(msg);
      } else {
        groups.push({ date, msgs: [msg] });
      }
    });
    return groups;
  }, [filteredMessages]);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-80" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background overflow-hidden">
      <ChatSidebar
        rooms={rooms}
        projects={projects}
        labs={labs}
        groups={groups}
        selectedRoomId={selectedRoomId}
        onRoomSelect={setSelectedRoomId}
        onCreateChannel={(target) => {
          setCreateTarget(target);
          setIsCreateModalOpen(true);
        }}
        canManageLab={canManageLab}
        canManageGroup={canManageGroup}
        canManageProject={canManageProject}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Subtle background glow */}

        {selectedRoom ? (
          <>
            <ChatHeader
              roomName={selectedRoom.name}
              onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
            />

            {isSearchOpen && (
              <div className="px-6 py-3 border-b border-border/40 bg-muted/20 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
                <div className="max-w-4xl mx-auto relative">
                  <Input
                    placeholder="Search in conversation..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="h-10 rounded-xl bg-background/50 border-border/60 focus-visible:ring-primary/40 pl-4 pr-10"
                    autoFocus
                  />
                  {messageSearchQuery && (
                    <button
                      onClick={() => setMessageSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            <ChatMessageList
              groupedMessages={groupedMessages}
              currentUser={currentUser}
              deletingMessageIds={deletingMessageIds}
              onDeleteMessage={handleDeleteMessage}
              formatTime={formatTime}
              canDeleteMessage={canDeleteMessage}
              selectedRoomName={selectedRoom.name}
            />

            <ChatInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={handleSend}
              placeholder={`Message #${selectedRoom.name}...`}
              disabled={false}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
            <div className="h-24 w-24 rounded-[2.5rem] bg-card border border-border flex items-center justify-center mb-8 shadow-2xl shadow-primary/5 relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Hash className="h-12 w-12 text-primary relative z-10" />
            </div>
            <h3 className="text-xl font-black tracking-tight mb-3 text-foreground/90">Welcome to your workspace</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed font-medium">
              Choose a community or project channel from the sidebar to start collaborating with your team.
            </p>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border/40 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span>New Channel</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
                Channel Name
              </label>
              <Input
                placeholder="e.g. general, research-notes"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateChannel();
                }}
                className="rounded-2xl border-border/60 focus-visible:ring-primary h-12 bg-muted/20 font-medium"
              />
              <p className="text-[10px] text-muted-foreground/60 px-1 font-medium italic">
                This channel will be created in <span className="text-primary/80 font-bold">#{createTarget?.name}</span>
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-3 flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="rounded-2xl px-6 font-bold h-12">
              Cancel
            </Button>
            <Button
              onClick={handleCreateChannel}
              disabled={!newChannelName.trim() || isCreating}
              className="rounded-2xl px-8 h-12 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Channel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
