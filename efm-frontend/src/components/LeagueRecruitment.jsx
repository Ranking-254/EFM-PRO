// src/components/LeagueRecruitment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TournamentHub = ({ currentUser, onJoinSuccess, onViewLeague, refreshKey }) => {
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchLeagues = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/v1/leagues/all');
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
        if (!currentUser) {
            setError('You must be registered to join a league.');
            return;
        }

        setJoining(leagueId);
        setError('');
        setSuccess('');

        try {
            const res = await axios.post(`http://localhost:5000/api/v1/leagues/${leagueId}/join`, {
                userId: currentUser.id
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

    const handleViewFixtures = (leagueId) => {
        if (onViewLeague) {
            onViewLeague(leagueId);
        }
    };

    const getCapacityPercentage = (filled, total) => {
        return Math.round((filled / total) * 100);
    };

    const filteredLeagues = filter === 'all' 
        ? leagues 
        : leagues.filter(l => l.status === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading Tournaments</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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

            <div className="flex items-center gap-3">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        filter === 'all'
                            ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                            : 'bg-[#0f131c] text-slate-400 border-slate-800 hover:border-cyan-500/30'
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('recruiting')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        filter === 'recruiting'
                            ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                            : 'bg-[#0f131c] text-slate-400 border-slate-800 hover:border-cyan-500/30'
                    }`}
                >
                    Recruiting
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        filter === 'active'
                            ? 'bg-[#a3e635] text-slate-950 border-[#a3e635]'
                            : 'bg-[#0f131c] text-slate-400 border-slate-800 hover:border-[#a3e635]/30'
                    }`}
                >
                    Active
                </button>
            </div>

            {filteredLeagues.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-slate-500 text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold text-white mb-2">No Leagues Found</h3>
                    <p className="text-slate-400 text-sm">No leagues match the selected filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredLeagues.map((league) => {
                        const pct = getCapacityPercentage(league.slotsFilled, league.capacity);
                        const isFull = league.slotsFilled >= league.capacity;
                        const isJoining = joining === league._id;
                        const hasJoined = currentUser && league.players && league.players.includes(currentUser.id);

                        return (
                            <div
                                key={league._id}
                                className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-cyan-500/30 transition-all group"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-black text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                                            {league.name}
                                        </h4>
                                        {league.status === 'active' ? (
                                            <span className="bg-[#a3e635]/10 text-[#a3e635] px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-[#a3e635]/20 animate-pulse">
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
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
                                        <span className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                                            Max STR: {league.maxStrengthLimit}
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
                                                league.status === 'active'
                                                    ? 'bg-[#a3e635]'
                                                    : pct >= 70
                                                    ? 'bg-amber-400'
                                                    : 'bg-cyan-400'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>

                                {league.status === 'active' && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="w-1.5 h-1.5 bg-[#a3e635] rounded-full animate-pulse"></span>
                                        Matchday {league.currentMatchday} in progress
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2">
                                    {league.status === 'recruiting' ? (
                                        <button
                                            onClick={() => handleJoinBracket(league._id)}
                                            disabled={isFull || isJoining || !currentUser || hasJoined}
                                            className={`flex-1 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all ${
                                                hasJoined
                                                    ? 'bg-[#a3e635]/20 text-[#a3e635] cursor-default border border-[#a3e635]/30'
                                                    : !currentUser
                                                    ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                                                    : isFull
                                                    ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                                                    : isJoining
                                                    ? 'bg-cyan-400/50 text-slate-950 border border-cyan-400'
                                                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/10 active:scale-[0.98]'
                                            }`}
                                        >
                                            {isJoining ? 'Joining...' : hasJoined ? 'Joined ✓' : !currentUser ? 'Register First' : isFull ? 'Bracket Full' : 'Join Bracket'}
                                        </button>
                                    ) : (
                                        <>
                                            {hasJoined && (
                                                <button
                                                    onClick={() => handleViewFixtures(league._id)}
                                                    className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-cyan-400/10 active:scale-[0.98] transition-all"
                                                >
                                                    Matchday Hub
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onViewLeague && onViewLeague(league._id, 'standings')}
                                                className={`${hasJoined ? 'flex-1' : 'w-full'} bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all`}
                                            >
                                                View Standings
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TournamentHub;
