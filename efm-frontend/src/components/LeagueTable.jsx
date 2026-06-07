// src/components/LeagueTable.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlayerContactModal from './PlayerContactModal';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const LeagueTable = ({ leagueId, currentUser }) => {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [leagueName, setLeagueName] = useState('');
    const [contactModal, setContactModal] = useState({ isOpen: false, player: null, opponent: null, leagueName: '' });
    
    // 🚀 NEW: Mobile layout toggle toggle state slider engine
    const [viewMode, setViewMode] = useState('full'); // 'short' or 'full'

    const currentUserId = currentUser?.id || currentUser?._id || null;

    useEffect(() => {
        if (leagueId) {
            fetchStandings(leagueId);
        }
    }, [leagueId]);

    const fetchStandings = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/leagues/${id}/standings`);
            if (res.data.success) {
                setStandings(res.data.table);
                setLeagueName(res.data.leagueName);
            }
        } catch (err) {
            setError('Failed to load standings.');
            console.error('Standings fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (row) => {
        const isMatch = currentUserId && row.playerId && String(row.playerId) === String(currentUserId);
        
        if (!isMatch || !leagueId) {
            console.warn('Click ignored. Verification diagnostics:', { 
                rowPlayerId: row.playerId, 
                currentUserId: currentUserId, 
                leagueId: leagueId 
            });
            return;
        }

        try {
            const fixturesRes = await axios.get(`${API_BASE_URL}/leagues/${leagueId}/fixtures`);
            if (!fixturesRes.data.success) return;

            const myNextFixture = fixturesRes.data.data.find(f => {
                const pAId = String(f.playerA?._id || f.playerA || '');
                const pBId = String(f.playerB?._id || f.playerB || '');
                const cId = String(currentUserId);

                return (pAId === cId || pBId === cId) && 
                       (f.status === 'pending' || f.status === 'awaiting_confirmation');
            });

            if (!myNextFixture) {
                alert('No pending matches found. Check back when your next fixture is scheduled.');
                return;
            }

            const playerAId = String(myNextFixture.playerA?._id || myNextFixture.playerA || '');
            const opponentId = playerAId === String(currentUserId)
                ? (myNextFixture.playerB?._id || myNextFixture.playerB)
                : (myNextFixture.playerA?._id || myNextFixture.playerA);

            const userRes = await axios.get(`${API_BASE_URL}/auth/profile/${opponentId}`);
            if (userRes.data.success) {
                setContactModal({
                    isOpen: true,
                    player: { username: currentUser.username },
                    opponent: userRes.data.data,
                    leagueName: leagueName
                });
            }
        } catch (err) {
            console.error('Failed to load opponent info:', err);
        }
    };

    if (!leagueId) {
        return (
            <div className="w-full max-w-5xl bg-[#0f131c] border border-slate-900 rounded-3xl p-10 shadow-2xl">
                <div className="text-center py-12">
                    <div className="text-slate-500 text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold text-white mb-2">No League Selected</h3>
                    <p className="text-slate-400 text-sm">Select a league from View Live Table to see standings.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading Standings</span>
                </div>
            </div>
        );
    }

    if (standings.length === 0 && !error) {
        return (
            <div className="text-center py-16">
                <div className="text-slate-500 text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">No Standings Data</h3>
                <p className="text-slate-400 text-sm">Standings will appear as matches are confirmed in the bracket.</p>
            </div>
        );
    }

    const isCurrentUserRow = (row) => currentUserId && row.playerId && String(currentUserId) === String(row.playerId);

    return (
        <div className="w-full max-w-5xl bg-[#0f131c] border border-slate-900 rounded-3xl p-4 sm:p-10 shadow-2xl space-y-6 sm:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-[#a3e635]/10 text-[#a3e635] text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-[#a3e635]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping"></span>
                        Real-Time Leaderboard
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{leagueName || 'Master League Standings'}</h2>
                    {/* 🚀 MUTATED TEXT: Added grow animation styling elements cleanly here */}
                    <p className="text-xs sm:text-sm text-slate-400 original-instruction-label hover:text-cyan-400 transition-colors transform duration-200 cursor-pointer origin-left">
                        LIVE aggregation of all confirmed results. <span className="inline-block font-black text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10 animate-pulse hover:scale-[1.02] transition-transform">Click your row to contact your next opponent.</span>
                    </p>
                </div>
                
                {/* 🚀 NEW: Responsive layout switcher panel (Only displays on mobile frames) */}
                <div className="sm:hidden flex items-center bg-[#070a0f] border border-slate-800 p-1 rounded-xl w-fit self-end">
                    <button
                        onClick={() => setViewMode('short')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            viewMode === 'short'
                                ? 'bg-cyan-400 text-slate-950 shadow'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Short
                    </button>
                    <button
                        onClick={() => setViewMode('full')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            viewMode === 'full'
                                ? 'bg-cyan-400 text-slate-950 shadow'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Full
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-xl">
                {/* 🚀 DYNAMIC OVERRIDE: Switches minimum table footprint when collapsed to prevent overflow breaks */}
                <table className={`w-full text-left border-collapse ${viewMode === 'short' ? 'min-w-0' : 'min-w-[640px]'}`}>
                    <thead>
                        <tr className="border-b border-slate-900 text-[11px] uppercase tracking-widest font-bold text-slate-500">
                            <th className="py-4 px-3 w-14 sm:w-16">Rank</th>
                            <th className="py-4 px-2 sm:px-4">Manager</th>
                            <th className="py-4 px-2 sm:px-3 text-center">P</th>
                            <th className="py-4 px-2 sm:px-3 text-center">W</th>
                            {/* 🚀 CONDITIONAL HIDE MATRIX BLOCKS */}
                            {viewMode === 'full' && <th className="py-4 px-3 text-center">D</th>}
                            {viewMode === 'full' && <th className="py-4 px-3 text-center">L</th>}
                            {viewMode === 'full' && <th className="py-4 px-3 text-center">GF</th>}
                            {viewMode === 'full' && <th className="py-4 px-3 text-center">GA</th>}
                            <th className="py-4 px-2 sm:px-3 text-center">GD</th>
                            <th className="py-4 px-2 sm:px-3 text-center">PTS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs sm:text-sm font-medium">
                        {standings.map((row, index) => {
                            const rank = index + 1;
                            const isTop = rank === 1;
                            const isMe = isCurrentUserRow(row);

                            return (
                                <tr
                                    key={row.playerId || index}
                                    onClick={() => isMe && handleRowClick(row)}
                                    className={`${
                                        isTop
                                            ? 'bg-[#a3e635]/5 border-l-4 border-l-[#a3e635]'
                                            : isMe
                                            ? 'bg-cyan-400/5 hover:bg-cyan-400/10 cursor-pointer'
                                            : 'hover:bg-slate-900/30'
                                    } transition-colors group`}
                                >
                                    <td className={`py-4 px-3 font-mono font-black text-sm sm:text-base ${
                                        isTop ? 'text-[#a3e635]' : rank <= 3 ? 'text-cyan-400' : 'text-slate-400'
                                    }`}>
                                        {rank}
                                    </td>
                                    <td className="py-4 px-2 sm:px-4 max-w-[120px] sm:max-w-none">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black font-mono border shrink-0 ${
                                                isTop
                                                    ? 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/30'
                                                    : isMe
                                                    ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30'
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}>
                                                {row.username ? row.username.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div className="truncate min-w-0">
                                                <span className={`font-bold block truncate ${isTop ? 'text-[#a3e635]' : isMe ? 'text-cyan-400' : 'text-white'}`}>
                                                    {row.username}
                                                </span>
                                                {isMe && (
                                                    <span className="text-[8px] sm:text-[10px] text-cyan-400 uppercase tracking-wider font-bold block sm:inline">(You)</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 sm:px-3 text-center text-slate-300 font-mono">{row.played}</td>
                                    <td className="py-4 px-2 sm:px-3 text-center text-slate-300 font-mono">{row.won}</td>
                                    {/* 🚀 CONDITIONAL CELL HIDE MATRIX BLOCKS */}
                                    {viewMode === 'full' && <td className="py-4 px-3 text-center text-slate-300 font-mono">{row.drawn}</td>}
                                    {viewMode === 'full' && <td className="py-4 px-3 text-center text-slate-300 font-mono">{row.lost}</td>}
                                    {viewMode === 'full' && <td className="py-4 px-3 text-center text-slate-300 font-mono">{row.goalsFor}</td>}
                                    {viewMode === 'full' && <td className="py-4 px-3 text-center text-slate-300 font-mono">{row.goalsAgainst}</td>}
                                    <td className={`py-4 px-2 sm:px-3 text-center font-mono font-black text-xs sm:text-sm ${(row.goalDifference || 0) > 0 ? 'text-[#a3e635]' : (row.goalDifference || 0) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {(row.goalDifference || 0) > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                    </td>
                                    <td className={`py-4 px-2 sm:px-3 text-center text-lg sm:text-2xl font-black font-mono ${isTop ? 'text-[#a3e635]' : isMe ? 'text-cyan-400' : 'text-white'}`}>
                                        {row.points}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {standings.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-slate-900 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#a3e635]/20 border border-[#a3e635]/40"></div>
                        <span>1st Place</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-cyan-400/20 border border-cyan-400/40"></div>
                        <span>Your Row (clickable)</span>
                    </div>
                </div>
            )}

            <PlayerContactModal
                isOpen={contactModal.isOpen}
                onClose={() => setContactModal({ isOpen: false, player: null, opponent: null, leagueName: '' })}
                player={contactModal.player}
                opponent={contactModal.opponent}
                leagueName={contactModal.leagueName}
            />
        </div>
    );
};

export default LeagueTable;