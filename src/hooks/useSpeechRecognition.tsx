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

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const previousTranscriptionsRef = useRef<Set<string>>(new Set());
  const lastTranscriptRef = useRef<string>('');

  // Initialize speech recognition on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for SpeechRecognition support by testing window object properties
      const SpeechRecognitionAPI = 
        // Using 'in' operator is more reliable for TypeScript
        'SpeechRecognition' in window 
          ? window['SpeechRecognition' as keyof Window] as unknown as SpeechRecognitionConstructor
          : 'webkitSpeechRecognition' in window 
            ? window['webkitSpeechRecognition' as keyof Window] as unknown as SpeechRecognitionConstructor
            : null;
            
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        // Set the language to English and optimize for responsive recognition
        recognitionRef.current.lang = 'en-US';
        
        // Decrease maxAlternatives to improve speed
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event: Event) => {
          // Type assertion to use the SpeechRecognitionEvent interface
          const speechEvent = event as unknown as SpeechRecognitionEvent;
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
            const transcript = speechEvent.results[i][0].transcript;
            
            if (speechEvent.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update text immediately with interim results for better responsiveness
          if (interimTranscript) {
            setText((prevText) => {
              const newText = prevText ? `${prevText} ${interimTranscript}` : interimTranscript;
              return newText;
            });
          }

          if (finalTranscript && !previousTranscriptionsRef.current.has(finalTranscript)) {
            setText((prevText) => {
              // If we already showed the interim transcript, replace that portion with the final
              // Otherwise, append as normal
              const newText = prevText.includes(interimTranscript) 
                ? prevText.replace(interimTranscript, finalTranscript)
                : prevText ? `${prevText} ${finalTranscript}` : finalTranscript;
                
              previousTranscriptionsRef.current.add(finalTranscript);
              lastTranscriptRef.current = finalTranscript;
              return newText;
            });
          }
        };

        // Add more error handling with specific error codes
        recognitionRef.current.onerror = (event: Event) => {
          const error = event as unknown as { error: string };
          console.error('Speech recognition error', error);
          
          if (error.error === 'no-speech') {
            // This is a common error, don't show toast for it
            return;
          }
          
          if (error.error === 'audio-capture') {
            toast.error('Could not access microphone. Check permissions.');
            stopRecording();
            return;
          }
          
          if (error.error === 'network') {
            toast.error('Network error occurred. Check your connection.');
            stopRecording();
            return;
          }
          
          toast.error(`Error: ${error.error}`);
          stopRecording();
        };
        
        // Restart recognition if it ends unexpectedly while still recording
        recognitionRef.current.onend = () => {
          if (isRecording && recognitionRef.current) {
            console.log('Recognition ended unexpectedly, restarting...');
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Failed to restart recognition', e);
            }
          }
        };
      } else {
        toast.error('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition on unmount', e);
        }
      }
    };
  }, [isRecording]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.success('Listening...');
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // Handle already started error specifically
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        // Recognition already started, just update UI state
        setIsRecording(true);
      } else {
        toast.error('Failed to start recording. Please try again.');
        setIsRecording(false);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        toast.info('Stopped listening');
      } catch (error) {
        console.error('Error stopping recording:', error);
        // Force state update even if error occurs
        setIsRecording(false);
      }
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
    previousTranscriptionsRef.current.clear();
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
