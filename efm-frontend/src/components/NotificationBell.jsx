// src/components/NotificationBell.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const NotificationBell = ({ currentUser, onNotificationCleared }) => {
    const [isOpen, setIsOpen] = useState(false);
    const notifications = currentUser?.notifications || [];
    const currentUserId = currentUser?.id || currentUser?._id;

    const handleClearAll = async () => {
        if (notifications.length === 0 || !currentUserId) return;
        try {
            // Clear notifications arrays on backend database documents
            const res = await axios.post(`${API_BASE_URL}/auth/profile/clear-notifications`, { userId: currentUserId });
            if (res.data.success && onNotificationCleared) {
                onNotificationCleared(); // Forces parent state to pull updated user object
                setIsOpen(false);
            }
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    };

    return (
        <div className="relative z-40">
            {/* 🔔 THE BELL BUTTON WITH BADGE */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-slate-300 hover:text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>

                {/* Unread Alerts Glow Badge */}
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 font-mono text-[9px] font-black text-white ring-2 ring-slate-950 animate-bounce">
                        {notifications.length}
                    </span>
                )}
            </button>

            {/* 📬 THE DROPDOWN ALERTS LIST */}
            {isOpen && (
                <>
                    {/* Backdrop cover overlay to handle clean background closing clicks */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    
                    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-slate-800/80 bg-[#0f131c] p-4 shadow-2xl ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 duration-150 z-20">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                Alerts Inbox ({notifications.length})
                            </h4>
                            {notifications.length > 0 && (
                                <button 
                                    onClick={handleClearAll}
                                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wide transition-colors"
                                >
                                    Dismiss All
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {notifications.length === 0 ? (
                                <div className="py-6 text-center text-xs text-slate-500 font-medium">
                                    📭 You currently have no notifications.
                                </div>
                            ) : (
                                notifications.map((notif, index) => {
    // Dynamically assign theme colors based on the type parameter
    let badgeStyle = "bg-slate-950/40 border-slate-900 text-slate-300";
    let icon = "🔔";

    if (notif.type === 'league_assignment') {
        badgeStyle = "bg-emerald-500/5 border-emerald-500/20 text-emerald-300";
        icon = "🔥";
    } else if (notif.type === 'score_report') {
        badgeStyle = "bg-cyan-500/5 border-cyan-500/20 text-cyan-300";
        icon = "⚽";
    } else if (notif.type === 'admin_override') {
        badgeStyle = "bg-amber-500/5 border-amber-500/20 text-amber-300";
        icon = "⚖️";
    }

    return (
        <div 
            key={notif._id || index}
            className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${badgeStyle}`}
        >
            <span className="text-sm shrink-0">{icon}</span>
            <div>{notif.message}</div>
        </div>
    );
})
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;