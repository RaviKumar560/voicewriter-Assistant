
import React from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import MicrophoneButton from '@/components/MicrophoneButton';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Index = () => {
  const { text, isRecording, toggleRecording, resetText } = useSpeechRecognition();

  const handleReset = () => {
    resetText();
    toast.info("Transcription cleared");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center space-y-8 animate-fade-in">
        <header className="text-center space-y-3 mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-secondary text-xs font-medium tracking-wider uppercase animate-fade-in">
            Voice Recognition
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Voice<span className="text-[hsl(var(--recording-color))]">Write</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Speak naturally and watch your words appear on screen in real-time
          </p>
        </header>

        <div className="w-full space-y-8">
          <TranscriptionDisplay text={text} isRecording={isRecording} />
          
          <div className="flex flex-col items-center space-y-6">
            <VoiceVisualizer isRecording={isRecording} />
            
            <div className="space-y-6">
              <MicrophoneButton 
                isRecording={isRecording} 
                onClick={toggleRecording} 
              />
              
              {text && (
                <div className="flex justify-center animate-fade-in">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="text-sm"
                  >
                    Clear Text
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <footer className="text-center text-sm text-muted-foreground mt-10">
          <p>
            Tap the microphone and start speaking
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
