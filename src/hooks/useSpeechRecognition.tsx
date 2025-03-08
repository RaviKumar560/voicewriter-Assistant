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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastTranscriptRef = useRef<string>('');
  const transcriptionInProgressRef = useRef<boolean>(false);
  const previousTranscriptionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const processAudioData = async (audioBlob: Blob) => {
    if (transcriptionInProgressRef.current) {
      console.log('Transcription already in progress, skipping...');
      return;
    }

    transcriptionInProgressRef.current = true;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      console.log('Sending audio for transcription, size:', audioBlob.size);

      await new Promise(resolve => setTimeout(resolve, 500));

      const currentSpeech = await extractTextFromAudio(audioBlob);

      if (!isSignificantlyDifferent(currentSpeech, lastTranscriptRef.current) ||
          previousTranscriptionsRef.current.has(currentSpeech)) {
        console.log('Skipping similar transcript:', currentSpeech);
        transcriptionInProgressRef.current = false;
        return;
      }

      setText((prevText) => {
        const newText = prevText ? `${prevText} ${currentSpeech}` : currentSpeech;
        previousTranscriptionsRef.current.add(currentSpeech);
        lastTranscriptRef.current = currentSpeech;
        return newText;
      });
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error('Failed to transcribe audio. Please try again.');
    } finally {
      transcriptionInProgressRef.current = false;
    }
  };

  const extractTextFromAudio = async (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        const mockPhrases = [
          "Hello, this is a simulated transcription.",
          "This would be replaced with actual Deepgram results.",
          "Voice recognition with Deepgram provides better accuracy.",
          "Your speech would be processed by Deepgram's advanced models."
        ];
        const randomIndex = Math.floor(Math.random() * mockPhrases.length);
        resolve(mockPhrases[randomIndex]);
      };
      fileReader.readAsArrayBuffer(audioBlob);
    });
  };

  const isSignificantlyDifferent = (newText: string, oldText: string): boolean => {
    if (!newText || !oldText) return true;
    
    const newTextNormalized = newText.trim().toLowerCase();
    const oldTextNormalized = oldText.trim().toLowerCase();
    
    if (newTextNormalized === oldTextNormalized) return false;
    
    if (newTextNormalized.includes(oldTextNormalized) || 
        oldTextNormalized.includes(newTextNormalized)) {
      return Math.abs(newTextNormalized.length - oldTextNormalized.length) > 
             oldTextNormalized.length * 0.3;
    }
    
    const levenshteinDistance = (a: string, b: string): number => {
      const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
      
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
      
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      
      return matrix[a.length][b.length];
    };
    
    const distance = levenshteinDistance(newTextNormalized, oldTextNormalized);
    const maxLength = Math.max(newTextNormalized.length, oldTextNormalized.length);
    const similarityScore = 1 - distance / maxLength;
    
    return similarityScore < 0.7;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm' 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudioData(audioBlob);
          audioChunksRef.current = [];
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(3000);
      
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access.');
      } else {
        toast.error('Failed to start recording. Please try again.');
      }
      
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Recording stopped');
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
