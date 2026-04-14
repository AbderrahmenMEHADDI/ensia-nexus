import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled: boolean;
}

const ChatInput = ({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
}: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="px-6 pb-8 pt-4 bg-transparent shrink-0">
      <div className="max-w-4xl mx-auto">
        <div className="relative group/input-container">
          <div className="absolute -inset-1  rounded-[2rem] "></div>
          <div className="relative flex gap-3 p-2 bg-card/80 border border-border/40 rounded-[1.5rem] focus-within:border-primary/30 focus-within:shadow-primary/10 backdrop-blur-2xl transition-all duration-500">
            <Input
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-5 h-12 text-sm placeholder:text-muted-foreground/40 transition-all font-medium"
            />
            <Button
              size="icon"
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className="h-11 w-11 rounded-2xl transition-all duration-500 shadow-xl shadow-primary/10 active:scale-95 disabled:scale-100 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
