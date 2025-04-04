
import React from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useRealTimeSharing } from '@/hooks/useRealTimeSharing';
import MicrophoneButton from '@/components/MicrophoneButton';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import ConnectionInterface from '@/components/ConnectionInterface';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { text, isRecording, toggleRecording, resetText, setText } = useSpeechRecognition();
  const { 
    userId, 
    userName, 
    sessionId,
    connectedUsers, 
    messages,
    updateTranscription, 
    updateRecordingStatus,
    createSession,
    joinSession,
    disconnectSession,
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

  // Display the latest message from any connected user
  React.useEffect(() => {
    if (messages.length > 0) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1];
      
      // Only update the text if it's not from the current user
      // to prevent feedback loops
      if (latestMessage.userId !== userId && latestMessage.text) {
        setText(latestMessage.text);
      }
    }
  }, [messages, userId, setText]);

  const handleReset = () => {
    resetText();
    toast.info("Transcription cleared");
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    // Immediate update for text changes from input
    updateTranscription(newText);
  };

  const handleDisconnect = () => {
    disconnectSession();
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
              
              {Object.keys(connectedUsers).length > 1 && (
                <div className="text-xs px-3 py-1 rounded-full bg-green-500 text-white">
                  {Object.keys(connectedUsers).length} devices connected
                </div>
              )}
              
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex items-center gap-1 text-xs h-6 px-3 py-0 rounded-full"
                onClick={handleDisconnect}
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </Button>
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
          <p className="mt-1 text-xs">Text will stay visible until you click the Clear Text button</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
