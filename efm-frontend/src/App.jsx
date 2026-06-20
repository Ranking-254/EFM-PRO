// src/App.jsx
import React, { useState, useEffect } from 'react'; 
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios'; 
import { io } from 'socket.io-client'; // 🚀 UPGRADED: Added real-time client socket import

// Extracted Components
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import WhatsAppButton from './components/WhatsappButton'; 

// Original Components & Pages
import Register from './components/Register';
import TournamentHub from './components/LeagueRecruitment';
import MatchdayHub from './components/MatchdayHub';
import AdminDesk from './components/AdminDesk';
import LeagueTable from './components/LeagueTable';
import LeagueSelector from './components/LeagueSelector';
import LoginModal from './components/LoginModal';
import SupportPage from './components/SupportPage';
import FAQPage from './components/FAQPage'; 
import NotFoundPage from './components/NotFoundPage';
import TournamentRulesPage from './pages/TournamentRulesPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import DashboardPage from './pages/DashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import HallOfFamePage from './pages/HallofFame';

// Dynamic API Endpoint Base Route Selector
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

// 🚀 Socket.io Server Connection Base Route Endpoint Selector
const SOCKET_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://efm-pro.onrender.com';

// 🚀 Core Application Entry Layer
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

// 🚀 UPDATED DYNAMIC INVITATION URL CATCH ENGINE
function TournamentDeepLinkWrapper({ setSelectedLeagueId }) {
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const analyzeLeagueStatusAndRoute = async () => {
            if (!id) return;
            
            try {
                // Mount the global ID reference state immediately
                setSelectedLeagueId(id);

                // Fetch the league details from your existing base URL layout
                const targetUrl = window.location.hostname === 'localhost' 
                    ? `http://localhost:5000/api/v1/leagues/all` 
                    : `https://efm-pro.onrender.com/api/v1/leagues/all`;

                const res = await axios.get(targetUrl);
                
                if (res.data.success) {
                    // Find our specific shared league inside the payload master array
                    const targetLeague = res.data.data.find(l => l._id === id);

                    if (targetLeague && targetLeague.status === 'recruiting') {
                        // 🟢 IF RECRUITING: Send them straight to the registration/join hub view
                        navigate('/tournament', { replace: true });
                    } else {
                        // 🏆 IF ACTIVE/LIVE: Direct fallback straight to scoreboard tables
                        navigate('/standings', { replace: true });
                    }
                } else {
                    // Safety structural fallback if table parsing fails
                    navigate('/standings', { replace: true });
                }
            } catch (err) {
                console.error("Failed to parse invite metadata routing rules:", err);
                navigate('/standings', { replace: true });
            }
        };

        analyzeLeagueStatusAndRoute();
    }, [id, setSelectedLeagueId, navigate]);

    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">Verifying Invite Link Card...</span>
        </div>
    );
}

