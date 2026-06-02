// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

// Extracted Components
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';

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

// 🚀 Core Application Entry Layer
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

// 🚀 Core Content Wrapper Layer (Enables clean programmatic useNavigate executions)
function AppContent() {
  const navigate = useNavigate(); // 🚀 Hook activation for immediate dashboard redirection

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

  const refreshTournamentList = () => {
    setTournamentRefreshToken(prev => prev + 1);
  };

  const handleLogin = (user) => {
    // Collect profile payload, write to local session cache, and push into state
    localStorage.setItem('efmpro_user', JSON.stringify(user));
    setCurrentUser(user);
    setLoginModalOpen(false);

    // 🚀 REDIRECT: Redirects registered or logging-in managers directly to dashboard!
    navigate('/dashboard');
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
                  onJoinSuccess={(leagueId) => {
                    setSelectedLeagueId(leagueId);
                    navigate('/matchday-hub'); // 🚀 Auto-route straight into tactical play if a join fills the bracket!
                  }}
                  onViewLeague={(leagueId) => {
                    setSelectedLeagueId(leagueId);
                    navigate('/standings'); // 🚀 THE FIX: Fires tracking token AND updates active window route context smoothly!
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
    
    {/* 🚀 FIXED: Removed the selectedLeagueId restriction wrapper so it renders instantly from the navbar! */}
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
        onClose={() => setLoginModalOpen(false)} // 🚀 FIXED: Swapped matching prop name layout safely
        onLogin={handleLogin}
      />
    </div>
  );
}

function MakeSelectionWrapper({ setLeague, user }) {
  return (
    <LeagueSelector currentUser={user} onSelectLeague={(league) => setLeague(league._id || league)} />
  );
}

export default App;