// src/components/NotFoundPage.jsx
import React from 'react';

const NotFoundPage = ({ onGoHome }) => {
    return (
        <div className="min-h-[75vh] flex items-center justify-center p-4 relative overflow-hidden select-none">
            
            {/* 🌌 CINEMATIC AMBIENT GLOW BACKDROP */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse duration-[4000ms]" />
            <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-pulse duration-[3000ms]" />

            <div className="max-w-md w-full bg-[#0f131c]/90 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl relative z-10 transition-all duration-300 hover:border-cyan-500/20 group">
                
                {/* ⚽ ANIMATED HEADER ZONE */}
                <div className="space-y-4 relative">
                    {/* Floating Football Wrapper */}
                    <div className="flex justify-center transform group-hover:scale-110 transition-transform duration-300">
                        <div className="text-4xl filter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-bounce duration-[2500ms] flex items-center justify-center bg-slate-950 border border-slate-800 w-16 h-16 rounded-2xl relative">
                            <span className="animate-spin duration-[8000ms] inline-block">⚽</span>
                            {/* Tiny scanning radar ring */}
                            <span className="absolute inset-0 rounded-2xl border border-cyan-400/40 animate-ping opacity-70 pointer-events-none scale-75" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        {/* Glowing 404 Number Layer */}
                        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-slate-200 to-emerald-400 tracking-tighter leading-none filter drop-shadow-[0_2px_10px_rgba(6,182,212,0.15)] italic">
                            404
                        </h1>
                        <p className="text-[10px] font-mono font-black text-cyan-400 tracking-widest uppercase bg-cyan-500/5 border border-cyan-500/10 py-1 px-3 rounded-md max-w-max mx-auto">
                            ⚠️ Offside Incident
                        </p>
                    </div>
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
                </div>

                {/* 📝 DESCRIPTION CONTEXT */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
                        Tactical Route Lost
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                       The page you're looking for is not here
                       </p>
                </div>

                {/* 🚀 ACTION BUTTONS */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={onGoHome}
                        className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-lg shadow-cyan-500/10 transition-all transform active:scale-[0.98] hover:shadow-cyan-400/20 group/btn flex items-center justify-center gap-2"
                    >
                        <span>Return to Home</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NotFoundPage;