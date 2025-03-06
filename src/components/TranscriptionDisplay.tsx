
import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clipboard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TranscriptionDisplayProps {
  text: string;
  isRecording: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  text, 
  isRecording 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  
  // Auto-scroll to the bottom of the container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
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
  
  return (
    <div className="relative w-full animate-fade-up">
      <Card className="border shadow-sm bg-card/50">
        <CardContent className="p-6">
          <div 
            ref={containerRef}
            className="min-h-[200px] max-h-[400px] overflow-y-auto mb-2"
          >
            {text ? (
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
            ) : (
              <p className="text-muted-foreground text-center italic pt-16">
                {isRecording 
                  ? "Listening..." 
                  : "Click the microphone to start speaking"
                }
              </p>
            )}
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
