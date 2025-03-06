
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
  const [userName, setUserName] = useState(`User ${Math.floor(Math.random() * 100)}`);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<{[key: string]: {name: string, isRecording: boolean}}>({});
  
  // Mock creating a new session
  const createSession = useCallback(() => {
    // In a real app, this would create a session on the backend
    const newSessionId = `session-${Math.random().toString(36).substring(2, 10)}`;
    setSessionId(newSessionId);
    
    // Reset connected users list and add self
    setConnectedUsers({
      [userId]: { name: userName, isRecording: false }
    });
    
    // Mock "connecting" to the new session
    toast.success(`Created and joined session: ${newSessionId}`);
    
    return newSessionId;
  }, [userId, userName]);
  
  // Mock joining an existing session
  const joinSession = useCallback((id: string) => {
    if (!id) {
      toast.error('Invalid session ID');
      return;
    }
    
    // In a real app, this would validate the session ID with the backend
    setSessionId(id);
    
    // Mock other users in the session
    const simulatedUsers = {
      'user-other1': { name: 'User Demo', isRecording: false },
      [userId]: { name: userName, isRecording: false }
    };
    
    setConnectedUsers(simulatedUsers);
    toast.success(`Joined session: ${id}`);
  }, [userId, userName]);
  
  // Update user name
  const updateUserName = useCallback((newName: string) => {
    if (!newName.trim()) return;
    
    setUserName(newName);
    
    // Update connected users
    if (sessionId) {
      setConnectedUsers(prev => ({
        ...prev,
        [userId]: { ...prev[userId], name: newName }
      }));
    }
  }, [userId, sessionId]);
  
  // Send a message to all users
  const broadcastMessage = useCallback((text: string, isRecording: boolean) => {
    if (!sessionId) return;
    
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
  }, [userId, userName, sessionId]);
  
  const updateTranscription = useCallback((text: string) => {
    if (!sessionId) return;
    broadcastMessage(text, false);
  }, [broadcastMessage, sessionId]);
  
  const updateRecordingStatus = useCallback((isRecording: boolean) => {
    if (!sessionId) return;
    
    // Get the latest message text or empty string
    const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const currentText = latestMessage?.userId === userId ? latestMessage.text : '';
    
    broadcastMessage(currentText, isRecording);
  }, [broadcastMessage, messages, userId, sessionId]);
  
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
    sessionId,
    messages,
    connectedUsers,
    broadcastMessage,
    updateTranscription,
    updateRecordingStatus,
    getCurrentUserMessage,
    getLatestUserMessage,
    createSession,
    joinSession,
    updateUserName
  };
}
