import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, Plus, ExternalLink, FileText, GitBranch, Database, Trash2, BookOpen, 
  Search, Users, FlaskConical, Calendar, Shield, Edit, ChevronRight, GripVertical
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
  const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null);
  const [localProjectsList, setLocalProjectsList] = useState<any[] | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canDrag = board.canManageProjects && searchQuery === '';

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
    (board.project.group_id === null && board.project.created_by === board.user?.id && board.user?.role === 'TEACHER') ||
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

  // Empty state if no projects are available
  if (!board.project) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F47A1E' }}>Projects</span>
            <h1 className="text-3xl md:text-4xl font-display font-bold mt-2" style={{ color: '#173C7E' }}>No projects yet</h1>
            <p className="text-sm text-slate-500 mt-3">
              Create the first project for your validated group to start managing details, resources, and publications.
            </p>
            {board.canCreateProjects && (
              <div className="mt-6 flex justify-center gap-2">
                <Button className="rounded-lg h-11 px-6 font-semibold text-white" style={{ background: '#F47A1E' }} onClick={() => board.setProjectFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Project Details Form
                </Button>
              </div>
            )}
          </div>
        </motion.div>

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
          isIndependent={true}
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
        />
      </div>
    );
  }

  const projectsListContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-slate-800">Projects</h2>
        {board.canCreateProjects && (
          <Button 
            size="sm" 
            className="rounded-lg h-9 font-semibold text-white hover:brightness-110 transition-all" 
            style={{ background: '#F47A1E' }} 
            onClick={() => board.setProjectFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        )}
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 rounded-xl border-slate-200 focus:border-[#F47A1E] focus:ring-[#F47A1E]"
        />
      </div>
      
      <div className="space-y-2 mt-4">
        {listToRender.map((proj, index) => {
          const isActive = proj.id === board.selectedProjectId;
          const isDragging = draggedProjectIndex === index;
          return (
            <div
              key={proj.id}
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
                onClick={() => board.handleProjectChange(String(proj.id))}
                className={cn(
                  "flex-1 text-left p-4 rounded-xl transition-all border flex items-center justify-between group",
                  isActive 
                    ? "bg-slate-50 border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)]" 
                    : "bg-white border-transparent hover:bg-slate-50/50 hover:border-slate-100"
                )}
              >
                <div className="min-w-0 flex-1">
                  <span className={cn(
                    "font-semibold text-sm truncate block",
                    isActive ? "text-[#173C7E]" : "text-slate-700 group-hover:text-[#173C7E]"
                  )}>
                    {proj.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 truncate max-w-[120px] block">
                      {proj.group_id ? board.getGroupById(proj.group_id)?.name : "Independent"}
                    </span>
                    <span style={{ width: 3, height: 3 }} className="rounded-full bg-slate-300 shrink-0" />
                    <span className={cn(
                      "text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded-md shrink-0",
                      proj.is_active 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    )}>
                      {proj.is_active ? "Active" : "Completed"}
                    </span>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
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
  );

  const projectDetailsContent = (
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

      {/* Resources */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-slate-800">Resources</h2>
          {board.user?.role !== 'ADMIN' && (!board.isStudent || board.participants.some(p => p.user_id === board.user?.id)) && (
            <Button size="sm" variant="outline" className="rounded-lg h-9 font-semibold text-[#173C7E] border-[#173C7E]/20 hover:bg-[#173C7E]/10" onClick={() => board.setResourceFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Resource
            </Button>
          )}
        </div>
        
        {board.resources.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {board.resources.map(res => {
              const Icon = resourceIcons[res.resource_type] || ExternalLink;
              const creator = board.getUserById(res.created_by || NaN);
              return (
                <div key={res.id} className="relative group p-4 rounded-xl border border-slate-100 bg-white hover:border-[#F47A1E]/30 transition-colors shadow-sm">
                  <a
                    href={res.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 pr-6 block h-full w-full"
                  >
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-[#F47A1E]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-700 block truncate" title={res.title}>{res.title}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8] truncate block mt-0.5">
                        {res.resource_type.replace('_', ' ')} · {creator?.full_name || 'System'}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#F47A1E]" />
                  </a>
                  
                  {(board.canManageProjects || board.user?.id === res.created_by) && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); board.handleDeleteResource(res.id); }}
                      className="absolute top-2 right-2 p-1.5 bg-destructive/5 text-destructive rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground focus:opacity-100"
                      title="Delete resource"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No resources added yet.</p>
        )}
      </div>

      {/* Publications */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-slate-800">Publications</h2>
          {board.user?.role !== 'ADMIN' && (!board.isStudent || board.participants.some(p => p.user_id === board.user?.id)) && (
            <Button size="sm" variant="outline" className="rounded-lg h-9 font-semibold text-[#173C7E] border-[#173C7E]/20 hover:bg-[#173C7E]/10" onClick={() => board.setPublicationFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Publication
            </Button>
          )}
        </div>
        
        {board.publications.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {board.publications.map(pub => {
              return (
                <div key={pub.id} className="relative group p-4 rounded-xl border border-slate-100 bg-white hover:border-[#F47A1E]/30 transition-colors shadow-sm">
                  <a
                    href={pub.paper_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 pr-6 block h-full w-full"
                  >
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-[#2E9FDA]">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-700 block truncate" title={pub.title}>{pub.title}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8] truncate block mt-0.5">
                        {pub.venue || 'Journal'} · {pub.publication_date ? new Date(pub.publication_date).getFullYear() : 'N/A'}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#2E9FDA]" />
                  </a>
                  
                  {board.canManageProjects && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); board.handleDeletePublication(pub.id); }}
                      className="absolute top-2 right-2 p-1.5 bg-destructive/5 text-destructive rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground focus:opacity-100"
                      title="Delete publication"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No publications added yet.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6">
      {isDesktop ? (
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-160px)] rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white">
          <ResizablePanel defaultSize={40} minSize={25} maxSize={55} className="p-5 overflow-y-auto h-full">
            {projectsListContent}
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-slate-100 hover:bg-slate-200 transition-colors" />
          <ResizablePanel defaultSize={60} className="p-6 md:p-8 overflow-y-auto h-full">
            {projectDetailsContent}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Projects List */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 h-fit max-h-[calc(100vh-140px)] overflow-y-auto">
            {projectsListContent}
          </div>

          {/* Right Main Panel: Selected Project Details */}
          <div className="lg:col-span-8">
            {projectDetailsContent}
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

      <ResourceDialogs
        resourceFormOpen={board.resourceFormOpen}
        setResourceFormOpen={board.setResourceFormOpen}
        newResourceTitle={board.newResourceTitle}
        setNewResourceTitle={board.setNewResourceTitle}
        newResourceType={board.newResourceType}
        setNewResourceType={board.setNewResourceType}
        newResourceUrl={board.newResourceUrl}
        setNewResourceUrl={board.setNewResourceUrl}
        createResourceLoading={board.createResourceLoading}
        handleCreateResource={board.handleCreateResource}
      />

      <PublicationDialogs
        publicationFormOpen={board.publicationFormOpen}
        setPublicationFormOpen={board.setPublicationFormOpen}
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
