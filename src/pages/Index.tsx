
import React from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useRealTimeSharing } from '@/hooks/useRealTimeSharing';
import MicrophoneButton from '@/components/MicrophoneButton';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import ConnectionInterface from '@/components/ConnectionInterface';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

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
  React.useEffect(() => {
    updateRecordingStatus(isRecording);
  }, [isRecording, updateRecordingStatus]);

  // Update transcription when text changes
  React.useEffect(() => {
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
    // Immediate update for text changes from input
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

        <Card className="w-full p-6 shadow-md rounded-lg">
          <h2 className="text-lg font-medium mb-3">How to Connect Devices</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
            <li>On the first device, click <strong>"Create New Session"</strong> to generate a unique session ID.</li>
            <li>Copy the session ID by clicking the copy icon.</li>
            <li>On another device, open this app and click <strong>"Join Existing"</strong>.</li>
            <li>Paste the session ID and click <strong>"Join"</strong>.</li>
            <li>Start speaking on either device - the transcription will appear on all connected devices.</li>
            <li>You can edit the text on any device and changes will sync across all connected devices.</li>
          </ol>
        </Card>

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
          <p className="mt-1 text-xs">Text will stay visible for 30 seconds after you stop speaking</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
