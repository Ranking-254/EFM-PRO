// src/App.jsx
import React, { useState, useEffect } from 'react';
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

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('efmpro_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentView] = useState('landing');
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tournamentRefreshToken, setTournamentRefreshToken] = useState(0);
  
  // Protect path tracking states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Intercept the /admin URL matching intent
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path === '/admin/') {
      setCurrentView('admin-auth');
    }
  }, []);

  const refreshTournamentList = () => {
    setTournamentRefreshToken(prev => prev + 1);
  };

  const goToTournaments = () => {
    refreshTournamentList();
    setCurrentView('league-recruitment');
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleAdminSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('admin-desk');
  };

  const handleJoinSuccess = (leagueId) => {
    setSelectedLeagueId(leagueId);
    setCurrentView('matchday-hub');
  };

  const navigateToStandings = (leagueId) => {
    const id = leagueId || selectedLeagueId;
    if (id) {
      setSelectedLeagueId(id);
      setCurrentView('standings');
    } else {
      goToTournaments();
    }
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 selection:bg-cyan-400 selection:text-slate-900 font-sans antialiased">

      <header className="border-b border-slate-900 bg-[#090d14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentView('landing'); setMobileNavOpen(false); }}>
            <span className="text-2xl font-black tracking-tighter text-cyan-400 italic font-sans">
              EFM-PRO
            </span>
          </div>

          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <button onClick={() => setCurrentView('landing')} className={`hover:text-white transition-colors ${currentView === 'landing' ? 'text-white' : ''}`}>Home</button>
            <button onClick={() => goToTournaments()} className={`hover:text-white transition-colors ${currentView === 'league-recruitment' ? 'text-white' : ''}`}>Tournaments</button>
            <button onClick={() => currentUser ? setCurrentView('dashboard') : setLoginModalOpen(true)} className={`hover:text-white transition-colors ${currentUser ? 'text-white' : ''}`}>
              {currentUser ? 'Dashboard' : 'Login'}
            </button>
            <button onClick={() => setCurrentView('support')} className={`hover:text-white transition-colors ${currentView === 'support' ? 'text-white' : ''}`}>Support</button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button className="hidden sm:inline-flex bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold tracking-wider uppercase py-2 px-4 rounded-xl transition-all">
              Join season 
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse"></span>
                  <span className="text-slate-400 font-normal">MANAGER:</span>
                  <span className="text-cyan-400 font-mono">{currentUser.username}</span>
                </div>
                <button
                  onClick={() => setCurrentView('matchday-hub')}
                  className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black tracking-wider uppercase py-2 px-4 rounded-xl shadow-lg shadow-cyan-400/10 transition-all"
                >
                  Matchday Hub
                </button>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-rose-400 text-xs font-bold uppercase transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView('register')}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black tracking-wider uppercase py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-400/5 transition-all"
              >
                Register Squad
              </button>
            )}
          </div>
        </div>

       {mobileNavOpen && (
  <div className="md:hidden border-t border-slate-800 bg-[#090d14] px-4 py-4 space-y-3">
    {/* Base Navigation Links (Visible to everyone) */}
    <button onClick={() => { setCurrentView('landing'); setMobileNavOpen(false); }} className={`block w-full text-left text-sm font-bold uppercase tracking-wider py-2 ${currentView === 'landing' ? 'text-cyan-400' : 'text-slate-400'}`}>Home</button>
    <button onClick={() => { goToTournaments(); setMobileNavOpen(false); }} className={`block w-full text-left text-sm font-bold uppercase tracking-wider py-2 ${currentView === 'league-recruitment' ? 'text-cyan-400' : 'text-slate-400'}`}>Tournaments</button>
    <button onClick={() => { setCurrentView('support'); setMobileNavOpen(false); }} className={`block w-full text-left text-sm font-bold uppercase tracking-wider py-2 ${currentView === 'support' ? 'text-cyan-400' : 'text-slate-400'}`}>Support</button>

    {/* Authentication & Protected Actions (Always Last) */}
    {currentUser ? (
      <>
        {/* Only visible when logged in */}
        <button onClick={() => { setCurrentView('dashboard'); setMobileNavOpen(false); }} className={`block w-full text-left text-sm font-bold uppercase tracking-wider py-2 ${currentView === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'}`}>Dashboard</button>
        
        <button onClick={() => { handleLogout(); setMobileNavOpen(false); }} className="block w-full text-left text-sm font-bold uppercase tracking-wider py-2 text-rose-400">Logout</button>
      </>
    ) : (
      <>
        <button onClick={() => { setLoginModalOpen(true); setMobileNavOpen(false); }} className="block w-full text-left text-sm font-bold uppercase tracking-wider py-2 text-cyan-400">Login</button>
        <button onClick={() => { setCurrentView('register'); setMobileNavOpen(false); }} className="block w-full text-left text-sm font-bold uppercase tracking-wider py-2 text-white">Register Squad</button>
      </>
    )}
  </div>
)}
</header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {currentView === 'landing' && (
          <div className="relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/bg.jpg')" }}
            ></div>
            <div className="absolute inset-0 bg-[#090d14]/85"></div>
            <div className="relative space-y-12 text-center max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1 bg-[#a3e635]/10 text-[#a3e635] text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-[#a3e635]/20 mx-auto">
                  ✦ Season 1 Registration Open
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-none">
                  Rise to the Top of the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 italic">Pitch</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-medium">
                  The ultimate eFootball management platform. Track performance, dominate leagues, and prove your tactical genius against the world's best virtual managers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentView(currentUser ? 'league-recruitment' : 'register')}
                  className="w-full sm:w-auto bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm tracking-wider uppercase py-4 px-8 rounded-xl shadow-xl shadow-cyan-400/10 transition-all transform hover:scale-[1.02]"
                >
                  {currentUser ? 'Browse Tournaments' : 'Register Your Squad'}
                </button>
                <button
                  onClick={() => currentUser ? setCurrentView('dashboard') : setLoginModalOpen(true)}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-bold text-sm tracking-wide py-4 px-8 rounded-xl transition-all"
                >
                  {currentUser ? 'My Dashboard' : 'Manager Login'}
                </button>
              </div>

              <div className="max-w-5xl mx-auto pt-16 space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-cyan-400/10 text-cyan-400 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-cyan-400/20">
                    How It Works
                  </div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">From Registration to Matchday in 4 Steps</h3>
                  <p className="text-sm text-slate-400">Get started in minutes and take control of your tournament destiny.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-lg font-black text-cyan-400 border border-cyan-400/20">1</div>
                    <h4 className="text-sm font-black text-white">Register Your Squad</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Create your manager profile with your eFootball ID, full name, and WhatsApp contact.</p>
                  </div>
                  <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-lg font-black text-cyan-400 border border-cyan-400/20">2</div>
                    <h4 className="text-sm font-black text-white">Join a Tournament</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Browse open brackets, pick a league that matches your team strength, and reserve your slot.</p>
                  </div>
                  <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-lg font-black text-cyan-400 border border-cyan-400/20">3</div>
                    <h4 className="text-sm font-black text-white">Submit Results</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">After each matchday, submit your score. If both players agree, the result is confirmed automatically.</p>
                  </div>
                  <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-lg font-black text-cyan-400 border border-cyan-400/20">4</div>
                    <h4 className="text-sm font-black text-white">Climb the Table</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Track your position in real-time on the standings. Contact your opponent, resolve disputes, and fight for the top spot.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'register' && (
          <div className="w-full flex justify-center py-4">
            <Register
              onRegistrationSuccess={handleLogin}
              onCancel={() => setCurrentView('landing')}
            />
          </div>
        )}

        {currentView === 'league-recruitment' && (
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
            <div className="flex-grow"></div>
            <div className="w-full flex justify-center">
              <TournamentHub
                currentUser={currentUser}
                onJoinSuccess={handleJoinSuccess}
                onViewLeague={(leagueId, view) => {
                  if (view === 'standings') {
                    navigateToStandings(leagueId);
                  } else {
                    setSelectedLeagueId(leagueId);
                    setCurrentView(view || 'matchday-hub');
                  }
                }}
                refreshKey={tournamentRefreshToken}
              />
            </div>
          </div>
        )}

        {currentView === 'matchday-hub' && (
          <div className="w-full space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Matchday Hub</h2>
                <p className="text-xs text-slate-400">Review fixtures and submit your match results.</p>
              </div>
              {currentUser ? (
                <button
                  onClick={navigateToStandings}
                  className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-bold text-sm tracking-wide py-4 px-8 rounded-xl transition-all"
                >
                  View Live Table
                </button>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-bold text-sm tracking-wide py-4 px-8 rounded-xl transition-all"
                >
                  Manager Login
                </button>
              )}
            </div>
            {selectedLeagueId ? (
              <MatchdayHub leagueId={selectedLeagueId} currentUser={currentUser} />
            ) : (
              <p className="text-center text-slate-500 py-12">Join a tournament bracket to access the Matchday Hub.</p>
            )}
          </div>
        )}

        {currentView === 'standings' && (
          <div className="w-full space-y-8">
            {!selectedLeagueId ? (
              <LeagueSelector
                currentUser={currentUser}
                onSelectLeague={(league) => {
                  setSelectedLeagueId(league._id);
                }}
              />
            ) : (
              <LeagueTable leagueId={selectedLeagueId} currentUser={currentUser} />
            )}
          </div>
        )}

        {/* Catch-all Auth Page for the Hidden /admin link */}
        {currentView === 'admin-auth' && (
          <AdminLoginPage onLogin={handleAdminSuccess} />
        )}

        {/* Securely Protected Admin View */}
        {currentView === 'admin-desk' && (
          <div className="w-full space-y-8">
            {isAdminAuthenticated ? (
              <>
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-400 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-amber-400/20">
                    ⚖️ Organizer Access Only
                  </div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Administrative Resolution Desk</h2>
                  <p className="text-sm text-slate-400">
                    Resolve disputed matches and unlock the standings calculation.
                  </p>
                </div>
                <AdminDesk
                  leagueId={selectedLeagueId}
                  onSelectLeague={(league) => setSelectedLeagueId(league._id || league)}
                />
              </>
            ) : (
              <div className="w-full space-y-8">
                <NotFoundPage onGoHome={() => setCurrentView('landing')} />
              </div>
            )}
          </div>
        )}

        {currentView === 'dashboard' && currentUser && (
          <div className="w-full space-y-8">
            <DashboardPage
              currentUser={currentUser}
              onNavigate={(view, leagueId) => {
                if (view === 'standings' && leagueId) {
                  setSelectedLeagueId(leagueId);
                  setCurrentView('standings');
                } else if (view === 'league-recruitment') {
                  goToTournaments();
                } else {
                  setCurrentView(view);
                }
              }}
            />
          </div>
        )}

        {(currentView === 'dashboard' && !currentUser) && (
          <div className="w-full space-y-8">
            <NotFoundPage onGoHome={() => setCurrentView('landing')} />
          </div>
        )}

        {currentView === 'support' && (
          <div className="w-full space-y-8">
            <SupportPage onNavigate={(view) => setCurrentView(view)} />
          </div>
        )}

        {currentView === 'faq' && (
          <div className="w-full space-y-8">
            <FAQPage onBack={() => setCurrentView('support')} />
          </div>
        )}

        {currentView === 'tournament-rules' && (
          <div className="w-full space-y-8">
            <TournamentRulesPage onBack={() => setCurrentView('support')} />
          </div>
        )}

        {currentView === 'terms-of-service' && (
          <div className="w-full space-y-8">
            <TermsOfServicePage onBack={() => setCurrentView('support')} />
          </div>
        )}

        {currentView === 'privacy-policy' && (
          <div className="w-full space-y-8">
            <PrivacyPolicyPage onBack={() => setCurrentView('support')} />
          </div>
        )}

        {!['landing','register','league-recruitment','matchday-hub','standings','admin-desk','admin-auth','support','faq','dashboard'].includes(currentView) && (
          <div className="w-full space-y-8">
            <NotFoundPage onGoHome={() => setCurrentView('landing')} />
          </div>
        )}

      </main>

      <footer className="border-t border-slate-900 bg-[#070a0f] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-4">
              <span className="font-black text-white tracking-widest text-sm">EFM-PRO</span>
              <p className="text-slate-400 leading-relaxed">
                The world's premier platform for competitive eFootball management.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Navigation</span>
              <button onClick={() => setCurrentView('landing')} className="text-left hover:text-white transition-colors">Home</button>
              <button onClick={() => goToTournaments()} className="text-left hover:text-white transition-colors">Leagues</button>
              <button onClick={() => setCurrentView('support')} className="text-left hover:text-white transition-colors">Contact</button>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Legal</span>
              <button onClick={() => setCurrentView('tournament-rules')} className="text-left hover:text-white transition-colors">Tournament Rules</button>
              <button onClick={() => setCurrentView('terms-of-service')} className="text-left hover:text-white transition-colors">Terms of Service</button>
              <button onClick={() => setCurrentView('privacy-policy')} className="text-left hover:text-white transition-colors">Privacy Policy</button>
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
            <p>© 2025 EFM-PRO. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLogin}
      />

    </div>
  );
}

export default App;