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
    const [tournamentFormat, setTournamentFormat] = useState('classic'); // 🚀 NEW: State link tracking structure type
    const [contactModal, setContactModal] = useState({ isOpen: false, player: null, opponent: null, leagueName: '' });
    
    // Mobile layout toggle toggle state slider engine
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
                // 🚀 NEW: Capturing structural format flag sent back from backend standings route
                setTournamentFormat(res.data.tournamentFormat || 'classic');
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

    // DYNAMIC CHECK FOR GROUP STAGE RENDERING SEPARATION 
    // Evaluates if any rows are holding an explicit group assignment tag
    const isGroupFormat = standings.some(row => row.groupLabel);

    // Helper mapping tracking row styling natively
    const getRowClassNames = (row, index) => {
        const isTop = index === 0;
        const isMe = isCurrentUserRow(row);
        return `${
            isTop
                ? 'bg-[#a3e635]/5 border-l-4 border-l-[#a3e635]'
                : isMe
                ? 'bg-cyan-400/5 hover:bg-cyan-400/10 cursor-pointer'
                : 'hover:bg-slate-900/30'
        } transition-colors group`;
    };

    // Helper mapping tracking badge color arrays natively
    const getBadgeClassNames = (row, index) => {
        const isTop = index === 0;
        const isMe = isCurrentUserRow(row);
        return `w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black font-mono border shrink-0 ${
            isTop
                ? 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/30'
                : isMe
                ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`;
    };

    return (
        <div className="w-full max-w-5xl bg-[#0f131c] border border-slate-900 rounded-3xl p-4 sm:p-10 shadow-2xl space-y-6 sm:space-y-8 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-[#a3e635]/10 text-[#a3e635] text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-[#a3e635]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping"></span>
                        Real-Time Leaderboard
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{leagueName || 'Master League Standings'}</h2>
                    <p className="text-xs sm:text-sm text-slate-400 original-instruction-label hover:text-cyan-400 transition-colors transform duration-200 cursor-pointer origin-left">
                        LIVE aggregation of all confirmed results. <span className="inline-block font-black text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10 animate-pulse hover:scale-[1.02] transition-transform">Click your row to contact your next opponent.</span>
                    </p>
                </div>
                
                {/* Responsive layout switcher panel (Only displays on mobile frames when non-group and non-knockout view matches) */}
                {!isGroupFormat && tournamentFormat !== 'knockout' && (
                    <div className="sm:hidden flex items-center bg-[#070a0f] border border-slate-800 p-1 rounded-xl w-fit self-end">
                        <button
                            onClick={() => setViewMode('short')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                viewMode === 'short' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Short
                        </button>
                        <button
                            onClick={() => setViewMode('full')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                viewMode === 'full' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Full
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">
                    {error}
                </div>
            )}

            {/* --- CORE UI MAPPING LAYER SELECTOR --- */}
            {tournamentFormat === 'knockout' ? (
                /* 🪓 PATH C: Premium Bracket Elimination Active Contenders Matrix Box Layout */
                <div className="overflow-x-auto rounded-xl bg-slate-950/20 border border-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-900 text-[11px] uppercase tracking-widest font-bold text-slate-500 bg-slate-950/40">
                                <th className="py-4 px-4 pl-6">Contending Manager</th>
                                <th className="py-4 px-3 text-center w-28">Matches Pld</th>
                                <th className="py-4 px-3 text-center w-36">Goals Scored</th>
                                <th className="py-4 px-4 text-center w-48 font-black text-amber-400">Status Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-xs sm:text-sm font-medium text-slate-300">
                            {standings.map((row, index) => {
                                const isMe = isCurrentUserRow(row);
                                // Logic evaluating survival: A manager is alive if they have clean zero losses logged 
                                const isAlive = (row.lost || 0) === 0;

                                return (
                                    <tr 
                                        key={row.playerId || index}
                                        onClick={() => isMe && handleRowClick(row)}
                                        className={`transition-colors hover:bg-slate-900/20 ${isMe ? 'bg-cyan-400/[0.02] cursor-pointer' : ''}`}
                                    >
                                        <td className="py-4 px-4 pl-6 font-bold text-white max-w-[160px] sm:max-w-none truncate">
                                            <div className="flex items-center gap-3">
                                                <div className={getBadgeClassNames(row, index)}>
                                                    {row.username ? row.username.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className={isMe ? 'text-cyan-400' : ''}>@{row.username}</span>
                                                {isMe && <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">(You)</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 text-center font-mono text-slate-400">{row.played}</td>
                                        <td className="py-4 px-3 text-center font-mono text-[#a3e635] font-bold">{row.goalsFor || 0}</td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                                isAlive 
                                                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
                                                    : 'bg-rose-500/5 text-rose-400/40 border-rose-500/10 line-through opacity-50'
                                            }`}>
                                                {isAlive ? '🔥 Active Bracket' : '💀 Eliminated'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : !isGroupFormat ? (
                /* 🏆 PATH A: Standard Classic League/Knockout master full table list row */
                <div className="overflow-x-auto rounded-xl">
                    <table className={`w-full text-left border-collapse ${viewMode === 'short' ? 'min-w-0' : 'min-w-[640px]'}`}>
                        <thead>
                            <tr className="border-b border-slate-900 text-[11px] uppercase tracking-widest font-bold text-slate-500">
                                <th className="py-4 px-3 w-14 sm:w-16">Rank</th>
                                <th className="py-4 px-2 sm:px-4">Manager</th>
                                <th className="py-4 px-2 sm:px-3 text-center">P</th>
                                <th className="py-4 px-2 sm:px-3 text-center">W</th>
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
                                        className={getRowClassNames(row, index)}
                                    >
                                        <td className={`py-4 px-3 font-mono font-black text-sm sm:text-base ${isTop ? 'text-[#a3e635]' : rank <= 3 ? 'text-cyan-400' : 'text-slate-400'}`}>
                                            {rank}
                                        </td>
                                        <td className="py-4 px-2 sm:px-4 max-w-[120px] sm:max-w-none">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className={getBadgeClassNames(row, index)}>
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
            ) : (
                /* ⭐ PATH B: Advanced Group Stage Visual Partitions Grid (UCL / World Cup formatting) */
                (() => {
                    const groupSegments = {};
                    standings.forEach(row => {
                        const label = row.groupLabel || 'Group A';
                        if (!groupSegments[label]) groupSegments[label] = [];
                        groupSegments[label].push(row);
                    });

                    const parsedGroupTitles = Object.keys(groupSegments).sort();

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {parsedGroupTitles.map((title) => (
                                <div key={title} className="bg-[#0b0e14] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                                    <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Tournament {title}
                                        </h4>
                                        <span className="text-[9px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                            Top 2 Advance
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                            <thead>
                                                <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-900 pb-2">
                                                    <th className="pb-2 w-10">Pos</th>
                                                    <th className="pb-2">Manager</th>
                                                    <th className="pb-2 text-center w-12">P</th>
                                                    <th className="pb-2 text-center w-14">GD</th>
                                                    <th className="pb-2 text-center w-14 font-black text-emerald-400">PTS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-900/60 font-medium text-slate-300">
                                                {groupSegments[title].map((row, index) => {
                                                    const rank = index + 1;
                                                    const isQualifier = rank <= 2;
                                                    const isMe = isCurrentUserRow(row);

                                                    return (
                                                        <tr 
                                                            key={row.playerId || index}
                                                            onClick={() => isMe && handleRowClick(row)}
                                                            className={`hover:bg-slate-900/20 transition-colors ${isMe ? 'bg-cyan-400/[0.02] cursor-pointer' : ''}`}
                                                        >
                                                            <td className={`py-2.5 font-mono font-black ${isQualifier ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                                {rank}
                                                            </td>
                                                            <td className="py-2.5 font-bold text-white max-w-[140px] truncate">
                                                                <span className="flex items-center gap-1.5 truncate">
                                                                    {isQualifier && <span className="text-emerald-400 text-[10px]">⭐</span>}
                                                                    <span className={isMe ? 'text-cyan-400' : ''}>@{row.username}</span>
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 text-center font-mono text-slate-400">{row.played}</td>
                                                            <td className={`py-2.5 text-center font-mono ${row.goalDifference > 0 ? 'text-[#a3e635]' : row.goalDifference < 0 ? 'text-rose-400/80' : 'text-slate-500'}`}>
                                                                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                                            </td>
                                                            <td className={`py-2.5 text-center font-mono font-black ${isQualifier ? 'text-emerald-400 text-sm sm:text-base' : 'text-slate-400'}`}>
                                                                {row.points}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()
            )}

            {standings.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-slate-900 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${tournamentFormat === 'knockout' ? 'bg-emerald-400/20 border-emerald-400/40' : 'bg-[#a3e635]/20 border-[#a3e635]/40'}`}></div>
                        <span>{tournamentFormat === 'knockout' ? 'Active Bracket' : isGroupFormat ? 'Group Leaders' : '1st Place'}</span>
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