
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
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript && !previousTranscriptionsRef.current.has(finalTranscript)) {
          setText((prevText) => {
            const newText = prevText ? `${prevText} ${finalTranscript}` : finalTranscript;
            previousTranscriptionsRef.current.add(finalTranscript);
            lastTranscriptRef.current = finalTranscript;
            return newText;
          });
        }
      };

      recognitionRef.current.onerror = (event: Event) => {
        const error = event as unknown as { error: string };
        console.error('Speech recognition error', error);
        
        if (error.error === 'no-speech') {
          // This is a common error, don't show toast for it
          return;
        }
        toast.error(`Error: ${error.error}`);
        stopRecording();
      };
    } else {
      toast.error('Speech recognition is not supported in your browser. Try Chrome or Edge.');
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
  }, []);

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
      toast.error('Failed to start recording. Please try again.');
      setIsRecording(false);
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
