
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// In a real application, this would be replaced with an actual backend service
// like WebSockets, Firebase, or Supabase Realtime
type Message = {
  userId: string;
  userName: string;
  text: string;
  isRecording: boolean;
  timestamp: number;
};

// Mock implementation - in a real app, this would connect to a backend
export function useRealTimeSharing() {
  const [userId] = useState(`user-${Math.floor(Math.random() * 10000)}`);
  const [userName] = useState(`User ${Math.floor(Math.random() * 100)}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<{[key: string]: {name: string, isRecording: boolean}}>({});
  
  // Mock joining the room
  useEffect(() => {
    // This simulates connecting to a room
    toast.success(`Connected as ${userName}`);
    
    // Simulate other users already in the room
    const simulatedUsers = {
      'user-other1': { name: 'User Demo', isRecording: false },
    };
    
    setConnectedUsers(prev => ({
      ...prev,
      ...simulatedUsers,
      [userId]: { name: userName, isRecording: false }
    }));
    
    // Simulate cleanup when disconnecting
    return () => {
      toast.info(`Disconnected from room`);
    };
  }, [userId, userName]);
  
  // Send a message to all users
  const broadcastMessage = useCallback((text: string, isRecording: boolean) => {
    const newMessage: Message = {
      userId,
      userName,
      text,
      isRecording,
      timestamp: Date.now()
    };
    
    // In a real app, this would send to a real-time backend
    setMessages(prev => [...prev, newMessage]);
    
    // Update the user's recording status
    setConnectedUsers(prev => ({
      ...prev,
      [userId]: { ...prev[userId], isRecording }
    }));
  }, [userId, userName]);
  
  const updateTranscription = useCallback((text: string) => {
    broadcastMessage(text, false);
  }, [broadcastMessage]);
  
  const updateRecordingStatus = useCallback((isRecording: boolean) => {
    // Get the latest message text or empty string
    const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const currentText = latestMessage?.userId === userId ? latestMessage.text : '';
    
    broadcastMessage(currentText, isRecording);
  }, [broadcastMessage, messages, userId]);
  
  // Helper function to get the latest message from a specific user
  const getLatestUserMessage = useCallback((targetUserId: string) => {
    // Filter messages by the target user and get the latest one
    const userMessages = messages.filter(msg => msg.userId === targetUserId);
    return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
  }, [messages]);
  
  // Get the latest message from the current user
  const getCurrentUserMessage = useCallback(() => {
    return getLatestUserMessage(userId);
  }, [getLatestUserMessage, userId]);

  return {
    userId,
    userName,
    messages,
    connectedUsers,
    broadcastMessage,
    updateTranscription,
    updateRecordingStatus,
    getCurrentUserMessage,
    getLatestUserMessage
  };
}
