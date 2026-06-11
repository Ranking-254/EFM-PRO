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
    const [tournamentFormat, setTournamentFormat] = useState('classic'); 
    const [contactModal, setContactModal] = useState({ isOpen: false, player: null, opponent: null, leagueName: '' });
    
    const [viewMode, setViewMode] = useState('full'); 

    // 🚀 NEW: State states for the tournament lifecycle layout switching
    const [activeStageTab, setActiveStageTab] = useState('groups'); // 'groups', 'quarterfinals', 'semifinals', 'finals'
    const [allFixtures, setFixtures] = useState([]);

    const currentUserId = currentUser?.id || currentUser?._id || null;

    useEffect(() => {
        if (leagueId) {
            fetchStandings(leagueId);
            fetchFixtures(leagueId);
        }
    }, [leagueId]);

    const fetchStandings = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/leagues/${id}/standings`);
            if (res.data.success) {
                setStandings(res.data.table || []);
                setLeagueName(res.data.leagueName || '');
                setTournamentFormat(res.data.tournamentFormat || 'classic');
                
                // Smart tab initializer: if it's a pure knockout cup, push them straight to brackets view!
                if (res.data.tournamentFormat === 'knockout') {
                    setActiveStageTab('quarterfinals');
                } else {
                    setActiveStageTab('groups');
                }
            }
        } catch (err) {
            setError('Failed to load standings.');
            console.error('Standings fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFixtures = async (id) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/leagues/${id}/fixtures`);
            if (res.data.success) {
                setFixtures(res.data.data || []);
            }
        } catch (err) {
            console.error('Fixtures collection stream sync error:', err);
        }
    };

    const handleRowClick = async (row) => {
        // 🚀 FIXED: Dynamic matching that supports both raw IDs and username string parsing
        const isMyId = currentUserId && row.playerId && String(row.playerId) === String(currentUserId);
        const isMyUsername = currentUser?.username && row.username && String(row.username).toLowerCase() === String(currentUser.username).toLowerCase();
        
        const isMatch = isMyId || isMyUsername;
        if (!isMatch || !leagueId) return;

        try {
            // Find the active pending matchday fixture for this specific manager context
            const myNextFixture = allFixtures.find(f => {
                const pAId = String(f.playerA?._id || f.playerA || '');
                const pBId = String(f.playerB?._id || f.playerB || '');
                const pAName = String(f.playerA?.username || '').toLowerCase();
                const pBName = String(f.playerB?.username || '').toLowerCase();
                const cId = String(currentUserId);
                const cName = String(currentUser?.username || '').toLowerCase();

                return (pAId === cId || pBId === cId || pAName === cName || pBName === cName) && 
                       (f.status === 'pending' || f.status === 'awaiting_confirmation');
            });

            if (!myNextFixture) {
                alert('No pending matches found. Check back when your next fixture is scheduled.');
                return;
            }

            // Identify opponent profile ID details securely
            const currentUserIdStr = String(currentUserId);
            const currentUserAIdStr = String(myNextFixture.playerA?._id || myNextFixture.playerA || '');
            const currentADataName = String(myNextFixture.playerA?.username || '').toLowerCase();
            const currentBDataName = String(myNextFixture.playerB?.username || '').toLowerCase();
            const currentSearchName = String(currentUser?.username || '').toLowerCase();

            const isPlayerA = currentUserAIdStr === currentUserIdStr || currentADataName === currentSearchName;

            const opponentId = isPlayerA
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

    // 🚀 NEW: Inlined mini renderer for modular sudden-death grid ties block maps
    const renderBracketStage = (stageName, labelTitle) => {
        const stageMatches = allFixtures.filter(f => f.roundName?.toLowerCase() === stageName.toLowerCase());

        if (stageMatches.length === 0) {
            return (
                <div className="text-center py-12 bg-slate-950/20 rounded-3xl border border-dashed border-slate-900 max-w-md mx-auto my-4 animate-in fade-in duration-200">
                    <span className="text-xl block mb-2">🔒</span>
                    <p className="text-slate-500 text-xs font-mono font-bold uppercase tracking-wider">
                        {labelTitle} Phase unspawned or locked
                    </p>
                </div>
            );
        }

        return (
            <div className="max-w-2xl mx-auto space-y-3 py-2 animate-in fade-in duration-200">
                {stageMatches.map((match) => {
                    const pA = match.playerA?.username || 'TBD';
                    const pB = match.playerB?.username || 'TBD';
                    const isConfirmed = match.status === 'confirmed';

                    // 🚀 FIXED: Dynamic verification flag checks if YOU are a participant in this specific bracket row
                    const isMeRow = currentUser?.username && (
                        String(pA).toLowerCase() === String(currentUser.username).toLowerCase() ||
                        String(pB).toLowerCase() === String(currentUser.username).toLowerCase()
                    );

                    return (
                        <div 
                            key={match._id} 
                            // 🚀 FIXED: Passes username context into handleRowClick when tapped
                            onClick={() => isMeRow && handleRowClick({ username: String(pA).toLowerCase() === String(currentUser.username).toLowerCase() ? pA : pB })}
                            className={`bg-[#0b0e14] border p-4 rounded-2xl flex items-center justify-between gap-4 shadow-md transition-all ${
                                isMeRow 
                                    ? 'border-cyan-500/40 hover:border-cyan-400 cursor-pointer bg-cyan-500/[0.02] shadow-lg shadow-cyan-500/[0.01]' 
                                    : 'border-slate-900/80'
                            }`}
                        >
                            {/* Player A */}
                            <div className={`flex-1 text-right font-black text-xs sm:text-sm tracking-tight truncate ${currentUser?.username && String(pA).toLowerCase() === String(currentUser.username).toLowerCase() ? 'text-cyan-400' : 'text-slate-200'}`}>
                                @{pA}
                            </div>
                            
                            {/* Score Matrix Badge */}
                            <div className="bg-slate-950 border border-slate-900 px-4 py-2 rounded-xl text-center font-mono font-black text-xs sm:text-sm text-white min-w-[75px] shadow-inner">
                                {isConfirmed ? `${match.playerAScore} : ${match.playerBScore}` : 'VS'}
                            </div>
                            
                            {/* Player B */}
                            <div className={`flex-1 text-left font-black text-xs sm:text-sm tracking-tight truncate ${currentUser?.username && String(pB).toLowerCase() === String(currentUser.username).toLowerCase() ? 'text-cyan-400' : 'text-slate-200'}`}>
                                @{pB}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!leagueId) {
        return (
            <div className="w-full max-w-7xl bg-[#0f131c] border border-slate-900 rounded-3xl p-10 shadow-2xl">
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

    const isCurrentUserRow = (row) => currentUserId && row.playerId && String(currentUserId) === String(row.playerId);

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

    const hasKnockoutTabs = tournamentFormat === 'group_knockout' || tournamentFormat === 'knockout';
    const qfMatchesCount = allFixtures.filter(f => f.roundName?.toLowerCase() === 'quarterfinals').length;

    return (
        <div className="w-full max-w-7xl bg-[#0f131c] border border-slate-900 rounded-3xl p-4 sm:p-10 shadow-2xl space-y-6 sm:space-y-8 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-[#a3e635]/10 text-[#a3e635] text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-[#a3e635]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping"></span>
                        Real-Time Leaderboard
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{leagueName || 'Master League Standings'}</h2>
                    <p className="text-xs sm:text-sm text-slate-400 original-instruction-label hover:text-cyan-400 transition-colors transform duration-200 cursor-pointer origin-left">
                        LIVE aggregation of all confirmed results. <span className="inline-block font-black text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10 animate-pulse">Click your row to contact your next opponent.</span>
                    </p>
                </div>
                
                {tournamentFormat === 'classic' && (
                    <div className="sm:hidden flex items-center bg-[#070a0f] border border-slate-800 p-1 rounded-xl w-fit self-end">
                        <button onClick={() => setViewMode('short')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'short' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}>Short</button>
                        <button onClick={() => setViewMode('full')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'full' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}>Full</button>
                    </div>
                )}
            </div>

            {error && <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">{error}</div>}

            {/* 🚀 NEW: THE TIMELINE STAGE TOGGLE HUB BAR COMPONENT */}
            {hasKnockoutTabs && (
                <div className="flex flex-wrap items-center justify-start gap-1 bg-[#070a0f] border border-slate-900/60 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner">
                    {tournamentFormat !== 'knockout' && (
                        <button
                            onClick={() => setActiveStageTab('groups')}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                                activeStageTab === 'groups' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            📊 Pools
                        </button>
                    )}
                    
                    {(qfMatchesCount > 0 || standings.length > 6 || tournamentFormat === 'knockout') && (
                        <button
                            onClick={() => setActiveStageTab('quarterfinals')}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                                activeStageTab === 'quarterfinals' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            🪓 QF Brackets
                        </button>
                    )}

                    <button
                        onClick={() => setActiveStageTab('semifinals')}
                        className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                            activeStageTab === 'semifinals' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        🔥 Semis
                    </button>

                    <button
                        onClick={() => setActiveStageTab('finals')}
                        className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                            activeStageTab === 'finals' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        🏆 Finals
                    </button>
                </div>
            )}

            {/* --- CORE DISPLAY HUB CONDITIONAL MATRIX LAYER --- */}
            {activeStageTab === 'quarterfinals' ? renderBracketStage('quarterfinals', 'Quarterfinals') :
             activeStageTab === 'semifinals' ? renderBracketStage('semifinals', 'Semifinals') :
             activeStageTab === 'finals' ? renderBracketStage('finals', 'Grand Finals') : (
                
                /* 🚀 STANDARD VIEW MODES (POOLS OR CLASSIC LEAGUE LIST VIEW) */
                standings.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-slate-500 text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-bold text-white mb-2">No Standings Data</h3>
                        <p className="text-slate-400 text-sm">Standings will appear as matches are confirmed in the bracket.</p>
                    </div>
                ) : tournamentFormat === 'group_knockout' ? (
                    /* ⭐ PATH B: Group Stage Pool Cards Grid */
                    (() => {
                        const groupSegments = {};
                        standings.forEach((row, idx) => {
                            let rawLabel = row.groupLabel;
                            let label = rawLabel ? (rawLabel.startsWith('Group ') ? rawLabel : `Group ${rawLabel}`) : 'Group A';
                            if (!groupSegments[label]) groupSegments[label] = [];
                            groupSegments[label].push(row);
                        });
                        const parsedGroupTitles = Object.keys(groupSegments).sort();

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start animate-in fade-in duration-200">
                                {parsedGroupTitles.map((title) => (
                                    <div key={title} className="bg-[#0b0e14] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                                        <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                Tournament {title}
                                            </h4>
                                            <span className="text-[9px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Top 2 Advance</span>
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
                                                            <tr key={row.playerId || index} onClick={() => isMe && handleRowClick(row)} className={`hover:bg-slate-900/20 transition-colors ${isMe ? 'bg-cyan-400/[0.02] cursor-pointer' : ''}`}>
                                                                <td className={`py-2.5 font-mono font-black ${isQualifier ? 'text-emerald-400' : 'text-slate-600'}`}>{rank}</td>
                                                                <td className="py-2.5 font-bold text-white max-w-[140px] truncate">
                                                                    <span className="flex items-center gap-1.5 truncate">
                                                                        {isQualifier && <span className="text-emerald-400 text-[10px]">⭐</span>}
                                                                        <span className={isMe ? 'text-cyan-400' : ''}>@{row.username}</span>
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 text-center font-mono text-slate-400">{row.played}</td>
                                                                <td className={`py-2.5 text-center font-mono ${row.goalDifference > 0 ? 'text-[#a3e635]' : row.goalDifference < 0 ? 'text-rose-400/80' : 'text-slate-500'}`}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                                                                <td className={`py-2.5 text-center font-mono font-black ${isQualifier ? 'text-emerald-400 text-sm sm:text-base' : 'text-slate-400'}`}>{row.points}</td>
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
                ) : (
                    /* 🏆 PATH A: Standard Classic Round-Robin Table List Layout */
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
                                        <tr key={row.playerId || index} onClick={() => isMe && handleRowClick(row)} className={getRowClassNames(row, index)}>
                                            <td className={`py-4 px-3 font-mono font-black text-sm sm:text-base ${isTop ? 'text-[#a3e635]' : rank <= 3 ? 'text-cyan-400' : 'text-slate-400'}`}>{rank}</td>
                                            <td className="py-4 px-2 sm:px-4 max-w-[120px] sm:max-w-none">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className={getBadgeClassNames(row, index)}>{row.username ? row.username.charAt(0).toUpperCase() : '?'}</div>
                                                    <div className="truncate min-w-0">
                                                        <span className={`font-bold block truncate ${isTop ? 'text-[#a3e635]' : isMe ? 'text-cyan-400' : 'text-white'}`}>{row.username}</span>
                                                        {isMe && <span className="text-[8px] sm:text-[10px] text-cyan-400 uppercase tracking-wider font-bold block sm:inline">(You)</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 sm:px-3 text-center text-slate-300 font-mono">{row.played}</td>
                                            <td className="py-4 px-2 sm:px-3 text-center text-slate-300 font-mono">{row.won}</td>
                                            {viewMode === 'full' && <td className="py-4 px-3 text-center text-slate-300 font-mono">{row.drawn}</td>}
                                            {viewMode === 'full' && <td className="py-4 px-3 text-center text-slate-300 font-mono">{row.lost}</td>}
                                            {viewMode === 'full' && <td className="py-4 px-3 text-center text-slate-300 font-mono">{row.goalsFor}</td>}
                                            {viewMode === 'full' && <td className="py-4 px-3 text-center text-slate-300 font-mono">{row.goalsAgainst}</td>}
                                            <td className={`py-4 px-2 sm:px-3 text-center font-mono font-black text-xs sm:text-sm ${(row.goalDifference || 0) > 0 ? 'text-[#a3e635]' : (row.goalDifference || 0) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                                            <td className={`py-4 px-2 sm:px-3 text-center text-lg sm:text-2xl font-black font-mono ${isTop ? 'text-[#a3e635]' : isMe ? 'text-cyan-400' : 'text-white'}`}>{row.points}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
             )}

            {standings.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-slate-900 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${tournamentFormat === 'knockout' ? 'bg-amber-400/20 border-amber-400/40' : 'bg-[#a3e635]/20 border-[#a3e635]/40'}`}></div>
                        <span>{tournamentFormat === 'knockout' ? 'Active Bracket' : tournamentFormat === 'group_knockout' ? 'Group Leaders' : '1st Place'}</span>
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