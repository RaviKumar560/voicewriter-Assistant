
import React from 'react';

interface VoiceVisualizerProps {
  isRecording: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isRecording }) => {
  if (!isRecording) return null;
  
  return (
    <div className="recording-waves animate-fade-in">
      <div className="wave animate-wave-1"></div>
      <div className="wave animate-wave-2"></div>
      <div className="wave animate-wave-3"></div>
      <div className="wave animate-wave-2"></div>
      <div className="wave animate-wave-1"></div>
    </div>
  );
};

export default VoiceVisualizer;
