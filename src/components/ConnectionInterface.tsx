
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Share, Users, Copy, Key } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectionInterfaceProps {
  sessionId: string;
  userName: string;
  connectedUsers: {[key: string]: {name: string, isRecording: boolean}};
  onCreateSession: () => void;
  onJoinSession: (sessionId: string) => void;
  onChangeUserName: (name: string) => void;
}

const ConnectionInterface: React.FC<ConnectionInterfaceProps> = ({
  sessionId,
  userName,
  connectedUsers,
  onCreateSession,
  onJoinSession,
  onChangeUserName,
}) => {
  const [joinSessionId, setJoinSessionId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [newUserName, setNewUserName] = useState(userName);
  const [secretKey, setSecretKey] = useState('');
  const [showSecretKeyInput, setShowSecretKeyInput] = useState(!sessionId);
  
  const CORRECT_SECRET_KEY = 'Ravi560@';

  const validateSecretKey = () => {
    if (secretKey !== CORRECT_SECRET_KEY) {
      toast.error('Invalid secret key. Access denied.');
      return false;
    }
    return true;
  };

  const handleCreateSession = () => {
    if (!validateSecretKey()) return;
    
    onCreateSession();
    setShowSecretKeyInput(false);
    toast.success('New session created!');
  };

  const handleJoinSession = () => {
    if (!validateSecretKey()) return;
    
    if (!joinSessionId.trim()) {
      toast.error('Please enter a session ID');
      return;
    }
    onJoinSession(joinSessionId);
    setIsJoining(false);
    setShowSecretKeyInput(false);
  };

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success('Session ID copied to clipboard');
  };

  const handleUserNameChange = () => {
    if (newUserName.trim()) {
      onChangeUserName(newUserName);
      toast.success('Username updated');
    }
  };

  const userCount = Object.keys(connectedUsers).length;

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Share className="h-5 w-5" />
          Connect Devices
        </CardTitle>
        <CardDescription>
          Share your session ID with others to collaborate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Secret key input */}
        {showSecretKeyInput && (
          <div className="space-y-2 animate-fade-in">
            <label htmlFor="secretKey" className="text-sm font-medium flex items-center gap-1">
              <Key className="h-3.5 w-3.5" />
              Secret Key (Required)
            </label>
            <Input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter the secret key"
              className="font-mono"
            />
          </div>
        )}

        {/* User name input */}
        <div className="space-y-2">
          <label htmlFor="userName" className="text-sm font-medium">Your Display Name</label>
          <div className="flex space-x-2">
            <Input 
              id="userName" 
              value={newUserName} 
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter your name"
            />
            <Button onClick={handleUserNameChange} size="sm">Update</Button>
          </div>
        </div>

        {/* Session info */}
        {sessionId ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Current Session</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 mr-1" />
                {userCount} {userCount === 1 ? 'user' : 'users'}
              </div>
            </div>
            <div className="flex space-x-2">
              <Input value={sessionId} readOnly className="bg-muted/50 font-mono text-sm" />
              <Button size="icon" variant="ghost" onClick={handleCopySessionId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Create a new session or join an existing one to start collaborating.
            </p>
            <div className="flex justify-between">
              <Button onClick={handleCreateSession}>
                Create New Session
              </Button>
              <Button variant="outline" onClick={() => setIsJoining(true)}>
                Join Existing
              </Button>
            </div>
          </div>
        )}

        {/* Join session form */}
        {isJoining && (
          <div className="space-y-2 animate-fade-in">
            <label htmlFor="sessionId" className="text-sm font-medium">Session ID</label>
            <div className="flex space-x-2">
              <Input 
                id="sessionId" 
                value={joinSessionId} 
                onChange={(e) => setJoinSessionId(e.target.value)}
                placeholder="Paste session ID here"
              />
              <Button onClick={handleJoinSession}>Join</Button>
            </div>
          </div>
        )}

        {/* Connected users */}
        {userCount > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Connected Users</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(connectedUsers).map(([uid, userData]) => (
                <div 
                  key={uid}
                  className="text-xs px-3 py-1 rounded-full bg-muted flex items-center gap-1"
                >
                  {userData.name}
                  {userData.isRecording && 
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                  }
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionInterface;
