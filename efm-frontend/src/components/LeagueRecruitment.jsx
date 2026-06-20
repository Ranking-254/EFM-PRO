// src/components/TournamentHub
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const TournamentHub = ({ currentUser, onJoinSuccess, onViewLeague, refreshKey, setLoginModalOpen }) => {
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(null);
    const [isReserving, setIsReserving] = useState(false); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Core Filter States
    const [filter, setFilter] = useState('all'); // 'all', 'recruiting', 'active'
    const [formatFilter, setFormatFilter] = useState('all'); // 'all', 'classic', 'knockout', 'group_knockout'
    
    const [userBookingState, setUserBookingState] = useState(currentUser?.hasBookedUpcoming || false);

    // MODAL STATE ENGINE
    const [rulesModal, setRulesModal] = useState({ isOpen: false, league: null, targetAction: null });


    // 🚀 ADD HERE: Link Share State & Helper Hooks
    const [copyStateId, setCopyStateId] = useState(null);

    const triggerCopyLink = async (e, leagueId) => {
        e.stopPropagation();
        const deepResourceUrl = `${window.location.origin}/tournaments/${leagueId}`;
        try {
            await navigator.clipboard.writeText(deepResourceUrl);
            setCopyStateId(leagueId);
            setTimeout(() => setCopyStateId(null), 1800);
        } catch (err) {
            console.error('Clipboard text write failure:', err);
        }
    };

   const triggerWhatsAppShare = (e, leagueId, leagueName, status) => {
        e.stopPropagation();
        const deepResourceUrl = `${window.location.origin}/tournaments/${leagueId}`;
        
        // Dynamic messaging template based on tournament recruitment status
        const messageTitle = status === 'recruiting'
            ? `📝 *EFM-PRO SQUAD SLOTS OPEN* 📝\n\nSlots are open for the upcoming season of: *${leagueName}*!`
            : `🎮 *EFM-PRO LIVE MATCH BROADCAST* 🎮\n\nTrack brackets and live standings positions for the league: *${leagueName}*!`;

        const inviteMessage = encodeURIComponent(
            `${messageTitle}\n\n📌 *Click Invite Link to Access Here:* \n${deepResourceUrl}`
        );
        window.open(`https://wa.me/?text=${inviteMessage}`, '_blank');
    };

    useEffect(() => {
        if (currentUser) {
            setUserBookingState(currentUser.hasBookedUpcoming || false);
        }
    }, [currentUser]);

    const fetchLeagues = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/leagues/all`);
            if (res.data.success) {
                setLeagues(res.data.data);
            }
        } catch (err) {
            setError('Failed to load leagues. Please try again later.');
            console.error('League fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeagues();
    }, [fetchLeagues, refreshKey]);

    const handleJoinBracket = async (leagueId) => {
        // 🚀 UPDATED INTERCEPTOR: Open the login portal instantly if a guest taps the CTA
        if (!currentUser) {
            if (typeof setLoginModalOpen === 'function') {
                setLoginModalOpen(true);
            } else {
                setError('Authentication required. Please use the login portal in the navigation bar.');
            }
            return;
        }

        setJoining(leagueId);
        setError('');
        setSuccess('');

        try {
            const res = await axios.post(`${API_BASE_URL}/leagues/${leagueId}/join`, {
                userId: currentUser.id || currentUser._id
            });

            if (res.data.success) {
                setSuccess(res.data.message);
                fetchLeagues();

                if (res.data.status === 'active' && onJoinSuccess) {
                    setTimeout(() => onJoinSuccess(leagueId), 1500);
                }
            }
        } catch (err) {
            const serverErr = err.response?.data?.error || 'Failed to join league.';
            setError(serverErr);
        } finally {
            setJoining(null);
        }
    };

    const handleGlobalReserveSpot = async () => {
        const userId = currentUser?.id || currentUser?._id;
        if (!userId) {
            setError('Please sign in to log a spot reservation for next season.');
            return;
        }

        setIsReserving(true);
        setError('');
        setSuccess('');

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/book-slot/${userId}`);
            if (res.data.success) {
                setSuccess(res.data.message);
                setUserBookingState(true);
                if (currentUser) currentUser.hasBookedUpcoming = true;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Reservation failed. Please try again.');
        } finally {
            setIsReserving(false);
        }
    };

    const handleViewFixtures = (leagueId) => {
        if (onViewLeague) {
            onViewLeague(leagueId);
        }
    };

    const handleViewStandingsClick = (league, hasJoined) => {
        if (hasJoined || league.status === 'active') {
            setRulesModal({ isOpen: true, league, targetAction: 'standings' });
        } else {
            if (onViewLeague) onViewLeague(league._id, 'standings', league.tournamentFormat);
        }
    };

    const executeRulesAcknowledge = () => {
        const { league, targetAction } = rulesModal;
        setRulesModal({ isOpen: false, league: null, targetAction: null });
        
        if (targetAction === 'standings' && onViewLeague && league) {
            onViewLeague(league._id, 'standings', league.tournamentFormat);
        }
    };

    const getCapacityPercentage = (filled, total) => {
        return Math.round((filled / total) * 100);
    };

    // 🚀 DUAL LAYER DYNAMIC FILTER HOOK:
    const filteredLeagues = leagues.filter(l => {
        const matchesStatus = filter === 'all' || l.status === filter;
        
        const formatClean = String(l.tournamentFormat || 'classic').trim().toLowerCase();
        let resolvedFormat = 'classic';
        if (formatClean === 'knockout') resolvedFormat = 'knockout';
        if (formatClean === 'group_knockout' || formatClean.includes('pool') || formatClean.includes('group')) {
            resolvedFormat = 'group_knockout';
        }

        const matchesFormat = formatFilter === 'all' || resolvedFormat === formatFilter;

        return matchesStatus && matchesFormat;
    });

    const areAllLeaguesFull = leagues.length > 0 && leagues.every(l => l.slotsFilled >= l.capacity);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading Tournaments</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative text-left">
            {error && (
                <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl text-sm font-medium border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                    {success}
                </div>
            )}

            {/* --- FILTER CONTROL HUD OVERLAY --- */}
            <div className="space-y-3 bg-[#070a0f] border border-slate-900 p-4 rounded-2xl shadow-xl">
                
                {/* CAMPAIGN STATUS CONTROL ROW */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Campaign Status:</label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                filter === 'all' ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-extrabold' : 'bg-[#0f131c] text-slate-400 border-slate-800 hover:border-cyan-500/30'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('recruiting')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                filter === 'recruiting' ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-extrabold' : 'bg-[#0f131c] text-slate-400 border-slate-800 hover:border-cyan-500/30'
                            }`}
                        >
                            Recruiting
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                filter === 'active' ? 'bg-gradient-to-r from-emerald-500 to-[#a3e635] text-slate-950 border-emerald-400 font-extrabold' : 'bg-[#0f131c] text-slate-400 border-slate-800 hover:border-[#a3e635]/30'
                            }`}
                        >
                            Active
                        </button>
                    </div>
                </div>

                {/* 🚀 TOURNAMENT STYLE LAYOUT FORMAT FILTERS PANEL */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-900/60">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Tournament Rules Format:</label>
                    
                    {/* 📱 Mobile Dropdown Switch Select Selector Container (Hidden on Desktop) */}
                    <div className="block sm:hidden w-full relative">
                        <select
                            value={formatFilter}
                            onChange={(e) => setFormatFilter(e.target.value)}
                            className="w-full bg-[#0f131c] border border-slate-800 text-cyan-400 font-black font-mono text-xs px-4 py-3 rounded-xl focus:outline-none appearance-none"
                        >
                            <option value="all">📊 ALL SCHEDULERS</option>
                            <option value="classic">🏆 LEAGUE SYSTEM</option>
                            <option value="knockout">🪓 PURE KNOCKOUT</option>
                            <option value="group_knockout">⭐ POOLS + CUP</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400 text-xs font-mono font-black">▼</div>
                    </div>

                    {/* 💻 Desktop Inline Navigation Row Buttons HUD (Hidden on Mobile) */}
                    <div className="hidden sm:flex flex-wrap items-center gap-2">
                        {[
                            { key: 'all', label: '📊 All Formats' },
                            { key: 'classic', label: '🏆 League' },
                            { key: 'knockout', label: '🪓 Knockout' },
                            { key: 'group_knockout', label: '⭐ Pools + Cup' }
                        ].map((fmt) => (
                            <button
                                key={fmt.key}
                                onClick={() => setFormatFilter(fmt.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shrink-0 ${
                                    formatFilter === fmt.key
                                        ? 'bg-slate-800 border-slate-700 text-cyan-400 font-black shadow-inner'
                                        : 'bg-[#0f131c] text-slate-400 border-slate-900/60 hover:text-slate-200'
                                }`}
                            >
                                {fmt.label}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {areAllLeaguesFull && (
                <div className="w-full bg-[#121824]/60 backdrop-blur-md border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="space-y-1">
                        <h5 className="text-sm font-black text-white flex items-center gap-2">
                            <span className="text-amber-400">🎟️</span> Found all leagues full? Don't worry!
                        </h5>
                        <p className="text-xs text-slate-400 max-w-xl">
                            Press the reserve button to secure an unassigned slot. You will be automatically added to the waitlist for priority selection when the next season launches.
                        </p>
                    </div>
                    <button
                        onClick={handleGlobalReserveSpot}
                        disabled={userBookingState || isReserving}
                        className={`sm:w-auto w-full whitespace-nowrap py-3 px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
                            userBookingState 
                                ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed' 
                                : isReserving
                                ? 'bg-amber-400/40 border-amber-400 text-slate-950 cursor-wait'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/10 active:scale-[0.98]'
                        }`}
                    >
                        {isReserving ? 'Reserving...' : userBookingState ? '✓ Slot Reserved' : 'Reserve Next Season Slot'}
                    </button>
                </div>
            )}

            {filteredLeagues.length === 0 ? (
                <div className="text-center py-16 bg-[#0f131c]/40 rounded-3xl border border-dashed border-slate-900 max-w-md mx-auto">
                    <div className="text-slate-500 text-5xl mb-2">🔍</div>
                    <h3 className="text-md font-bold text-white mb-1">No Leagues Match Criteria</h3>
                    <p className="text-slate-400 text-xs">Try refreshing the page.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredLeagues.map((league) => {
                        const pct = getCapacityPercentage(league.slotsFilled, league.capacity);
                        const isFull = league.slotsFilled >= league.capacity;
                        const isJoining = joining === league._id;
                        const hasJoined = currentUser && league.players && league.players.includes(currentUser.id || currentUser._id);

                        return (
                            <div
                                key={league._id}
                                className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-cyan-500/30 transition-all group flex flex-col justify-between relative"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-lg font-black text-white tracking-tight group-hover:text-cyan-400 transition-colors max-w-[75%] truncate">
                                                {league.name}
                                            </h4>
                                            
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={() => setRulesModal({ isOpen: true, league, targetAction: 'info' })}
                                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-cyan-400 bg-slate-900/60 border border-slate-800 rounded-lg transition-colors"
                                                    title="View Rules & Instructions"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                                    </svg>
                                                </button>

                                                {league.status === 'active' ? (
                                                    <span className="bg-gradient-to-r from-emerald-500/10 to-[#a3e635]/10 text-[#a3e635] px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-[#a3e635]/20">
                                                        LIVE
                                                    </span>
                                                ) : league.status === 'completed' ? (
                                                    <span className="bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-500/20">
                                                        FINISHED
                                                    </span>
                                                ) : (
                                                    <span className="bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-cyan-400/20">
                                                        OPEN
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
                                            <span className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                                                Max STR: {league.maxStrengthLimit || 'Any'}
                                            </span>
                                            <span className="bg-slate-800/80 text-cyan-400 px-2 py-0.5 rounded-md border border-slate-700 font-extrabold font-mono">
                                                {league.tournamentFormat === 'knockout' ? '🪓 Knockout' : league.tournamentFormat === 'group_knockout' ? '⭐ Pools + Cup' : '🏆 Classic'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-slate-400">
                                            <span>SQUAD CAPACITY</span>
                                            <span className="text-white font-mono">
                                                {league.slotsFilled} / {league.capacity}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-lg h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-lg transition-all duration-500 ${
                                                    league.status === 'active' ? 'bg-[#a3e635]' : pct >= 70 ? 'bg-amber-400' : 'bg-cyan-400'
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {league.status === 'active' && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                            <span className="w-1.5 h-1.5 bg-[#a3e635] rounded-full animate-pulse"></span>
                                            Matchday {league.currentMatchday || 1} in progress
                                        </div>
                                    )}
                                </div>
                                <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between gap-2 bg-[#090d14]/40 p-2 rounded-xl">
                                    <button 
                                        onClick={(e) => triggerCopyLink(e, league._id)}
                                        className={`flex-1 text-[10px] font-black uppercase tracking-wider py-2 rounded-lg font-mono border transition-all ${
                                            copyStateId === league._id 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                                : 'bg-[#0f131c] text-slate-400 border-slate-800 hover:border-slate-700 text-slate-300'
                                        }`}
                                    >
                                        {copyStateId === league._id ? '✓ Copied' : '🔗 Copy Link'}
                                    </button>
                                    <button 
                                        onClick={(e) => triggerWhatsAppShare(e, league._id, league.name)}
                                        className="flex-1 text-[10px] font-black uppercase tracking-wider py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all font-mono"
                                    >
                                        📱 Share Invite
                                    </button>
                                </div>

                                <div className="pt-4">
                                    {league.status === 'recruiting' && !isFull ? (
                                       <button
                                            onClick={() => {
                                                if (!currentUser) {
                                                    // Trigger your login modal handler directly here
                                                    if (typeof setLoginModalOpen === 'function') {
                                                        setLoginModalOpen(true);
                                                    } else {
                                                        // Fallback alert framework if prop isn't passed down yet
                                                        setError('Please open the login portal from the navbar to continue.');
                                                    }
                                                } else {
                                                    handleJoinBracket(league._id);
                                                }
                                            }}
                                            disabled={isJoining || (currentUser && hasJoined)}
                                            className={`w-full text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all border ${
                                                hasJoined
                                                    ? 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/30 cursor-default'
                                                    : !currentUser
                                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 shadow-lg shadow-cyan-500/[0.05]' // Active glow for guests!
                                                    : isJoining
                                                    ? 'bg-cyan-400/50 text-slate-950 border border-cyan-400'
                                                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-400/10 active:scale-[0.98]'
                                            }`}
                                        >
                                            {isJoining ? 'Joining...' : hasJoined ? 'Joined ✓' : !currentUser ? '🔒 Login to Join Bracket' : 'Join Bracket'}
                                        </button>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                                            {hasJoined && league.status === 'active' && (
                                                <button
                                                    onClick={() => handleViewFixtures(league._id)}
                                                    className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-cyan-400/10 active:scale-[0.98] transition-all"
                                                >
                                                    Matchday Hub
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleViewStandingsClick(league, hasJoined)}
                                                className={`${hasJoined && league.status === 'active' ? 'flex-1' : 'w-full'} bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all active:scale-[0.99]`}
                                            >
                                                View Standings
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* RULES & INSTRUCTIONS SCROLL-MANDATORY OVERLAY MODAL */}
            {rulesModal.isOpen && rulesModal.league && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-xl bg-[#121824] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
                        
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#161d2b] rounded-t-3xl">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                                    Official Briefing
                                </span>
                                <h3 className="text-xl font-black text-white tracking-tight pt-1">
                                    {rulesModal.league.name} Rules & Guidelines
                                </h3>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 custom-scrollbar flex-1">
                            {rulesModal.league.rules ? (
                                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-2">
                                    <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                        📢 Special Admin Instructions
                                    </h5>
                                    <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                                        {rulesModal.league.rules}
                                    </p>
                                </div>
                            ) : null}

                            <div className="bg-[#0b0f17] border border-slate-800/60 rounded-xl p-4 space-y-3">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    📅 Season Timeline & Launch
                                </h5>
                                <div className="text-xs text-slate-300 space-y-1.5 font-medium">
                                    <ppx>• <span className="text-white font-bold">Start Date:</span> Matches begin immediately once bracket filling concludes.</ppx>
                                    <p>• <span className="text-white font-bold">Matchday Speed:</span> Managers get designated windows per round to finish pairings.</p>
                                    <p>• <span className="text-white font-bold">Status:</span> This league is currently <span className="text-cyan-400 font-bold uppercase">{rulesModal.league.status}</span>.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    🎮 Gameplay Instructions & Squad Limits
                                </h5>
                                <ul className="space-y-2 text-xs font-medium text-slate-400 list-none pl-0">
                                   <li className="flex items-start gap-2">
    <span className="text-cyan-400 mt-0.5">✔</span>
    <span>
        <strong className="text-slate-200">Team Strength Cap:</strong> Your active squad ratings must strictly stay within{' '}
        <span className="text-cyan-400 font-bold">
            Max STR: {rulesModal.league.maxStrengthLimit || 'Unlimited'}
        </span>{' '}
        limits.
    </span>
</li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-cyan-400 mt-0.5">✔</span>
                                        <span><strong className="text-slate-200">Result Submission:</strong> Both managers are expected to upload screenshots or match confirmations via the Matchday Hub interface promptly.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-cyan-400 mt-0.5">✔</span>
                                        <span><strong className="text-slate-200">Disconnect Rules:</strong> In the event of sudden network drops, play the remaining game time with the previous scoreline standing intact.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    🚨 Fairplay & Opponent Coordination
                                </h5>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Click your row inside the standings tracker board to access your opponent's dynamic WhatsApp direct chat module. Managers who display toxicity, deliberate delays, or input fake data metrics face immediate eviction and bans from upcoming registrations.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-[#0b0f17] border-t border-slate-800 rounded-b-3xl flex justify-end">
                            <button
                                onClick={rulesModal.targetAction === 'standings' ? executeRulesAcknowledge : () => setRulesModal({ isOpen: false, league: null, targetAction: null })}
                                className="w-full sm:w-auto bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-lg shadow-cyan-400/10 transition-all active:scale-[0.99]"
                            >
                                {rulesModal.targetAction === 'standings' ? 'I Understand, View Standings ✓' : 'Close Briefing'}
                            </button>
                        </div> 

                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentHub;