import { useState } from 'react';
import { Hash, Users, FolderOpen, Beaker, Layers, ChevronRight, Plus, Search } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import type { ChatRoom, Project, ResearchLab, ResearchGroup } from '@/types';
import { motion } from 'framer-motion';
interface ChatSidebarProps {
  rooms: ChatRoom[];
  projects: Project[];
  labs: ResearchLab[];
  groups: ResearchGroup[];
  selectedRoomId: number | null;
  onRoomSelect: (id: number) => void;
  onCreateChannel: (target: { type: 'LAB' | 'GROUP' | 'PROJECT'; id: number; name: string }) => void;
  canManageLab: (labId: number) => boolean;
  canManageGroup: (groupId: number) => boolean;
  canManageProject: (projectId: number) => boolean;
}

const ChatSidebar = ({
  rooms,
  projects,
  labs,
  groups,
  selectedRoomId,
  onRoomSelect,
  onCreateChannel,
  canManageLab,
  canManageGroup,
  canManageProject,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const teamRooms = filteredRooms.filter(r => r.type === 'TEAM');

  const labsWithRooms = labs.filter(l => filteredRooms.some(r => r.lab_id === l.id));
  const groupsWithRooms = groups.filter(g => filteredRooms.some(r => r.group_id === g.id));
  const projectsWithRooms = projects.filter(p => filteredRooms.some(r => r.project_id === p.id));

  const labRoomsMap = filteredRooms.reduce((acc, r) => {
    if (r.lab_id) {
      if (!acc[r.lab_id]) acc[r.lab_id] = [];
      acc[r.lab_id].push(r);
    }
    return acc;
  }, {} as Record<number, ChatRoom[]>);

  const groupRoomsMap = filteredRooms.reduce((acc, r) => {
    if (r.group_id) {
      if (!acc[r.group_id]) acc[r.group_id] = [];
      acc[r.group_id].push(r);
    }
    return acc;
  }, {} as Record<number, ChatRoom[]>);

  const projectRoomsMap = filteredRooms.reduce((acc, r) => {
    if (r.project_id) {
      if (!acc[r.project_id]) acc[r.project_id] = [];
      acc[r.project_id].push(r);
    }
    return acc;
  }, {} as Record<number, ChatRoom[]>);

  const renderRoomButton = (room: ChatRoom, depth: number = 0) => (
    <button
      key={room.id}
      onClick={() => onRoomSelect(room.id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-300 relative group/room ${selectedRoomId === room.id
        ? 'bg-primary/10 text-primary font-bold shadow-[0_0_15px_-5px_rgba(var(--primary),0.3)] ring-1 ring-primary/20'
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1'
        }`}
    >
      {selectedRoomId === room.id && (
        <motion.div
          layoutId="activeRoom"
          className="absolute left-0 w-1 h-4 bg-primary rounded-r-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <Hash className={`h-4 w-4 shrink-0 transition-all duration-300 ${selectedRoomId === room.id ? 'text-primary scale-110' : 'text-muted-foreground/40 group-hover/room:text-muted-foreground/80'
        }`} />
      <span className="truncate tracking-tight">{room.name}</span>
    </button>
  );

  return (
    <div className="w-72 border-r border-border/40 bg-card/5 flex flex-col shrink-0 backdrop-blur-3xl relative z-10">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em]">Channels</h2>
          <div className="h-1 w-1 rounded-full bg-primary/40 animate-pulse" />
        </div>
        <div className="relative group/search">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-xl blur opacity-0 group-focus-within/search:opacity-100 transition duration-500" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 group-focus-within/search:text-primary transition-colors" />
            <Input
              placeholder="Jump to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 text-xs rounded-xl bg-muted/20 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-muted/40 transition-all font-medium placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 pb-8 scrollbar-premium">
        <div className="space-y-8">
          {/* Team rooms */}
          {teamRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 mb-3">
                <div className="h-4 w-4 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-3 w-3 text-blue-500" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">Global</span>
              </div>
              <div className="space-y-1">
                {teamRooms.map(room => renderRoomButton(room))}
              </div>
            </div>
          )}

          {/* Lab rooms */}
          {labsWithRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 mb-2.5">
                <Beaker className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Research Labs</span>
              </div>
              <div className="space-y-1">
                {labsWithRooms.map(lab => {
                  const isExpanded = expandedSections[`lab-${lab.id}`] ?? true;
                  return (
                    <Collapsible key={lab.id} open={isExpanded} onOpenChange={() => toggleSection(`lab-${lab.id}`)} className="group/section">
                      <div className="flex items-center justify-between px-2 py-1 mb-0.5 group/header rounded-lg hover:bg-muted/30 transition-colors">
                        <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 transition-colors text-left py-1">
                          <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-300 text-muted-foreground/60 ${isExpanded ? 'rotate-90' : ''}`} />
                          <span className="text-[11px] font-bold text-muted-foreground/90 truncate block tracking-tight group-hover/section:text-foreground transition-colors">
                            {lab.name}
                          </span>
                        </CollapsibleTrigger>
                        {canManageLab(lab.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateChannel({ type: 'LAB', id: lab.id, name: lab.name });
                            }}
                            className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-all text-muted-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <CollapsibleContent className="space-y-0.5 pl-3 border-l border-border/40 ml-3.5 mb-1 mt-0.5">
                        {labRoomsMap[lab.id]?.map(room => renderRoomButton(room))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group rooms */}
          {groupsWithRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 mb-2.5">
                <Layers className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Research Groups</span>
              </div>
              <div className="space-y-1">
                {groupsWithRooms.map(group => {
                  const isExpanded = expandedSections[`group-${group.id}`] ?? true;
                  return (
                    <Collapsible key={group.id} open={isExpanded} onOpenChange={() => toggleSection(`group-${group.id}`)} className="group/section">
                      <div className="flex items-center justify-between px-2 py-1 mb-0.5 group/header rounded-lg hover:bg-muted/30 transition-colors">
                        <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 transition-colors text-left py-1">
                          <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-300 text-muted-foreground/60 ${isExpanded ? 'rotate-90' : ''}`} />
                          <span className="text-[11px] font-bold text-muted-foreground/90 truncate block tracking-tight group-hover/section:text-foreground transition-colors">
                            {group.name}
                          </span>
                        </CollapsibleTrigger>
                        {canManageGroup(group.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateChannel({ type: 'GROUP', id: group.id, name: group.name });
                            }}
                            className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-all text-muted-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <CollapsibleContent className="space-y-0.5 pl-3 border-l border-border/40 ml-3.5 mb-1 mt-0.5">
                        {groupRoomsMap[group.id]?.map(room => renderRoomButton(room))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project rooms */}
          {projectsWithRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 mb-2.5">
                <FolderOpen className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Projects</span>
              </div>
              <div className="space-y-1">
                {projectsWithRooms.map(project => {
                  const isExpanded = expandedSections[`project-${project.id}`] ?? true;
                  return (
                    <Collapsible key={project.id} open={isExpanded} onOpenChange={() => toggleSection(`project-${project.id}`)} className="group/section">
                      <div className="flex items-center justify-between px-2 py-1 mb-0.5 group/header rounded-lg hover:bg-muted/30 transition-colors">
                        <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 transition-colors text-left py-1">
                          <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-300 text-muted-foreground/60 ${isExpanded ? 'rotate-90' : ''}`} />
                          <span className="text-[11px] font-bold text-muted-foreground/90 truncate block tracking-tight group-hover/section:text-foreground transition-colors">
                            {project.title}
                          </span>
                        </CollapsibleTrigger>
                        {canManageProject(project.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateChannel({ type: 'PROJECT', id: project.id, name: project.title });
                            }}
                            className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-all text-muted-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <CollapsibleContent className="space-y-0.5 pl-3 border-l border-border/40 ml-3.5 mb-1 mt-0.5">
                        {projectRoomsMap[project.id]?.map(room => renderRoomButton(room))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}

          {filteredRooms.length === 0 && (
            <div className="px-3 py-10 text-center space-y-2 opacity-60">
              <Hash className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">No channels found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
