
import React from 'react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  userId?: string;
  userName?: string;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isRecording, userId, userName }) => {
  if (!isRecording) return null;
  
  return (
    <div className="recording-waves animate-fade-in">
      {userName && (
        <div className="user-name text-xs font-medium text-center mb-1 text-muted-foreground">
          {userName} is speaking...
        </div>
      )}
      <div className="wave animate-wave-1"></div>
      <div className="wave animate-wave-2"></div>
      <div className="wave animate-wave-3"></div>
      <div className="wave animate-wave-2"></div>
      <div className="wave animate-wave-1"></div>
    </div>
  );
};

export default VoiceVisualizer;
