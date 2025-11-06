
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Session, VibeMessage, Profile } from './types';
import MapView, { type MapViewRef } from './components/map/MapView';
import CreateEventModal from './components/events/CreateEventModal';
import VibeChatPanel from './components/vibes/VibeChatPanel';
import SettingsModal from './components/profile/SettingsModal';
import ProfileModal from './components/profile/ProfileModal';
import { supabase } from './lib/supabaseClient';
import BottomNavBar, { type AppTab } from './components/layout/BottomNavBar';
import PageHeader from './components/layout/PageHeader';
import SocialPage from './components/social/SocialPage';
import SessionTypeModal from './components/sessions/SessionTypeModal';

interface MainAppProps {
  user: User;
  onLogout: () => void;
  onProfileUpdate: (profile: User['profile']) => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('Home');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventCoords, setNewEventCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<VibeMessage[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapViewRef = useRef<MapViewRef>(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [isSessionTypeModalOpen, setIsSessionTypeModalOpen] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState<'vibe' | 'seek' | 'cookie' | 'borrow' | null>(null);

  useEffect(() => {
    console.log('🎯 MainApp mounted for user:', user.profile.username);
  }, [user]);

  useEffect(() => {
    if (!sessionValid) return;
    
    const fetchSessions = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('sessions')
                .select('*, creator:profiles(username)')
                .eq('status', 'active');
            
            if (fetchError) {
                console.error("Error fetching sessions", fetchError);
                if (fetchError.message.includes('JWT') || fetchError.message.includes('session')) {
                  setError("Session expired. Please log in again.");
                  setTimeout(() => onLogout(), 2000);
                } else {
                  setError("Failed to load sessions. Please refresh the page.");
                }
            } else {
                setSessions(data as Session[]);
                setError(null);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setError("An unexpected error occurred while loading sessions.");
        }
    };
    fetchSessions();

    const sessionsSubscription = supabase.channel('public:sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, payload => {
        console.log('Change received!', payload)
        fetchSessions();
      })
      .subscribe();
      
    return () => {
        supabase.removeChannel(sessionsSubscription);
    };
  }, [sessionValid, onLogout]);
  
