// src/pages/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage({ currentUser, setLoginModalOpen }) {
  const navigate = useNavigate();

  return (
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
            onClick={() => navigate(currentUser ? '/tournament' : '/register')}
            className="w-full sm:w-auto bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm tracking-wider uppercase py-4 px-8 rounded-xl shadow-xl shadow-cyan-400/10 transition-all transform hover:scale-[1.02]"
          >
            {currentUser ? 'Browse Tournaments' : 'Register Your Squad'}
          </button>
          <button
            onClick={() => currentUser ? navigate('/dashboard') : setLoginModalOpen(true)}
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
  );
}

export default LandingPage;