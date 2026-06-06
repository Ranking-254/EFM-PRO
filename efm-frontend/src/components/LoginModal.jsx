// src/components/LoginModal.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLockedOut, setIsLockedOut] = useState(false); // 🚀 NEW: State flag to completely lock typing fields

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const val = identifier.trim();
        if (!val) {
            setError('Please enter your username or eFootball ID.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, {
                identifier: val
            });

            // 🚀 INTERCEPT RATE LIMITER (If backend returns statusCode 200/400 but success is false)
            if (res.data.success === false) {
                setError(res.data.error || 'Too many attempts.');
                setIsSubmitting(false);
                setIsLockedOut(true); // 🚀 FREEZE THE INTERFACE: Locks inputs and buttons instantly
                return; // Halts execution right here
            }

            if (res.data.success) {
                setTimeout(() => {
                    if (onLogin) onLogin(res.data.data);
                    setIdentifier('');
                    setError('');
                }, 300);
            }
        } catch (err) {
            // Falls back here if the server throws a traditional 429/500 raw status error code instead
            let serverErr = 'Login failed. Please try again.';
            if (err.response) {
                serverErr = err.response.data?.error || err.response.data || serverErr;
                // If it returns a standard 429 error code block, we lock them out here too
                if (err.response.status === 429) {
                    setIsLockedOut(true);
                }
            }
            setError(serverErr);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#121824] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white tracking-tight">Manager Login</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        ✕ Close
                    </button>
                </div>

                <p className="text-xs text-slate-400">
                    Enter your <span className="text-cyan-400 font-bold">eFootball ID</span> or <span className="text-cyan-400 font-bold">username</span> to access your dashboard.
                </p>

                {error && (
                    <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400 animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username or eFootball ID</label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder={isLockedOut ? "Access Suspended" : "e.g. #KONAMI-ID or username"}
                            disabled={isSubmitting || isLockedOut} // 🚀 FIXED: Blocks typing entirely when user is locked out
                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                            autoFocus={!isLockedOut}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || isLockedOut} // 🚀 FIXED: Completely prevents spam clicking form submissions
                        className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm py-4 rounded-xl shadow-lg shadow-cyan-400/10 active:scale-[0.99] transition-all disabled:opacity-30 disabled:pointer-events-none uppercase tracking-wider"
                    >
                        {isSubmitting ? 'Authenticating...' : isLockedOut ? 'Locked Out' : 'Enter Dashboard'}
                    </button>

                    <p className="text-center text-[11px] text-slate-500">
                        No account?{' '}
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                window.location.href = "/register";
                            }}
                            disabled={isLockedOut} // 🚀 Optional: Protect onboarding traversal fields if locked out
                            className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors disabled:opacity-30 disabled:no-underline"
                        >
                            Register here
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;