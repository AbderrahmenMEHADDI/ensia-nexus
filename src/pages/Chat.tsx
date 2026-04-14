import { useState, useRef, useEffect } from 'react';
import { Hash, Send, Users, FolderOpen, Loader2, Plus, Beaker, Layers, ChevronRight, Trash2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { chatRepository } from '@/repositories/chatRepository';
import { apiRepository } from '@/repositories/apiRepository';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, ChatRoom, Project, ResearchLab, ResearchGroup, ResearchLabAdmin } from '@/types';
import { toast } from 'sonner';

const Chat = () => {
  const { user: currentUser } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [labAdmins, setLabAdmins] = useState<ResearchLabAdmin[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [deletingMessageIds, setDeletingMessageIds] = useState<number[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New channel modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [createTarget, setCreateTarget] = useState<{
    type: 'LAB' | 'GROUP' | 'PROJECT';
    id: number;
    name: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        // Fetch lab admins separately as it may fail for non-admins (though we updated the backend)
        try {
          const adminsData = await apiRepository.getLabAdmins();
          setLabAdmins(adminsData);
        } catch (adminError) {
          console.warn('Failed to fetch lab admins:', adminError);
          setLabAdmins([]);
        }

        if (roomsData.length > 0) {
          setSelectedRoomId(roomsData[0].id);
          
          // Auto-expand sections that have the selected room or just expand all initially for better UX
          const initialExpanded: Record<string, boolean> = {};
          labsData.forEach(l => initialExpanded[`lab-${l.id}`] = true);
          groupsData.forEach(g => initialExpanded[`group-${g.id}`] = true);
          projectsData.forEach(p => initialExpanded[`project-${p.id}`] = true);
          setExpandedSections(initialExpanded);
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
      if (data?.type === 'message_deleted' && typeof data.id === 'number') {
        setMessages(prev => prev.filter(m => m.id !== data.id));
        return;
      }
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

  const canDeleteMessage = (msg: ChatMessage) => {
    if (!currentUser) return false;
    return currentUser.role === 'ADMIN' || currentUser.id === msg.sender_user_id;
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
      setRooms([...rooms, newRoom]);
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

  const teamRooms = rooms.filter(r => r.type === 'TEAM');
  const projectRoomsMap = rooms.reduce((acc, r) => {
    if (r.project_id) {
      if (!acc[r.project_id]) acc[r.project_id] = [];
      acc[r.project_id].push(r);
    }
    return acc;
  }, {} as Record<number, ChatRoom[]>);

  const labRoomsMap = rooms.reduce((acc, r) => {
    if (r.lab_id) {
      if (!acc[r.lab_id]) acc[r.lab_id] = [];
      acc[r.lab_id].push(r);
    }
    return acc;
  }, {} as Record<number, ChatRoom[]>);

  const groupRoomsMap = rooms.reduce((acc, r) => {
    if (r.group_id) {
      if (!acc[r.group_id]) acc[r.group_id] = [];
      acc[r.group_id].push(r);
    }
    return acc;
  }, {} as Record<number, ChatRoom[]>);

  const labsWithRooms = labs.filter(l => rooms.some(r => r.lab_id === l.id));
  const groupsWithRooms = groups.filter(g => rooms.some(r => r.group_id === g.id));
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

          {/* Lab rooms */}
          {labsWithRooms.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 px-3 mb-2">
                <Beaker className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Research Labs</span>
              </div>
              {labsWithRooms.map(lab => {
                const isExpanded = expandedSections[`lab-${lab.id}`] ?? true;
                return (
                  <Collapsible 
                    key={lab.id} 
                    open={isExpanded} 
                    onOpenChange={() => toggleSection(`lab-${lab.id}`)}
                    className="mb-2"
                  >
                    <div className="flex items-center justify-between px-3 py-1 mb-1 group/header">
                      <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 min-w-0 hover:text-foreground transition-colors text-left">
                        <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        <span className="text-[11px] font-medium text-muted-foreground/80 truncate block">
                          {lab.name}
                        </span>
                      </CollapsibleTrigger>
                      {canManageLab(lab.id) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateTarget({ type: 'LAB', id: lab.id, name: lab.name });
                            setIsCreateModalOpen(true);
                          }}
                          title={`Create lab channel in ${lab.name}`}
                          aria-label={`Create lab channel in ${lab.name}`}
                          className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-muted rounded transition-all ml-1"
                        >
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <CollapsibleContent className="space-y-1">
                      {(labRoomsMap[lab.id] || []).map(room => (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ml-4 w-[calc(100%-1rem)] ${
                            selectedRoomId === room.id
                              ? 'bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Hash className={`h-3.5 w-3.5 shrink-0 ${selectedRoomId === room.id ? 'text-primary' : 'text-muted-foreground/60'}`} />
                          <span className="truncate">{room.name}</span>
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}

          {/* Group rooms */}
          {groupsWithRooms.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 px-3 mb-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Research Groups</span>
              </div>
              {groupsWithRooms.map(group => {
                const isExpanded = expandedSections[`group-${group.id}`] ?? true;
                return (
                  <Collapsible 
                    key={group.id} 
                    open={isExpanded} 
                    onOpenChange={() => toggleSection(`group-${group.id}`)}
                    className="mb-2"
                  >
                    <div className="flex items-center justify-between px-3 py-1 mb-1 group/header">
                      <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 min-w-0 hover:text-foreground transition-colors text-left">
                        <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        <span className="text-[11px] font-medium text-muted-foreground/80 truncate block">
                          {group.name}
                        </span>
                      </CollapsibleTrigger>
                      {canManageGroup(group.id) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateTarget({ type: 'GROUP', id: group.id, name: group.name });
                            setIsCreateModalOpen(true);
                          }}
                          title={`Create group channel in ${group.name}`}
                          aria-label={`Create group channel in ${group.name}`}
                          className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-muted rounded transition-all ml-1"
                        >
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <CollapsibleContent className="space-y-1">
                      {(groupRoomsMap[group.id] || []).map(room => (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ml-4 w-[calc(100%-1rem)] ${
                            selectedRoomId === room.id
                              ? 'bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Hash className={`h-3.5 w-3.5 shrink-0 ${selectedRoomId === room.id ? 'text-primary' : 'text-muted-foreground/60'}`} />
                          <span className="truncate">{room.name}</span>
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
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
                const projectRooms = projectRoomsMap[project.id] || [];
                const isExpanded = expandedSections[`project-${project.id}`] ?? true;
                return (
                  <Collapsible 
                    key={project.id} 
                    open={isExpanded} 
                    onOpenChange={() => toggleSection(`project-${project.id}`)}
                    className="mb-2"
                  >
                    <div className="flex items-center justify-between px-3 py-1 mb-1 group/header">
                      <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 min-w-0 hover:text-foreground transition-colors text-left">
                        <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        <span className="text-[11px] font-medium text-muted-foreground/80 truncate block">
                          {project.title}
                        </span>
                      </CollapsibleTrigger>
                      {canManageProject(project.id) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateTarget({ type: 'PROJECT', id: project.id, name: project.title });
                            setIsCreateModalOpen(true);
                          }}
                          title={`Create project channel in ${project.title}`}
                          aria-label={`Create project channel in ${project.title}`}
                          className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-muted rounded transition-all ml-1"
                        >
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <CollapsibleContent className="space-y-1">
                      {projectRooms.map(room => (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ml-4 w-[calc(100%-1rem)] ${
                            selectedRoomId === room.id
                              ? 'bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Hash className={`h-3.5 w-3.5 shrink-0 ${selectedRoomId === room.id ? 'text-primary' : 'text-muted-foreground/60'}`} />
                          <span className="truncate">{room.name}</span>
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
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
                          const canDelete = canDeleteMessage(msg);
                          const isDeleting = deletingMessageIds.includes(msg.id);

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
                                    {canDelete && (
                                      <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        disabled={isDeleting}
                                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60"
                                        title="Delete message"
                                      >
                                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                      </button>
                                    )}
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

      {/* Create Room Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <span>Create New Channel</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Channel Name
              </label>
              <Input
                placeholder="e.g. documentation, team-chat"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateChannel();
                }}
                className="rounded-xl border-border/60 focus-visible:ring-primary h-11"
              />
              <p className="text-[10px] text-muted-foreground px-1 italic">
                Creating in <span className="text-foreground font-semibold font-mono">#{createTarget?.name}</span>
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateChannel} 
              disabled={!newChannelName.trim() || isCreating}
              className="rounded-xl px-8 shadow-lg shadow-primary/20"
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
