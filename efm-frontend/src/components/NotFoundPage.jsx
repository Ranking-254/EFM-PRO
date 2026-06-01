// src/components/NotFoundPage.jsx
import React from 'react';

const NotFoundPage = ({ onGoHome }) => {
    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="max-w-md w-full bg-[#0f131c] border border-slate-800 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
                <div className="space-y-2">
                    <span className="text-6xl font-black text-slate-800 block leading-none">404</span>
                    <div className="h-px bg-slate-900"></div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">Page Not Found</h2>
                    <p className="text-sm text-slate-400">
                        The page you are looking for doesn’t exist or has been moved. Head back to the homepage to continue.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={onGoHome}
                        className="w-full sm:w-auto bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl shadow-lg shadow-cyan-400/10 transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
