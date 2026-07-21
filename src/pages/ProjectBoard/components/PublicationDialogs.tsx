import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProjectParticipant, User } from '@/types';

interface PublicationDialogsProps {
  publicationFormOpen: boolean;
  setPublicationFormOpen: (open: boolean) => void;
  newPubTitle: string;
  setNewPubTitle: (val: string) => void;
  newPubAbstract: string;
  setNewPubAbstract: (val: string) => void;
  newPubDate: string;
  setNewPubDate: (val: string) => void;
  newPubVenue: string;
  setNewPubVenue: (val: string) => void;
  newPubDoi: string;
  setNewPubDoi: (val: string) => void;
  newPubUrl: string;
  setNewPubUrl: (val: string) => void;
  newPubAuthors: number[];
  setNewPubAuthors: (val: number[] | ((prev: number[]) => number[])) => void;
  createPubLoading: boolean;
  handleCreatePublication: () => void;
  participants: ProjectParticipant[];
  getUserById: (id: number) => User | undefined;
}

export const PublicationDialogs = ({
  publicationFormOpen,
  setPublicationFormOpen,
  newPubTitle,
  setNewPubTitle,
  newPubAbstract,
  setNewPubAbstract,
  newPubDate,
  setNewPubDate,
  newPubVenue,
  setNewPubVenue,
  newPubDoi,
  setNewPubDoi,
  newPubUrl,
  setNewPubUrl,
  newPubAuthors,
  setNewPubAuthors,
  createPubLoading,
  handleCreatePublication,
  participants,
  getUserById,
}: PublicationDialogsProps) => {

  const handleAuthorToggle = (userId: number) => {
    setNewPubAuthors((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={publicationFormOpen} onOpenChange={setPublicationFormOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Research Publication</DialogTitle>
          <DialogDescription>
            Publish the research outputs and academic contributions of this project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pub-title">Publication Title <span className="text-destructive">*</span></Label>
            <Input
              id="pub-title"
              value={newPubTitle}
              onChange={(e) => setNewPubTitle(e.target.value)}
              placeholder="E.g., An Empirical Study of Generative AI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pub-abstract">Abstract</Label>
            <Textarea
              id="pub-abstract"
              value={newPubAbstract}
              onChange={(e) => setNewPubAbstract(e.target.value)}
              placeholder="Short abstract of the paper..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pub-date">Publication Date</Label>
              <Input
                id="pub-date"
                type="date"
                value={newPubDate}
                onChange={(e) => setNewPubDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pub-venue">Venue / Journal</Label>
              <Input
                id="pub-venue"
                value={newPubVenue}
                onChange={(e) => setNewPubVenue(e.target.value)}
                placeholder="E.g., IEEE Access, NeurIPS"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pub-doi">DOI</Label>
              <Input
                id="pub-doi"
                value={newPubDoi}
                onChange={(e) => setNewPubDoi(e.target.value)}
                placeholder="E.g., 10.1109/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pub-url">Paper URL</Label>
              <Input
                id="pub-url"
                value={newPubUrl}
                onChange={(e) => setNewPubUrl(e.target.value)}
                placeholder="https://arxiv.org/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Authors (Project Participants)</Label>
            <div className="border border-slate-100 rounded-xl p-3 max-h-[120px] overflow-y-auto space-y-2.5">
              {participants.map((p) => {
                const u = getUserById(p.user_id);
                const name = u?.full_name || `User #${p.user_id}`;
                return (
                  <div key={p.user_id} className="flex items-center space-x-2.5">
                    <Checkbox
                      id={`author-${p.user_id}`}
                      checked={newPubAuthors.includes(p.user_id)}
                      onCheckedChange={() => handleAuthorToggle(p.user_id)}
                    />
                    <label
                      htmlFor={`author-${p.user_id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {name} <span className="text-xs text-slate-400 capitalize">({p.participant_role.toLowerCase()})</span>
                    </label>
                  </div>
                );
              })}
              {participants.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No participants found in this project.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setPublicationFormOpen(false)} disabled={createPubLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreatePublication} disabled={createPubLoading || !newPubTitle.trim()}>
            {createPubLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Publication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
