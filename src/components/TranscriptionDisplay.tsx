import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clipboard, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TranscriptionDisplayProps {
  text: string;
  isRecording: boolean;
  onTextChange?: (newText: string) => void;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  text, 
  isRecording,
  onTextChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const prevTextRef = useRef<string>('');
  const textChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-scroll to the bottom of the container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  // Keep track of previous text to prevent unnecessary updates
  useEffect(() => {
    prevTextRef.current = text;
  }, [text]);
  
  const copyToClipboard = () => {
    if (!text.trim()) {
      toast.info("Nothing to copy");
      return;
    }
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // Clear any existing timeout
    if (textChangeTimeoutRef.current) {
      clearTimeout(textChangeTimeoutRef.current);
    }
    
    // Debounce text changes to prevent too frequent updates
    textChangeTimeoutRef.current = setTimeout(() => {
      // Only call onTextChange if the text has actually changed
      if (onTextChange && newText !== prevTextRef.current) {
        onTextChange(newText);
        prevTextRef.current = newText;
      }
    }, 300);
  };

  return (
    <div className="relative w-full animate-fade-up">
      <Card className="border shadow-sm bg-card/50">
        <CardContent className="p-6">
          <div 
            ref={containerRef}
            className="min-h-[200px] max-h-[400px] overflow-y-auto mb-2"
          >
            <textarea
              className="w-full min-h-[160px] bg-transparent resize-none text-lg leading-relaxed focus:outline-none"
              value={text}
              onChange={handleTextChange}
              placeholder={isRecording ? "Listening to your voice..." : "Edit your text here..."}
            />
          </div>
          
          {text && (
            <button
              onClick={copyToClipboard}
              className="absolute bottom-6 right-6 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors duration-200"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Clipboard className="w-5 h-5" />
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TranscriptionDisplay;
