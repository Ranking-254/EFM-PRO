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

    // Filter to find notifications that haven't been marked as read yet
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleClearAll = async (e) => {
        e.stopPropagation(); // 🚀 PREVENTS CLICK BLEED-THROUGH
        if (notifications.length === 0 || !currentUserId) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/profile/clear-notifications`, { userId: currentUserId });
            if (res.data.success && onNotificationCleared) {
                onNotificationCleared(); 
                setIsOpen(false);
            }
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    };

    const handleMarkAllAsRead = async (e) => {
        e.stopPropagation(); // 🚀 PREVENTS CLICK BLEED-THROUGH
        if (unreadCount === 0 || !currentUserId) return;
        try {
            const res = await axios.put(`${API_BASE_URL}/auth/notifications/${currentUserId}/read`);
            if (res.data.success && onNotificationCleared) {
                onNotificationCleared(); 
            }
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    };

    return (
        <div className="relative">
            {/* 🔔 THE BELL BUTTON WITH BADGE */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-slate-300 hover:text-white z-40"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>

                {/* Unread Alerts count dynamic tracking */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 font-mono text-[9px] font-black text-white ring-2 ring-slate-950 animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* 📬 THE DROPDOWN ALERTS LIST */}
            {isOpen && (
                <>
                    {/* Backdrop cover curtain overlay */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 z-40 animate-in fade-in" 
                        onClick={() => setIsOpen(false)} 
                    />
                    
                    {/* Responsive Panel Wrapper Container */}
                    <div className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-20 md:top-auto mt-3 w-auto md:w-85 origin-top rounded-2xl border border-slate-800 bg-[#0f131c] p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        
                        {/* 🚀 FIXED: Mobile-only X close target button anchored directly to the top-left area block */}
                        <button 
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="md:hidden absolute top-3 left-4 p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3 pt-7 md:pt-0">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                Alerts Inbox ({notifications.length})
                            </h4>
                            
                            {/* 🚀 BUTTONS POOL CONTAINER WITH STRICT ISOLATED STRUCTURAL GAPS */}
                            <div className="flex items-center gap-4 relative z-50">
                                {unreadCount > 0 && (
                                    <button 
                                        type="button"
                                        onClick={handleMarkAllAsRead}
                                        className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-wider bg-cyan-500/5 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg transition-all"
                                    >
                                        Mark Read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button 
                                        type="button"
                                        onClick={handleClearAll}
                                        className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-wider bg-rose-500/5 border border-rose-500/20 px-2.5 py-1.5 rounded-lg transition-all"
                                    >
                                        Dismiss All
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-10 text-center text-xs text-slate-500 font-medium">
                                    📭 Inbox clear. There are no active notifications.
                                </div>
                            ) : (
                                notifications.map((notif, index) => {
                                    // 🚀 FIXED: Brightened up baseline fallback colors so generic items never turn invisible
                                    let badgeStyle = "bg-slate-900/60 border-slate-800 text-slate-300";
                                    let icon = "🔔";

                                    // Strict type parsing
                                    if (notif.type === 'league_assignment') {
                                        badgeStyle = "bg-emerald-500/5 border-emerald-500/20 text-emerald-300";
                                        icon = "🔥";
                                    } else if (notif.type === 'score_report') {
                                        badgeStyle = "bg-cyan-500/5 border-cyan-500/20 text-cyan-300";
                                        icon = "⚽";
                                    } else if (notif.type === 'admin_override') {
                                        badgeStyle = "bg-amber-500/5 border-amber-500/20 text-amber-300";
                                        icon = "⚖️";
                                    } else if (notif.type === 'new_league') {
                                        badgeStyle = "bg-fuchsia-500/5 border-fuchsia-500/20 text-fuchsia-300 animate-pulse";
                                        icon = "⚡";
                                    } else if (notif.type === 'general' || !notif.type) {
                                        // 🚀 NEW: Clean explicit capture for match tracking alerts, look-aheads, and general texts
                                        badgeStyle = "bg-slate-900/90 border-slate-800/80 text-slate-200 shadow-inner";
                                        icon = "📢";
                                    }

                                    // Safely evaluate the read status flag, treating old alerts as unread by default instead of breaking
                                    const isAlertRead = notif.isRead === true;

                                    return (
                                        <div 
                                            key={notif._id || index}
                                            className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 transition-all duration-200 ${badgeStyle} ${
                                                isAlertRead 
                                                    ? 'opacity-40 grayscale-[30%] bg-slate-950/20 border-slate-950/40 text-slate-500 shadow-none' 
                                                    : 'opacity-100 shadow-md shadow-black/40 border-slate-700/50'
                                            }`}
                                        >
                                            <span className="text-sm shrink-0 select-none">{icon}</span>
                                            <div className="space-y-1 w-full">
                                                <div className="font-medium tracking-wide break-words">{notif.message}</div>
                                                <div className="text-[8px] font-mono tracking-wider uppercase text-right select-none opacity-60">
                                                    {isAlertRead ? 'Archived' : 'New Alert'}
                                                </div>
                                            </div>
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