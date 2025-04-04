
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

// Message type for real-time communication
type Message = {
  userId: string;
  userName: string;
  text: string;
  isRecording: boolean;
  timestamp: number;
  messageId: string; // Unique ID for deduplication
};

export function useRealTimeSharing() {
  const [userId] = useState(`user-${Math.floor(Math.random() * 10000)}`);
  const [userName, setUserName] = useState(`User ${Math.floor(Math.random() * 100)}`);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<{[key: string]: {name: string, isRecording: boolean}}>({});
  
  // Use refs to prevent infinite updates in useEffects
  const latestMessageRef = useRef<string>('');
  const lastBroadcastTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const sessionChannelRef = useRef<any>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Function to set up real-time channel communication
  const setupRealtimeChannel = useCallback((id: string) => {
    // Clean up any existing channel
    if (sessionChannelRef.current) {
      supabase.removeChannel(sessionChannelRef.current);
    }

    // Reset processed message IDs when creating a new channel
    processedMessageIds.current.clear();

    // Create a new channel for this session
    const channel = supabase.channel(`session:${id}`, {
      config: {
        broadcast: {
          self: true
        }
      }
    });

    // Subscribe to message events
    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage = payload.payload as Message;
        
        // Skip if we've already processed this message
        if (processedMessageIds.current.has(newMessage.messageId)) {
          return;
        }
        
        // Mark as processed
        processedMessageIds.current.add(newMessage.messageId);
        
        // Add message to messages array (using a function to avoid closure issues)
        setMessages(prev => {
          // Check if message is already in the array (additional deduplication)
          const messageExists = prev.some(msg => 
            msg.messageId === newMessage.messageId || 
            (msg.userId === newMessage.userId && 
             msg.timestamp === newMessage.timestamp)
          );
          
          if (messageExists) {
            return prev;
          }
          
          return [...prev, newMessage];
        });
        
        // Update connected users
        setConnectedUsers(prev => ({
          ...prev,
          [newMessage.userId]: { 
            name: newMessage.userName, 
            isRecording: newMessage.isRecording 
          }
        }));
      })
      .on('broadcast', { event: 'user_joined' }, (payload) => {
        const { userId: newUserId, userName: newUserName } = payload.payload;
        
        // Only show toast if it's not the current user
        if (newUserId !== userId) {
          toast.success(`${newUserName} joined the session`);
        }
        
        // Update the connected users list
        setConnectedUsers(prev => ({
          ...prev,
          [newUserId]: { name: newUserName, isRecording: false }
        }));
      })
      .on('broadcast', { event: 'user_left' }, (payload) => {
        const { userId: leftUserId, userName: leftUserName } = payload.payload;
        
        // Only show toast if it's not the current user
        if (leftUserId !== userId) {
          toast.info(`${leftUserName} left the session`);
        }
        
        // Remove the user from the connected users list
        setConnectedUsers(prev => {
          const newState = { ...prev };
          delete newState[leftUserId];
          return newState;
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Announce this user has joined
          channel.send({
            type: 'broadcast',
            event: 'user_joined',
            payload: { userId, userName }
          });
          
          sessionChannelRef.current = channel;
        }
      });
    
    return channel;
  }, [userId, userName]);
  
  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      // If there's an active session, announce that the user has left
      if (sessionId && sessionChannelRef.current) {
        sessionChannelRef.current.send({
          type: 'broadcast',
          event: 'user_left',
          payload: { userId, userName }
        }).then(() => {
          // Then remove the channel
          supabase.removeChannel(sessionChannelRef.current);
        });
      }
    };
  }, [sessionId, userId, userName]);
  
  // Mock creating a new session
  const createSession = useCallback(() => {
    // In a real app, this would create a session on the backend
    const newSessionId = `session-${Math.random().toString(36).substring(2, 10)}`;
    setSessionId(newSessionId);
    
    // Reset connected users list and add self
    setConnectedUsers({
      [userId]: { name: userName, isRecording: false }
    });
    
    // Set up real-time channel for this session
    setupRealtimeChannel(newSessionId);
    
    toast.success(`Created and joined session: ${newSessionId}`);
    
    return newSessionId;
  }, [userId, userName, setupRealtimeChannel]);
  
  // Mock joining an existing session
  const joinSession = useCallback((id: string) => {
    if (!id) {
      toast.error('Invalid session ID');
      return;
    }
    
    // In a real app, this would validate the session ID with the backend
    setSessionId(id);
    
    // Initial users list with just the current user
    setConnectedUsers({
      [userId]: { name: userName, isRecording: false }
    });
    
    // Set up real-time channel for this session
    setupRealtimeChannel(id);
    
    toast.success(`Joined session: ${id}`);
  }, [userId, userName, setupRealtimeChannel]);
  
  // Disconnect from a session
  const disconnectSession = useCallback(() => {
    if (!sessionId || !sessionChannelRef.current) {
      return;
    }
    
    // Announce that the user has left before disconnecting
    sessionChannelRef.current.send({
      type: 'broadcast',
      event: 'user_left',
      payload: { userId, userName }
    }).then(() => {
      // Then remove the channel
      supabase.removeChannel(sessionChannelRef.current);
      sessionChannelRef.current = null;
      
      // Clear session data
      setSessionId('');
      setMessages([]);
      setConnectedUsers({});
      
      toast.info(`Disconnected from session`);
    });
  }, [sessionId, userId, userName]);
  
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
    if (!sessionId || !sessionChannelRef.current) return;
    
    // Check if message content has changed significantly
    const textChanged = text !== latestMessageRef.current;
    const recordingStatusChanged = isRecording !== isRecordingRef.current;
    
    // Throttle updates to at most 1 per second unless recording status changes
    const now = Date.now();
    const shouldThrottle = !recordingStatusChanged && (now - lastBroadcastTimeRef.current < 1000);
    
    // Only broadcast if necessary changes and not throttled
    if ((!textChanged && !recordingStatusChanged) || shouldThrottle) {
      return;
    }
    
    // Update refs
    latestMessageRef.current = text;
    isRecordingRef.current = isRecording;
    lastBroadcastTimeRef.current = now;
    
    const messageId = `${userId}-${now}`;
    const newMessage: Message = {
      userId,
      userName,
      text,
      isRecording,
      timestamp: now,
      messageId
    };
    
    // Add to processed list before sending to prevent duplicates
    processedMessageIds.current.add(messageId);
    
    // Send the message via the real-time channel
    sessionChannelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: newMessage
    });
    
    // Also update our local state - using a function to avoid closure issues
    setMessages(prev => {
      // Check if message is already in the array (additional deduplication)
      const messageExists = prev.some(msg => 
        msg.messageId === messageId || 
        (msg.userId === userId && 
         Math.abs(msg.timestamp - now) < 100 && 
         msg.text === text)
      );
      
      if (messageExists) {
        return prev;
      }
      
      return [...prev, newMessage];
    });
    
    // Update the user's recording status
    setConnectedUsers(prev => ({
      ...prev,
      [userId]: { ...prev[userId], isRecording }
    }));
  }, [userId, userName, sessionId]);
  
  const updateTranscription = useCallback((text: string) => {
    if (!sessionId) return;
    
    // Only broadcast if text has meaningfully changed
    if (text === latestMessageRef.current) return;
    
    // If the new text is just the old text with a small addition,
    // make sure we don't send updates too frequently
    if (text.startsWith(latestMessageRef.current) && 
        text.length - latestMessageRef.current.length < 5 &&
        Date.now() - lastBroadcastTimeRef.current < 1000) {
      return;
    }
    
    broadcastMessage(text, isRecordingRef.current);
  }, [broadcastMessage, sessionId]);
  
  const updateRecordingStatus = useCallback((isRecording: boolean) => {
    if (!sessionId || isRecording === isRecordingRef.current) return;
    
    // Get the latest message text or empty string
    const latestMessage = messages.length > 0 ? 
      messages.find(msg => msg.userId === userId) : null;
    const currentText = latestMessage?.text || '';
    
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
    disconnectSession,
    updateUserName
  };
}
