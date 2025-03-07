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
  maxAlternatives: number;
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastTranscriptRef = useRef<string>('');

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
    recognitionInstance.maxAlternatives = 1;
    
    // Events
    recognitionInstance.onresult = (event) => {
      // Process the result immediately for responsive feedback
      let transcript = '';
      
      // Get latest result
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        } else {
          // For interim results, we still want to show something
          transcript += event.results[i][0].transcript;
        }
      }
      
      // Update text state if we have content
      if (transcript.trim()) {
        setText((prevText) => {
          // For final results, append with space
          if (event.results[event.resultIndex].isFinal) {
            // Prevent duplicate transcriptions by checking if this is the same as the last final transcript
            if (transcript.trim() === lastTranscriptRef.current.trim()) {
              return prevText;
            }
            
            // Update the last transcript reference
            lastTranscriptRef.current = transcript;
            
            return prevText ? `${prevText} ${transcript}` : transcript;
          }
          
          // For interim results, only update if it's substantially different
          if (transcript.trim() === lastTranscriptRef.current.trim()) {
            return prevText;
          }
          
          return transcript;
        });
      }
      
      // Clear any existing timeout to prevent text from disappearing
      if (textTimeoutRef.current !== null) {
        window.clearTimeout(textTimeoutRef.current);
        textTimeoutRef.current = null;
      }
    };
    
    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please allow microphone access.");
      } else if (event.error === 'network') {
        toast.error("Network error. Please check your connection.");
      } else if (event.error === 'no-speech') {
        // This is common, so we don't need to show an error
        console.log("No speech detected");
        // Try to restart if we're supposed to be recording
        if (isRecording) {
          try {
            recognitionInstance.stop();
            setTimeout(() => {
              if (isRecording) recognitionInstance.start();
            }, 100);
          } catch (e) {
            console.error("Error restarting after no-speech:", e);
          }
        }
      } else {
        toast.error(`Error: ${event.error}`);
      }
    };
    
    recognitionInstance.onend = () => {
      console.log("Recognition ended, isRecording:", isRecording);
      
      if (isRecording) {
        // This ensures continuous recording even if the API stops listening
        try {
          // Small delay to avoid rapid restart issues
          setTimeout(() => {
            if (isRecording) recognitionInstance.start();
          }, 200);
        } catch (error) {
          console.error('Error restarting speech recognition:', error);
          setIsRecording(false);
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
    recognitionRef.current = recognitionInstance;
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping recognition on cleanup:", e);
        }
      }
      if (textTimeoutRef.current !== null) {
        window.clearTimeout(textTimeoutRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported");
      return;
    }
    
    try {
      // Make sure we're stopped before starting (avoid already started errors)
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      
      setTimeout(() => {
        if (recognitionRef.current) {
          // Reset the last transcript when starting a new recording session
          lastTranscriptRef.current = '';
          
          recognitionRef.current.start();
          setIsRecording(true);
          
          // Clear any timeout that might be set to clear the text
          if (textTimeoutRef.current !== null) {
            window.clearTimeout(textTimeoutRef.current);
            textTimeoutRef.current = null;
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Failed to start recording");
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      // Set a timeout to keep text visible for 30 seconds after recording ends
      if (textTimeoutRef.current !== null) {
        window.clearTimeout(textTimeoutRef.current);
      }
      
      textTimeoutRef.current = window.setTimeout(() => {
        setText('');
      }, 30000); // 30 seconds
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const resetText = useCallback(() => {
    setText('');
    lastTranscriptRef.current = '';
    
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
