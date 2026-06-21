import { motion } from 'framer-motion';
import { Loader2, Plus, ExternalLink, FileText, GitBranch, Database, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectBoard } from './ProjectBoard/hooks/useProjectBoard';
import { ProjectBoardHeader } from './ProjectBoard/components/ProjectBoardHeader';
import { KanbanBoard } from './ProjectBoard/components/KanbanBoard';
import { TaskDialogs } from './ProjectBoard/components/TaskDialogs';
import { ProjectDialogs } from './ProjectBoard/components/ProjectDialogs';
import { StudentDiscoveryView } from './ProjectBoard/components/StudentDiscoveryView';
import { ResourceDialogs } from './ProjectBoard/components/ResourceDialogs';
import type { TaskStatus } from '@/types';

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'bg-status-todo' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-status-in-progress' },
  { status: 'BLOCKED', label: 'Blocked', color: 'bg-status-blocked' },
  { status: 'DONE', label: 'Done', color: 'bg-status-done' },
];

const resourceIcons: Record<string, React.ElementType> = {
  INTERNAL_DOC: FileText,
  GIT_REPO: GitBranch,
  DATASET: Database,
  OTHER: ExternalLink,
};

const ProjectBoard = () => {
  const board = useProjectBoard();

  if (board.loading && board.projects.length === 0) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isMemberOfSelected = board.selectedProjectId ? board.joinedProjectIds.includes(board.selectedProjectId) : false;

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

  if (!board.project) {
    return (
      <div className="container py-10">
        <motion.div >
          <div className="max-w-2xl mx-auto rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F37F20' }}>Projects</span>
            <h1 className="text-3xl md:text-4xl font-display font-bold mt-2" style={{ color: '#074a75' }}>No projects yet</h1>
            <p className="text-sm text-slate-500 mt-3">
              Create the first project for your validated group to start managing tasks and members.
            </p>
            {board.canCreateProjects && (
              <div className="mt-6 flex justify-center gap-2">
                <Button className="rounded-lg h-11 px-6 font-semibold" style={{ background: '#F37F20', color: '#fff' }} onClick={() => board.setProjectFormOpen(true)}>
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

  return (
    <div className="container py-10">
      <motion.div >
        <ProjectBoardHeader
          project={board.project}
          projects={board.projects}
          selectedProjectId={board.selectedProjectId}
          handleProjectChange={board.handleProjectChange}
          canManageProjects={board.canManageProjects}
          canCreateProjects={board.canCreateProjects}
          setProjectFormOpen={board.setProjectFormOpen}
          setMemberFormOpen={board.setMemberFormOpen}
          canReviewSelectedProject={board.canReviewSelectedProject}
          handleReviewSelectedProject={board.handleReviewSelectedProject}
          projectReviewLoading={board.projectReviewLoading}
          participants={board.participants}
          getUserById={board.getUserById}
          labName={board.lab?.name.split('—')[0]?.trim()}
          groupName={board.group?.name}
          isIndividualProjectCreator={
            (board.project?.group_id === null && board.project?.created_by === board.user?.id && board.user?.role === 'TEACHER') ||
            (board.project?.group_id !== null && board.project?.group_id !== undefined && board.group?.leader_user_id === board.user?.id)
          }
          handleOpenEditProject={board.handleOpenEditProject}
          setDeleteProjectConfirmOpen={board.setDeleteProjectConfirmOpen}
        />

        <KanbanBoard
          statusColumns={statusColumns}
          localTasks={board.localTasks}
          selectedProjectId={board.selectedProjectId}
          draggedTaskId={board.draggedTaskId}
          dragOverColumn={board.dragOverColumn}
          handleDragStart={board.handleDragStart}
          handleDragEnd={board.handleDragEnd}
          handleDragOver={board.handleDragOver}
          handleDragLeave={board.handleDragLeave}
          handleDrop={board.handleDrop}
          handleOpenEdit={board.handleOpenEdit}
          canParticipate={board.user?.role !== 'ADMIN' && (!board.isStudent || board.participants.some(p => p.user_id === board.user?.id))}
          onAddTask={(status) => { board.setCreateStatus(status); board.setCreateOpen(true); }}
          getUserById={board.getUserById}
        />

        {/* Resources */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold" style={{ color: '#074a75' }}>Resources</h2>
            {board.user?.role !== 'ADMIN' && (!board.isStudent || board.participants.some(p => p.user_id === board.user?.id)) && (
              <Button size="sm" variant="outline" className="rounded-lg h-9 font-semibold text-[#074a75] border-[#074a75]/20 hover:bg-[#074a75] hover:text-white" onClick={() => board.setResourceFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Resource
              </Button>
            )}
          </div>
          
          {board.resources.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {board.resources.map(res => {
                const Icon = resourceIcons[res.resource_type] || ExternalLink;
                const creator = board.getUserById(res.created_by || NaN);
                return (
                  <div key={res.id} className="relative group p-4 rounded-2xl border border-slate-100 bg-white hover:border-[#F37F20]/30 transition-colors shadow-sm">
                    <a
                      href={res.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 pr-6 block h-full w-full"
                    >
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F37F20', color: '#fff' }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-[#0F172A] block truncate" title={res.title}>{res.title}</span>
                        <span className="text-xs uppercase font-bold tracking-widest text-[#94A3B8] truncate block mt-1">{res.resource_type.replace('_', ' ')} · {creator?.full_name || 'System'}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#F37F20' }} />
                    </a>
                    
                    {(board.canManageProjects || board.user?.id === res.created_by) && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); board.handleDeleteResource(res.id); }}
                        className="absolute top-2 right-2 p-1.5 bg-destructive/10 text-destructive rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground focus:opacity-100"
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
            <p className="text-sm text-muted-foreground italic">No resources added yet.</p>
          )}
        </div>
      </motion.div>

      <TaskDialogs
        createOpen={board.createOpen}
        setCreateOpen={board.setCreateOpen}
        createStatus={board.createStatus}
        setCreateStatus={board.setCreateStatus}
        newTitle={board.newTitle}
        setNewTitle={board.setNewTitle}
        newDesc={board.newDesc}
        setNewDesc={board.setNewDesc}
        newPriority={board.newPriority}
        setNewPriority={board.setNewPriority}
        newAssigneeUserId={board.newAssigneeUserId}
        setNewAssigneeUserId={board.setNewAssigneeUserId}
        createLoading={board.createLoading}
        handleCreateTask={board.handleCreateTask}
        editOpen={board.editOpen}
        setEditOpen={board.setEditOpen}
        editTaskId={board.editingTaskId || undefined}
        editTitle={board.editTitle}
        setEditTitle={board.setEditTitle}
        editDesc={board.editDesc}
        setEditDesc={board.setEditDesc}
        editStatus={board.editStatus}
        setEditStatus={board.setEditStatus}
        editPriority={board.editPriority}
        setEditPriority={board.setEditPriority}
        editAssigneeUserId={board.editAssigneeUserId}
        setEditAssigneeUserId={board.setEditAssigneeUserId}
        editLoading={board.editLoading}
        handleUpdateTask={board.handleUpdateTask}
        handleDeleteTask={board.handleDeleteTask}
        statusColumns={statusColumns}
        participants={board.participants}
        getUserById={board.getUserById}
        isReadOnly={board.user?.role === 'ADMIN'}
      />

      <ProjectDialogs
        projectFormOpen={board.projectFormOpen}
        setProjectFormOpen={board.setProjectFormOpen}
        formProjectTitle={board.formProjectTitle}
        setFormProjectTitle={board.setFormProjectTitle}
        formProjectDescription={board.formProjectDescription}
        setFormProjectDescription={board.setFormProjectDescription}
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
