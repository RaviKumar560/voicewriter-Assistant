
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface SpeechRecognitionHook {
  text: string;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  resetText: () => void;
  setText: (newText: string) => void;
}

// Create a type for the SpeechRecognition object since TypeScript doesn't have built-in types for it
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: any) => void;
  onend: (event: any) => void;
  onresult: (event: any) => void;
  onspeechstart: (event: any) => void;
  onspeechend: (event: any) => void;
}

// Create a type for the window with SpeechRecognition
interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Initialize speech recognition on component mount
  useEffect(() => {
    const windowWithSpeech = window as unknown as WindowWithSpeechRecognition;
    const SpeechRecognition = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }
    
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    
    // Events
    recognitionInstance.onresult = (event) => {
      // Get the last result to immediately show the current speech
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      setText(transcript);
    };
    
    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please allow microphone access.");
      } else if (event.error === 'network') {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(`Error: ${event.error}`);
      }
      setIsRecording(false);
    };
    
    recognitionInstance.onend = () => {
      if (isRecording) {
        recognitionInstance.start();
      }
    };
    
    setRecognition(recognitionInstance);
    
    // Cleanup
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [isRecording]);

  const startRecording = useCallback(() => {
    if (!recognition) {
      toast.error("Speech recognition is not supported");
      return;
    }
    
    try {
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Failed to start recording");
    }
  }, [recognition]);

  const stopRecording = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, [recognition]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const resetText = useCallback(() => {
    setText('');
  }, []);

  const updateText = useCallback((newText: string) => {
    setText(newText);
  }, []);

  return {
    text,
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
    resetText,
    setText: updateText
  };
}
