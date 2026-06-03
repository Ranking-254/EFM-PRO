// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell'; // 🚀 IMPORTED: Notification bell component template layer

function Navbar({ currentUser, handleLogout, setLoginModalOpen, mobileNavOpen, setMobileNavOpen, onNotificationCleared }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="border-b border-slate-900 bg-[#090d14]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo Link */}
        <Link 
          to="/" 
          onClick={() => setMobileNavOpen(false)} 
          className="flex items-center gap-3 cursor-pointer"
        >
          <span className="text-2xl font-black tracking-tighter text-cyan-400 italic font-sans">
            EFM-PRO
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link to="/" className={`hover:text-white transition-colors ${currentPath === '/' ? 'text-white' : ''}`}>Home</Link>
          <Link to="/tournament" className={`hover:text-white transition-colors ${currentPath === '/tournament' ? 'text-white' : ''}`}>Tournaments</Link>
          
          {currentUser ? (
            <Link to="/dashboard" className={`hover:text-white transition-colors ${currentPath === '/dashboard' ? 'text-white' : ''}`}>Dashboard</Link>
          ) : (
            <button onClick={() => setLoginModalOpen(true)} className="hover:text-white transition-colors uppercase font-bold text-xs tracking-widest">Login</button>
          )}
          
          <Link to="/support" className={`hover:text-white transition-colors ${currentPath === '/support' ? 'text-white' : ''}`}>Support</Link>
        </nav>

        {/* 📱 MOBILE ACTION TRAY: Renders side-by-side with hamburger on small screens */}
        <div className="flex md:hidden items-center gap-3">
          {currentUser && (
            <NotificationBell 
              currentUser={currentUser} 
              onNotificationCleared={onNotificationCleared} 
            />
          )}

          {/* Mobile Nav Menu Toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
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
        </div>

        {/* Desktop Profile Status / Action buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button className="hidden sm:inline-flex bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold tracking-wider uppercase py-2 px-4 rounded-xl transition-all">
            Join season 
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3">
              
              {/* 🚀 DESKTOP BELL: Renders in front of manager profile tags */}
              <NotificationBell 
                currentUser={currentUser} 
                onNotificationCleared={onNotificationCleared} 
              />

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse"></span>
                <span className="text-slate-400 font-normal">MANAGER:</span>
                <span className="text-cyan-400 font-mono">{currentUser.username}</span>
              </div>
              <button
                onClick={() => navigate('/matchday-hub')}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black tracking-wider uppercase py-2 px-4 rounded-xl shadow-lg shadow-cyan-400/10 transition-all"
              >
                Fixtures & Scores
              </button>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 text-xs font-bold uppercase transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/register"
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black tracking-wider uppercase py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-400/5 transition-all inline-block"
            >
              Register Squad
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Navigation */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#090d14] px-4 py-5 space-y-4 animate-fade-in">
          
          {/* Display active Manager banner at top of mobile menu if logged in */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3 py-2.5 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse"></span>
              <span className="text-slate-400 font-normal">MANAGER:</span>
              <span className="text-cyan-400 font-mono">{currentUser.username}</span>
            </div>
          )}

          <div className="space-y-1">
            <Link to="/" onClick={() => setMobileNavOpen(false)} className={`block w-full text-left text-sm font-bold uppercase tracking-wider py-2 ${currentPath === '/' ? 'text-cyan-400' : 'text-slate-400'}`}>Home</Link>
            <Link to="/tournament" onClick={() => setMobileNavOpen(false)} className={`block w-full text-left text-sm font-bold uppercase tracking-wider py-2 ${currentPath === '/tournament' ? 'text-cyan-400' : 'text-slate-400'}`}>Tournaments</Link>
            <Link to="/support" onClick={() => setMobileNavOpen(false)} className={`block w-full text-left text-sm font-bold uppercase tracking-wider py-2 ${currentPath === '/support' ? 'text-cyan-400' : 'text-slate-400'}`}>Support</Link>
            
            {currentUser && (
              <Link to="/dashboard" onClick={() => setMobileNavOpen(false)} className={`block w-full text-left text-sm font-bold uppercase tracking-wider py-2 ${currentPath === '/dashboard' ? 'text-cyan-400' : 'text-slate-400'}`}>Dashboard</Link>
            )}
          </div>

          <div className="pt-2 border-t border-slate-900 space-y-3">
            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    navigate('/matchday-hub');
                    setMobileNavOpen(false);
                  }}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black tracking-wider uppercase py-3 px-4 rounded-xl shadow-lg text-center block transition-all"
                >
                  Fixtures & Scores
                </button>
                <button 
                  onClick={() => { 
                    handleLogout(); 
                    setMobileNavOpen(false); 
                  }} 
                  className="w-full text-center text-xs font-bold uppercase tracking-wider py-2 text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { 
                    setLoginModalOpen(true); 
                    setMobileNavOpen(false); 
                  }} 
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center text-xs font-bold uppercase tracking-wider py-3 rounded-xl text-cyan-400 transition-colors"
                >
                  Login
                </button>
                <Link 
                  to="/register" 
                  onClick={() => setMobileNavOpen(false)} 
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black tracking-wider uppercase py-3 px-4 rounded-xl text-center block transition-all"
                >
                  Register Squad
                </Link>
              </>
            )}
          </div>

        </div>
      )}
    </header>
  );
}

export default Navbar;