// 🚀 Core Content Wrapper Layer (Enables clean programmatic useNavigate executions)
function AppContent() {
  const navigate = useNavigate(); 

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('efmpro_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tournamentRefreshToken, setTournamentRefreshToken] = useState(0);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // 🚀 REVISED: Connects cleanly to the user's specific profile endpoint
  const fetchFreshUserProfile = async () => {
    if (!currentUser) return;
    const currentUserId = currentUser.id || currentUser._id;
    if (!currentUserId) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/user/${currentUserId}`); 
      if (res.data.success) {
        const freshData = res.data.data;
        
        setCurrentUser(freshData);
        localStorage.setItem('efmpro_user', JSON.stringify(freshData));
      }
    } catch (err) {
      console.error("Background notification sync error:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const currentUserId = currentUser.id || currentUser._id;
    if (!currentUserId) return;

    // 🚀 FIXED: Enforce 'websocket' transport configuration directly to completely skip polling
    const socket = io(SOCKET_BASE_URL, { 
        withCredentials: true,
        transports: ['websocket'], // ⚡ Bypasses HTTP polling strings completely!
        upgrade: false             // Prevents unnecessary fallback polling handshakes
    });

    socket.emit('register_manager', currentUserId);

    // 🚀 FIX 1: Smart update for read states without wiping unmatched history cards
    socket.on('notifications_updated', (backendNotificationsArray) => {
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            
            const localNotifications = prevUser.notifications || [];
            
            const mergedNotifications = localNotifications.map(localNotif => {
                const serverMatch = backendNotificationsArray.find(s => s._id === localNotif._id || s.message === localNotif.message);
                if (serverMatch) {
                    return { ...localNotif, ...serverMatch }; // Sync properties (like isRead)
                }
                return localNotif; // Keep historical items completely safe
            });

            backendNotificationsArray.forEach(serverNotif => {
                const alreadyExists = mergedNotifications.some(m => m._id === serverNotif._id || m.message === serverNotif.message);
                if (!alreadyExists) {
                    mergedNotifications.unshift(serverNotif);
                }
            });

            const updatedUserObj = { ...prevUser, notifications: mergedNotifications };
            localStorage.setItem('efmpro_user', JSON.stringify(updatedUserObj));
            return updatedUserObj;
        });
    });

    // 🚀 FIX 2: Smart update for new global league broadcasts
    socket.on('global_notification', (newNotif) => {
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            
            const currentAlerts = prevUser.notifications || [];
            
            const alertExists = currentAlerts.some(n => n.message === newNotif.message);
            if (alertExists) return prevUser;

            const updatedNotifications = [newNotif, ...currentAlerts];
            const updatedUserObj = { ...prevUser, notifications: updatedNotifications };
            
            localStorage.setItem('efmpro_user', JSON.stringify(updatedUserObj));
            return updatedUserObj;
        });
    });

    return () => {
        socket.disconnect();
    };
  }, [currentUser ? (currentUser.id || currentUser._id) : null]);

  const refreshTournamentList = () => {
    setTournamentRefreshToken(prev => prev + 1);
  };

  const handleLogin = async (user) => {
    // 1. Immediately cache and set the base authentication profile data
    localStorage.setItem('efmpro_user', JSON.stringify(user));
    setCurrentUser(user);
    setLoginModalOpen(false);
    navigate('/dashboard');
    
    // 2. 🚀 FORCE INITIAL HYDRATION: Pull full historical records (including notifications array) right at login
    const currentUserId = user.id || user._id;
    if (!currentUserId) return;

    try {
        const res = await axios.get(`${API_BASE_URL}/auth/user/${currentUserId}`); 
        if (res.data.success) {
            const freshData = res.data.data;
            
            // Hydrate the layout states so the notification badges display accurately on the first render
            setCurrentUser(freshData);
            localStorage.setItem('efmpro_user', JSON.stringify(freshData));
        }
    } catch (err) {
        console.error("Failed to execute initial profile synchronization upon manager login:", err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('efmpro_user'); 
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 selection:bg-cyan-400 selection:text-slate-900 font-sans antialiased flex flex-col justify-between">
      
      <Navbar 
        currentUser={currentUser} 
        handleLogout={handleLogout} 
        setLoginModalOpen={setLoginModalOpen}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        onNotificationCleared={fetchFreshUserProfile}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <Routes>
          {/* Home Route */}
          <Route path="/" element={<LandingPage currentUser={currentUser} setLoginModalOpen={setLoginModalOpen} />} />

          {/* Registration Route */}
          <Route path="/register" element={
            <div className="w-full flex justify-center py-4">
              <Register onRegistrationSuccess={handleLogin} onCancel={() => window.history.back()} />
            </div>
          } />
          
          {/* 🚀 NEW DYNAMIC INCOMING RESOURCE URL CAPTURE ROUTE */}
          <Route path="/tournaments/:id" element={<TournamentDeepLinkWrapper setSelectedLeagueId={setSelectedLeagueId} />} />

          {/* Tournament Route */}
          <Route path="/tournament" element={
            <div className="w-full space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-1.5 bg-[#a3e635]/10 text-[#a3e635] text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-[#a3e635]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping"></span>
                  Open Brackets
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Tournament Hub</h2>
                <p className="text-sm text-slate-400">
                  Join recruiting leagues and compete. Slots fill fast — once a bracket is full, the season goes live automatically.
                </p>
              </div>
              <div className="w-full flex justify-center">
                <TournamentHub
                  currentUser={currentUser}
                  setLoginModalOpen={setLoginModalOpen}
                  onJoinSuccess={(leagueId) => {
                    setSelectedLeagueId(leagueId);
                    navigate('/matchday-hub');
                  }}
                  onViewLeague={(leagueId) => {
                    setSelectedLeagueId(leagueId);
                    navigate('/standings');
                  }}
                  refreshKey={tournamentRefreshToken}
                />
              </div>
            </div>
          } />

          {/* Matchday Hub Route */}
          <Route path="/matchday-hub" element={
            <div className="w-full space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Matchday Hub</h2>
                  <p className="text-xs text-slate-400">Review fixtures and submit your match results.</p>
                </div>
              </div>
              <MatchdayHub leagueId={selectedLeagueId} currentUser={currentUser} />
            </div>
          } />

          {/* Standings Table Route */}
          <Route path="/standings" element={
            <div className="w-full space-y-8">
              {!selectedLeagueId ? (
                <MakeSelectionWrapper setLeague={setSelectedLeagueId} user={currentUser} />
              ) : (
                <LeagueTable leagueId={selectedLeagueId} currentUser={currentUser} />
              )}
            </div>
          } />
          {/* Hall of Fame Route */}
          <Route path="/hall-of-fame" element={
            <div className="w-full space-y-8">
              <HallOfFamePage />
            </div>
          } />

          {/* Dashboard Route (Protected) */}
          <Route path="/dashboard" element={
            currentUser ? (
              <div className="w-full space-y-8">
                <DashboardPage currentUser={currentUser} onNavigate={() => refreshTournamentList()} />
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* Administration Entry Gateways */}
          <Route path="/admin" element={
            isAdminAuthenticated ? (
              <Navigate to="/admin/desk" replace />
            ) : (
              <AdminLoginPage onLogin={() => setIsAdminAuthenticated(true)} />
            )
          } />

          <Route path="/admin/desk" element={
            isAdminAuthenticated ? (
              <div className="w-full space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-400 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-amber-400/20">
                    ⚖️ Organizer Access Only
                  </div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Administrative Resolution Desk</h2>
                  <p className="text-sm text-slate-400">Resolve disputed matches and unlock standings calculations.</p>
                </div>
                <AdminDesk leagueId={selectedLeagueId} onSelectLeague={(id) => setSelectedLeagueId(id)} />
              </div>
            ) : (
              <Navigate to="/admin" replace />
            )
          } />

          {/* Legal Documents / Info Routes */}
          <Route path="/support" element={<div className="w-full space-y-8"><SupportPage /></div>} />
          <Route path="/faq" element={<div className="w-full space-y-8"><FAQPage /></div>} />
          <Route path="/tournament-rules" element={<div className="w-full space-y-8"><TournamentRulesPage /></div>} />
          <Route path="/terms-of-service" element={<div className="w-full space-y-8"><TermsOfServicePage /></div>} />
          <Route path="/privacy-policy" element={<div className="w-full space-y-8"><PrivacyPolicyPage /></div>} />

          {/* Fallback 404 Route */}
          <Route path="*" element={<div className="w-full space-y-8"><NotFoundPage onGoHome={() => navigate('/')} /></div>} />
        </Routes>
      </main>

      {/* Global Footer Layout */}
      <footer className="border-t border-slate-900 bg-[#070a0f] py-12 text-xs text-slate-500 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-4">
              <span className="font-black text-white tracking-widest text-sm">EFM-PRO</span>
              <p className="text-slate-400 leading-relaxed">The world's premier platform for competitive eFootball management.</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Navigation</span>
              <Link to="/" className="text-left hover:text-white transition-colors">Home</Link>
              <Link to="/tournament" className="text-left hover:text-white transition-colors">Leagues</Link>
              <Link to="/support" className="text-left hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Legal</span>
              <Link to="/tournament-rules" className="text-left hover:text-white transition-colors">Tournament Rules</Link>
              <Link to="/terms-of-service" className="text-left hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/privacy-policy" className="text-left hover:text-white transition-colors">Privacy Policy</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Security</span>
              <div className="inline-flex items-center gap-2 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Encrypted & Protected
              </div>
              <p className="text-slate-500">Your data is encrypted and protected</p>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-6 text-center text-slate-600">
            <p>© 2026 EFM-PRO. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)} 
        onLogin={handleLogin}
      />

      <WhatsAppButton />
    </div>
  );
}

function MakeSelectionWrapper({ setLeague, user }) {
  return (
    <LeagueSelector currentUser={user} onSelectLeague={(league) => setLeague(league._id || league)} />
  );
}

export default App;