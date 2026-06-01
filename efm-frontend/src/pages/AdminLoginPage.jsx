//src/pages/AdminLoginPage.jsx
import React, { useState } from 'react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

const AdminLoginPage = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            if (password === ADMIN_PASSWORD) {
                if (onLogin) onLogin();
            } else {
                setError('Incorrect admin password.');
            }
            setLoading(false);
        }, 600);
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-md bg-[#121824]/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="text-2xl">🔒</div>
                    <h3 className="text-xl font-black text-white tracking-tight">Admin Access</h3>
                    <p className="text-xs text-slate-400">Enter the admin password to continue.</p>
                </div>

                {error && (
                    <div className="p-3 rounded-xl text-xs font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            autoFocus
                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all text-center tracking-widest"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm py-4 rounded-xl shadow-lg shadow-amber-400/10 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider"
                    >
                        {loading ? 'Verifying...' : 'Unlock Admin Desk'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;
