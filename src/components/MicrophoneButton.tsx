
import React from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ 
  isRecording, 
  onClick 
}) => {
  return (
    <button
      className={cn(
        "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out",
        isRecording 
          ? "bg-[hsl(var(--recording-color))]" 
          : "bg-secondary hover:bg-secondary/80"
      )}
      onClick={onClick}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isRecording && (
        <div className="pulse-ring bg-[hsl(var(--recording-color))] opacity-75"></div>
      )}
      <Mic 
        className={cn(
          "w-8 h-8 transition-colors duration-300",
          isRecording ? "text-white" : "text-foreground"
        )} 
      />
    </button>
  );
};

export default MicrophoneButton;