  useEffect(() => {
    if (!sessionValid) return;
    
    let messagesSubscription: any = null;
    if (isChatVisible && activeSession) {
        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*, sender:profiles(username)')
                    .eq('event_id', activeSession.id)
                    .order('created_at');
                    
                if (error) {
                    console.error("Error fetching messages", error);
                    if (error.message.includes('JWT') || error.message.includes('session')) {
                      setError("Session expired. Please log in again.");
                      setTimeout(() => onLogout(), 2000);
                    }
                } else {
                    setChatMessages(data as any[] as VibeMessage[]);
                }
            } catch (err) {
                console.error("Unexpected error fetching messages:", err);
            }
        };
        fetchMessages();

        messagesSubscription = supabase.channel(`public:messages:event_id=eq.${activeSession.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `event_id=eq.${activeSession.id}` 
            }, 
            async (payload) => {
                try {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', payload.new.sender_id)
                        .single();
                        
                    if (error) {
                        console.error(error);
                        setChatMessages(msgs => [...msgs, { 
                            ...payload.new, 
                            sender: { username: 'Unknown' } 
                        } as VibeMessage]);
                    } else {
                        setChatMessages(msgs => [...msgs, { 
                            ...payload.new, 
                            sender: { username: profile.username } 
                        } as VibeMessage]);
                    }
                } catch (err) {
                    console.error('Error handling new message:', err);
                }
            })
            .subscribe();
    }
    return () => {
        if(messagesSubscription) {
            supabase.removeChannel(messagesSubscription);
        }
    };
  }, [isChatVisible, activeSession, sessionValid, onLogout]);

  const handleMapClickInCreateMode = (coords: { lat: number; lng: number }) => {
    if (activeSession) {
        alert("You are already in a session. Leave or close your current session to create a new one.");
        setIsCreateMode(false);
        return;
    }
    setNewEventCoords(coords);
    setIsCreateModalOpen(true);
  };

  const handleCreateSession = async (sessionData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants'>) => {
    if (!newEventCoords || !sessionValid) return;

    try {
        const { data: newSession, error } = await supabase
            .from('sessions')
            .insert({
                ...sessionData,
                status: 'active',
                lat: newEventCoords.lat,
                lng: newEventCoords.lng,
                creator_id: user.id,
                participants: [user.id],
            })
            .select('*, creator:profiles(username)')
            .single();
        
        if (error) {
            console.error("Error creating session:", error);
            if (error.message.includes('JWT') || error.message.includes('session')) {
              setError("Session expired. Please log in again.");
              setTimeout(() => onLogout(), 2000);
            } else {
              setError("Failed to create session. Please try again.");
            }
        } else if (newSession) {
            setActiveSession(newSession as Session);
            setIsCreateModalOpen(false);
            setNewEventCoords(null);
            setIsCreateMode(false);
            setError(null);
        }
    } catch (err) {
        console.error("Unexpected error creating session:", err);
        setError("Failed to create session. Please try again.");
    }
  };
  
  const handleRecenterMap = () => {
    mapViewRef.current?.recenter();
  };

  const handleCloseSession = async (sessionId: number) => {
    if (!sessionValid) return;
    
    try {
        const { error } = await supabase
            .from('sessions')
            .update({ status: 'closed' })
            .eq('id', sessionId);
            
        if (error) {
            console.error("Error closing session:", error);
            if (error.message.includes('JWT') || error.message.includes('session')) {
              setError("Session expired. Please log in again.");
              setTimeout(() => onLogout(), 2000);
            }
        } else {
            if (activeSession?.id === sessionId) {
              setActiveSession(null);
              setIsChatVisible(false);
            }
        }
    } catch (err) {
        console.error("Unexpected error closing session:", err);
    }
  };

  const handleExtendSession = async (sessionId: number) => {
      if (!sessionValid) return;
      
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      
      try {
          const { error } = await supabase
              .from('sessions')
              .update({ duration: session.duration + 15 })
              .eq('id', sessionId);
              
          if (error) {
              console.error("Error extending session:", error);
              if (error.message.includes('JWT') || error.message.includes('session')) {
                setError("Session expired. Please log in again.");
                setTimeout(() => onLogout(), 2000);
              }
          }
      } catch (err) {
          console.error("Unexpected error extending session:", err);
      }
  };

  const handleJoinSession = async (sessionId: number) => {
    if (!sessionValid) return;
    
    if (activeSession) {
        alert("You're already in a session. Please leave it before joining another.");
        return;
    }
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
        const newParticipants = [...session.participants, user.id];
        const { data, error } = await supabase
            .from('sessions')
            .update({ participants: newParticipants })
            .eq('id', sessionId)
            .select('*, creator:profiles(username)')
            .single();
            
        if (error) {
            console.error("Error joining session:", error);
            if (error.message.includes('JWT') || error.message.includes('session')) {
              setError("Session expired. Please log in again.");
              setTimeout(() => onLogout(), 2000);
            }
        } else {
            setActiveSession(data as Session);
        }
    } catch (err) {
        console.error("Unexpected error joining session:", err);
    }
  };

  const handleLeaveSession = async (sessionId: number) => {
      if (!sessionValid) return;
      
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      try {
          const newParticipants = session.participants.filter(p => p !== user.id);
          const { error } = await supabase
              .from('sessions')
              .update({ participants: newParticipants })
              .eq('id', sessionId);
              
          if (error) {
              console.error("Error leaving session:", error);
              if (error.message.includes('JWT') || error.message.includes('session')) {
                setError("Session expired. Please log in again.");
                setTimeout(() => onLogout(), 2000);
              }
          } else {
              setActiveSession(null);
              setIsChatVisible(false);
          }
      } catch (err) {
          console.error("Unexpected error leaving session:", err);
      }
  };

  const handleSendMessage = async (text: string) => {
      if (!activeSession || !sessionValid) return;

      try {
          const { error } = await supabase
              .from('messages')
              .insert({
                  text,
                  sender_id: user.id,
                  event_id: activeSession.id,
              });
              
          if (error) {
              console.error("Error sending message:", error);
              if (error.message.includes('JWT') || error.message.includes('session')) {
                setError("Session expired. Please log in again.");
                setTimeout(() => onLogout(), 2000);
              }
          }
      } catch (err) {
          console.error("Unexpected error sending message:", err);
      }
  };

  const handleOpenProfile = async (username: string) => {
      if (!sessionValid) return;
      
      try {
          const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('username', username)
              .single();
              
          if(error) {
               console.error("Could not find user to view profile for:", username, error);
               if (error.message.includes('JWT') || error.message.includes('session')) {
                 setError("Session expired. Please log in again.");
                 setTimeout(() => onLogout(), 2000);
               }
               return;
          }
          if (profile) {
              const userToView: User = {
                  id: profile.id,
                  profile: {
                    username: profile.username,
                    bio: profile.bio,
                    privacy: profile.privacy,
                  }
              };
              setViewedUser(userToView);
              setIsProfileModalOpen(true);
          }
      } catch (err) {
          console.error("Unexpected error opening profile:", err);
      }
  };

  const handleTabClick = (tab: AppTab) => {
    if (tab === 'Profile') {
      setIsSettingsModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  if (!sessionValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="text-center p-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 text-lg mb-4">Session validation failed...</p>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-green-50 flex flex-col">
      {['Home', 'Social', 'Alerts'].includes(activeTab) && (
        <PageHeader username={user.profile.username} onLogout={onLogout} />
      )}
      <main className="flex-grow relative">
        {error && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md w-11/12" role="alert">
                <div className="flex justify-between items-center">
                    <div className="flex-grow">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                    <button 
                        onClick={() => setError(null)} 
                        className="text-red-700 hover:text-red-900 ml-4 flex-shrink-0"
                        aria-label="Dismiss error"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        )}
        
          {/* Home Tab Content */}
          <div className={`h-full w-full ${activeTab === 'Home' ? '' : 'hidden'}`}>
            <MapView 
              ref={mapViewRef}
              isVisible={activeTab === 'Home'}
              isCreateMode={isCreateMode}
              userLocation={userLocation}
              onSetUserLocation={setUserLocation}
              onMapClick={handleMapClickInCreateMode}
              events={sessions}
              user={user}
              activeVibe={activeSession}
              onCloseEvent={handleCloseSession}
              onExtendEvent={handleExtendSession}
              onJoinVibe={handleJoinSession}
              onViewChat={() => setIsChatVisible(true)}
            />
            <button
              onClick={() => setIsSessionTypeModalOpen(true)}
              className="fixed bottom-24 right-6 z-[1000] p-4 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-transform duration-200 ease-in-out hover:scale-110"
              aria-label="Create new session"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          {/* Social Tab Content */}
          <div className={`h-full ${activeTab === 'Social' ? '' : 'hidden'}`}>
            <SocialPage />
          </div>

          {/* Alerts Tab Content */}
          <div className={`h-full ${activeTab === 'Alerts' ? 'flex' : 'hidden'} items-center justify-center text-gray-500`}>
            <p>Alerts page coming soon!</p>
          </div>
        
        
        {newEventCoords && (
          <CreateEventModal 
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setNewEventCoords(null);
              setIsCreateMode(false);
            }}
            onSubmit={handleCreateSession}
          />
        )}
        {activeSession && (
            <VibeChatPanel
                isOpen={isChatVisible}
                onClose={() => setIsChatVisible(false)}
                vibe={activeSession}
                messages={chatMessages}
                user={user}
                onSendMessage={handleSendMessage}
                onLeaveVibe={handleLeaveSession}
                onViewProfile={handleOpenProfile}
            />
        )}
        <SessionTypeModal
            isOpen={isSessionTypeModalOpen}
            onClose={() => setIsSessionTypeModalOpen(false)}
            onSelectType={(type) => {
                setSelectedSessionType(type);
                setIsSessionTypeModalOpen(false);
                setIsCreateModalOpen(true);
            }}
        />
        <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            user={user}
            onSave={(profile) => {
              onProfileUpdate(profile);
              setIsSettingsModalOpen(false);
            }}
        />
        {viewedUser && (
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userToView={viewedUser}
            />
        )}
      </main>
      <BottomNavBar activeTab={activeTab} onTabClick={handleTabClick} />
    </div>
  );
};

export default MainApp;
