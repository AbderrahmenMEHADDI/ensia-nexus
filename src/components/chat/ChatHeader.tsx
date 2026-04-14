import { Hash, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  roomName: string;
  roomDescription?: string;
  onSearchToggle?: () => void;
}

const ChatHeader = ({
  roomName,
  // roomDescription = "Real-time collaboration",
  onSearchToggle,
}: ChatHeaderProps) => {
  return (
    <div className="h-14 flex items-center justify-between px-6 border-b border-border/40 bg-card/10 backdrop-blur-2xl shrink-0 z-20">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Hash className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight leading-none mb-1">{roomName}</h3>
          {/* <p className="text-[11px] text-muted-foreground font-medium opacity-80">{roomDescription}</p> */}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onSearchToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchToggle}
            className="h-9 w-9 rounded-lg hover:bg-muted/50"
            title="Search messages"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
