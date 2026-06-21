import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ResourceDialogsProps {
  resourceFormOpen: boolean;
  setResourceFormOpen: (open: boolean) => void;
  newResourceTitle: string;
  setNewResourceTitle: (val: string) => void;
  newResourceType: string;
  setNewResourceType: (val: string) => void;
  newResourceUrl: string;
  setNewResourceUrl: (val: string) => void;
  createResourceLoading: boolean;
  handleCreateResource: () => void;
}

export const ResourceDialogs = ({
  resourceFormOpen,
  setResourceFormOpen,
  newResourceTitle,
  setNewResourceTitle,
  newResourceType,
  setNewResourceType,
  newResourceUrl,
  setNewResourceUrl,
  createResourceLoading,
  handleCreateResource,
}: ResourceDialogsProps) => {
  return (
    <Dialog open={resourceFormOpen} onOpenChange={setResourceFormOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Project Resource</DialogTitle>
          <DialogDescription>
            Provide a link or document reference for this project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              value={newResourceTitle}
              onChange={(e) => setNewResourceTitle(e.target.value)}
              placeholder="E.g., Architecture Diagram"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-type">Resource Type</Label>
            <Select value={newResourceType} onValueChange={setNewResourceType}>
              <SelectTrigger id="resource-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL_DOC">Paper / Document</SelectItem>
                <SelectItem value="GIT_REPO">Git Repository</SelectItem>
                <SelectItem value="DATASET">Dataset</SelectItem>
                <SelectItem value="OTHER">Other Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-url">URL</Label>
            <Input
              id="resource-url"
              value={newResourceUrl}
              onChange={(e) => setNewResourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setResourceFormOpen(false)} disabled={createResourceLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateResource} disabled={createResourceLoading || !newResourceTitle.trim() || !newResourceType}>
            {createResourceLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Resource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
