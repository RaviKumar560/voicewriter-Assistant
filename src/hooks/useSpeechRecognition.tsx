import { useState, useEffect, useCallback, useRef } from 'react';
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
  const textTimeoutRef = useRef<number | null>(null);

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
      // Process the result immediately for responsive feedback
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      // Update text state
      setText(transcript);
      
      // Clear any existing timeout to prevent text from disappearing
      if (textTimeoutRef.current !== null) {
        window.clearTimeout(textTimeoutRef.current);
      }
      
      // Set a new timeout to ensure text stays for at least 30 seconds after speaking stops
      if (!isRecording) {
        textTimeoutRef.current = window.setTimeout(() => {
          // Only clear if not recording
          if (!isRecording) {
            setText('');
          }
        }, 30000); // 30 seconds
      }
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
        // This ensures continuous recording even if the API stops listening
        try {
          recognitionInstance.start();
        } catch (error) {
          console.error('Error restarting speech recognition:', error);
        }
      } else {
        // Set a timeout to keep text visible for 30 seconds after recording ends
        if (textTimeoutRef.current !== null) {
          window.clearTimeout(textTimeoutRef.current);
        }
        
        textTimeoutRef.current = window.setTimeout(() => {
          // Only clear if not recording
          if (!isRecording) {
            setText('');
          }
        }, 30000); // 30 seconds
      }
    };
    
    setRecognition(recognitionInstance);
    
    // Cleanup
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      if (textTimeoutRef.current !== null) {
        window.clearTimeout(textTimeoutRef.current);
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
      
      // Clear any timeout that might be set to clear the text
      if (textTimeoutRef.current !== null) {
        window.clearTimeout(textTimeoutRef.current);
        textTimeoutRef.current = null;
      }
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
      
      // Set a timeout to keep text visible for 30 seconds after recording ends
      if (textTimeoutRef.current !== null) {
        window.clearTimeout(textTimeoutRef.current);
      }
      
      textTimeoutRef.current = window.setTimeout(() => {
        // Only clear if not recording
        if (!isRecording) {
          setText('');
        }
      }, 30000); // 30 seconds
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, [recognition, isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const resetText = useCallback(() => {
    setText('');
    
    // Clear any timeout
    if (textTimeoutRef.current !== null) {
      window.clearTimeout(textTimeoutRef.current);
      textTimeoutRef.current = null;
    }
  }, []);

  const updateText = useCallback((newText: string) => {
    setText(newText);
    
    // Reset the 30-second timeout when text is manually updated
    if (textTimeoutRef.current !== null) {
      window.clearTimeout(textTimeoutRef.current);
    }
    
    // Only set a timeout to clear text if not recording
    if (!isRecording) {
      textTimeoutRef.current = window.setTimeout(() => {
        if (!isRecording) {
          setText('');
        }
      }, 30000); // 30 seconds
    }
  }, [isRecording]);

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
