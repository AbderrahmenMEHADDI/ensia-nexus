import { motion } from 'framer-motion';
import { Loader2, Plus, ExternalLink, FileText, GitBranch, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectBoard } from './ProjectBoard/hooks/useProjectBoard';
import { ProjectBoardHeader } from './ProjectBoard/components/ProjectBoardHeader';
import { KanbanBoard } from './ProjectBoard/components/KanbanBoard';
import { TaskDialogs } from './ProjectBoard/components/TaskDialogs';
import { ProjectDialogs } from './ProjectBoard/components/ProjectDialogs';
import { StudentDiscoveryView } from './ProjectBoard/components/StudentDiscoveryView';
import type { TaskStatus } from '@/types';

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'bg-status-todo' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-status-in-progress' },
  { status: 'BLOCKED', label: 'Blocked', color: 'bg-status-blocked' },
  { status: 'DONE', label: 'Done', color: 'bg-status-done' },
];

const resourceIcons: Record<string, React.ElementType> = {
  PAPER_DOC: FileText,
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

  const acceptedProjectIds = board.applications
    .filter(a => a.status === 'ACCEPTED')
    .map(a => a.project_id);
  const isMemberOfSelected = board.selectedProjectId ? acceptedProjectIds.includes(board.selectedProjectId) : false;

  if (board.isStudent && !isMemberOfSelected) {
    return (
      <StudentDiscoveryView
        publicProjects={board.publicProjects}
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
          <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Projects</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2">No projects yet</h1>
            <p className="text-sm text-muted-foreground mt-3">
              Create the first project for your validated group to start managing tasks and members.
            </p>
            {board.canCreateProjects && (
              <div className="mt-6 flex justify-center gap-2">
                <Button onClick={() => board.setProjectFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Project Details Form
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
          formCreateProjectLoading={board.formCreateProjectLoading}
          handleCreateProjectFromForm={board.handleCreateProjectFromForm}
          validatedGroups={board.validatedGroups}
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
          canParticipate={!board.isStudent || board.participants.some(p => p.user_id === board.user?.id)}
          onAddTask={(status) => { board.setCreateStatus(status); board.setCreateOpen(true); }}
          getUserById={board.getUserById}
        />

        {/* Resources */}
        {board.resources.length > 0 && (
          <div>
            <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Resources</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {board.resources.map(res => {
                const Icon = resourceIcons[res.resource_type] || ExternalLink;
                const creator = board.getUserById(res.created_by);
                return (
                  <a
                    key={res.id}
                    href={res.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">{res.title}</span>
                      <span className="text-xs font-mono text-muted-foreground">{res.resource_type.replace('_', ' ')} · {creator?.full_name}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
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
        statusColumns={statusColumns}
        participants={board.participants}
        getUserById={board.getUserById}
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
        formCreateProjectLoading={board.formCreateProjectLoading}
        handleCreateProjectFromForm={board.handleCreateProjectFromForm}
        validatedGroups={board.validatedGroups}
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
      />
    </div>
  );
};

export default ProjectBoard;
