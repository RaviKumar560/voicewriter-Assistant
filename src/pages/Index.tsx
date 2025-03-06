
import React, { useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useRealTimeSharing } from '@/hooks/useRealTimeSharing';
import MicrophoneButton from '@/components/MicrophoneButton';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import ConnectionInterface from '@/components/ConnectionInterface';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const { text, isRecording, toggleRecording, resetText, setText } = useSpeechRecognition();
  const { 
    userId, 
    userName, 
    sessionId,
    connectedUsers, 
    updateTranscription, 
    updateRecordingStatus,
    createSession,
    joinSession,
    updateUserName
  } = useRealTimeSharing();

  // Update other users when recording status changes
  useEffect(() => {
    updateRecordingStatus(isRecording);
  }, [isRecording, updateRecordingStatus]);

  // Update transcription when text changes
  useEffect(() => {
    if (text) {
      updateTranscription(text);
    }
  }, [text, updateTranscription]);

  const handleReset = () => {
    resetText();
    toast.info("Transcription cleared");
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    updateTranscription(newText);
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

        <ConnectionInterface
          sessionId={sessionId}
          userName={userName}
          connectedUsers={connectedUsers}
          onCreateSession={createSession}
          onJoinSession={joinSession}
          onChangeUserName={updateUserName}
        />

        <div className="w-full space-y-8">
          {sessionId && (
            <div className="w-full flex flex-wrap gap-2 justify-center mb-4">
              <div className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground">
                Connected to session: {sessionId.substring(0, 6)}...
              </div>
            </div>
          )}

          <TranscriptionDisplay 
            text={text} 
            isRecording={isRecording} 
            onTextChange={handleTextChange}
          />
          
          <div className="flex flex-col items-center space-y-6">
            <VoiceVisualizer 
              isRecording={isRecording}
              userId={userId}
              userName={userName}
            />
            
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
        
        <footer className="w-full max-w-xl mx-auto bg-muted/40 rounded-lg p-4 text-center text-sm text-muted-foreground">
          <p className="font-medium mb-1">📢 Share your session ID to collaborate in real-time</p>
          <p>Click the microphone to speak, or edit text directly in the textbox</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
