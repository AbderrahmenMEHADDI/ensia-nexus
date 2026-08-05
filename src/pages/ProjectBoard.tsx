import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, Plus, ExternalLink, FileText, GitBranch, Database, Trash2, BookOpen, 
  Search, Users, FlaskConical, Calendar, Shield, Edit, ChevronRight, GripVertical, Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectBoard } from './ProjectBoard/hooks/useProjectBoard';
import { ProjectDialogs } from './ProjectBoard/components/ProjectDialogs';
import { StudentDiscoveryView } from './ProjectBoard/components/StudentDiscoveryView';
import { ResourceDialogs } from './ProjectBoard/components/ResourceDialogs';
import { PublicationDialogs } from './ProjectBoard/components/PublicationDialogs';
import { ProjectStatusBadge } from '@/components/Badges';
import { getProjectStatus } from '@/lib/projectAccess';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const resourceIcons: Record<string, React.ElementType> = {
  INTERNAL_DOC: FileText,
  GIT_REPO: GitBranch,
  DATASET: Database,
  OTHER: ExternalLink,
};

const ProjectBoard = () => {
  const board = useProjectBoard();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'publications'>('projects');
  const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null);
  const [localProjectsList, setLocalProjectsList] = useState<any[] | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    if (board.selectedItem?.type === 'PUBLICATION') {
      setActiveTab('publications');
    } else if (board.selectedItem?.type === 'PROJECT') {
      setActiveTab('projects');
    }
  }, [board.selectedItem?.type, board.selectedItem?.id]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canDrag = board.canManageProjects && searchQuery === '';

  const [draggedPubIndex, setDraggedPubIndex] = useState<number | null>(null);
  const [localPubsList, setLocalPubsList] = useState<any[] | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedProjectIndex(index);
    setLocalProjectsList(filteredProjects);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedProjectIndex === null || draggedProjectIndex === index || !localProjectsList) return;
    
    const reordered = [...localProjectsList];
    const draggedItem = reordered[draggedProjectIndex];
    reordered.splice(draggedProjectIndex, 1);
    reordered.splice(index, 0, draggedItem);
    
    setDraggedProjectIndex(index);
    setLocalProjectsList(reordered);
  };

  const handleDragEnd = async () => {
    if (localProjectsList) {
      await board.handleReorderProjects(localProjectsList);
    }
    setDraggedProjectIndex(null);
    setLocalProjectsList(null);
  };

  const handlePubDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPubIndex(index);
    setLocalPubsList(filteredStandalonePubs);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePubDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPubIndex === null || draggedPubIndex === index || !localPubsList) return;
    
    const reordered = [...localPubsList];
    const draggedItem = reordered[draggedPubIndex];
    reordered.splice(draggedPubIndex, 1);
    reordered.splice(index, 0, draggedItem);
    
    setDraggedPubIndex(index);
    setLocalPubsList(reordered);
  };

  const handlePubDragEnd = async () => {
    if (localPubsList) {
      await board.handleReorderPublications(localPubsList);
    }
    setDraggedPubIndex(null);
    setLocalPubsList(null);
  };

  if (board.loading && board.projects.length === 0) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isMemberOfSelected = board.selectedProjectId ? board.joinedProjectIds.includes(board.selectedProjectId) : false;

  // For students who haven't joined a project, show discovery view
  if (board.isStudent && !isMemberOfSelected) {
    return (
      <StudentDiscoveryView
        publicProjects={board.publicProjects}
        projects={board.allProjects}
        applications={board.applications}
        getGroupById={board.getGroupById}
        getBlockingApplication={board.getBlockingApplication}
        getApplyButtonLabel={board.getApplyButtonLabel}
        handleOpenApply={board.handleOpenApply}
        applyOpen={board.applyOpen}
        setApplyOpen={board.setApplyOpen}
        applyMotivation={board.applyMotivation}
        setApplyMotivation={board.setApplyMotivation}
        applySubmitting={board.applySubmitting}
        handleApplyToProject={board.handleApplyToProject}
      />
    );
  }

  // Filter projects by search query
  const filteredProjects = board.projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const listToRender = localProjectsList || filteredProjects;

  const isIndividualProjectCreator = board.project ? (
    board.user?.role === 'TEACHER' ||
    board.user?.role === 'ADMIN' ||
    (board.project.group_id === null && board.project.created_by === board.user?.id) ||
    (board.project.group_id !== null && board.project.group_id !== undefined && board.group?.leader_user_id === board.user?.id)
  ) : false;

  const displayMembers = board.project?.group_id 
    ? board.groupMembers
        .filter(gm => gm.group_id === board.project?.group_id && gm.is_active)
        .map(gm => ({
          user_id: gm.user_id,
          user_name: gm.user_name || `User ${gm.user_id}`,
        }))
    : board.participants.map(part => {
        const u = board.getUserById(part.user_id);
        return {
          user_id: part.user_id,
          user_name: u?.full_name || 'member',
        };
      });

  // Build the empty-state panel shown when nothing is selected or no items exist
  const hasAnyItems = board.projects.length > 0 || (board.standalonePublications?.length || 0) > 0;

  const emptyDetailPanel = (
    <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md space-y-6"
      >
        {/* Animated illustration */}
        <div className="relative mx-auto w-36 h-36">
          {/* Outer ring pulse */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px dashed rgba(23,60,126,0.12)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
          {/* Inner circle */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#173C7E]/5 to-[#F47A1E]/5 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {hasAnyItems ? (
                <Folder className="h-14 w-14 text-[#173C7E]/25" strokeWidth={1.2} />
              ) : (
                <FlaskConical className="h-14 w-14 text-[#173C7E]/25" strokeWidth={1.2} />
              )}
            </motion.div>
          </div>
          {/* Decorative dots */}
          <motion.div
            className="absolute -top-1 right-4 h-3 w-3 rounded-full bg-[#F47A1E]/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-2 -left-1 h-2 w-2 rounded-full bg-[#173C7E]/15"
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
        </div>

        {/* Text content */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F47A1E]">
            {hasAnyItems ? 'Select an item' : 'Get started'}
          </span>
          <h2 className="text-2xl font-display font-bold text-[#173C7E]">
            {hasAnyItems ? 'No item selected' : 'No projects yet'}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            {hasAnyItems
              ? 'Select a project or publication from the sidebar to view its details, resources, and team members.'
              : 'Create your first project or publication to start managing research, tracking progress, and collaborating with your team.'}
          </p>
        </div>

        {/* Action buttons (only for empty board) */}
        {!hasAnyItems && board.canCreateProjects && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-wrap justify-center gap-3 pt-2"
          >
            <Button
              className="rounded-xl h-11 px-6 font-semibold text-white shadow-md hover:shadow-lg transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #F47A1E, #e56b10)' }}
              onClick={() => board.setProjectFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> New Project
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-11 px-6 font-semibold text-[#173C7E] border-[#173C7E]/20 hover:bg-[#173C7E]/5 transition-all"
              onClick={board.handleOpenCreatePublicationStandalone}
            >
              <BookOpen className="h-4 w-4 mr-2" /> New Publication
            </Button>
          </motion.div>
        )}

        {/* Hint for users with items */}
        {hasAnyItems && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-xs text-slate-400"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Click any item in the sidebar to get started</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  const filteredStandalonePubs = (board.standalonePublications || []).filter(pub =>
    pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pub.abstract || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pub.venue || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const projectsListContent = (
    <div className="space-y-4">
      {/* GitHub-style Tabs Header */}
      <div className="flex items-center border-b border-slate-200 gap-1 pb-1">
        <button
          onClick={() => setActiveTab('projects')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-semibold border-b-2 transition-all relative -mb-[1px]",
            activeTab === 'projects'
              ? "border-[#F47A1E] text-[#173C7E]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          )}
        >
          <Folder className="h-4 w-4" />
          <span>Projects</span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
            activeTab === 'projects'
              ? "bg-[#173C7E]/10 text-[#173C7E]"
              : "bg-slate-100 text-slate-600"
          )}>
            {board.projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('publications')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-semibold border-b-2 transition-all relative -mb-[1px]",
            activeTab === 'publications'
              ? "border-[#F47A1E] text-[#173C7E]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          )}
        >
          <BookOpen className="h-4 w-4" />
          <span>Publications</span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
            activeTab === 'publications'
              ? "bg-[#173C7E]/10 text-[#173C7E]"
              : "bg-slate-100 text-slate-600"
          )}>
            {board.standalonePublications?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'projects' ? (
        <div className="space-y-3">
          {/* Search Projects */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search projects"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border-slate-200 focus:border-[#F47A1E] focus:ring-[#F47A1E]"
            />
          </div>

          {/* New Project Button */}
          {board.canCreateProjects && (
            <Button 
              size="sm" 
              className="w-full rounded-xl h-9 font-semibold text-white hover:brightness-110 transition-all text-xs px-3 shadow-sm" 
              style={{ background: '#F47A1E' }} 
              onClick={() => board.setProjectFormOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Project
            </Button>
          )}

          {/* Projects List */}
          <div className="space-y-2 pt-1">
            {listToRender.map((proj, index) => {
              const isActive = board.selectedItem?.type === 'PROJECT' && proj.id === board.selectedProjectId;
              const isDragging = draggedProjectIndex === index;
              return (
                <div
                  key={`proj-${proj.id}`}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-2 transition-all rounded-xl",
                    isDragging && "opacity-40 border-dashed border-[#F47A1E] scale-95"
                  )}
                >
                  {canDrag && (
                    <div title="Drag to reorder" className="shrink-0 flex items-center">
                      <GripVertical 
                        className="h-4 w-4 text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 transition-colors" 
                      />
                    </div>
                  )}
                  <button
                    onClick={() => board.handleItemSelect({ type: 'PROJECT', id: proj.id })}
                    className={cn(
                      "flex-1 text-left p-3.5 rounded-xl transition-all border flex items-center justify-between group",
                      isActive 
                        ? "bg-slate-50 border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)]" 
                        : "bg-white border-transparent hover:bg-slate-50/50 hover:border-slate-100"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          PROJECT
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 truncate max-w-[120px] block">
                          {proj.group_id ? board.getGroupById(proj.group_id)?.name : "Independent"}
                        </span>
                      </div>
                      <span className={cn(
                        "font-semibold text-sm break-words whitespace-normal block",
                        isActive ? "text-[#173C7E]" : "text-slate-700 group-hover:text-[#173C7E]"
                      )}>
                        {proj.title}
                      </span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-transform ml-2",
                      isActive ? "text-[#173C7E] translate-x-0.5" : "text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5"
                    )} />
                  </button>
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="py-8 text-center text-slate-400 italic text-sm">
                No projects found.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Search Publications */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search publications"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border-slate-200 focus:border-[#F47A1E] focus:ring-[#F47A1E]"
            />
          </div>

          {/* New Publication Button */}
          {board.canCreateProjects && (
            <Button 
              size="sm" 
              variant="outline"
              className="w-full rounded-xl h-9 font-semibold text-[#173C7E] border-[#173C7E]/20 bg-[#173C7E]/5 hover:bg-[#173C7E]/10 transition-all text-xs px-3 shadow-sm" 
              onClick={board.handleOpenCreatePublicationStandalone}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Publication
            </Button>
          )}

          {/* Publications List */}
          <div className="space-y-2 pt-1">
            {(localPubsList || filteredStandalonePubs).map((pub, index) => {
              const isActive = board.selectedItem?.type === 'PUBLICATION' && pub.id === board.selectedItem.id;
              const isDragging = draggedPubIndex === index;
              return (
                <div
                  key={`pub-${pub.id}`}
                  draggable={canDrag}
                  onDragStart={(e) => handlePubDragStart(e, index)}
                  onDragOver={(e) => handlePubDragOver(e, index)}
                  onDragEnd={handlePubDragEnd}
                  className={cn(
                    "flex items-center gap-2 transition-all rounded-xl",
                    isDragging && "opacity-40 border-dashed border-sky-400 scale-95"
                  )}
                >
                  {canDrag && (
                    <div title="Drag to reorder" className="shrink-0 flex items-center">
                      <GripVertical 
                        className="h-4 w-4 text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 transition-colors" 
                      />
                    </div>
                  )}
                  <button
                    onClick={() => board.handleItemSelect({ type: 'PUBLICATION', id: pub.id })}
                    className={cn(
                      "flex-1 text-left p-3.5 rounded-xl transition-all border flex items-center justify-between group",
                      isActive 
                        ? "bg-sky-50/70 border-sky-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)]" 
                        : "bg-white border-transparent hover:bg-slate-50/50 hover:border-slate-100"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                          {pub.project_id ? "PROJECT PUB" : "PUBLICATION"}
                        </span>
                        {pub.project_id ? (
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 truncate max-w-[120px] block">
                            {board.projects.find(p => p.id === pub.project_id)?.title || "Project"}
                          </span>
                        ) : pub.venue ? (
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 truncate max-w-[120px] block">
                            {pub.venue}
                          </span>
                        ) : null}
                      </div>
                      <span className={cn(
                        "font-semibold text-sm break-words whitespace-normal block truncate",
                        isActive ? "text-sky-950" : "text-slate-700 group-hover:text-sky-900"
                      )}>
                        {pub.title}
                      </span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-transform ml-2",
                      isActive ? "text-sky-600 translate-x-0.5" : "text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5"
                    )} />
                  </button>
                </div>
              );
            })}

            {filteredStandalonePubs.length === 0 && (
              <div className="py-8 text-center text-slate-400 italic text-sm">
                No publications found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const projectDetailsContent = !board.project ? null : (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full",
                board.project.visibility === 'PUBLIC' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              )}>
                {board.project.visibility}
              </span>
              {getProjectStatus(board.project) !== 'APPROVED' && (
                <ProjectStatusBadge status={getProjectStatus(board.project)} />
              )}
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full",
                board.project.is_active 
                  ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                  : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
              )}>
                {board.project.is_active ? "ACTIVE" : "COMPLETED"}
              </span>
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full",
                board.project.accepting_collaborators 
                  ? "bg-teal-50 text-teal-700 border border-teal-100" 
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              )}>
                {board.project.accepting_collaborators ? "ACCEPTS COLLABORATION" : "NO COLLABORATION"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-800 leading-tight">
              {board.project.title}
            </h1>
          </div>

          {/* Action Buttons (Edit, Delete, Approve/Reject) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Approve/Reject for Admin/Teachers */}
            {board.canReviewSelectedProject && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-lg h-9 font-semibold bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => board.handleReviewSelectedProject('APPROVED')}
                  disabled={board.projectReviewLoading !== null}
                >
                  {board.projectReviewLoading === 'APPROVED' && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-9 font-semibold text-red-600 border-red-600/20 hover:bg-red-50 hover:text-red-700"
                  onClick={() => board.handleReviewSelectedProject('REJECTED')}
                  disabled={board.projectReviewLoading !== null}
                >
                  {board.projectReviewLoading === 'REJECTED' && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Reject
                </Button>
              </div>
            )}
            
            {/* Edit / Delete for Creator */}
            {board.canManageProjects && isIndividualProjectCreator && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-9 font-semibold text-blue-600 border-blue-600/20 hover:bg-blue-50 hover:text-blue-700"
                  onClick={board.handleOpenEditProject}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-9 font-semibold text-red-600 border-red-600/20 hover:bg-red-50 hover:text-red-700"
                  onClick={() => board.setDeleteProjectConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Metadata Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-50 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#F47A1E]" />
            <div className="text-xs">
              <div className="text-slate-400 font-medium">Research Group</div>
              <div className="font-semibold text-slate-700">
                {board.project.group_id ? (board.group?.name || 'Loading...') : 'Independent'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-[#F47A1E]" />
            <div className="text-xs">
              <div className="text-slate-400 font-medium">Laboratory</div>
              <div className="font-semibold text-slate-700">
                {board.lab?.name?.split('—')[0]?.trim() || 'General'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#F47A1E]" />
            <div className="text-xs">
              <div className="text-slate-400 font-medium">Deadline</div>
              <div className="font-semibold text-slate-700">
                {board.project.deadline ? new Date(board.project.deadline).toLocaleDateString() : 'Open Ended'}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Description</h3>
          <p className="text-sm text-slate-600 leading-relaxed font-sans">
            {board.project.description || 'No description provided.'}
          </p>
        </div>

        {/* Focus Areas */}
        {board.project.focus_areas && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Focus Areas</h3>
            <div className="flex flex-wrap gap-1.5">
              {board.project.focus_areas.split(',').map((area: string, idx: number) => {
                const trimmed = area.trim();
                if (!trimmed) return null;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#173C7E]/5 text-[#173C7E] border border-[#173C7E]/10"
                  >
                    {trimmed}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Publications */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-display font-bold text-slate-800">Project Publications</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#173C7E] border border-blue-100">
                Belongs to this project
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Research publications produced by and attached directly to <strong>{board.project.title}</strong>
            </p>
          </div>
          {board.user?.role !== 'ADMIN' && (!board.isStudent || board.participants.some(p => p.user_id === board.user?.id)) && (
            <Button size="sm" variant="outline" className="rounded-lg h-9 font-semibold text-[#173C7E] border-[#173C7E]/20 hover:bg-[#173C7E]/10" onClick={board.handleOpenCreatePublication}>
              <Plus className="h-4 w-4 mr-1" /> Add Publication
            </Button>
          )}
        </div>
        
        {board.publications.filter(p => p.project_id === board.project.id).length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {board.publications.filter(p => p.project_id === board.project.id).map(pub => {
              return (
                <div key={pub.id} className="relative group p-4 rounded-xl border border-slate-100 bg-white hover:border-[#F47A1E]/30 transition-colors shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                      <BookOpen className="h-2.5 w-2.5" /> Project Publication
                    </span>
                  </div>
                  <a
                    href={pub.paper_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 pr-14 block h-full w-full"
                  >
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-[#2E9FDA]">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-700 block truncate" title={pub.title}>{pub.title}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8] truncate block mt-0.5">
                        {[pub.venue, pub.publication_date ? new Date(pub.publication_date).getFullYear() : null].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#2E9FDA]" />
                  </a>
                  
                  {board.canManageProjects && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); board.handleOpenEditPublication(pub); }}
                        className="p-1.5 bg-blue-500/5 text-blue-600 rounded-md hover:bg-[#173C7E] hover:text-white transition-colors"
                        title="Edit publication"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); board.handleDeletePublication(pub.id); }}
                        className="p-1.5 bg-destructive/5 text-destructive rounded-md hover:bg-destructive hover:text-white transition-colors"
                        title="Delete publication"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No project publications added yet.</p>
        )}
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-display font-bold text-slate-800">Team Members</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayMembers.map(member => (
            <div key={member.user_id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 bg-slate-50/20">
              <ProfileAvatar
                userId={member.user_id}
                name={member.user_name}
                className="h-10 w-10 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-700 truncate" title={member.user_name}>
                  {member.user_name}
                </div>
              </div>
            </div>
          ))}
          {displayMembers.length === 0 && (
            <div className="col-span-full py-4 text-center text-slate-400 italic text-sm">
              No members found.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const publicationDetailsContent = board.selectedPublication ? (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {board.selectedPublication.project_id ? "PROJECT PUBLICATION" : "INDEPENDENT PUBLICATION"}
              </span>
              {board.selectedPublication.venue && (
                <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {board.selectedPublication.venue}
                </span>
              )}
              {board.selectedPublication.publication_date && (
                <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {new Date(board.selectedPublication.publication_date).getFullYear()}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-800 leading-tight">
              {board.selectedPublication.title}
            </h1>
          </div>

          {board.canManageProjects && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg h-9 font-semibold text-blue-600 border-blue-600/20 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => board.handleOpenEditPublication(board.selectedPublication!)}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg h-9 font-semibold text-red-600 border-red-600/20 hover:bg-red-50 hover:text-red-700"
                onClick={() => board.handleDeletePublication(board.selectedPublication!.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>

        {board.selectedPublication.abstract && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Abstract</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-sans italic bg-slate-50/80 p-4 rounded-xl border-l-4 border-l-sky-500">
              "{board.selectedPublication.abstract}"
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
          {board.selectedPublication.paper_url && (
            <a
              href={board.selectedPublication.paper_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173C7E] text-white text-xs font-semibold hover:bg-[#173C7E]/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Open Full Paper
            </a>
          )}
          {board.selectedPublication.doi && (
            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              DOI: {board.selectedPublication.doi}
            </span>
          )}
        </div>

        {board.selectedPublication.authors && board.selectedPublication.authors.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Authors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {board.selectedPublication.authors.map((auth: any) => {
                const u = board.getUserById(auth.user_id);
                const name = u?.full_name || auth.user?.full_name || `Author ${auth.user_id}`;
                return (
                  <div key={auth.user_id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <ProfileAvatar userId={auth.user_id} name={name} className="h-8 w-8 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-700 truncate">{name}</div>
                      {auth.is_corresponding && (
                        <span className="text-[10px] text-purple-600 font-bold">Corresponding Author</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  const mainPanelContent = board.selectedItem?.type === 'PUBLICATION'
    ? (publicationDetailsContent || emptyDetailPanel)
    : (board.project ? projectDetailsContent : emptyDetailPanel);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 pt-2 pb-3 px-4 md:px-6">
      {isDesktop ? (
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-115px)] rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white">
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <div className="h-full overflow-y-auto p-5">
              {projectsListContent}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-slate-100 hover:bg-slate-200 transition-colors" />
          <ResizablePanel defaultSize={65}>
            <div className="h-full overflow-y-auto p-6 md:p-8">
              {mainPanelContent}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Projects & Publications List */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
            {projectsListContent}
          </div>

          {/* Right Main Panel: Details */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-y-auto max-h-[calc(100vh-120px)]">
            {mainPanelContent}
          </div>
        </div>
      )}

      <ProjectDialogs
        projectFormOpen={board.projectFormOpen}
        setProjectFormOpen={board.setProjectFormOpen}
        formProjectTitle={board.formProjectTitle}
        setFormProjectTitle={board.setFormProjectTitle}
        formProjectDescription={board.formProjectDescription}
        setFormProjectDescription={board.setFormProjectDescription}
        formFocusAreas={board.formFocusAreas}
        setFormFocusAreas={board.setFormFocusAreas}
        formGroupId={board.formGroupId}
        setFormGroupId={board.setFormGroupId}
        formVisibility={board.formVisibility}
        setFormVisibility={board.setFormVisibility}
        formAcceptingCollaborators={board.formAcceptingCollaborators}
        setFormAcceptingCollaborators={board.setFormAcceptingCollaborators}
        formDeadline={board.formDeadline}
        setFormDeadline={board.setFormDeadline}
        formCreateProjectLoading={board.formCreateProjectLoading}
        handleCreateProjectFromForm={board.handleCreateProjectFromForm}
        validatedGroups={board.validatedGroups}
        isIndependent={board.project?.group_id === null || board.project?.group_id === undefined}
        leaderGroups={board.leaderGroups}
        editProjectGroupId={board.editProjectGroupId}
        setEditProjectGroupId={board.setEditProjectGroupId}
        currentGroupName={board.group?.name}
        memberFormOpen={board.memberFormOpen}
        setMemberFormOpen={board.setMemberFormOpen}
        formMemberProjectId={board.formMemberProjectId}
        setFormMemberProjectId={board.setFormMemberProjectId}
        formMemberUserId={board.formMemberUserId}
        setFormMemberUserId={board.setFormMemberUserId}
        formMemberRole={board.formMemberRole}
        setFormMemberRole={board.setFormMemberRole}
        formAddMemberLoading={board.formAddMemberLoading}
        handleAddMemberFromForm={board.handleAddMemberFromForm}
        projects={board.projects}
        availableMemberOptions={board.availableMemberOptions}
        editProjectOpen={board.editProjectOpen}
        setEditProjectOpen={board.setEditProjectOpen}
        editProjectTitle={board.editProjectTitle}
        setEditProjectTitle={board.setEditProjectTitle}
        editProjectDescription={board.editProjectDescription}
        setEditProjectDescription={board.setEditProjectDescription}
        editProjectFocusAreas={board.editProjectFocusAreas}
        setEditProjectFocusAreas={board.setEditProjectFocusAreas}
        editProjectVisibility={board.editProjectVisibility}
        setEditProjectVisibility={board.setEditProjectVisibility}
        editProjectAcceptingCollaborators={board.editProjectAcceptingCollaborators}
        setEditProjectAcceptingCollaborators={board.setEditProjectAcceptingCollaborators}
        editProjectDeadline={board.editProjectDeadline}
        setEditProjectDeadline={board.setEditProjectDeadline}
        editProjectLoading={board.editProjectLoading}
        handleUpdateProject={board.handleUpdateProject}
        deleteProjectConfirmOpen={board.deleteProjectConfirmOpen}
        setDeleteProjectConfirmOpen={board.setDeleteProjectConfirmOpen}
        deleteProjectLoading={board.deleteProjectLoading}
        handleDeleteProject={board.handleDeleteProject}
        formProjectIsActive={board.formProjectIsActive}
        setFormProjectIsActive={board.setFormProjectIsActive}
        editProjectIsActive={board.editProjectIsActive}
        setEditProjectIsActive={board.setEditProjectIsActive}
      />



      <PublicationDialogs
        publicationFormOpen={board.publicationFormOpen}
        setPublicationFormOpen={board.setPublicationFormOpen}
        formPubProjectId={board.formPubProjectId}
        setFormPubProjectId={board.setFormPubProjectId}
        projects={board.projects}
        newPubTitle={board.newPubTitle}
        setNewPubTitle={board.setNewPubTitle}
        newPubAbstract={board.newPubAbstract}
        setNewPubAbstract={board.setNewPubAbstract}
        newPubDate={board.newPubDate}
        setNewPubDate={board.setNewPubDate}
        newPubVenue={board.newPubVenue}
        setNewPubVenue={board.setNewPubVenue}
        newPubDoi={board.newPubDoi}
        setNewPubDoi={board.setNewPubDoi}
        newPubUrl={board.newPubUrl}
        setNewPubUrl={board.setNewPubUrl}
        newPubAuthors={board.newPubAuthors}
        setNewPubAuthors={board.setNewPubAuthors}
        createPubLoading={board.createPubLoading}
        handleCreatePublication={board.handleCreatePublication}
        participants={board.participants}
        getUserById={board.getUserById}
        authorOptions={board.availableMemberOptions}
        editingPublicationId={board.editingPublicationId}
      />

      {board.isStudent && board.publicProjects.length > 0 && (
        <div className="mt-16 pt-10 border-t border-border/50">
          <StudentDiscoveryView
            publicProjects={board.publicProjects}
            projects={board.allProjects}
            applications={board.applications}
            getGroupById={board.getGroupById}
            getBlockingApplication={board.getBlockingApplication}
            getApplyButtonLabel={board.getApplyButtonLabel}
            handleOpenApply={board.handleOpenApply}
            applyOpen={board.applyOpen}
            setApplyOpen={board.setApplyOpen}
            applyMotivation={board.applyMotivation}
            setApplyMotivation={board.setApplyMotivation}
            applySubmitting={board.applySubmitting}
            handleApplyToProject={board.handleApplyToProject}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;
