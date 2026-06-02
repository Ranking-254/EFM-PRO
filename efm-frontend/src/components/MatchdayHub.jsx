// src/components/MatchdayHub.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScoreSubmissionModal from './ScoreSubmissionModal';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const MatchdayHub = ({ leagueId: initialLeagueId, currentUser }) => {
    const [userLeagues, setUserLeagues] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState(initialLeagueId || null);
    const [activeLeague, setActiveLeague] = useState(null);
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fixturesLoading, setFixturesLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedFixture, setSelectedFixture] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMatchday, setActiveMatchday] = useState(1);

    const currentUserId = currentUser?.id || currentUser?._id || null;

    // Phase 1: Fetch all leagues the manager belongs to
    useEffect(() => {
        if (currentUserId) {
            fetchUserLeagues();
        } else {
            setLoading(false);
        }
    }, [currentUserId]);

    // Phase 2: Fetch fixtures whenever the selected tournament shifts
    useEffect(() => {
        if (selectedLeagueId) {
            fetchFixtures(selectedLeagueId);
            const currentObj = userLeagues.find(l => l._id === selectedLeagueId);
            if (currentObj) setActiveLeague(currentObj);
        }
    }, [selectedLeagueId, userLeagues]);

    const fetchUserLeagues = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/leagues/user/${currentUserId}`);
            if (res.data.success) {
                setUserLeagues(res.data.data);
                
                // Smart Fallback Setup:
                // If the app passed a preferred league ID via props, use it. 
                // Otherwise, default to the first active league they belong to.
                if (!selectedLeagueId && res.data.data.length > 0) {
                    setSelectedLeagueId(res.data.data[0]._id);
                    setActiveLeague(res.data.data[0]);
                }
            }
        } catch (err) {
            console.error('Failed to resolve manager league involvements:', err);
            setError('Could not verify your tournament enrollments.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFixtures = async (targetLeagueId) => {
        try {
            setFixturesLoading(true);
            setError('');
            const res = await axios.get(`${API_BASE_URL}/leagues/${targetLeagueId}/fixtures`);
            if (res.data.success) {
                setFixtures(res.data.data);
                if (res.data.data.length > 0) {
                    // Pull current scheduled matchday fallback marker
                    const targetMatchday = res.data.data[0].leagueMatchday || res.data.data[0].matchday;
                    setActiveMatchday(targetMatchday);
                }
            }
        } catch (err) {
            setError('Failed to load fixtures for the selected tournament layout.');
            console.error(err);
        } finally {
            setFixturesLoading(false);
        }
    };

    const handleFixtureClick = (fixture) => {
        if (!currentUserId) {
            setError('You must be registered and logged in to submit official scores.');
            return;
        }

        const userA = fixture.playerA?._id || fixture.playerA;
        const userB = fixture.playerB?._id || fixture.playerB;
        const isParticipant = userA === currentUserId || userB === currentUserId;

        if (!isParticipant) {
            setError('Tactical Lock: You can only submit match performance scorelines for your own fixtures.');
            return;
        }

        if (fixture.status === 'confirmed') {
            setError('This match week fixture record has already been locked and confirmed by the server.');
            return;
        }

        setSelectedFixture(fixture);
        setIsModalOpen(true);
    };

    const handleSubmissionComplete = () => {
        setSelectedFixture(null);
        setIsModalOpen(false);
        if (selectedLeagueId) fetchFixtures(selectedLeagueId);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            awaiting_confirmation: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
            confirmed: 'bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/20',
            disputed: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        };

        const labels = {
            pending: 'PENDING',
            awaiting_confirmation: 'AWAITING CONFIRMATION',
            confirmed: 'CONFIRMED',
            disputed: 'DISPUTED'
        };

        return (
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.pending}`}>
                {labels[status] || status.toUpperCase()}
            </span>
        );
    };

    const groupByMatchday = (fixturesList) => {
        const grouped = {};
        if (!fixturesList || fixturesList.length === 0) return grouped;
        fixturesList.forEach(f => {
            if (!grouped[f.matchday]) grouped[f.matchday] = [];
            grouped[f.matchday].push(f);
        });
        return grouped;
    };

    const matchdays = groupByMatchday(fixtures);
    const uniqueMatchdays = Object.keys(matchdays).map(Number).sort((a, b) => a - b);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!currentUserId) {
        return <p className="text-center text-slate-500 py-12">Please create a manager profile to access matchday modules.</p>;
    }

    if (userLeagues.length === 0) {
        return (
            <div className="text-center py-16 bg-[#0f131c] border border-slate-800 rounded-3xl max-w-xl mx-auto">
                <div className="text-slate-500 text-5xl mb-4">📭</div>
                <h3 className="text-lg font-extrabold text-white mb-1 tracking-tight">No Active Enrollments</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                    You aren't slotted inside any tournament brackets yet. Go to the Tournament Hub to register into open brackets!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            
            {/* --- 🚀 MULTI-LEAGUE COMPASS DASHBOARD TABS --- */}
            {userLeagues.length > 1 && (
                <div className="space-y-2 bg-[#0f131c]/40 border border-slate-800/60 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Active Involvements — Select Campaign Deck
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                        {userLeagues.map((league) => (
                            <button
                                key={league._id}
                                onClick={() => {
                                    setSelectedLeagueId(league._id);
                                    setActiveLeague(league);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border shrink-0 ${
                                    selectedLeagueId === league._id
                                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-400/40 shadow-md'
                                        : 'bg-[#070a0f] text-slate-400 border-slate-900 hover:border-slate-700 hover:text-slate-200'
                                }`}
                            >
                                🏆 {league.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400 animate-in fade-in duration-200">
                    ⚠️ {error}
                </div>
            )}

            {/* Render a single quick-label if they only belong to 1 tournament */}
            {userLeagues.length === 1 && activeLeague && (
                <div className="text-xs text-slate-400 font-bold bg-[#0f131c] border border-slate-800/60 w-fit px-3 py-1.5 rounded-lg font-mono uppercase tracking-wider">
                    Tournament Focus: <span className="text-white font-sans font-black">{activeLeague.name}</span>
                </div>
            )}

            {fixturesLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : fixtures.length === 0 ? (
                <div className="text-center py-12 bg-[#0f131c]/50 border border-dashed border-slate-800 rounded-3xl max-w-md mx-auto">
                    <p className="text-slate-400 text-xs">Calendar unreleased or processing setup parameters.</p>
                </div>
            ) : (
                <>
                    {/* --- MATCHDAY GAME WEEK NAVIGATION HUD --- */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 border-b border-slate-800/40 custom-scrollbar">
                        {uniqueMatchdays.map((md) => (
                            <button
                                key={md}
                                onClick={() => { setActiveMatchday(md); setError(''); }}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${
                                    activeMatchday === md
                                        ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-md'
                                        : 'bg-[#0f131c] text-slate-400 border-slate-800/80 hover:border-cyan-500/30 hover:text-white'
                                }`}
                            >
                                MD {md}
                            </button>
                        ))}
                    </div>

                    {/* --- FIXTURE SCOREBOARD MATRIX --- */}
                    <div className="space-y-3">
                        {matchdays[activeMatchday] && matchdays[activeMatchday].length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {matchdays[activeMatchday].map((fixture) => {
                                    const playerA = fixture.playerA?._id ? fixture.playerA : { _id: fixture.playerA, username: 'Unregistered Player' };
                                    const playerB = fixture.playerB?._id ? fixture.playerB : { _id: fixture.playerB, username: 'Unregistered Player' };

                                    const isCurrentMatch = currentUserId && (playerA._id === currentUserId || playerB._id === currentUserId);

                                    return (
                                        <div
                                            key={fixture._id}
                                            onClick={() => handleFixtureClick(fixture)}
                                            className={`bg-[#0f131c]/60 backdrop-blur-sm border rounded-2xl p-5 space-y-4 transition-all relative group ${
                                                fixture.status === 'confirmed'
                                                    ? 'border-slate-800/60 opacity-60'
                                                    : fixture.status === 'disputed'
                                                    ? 'border-rose-500/30 hover:border-rose-400 cursor-pointer bg-rose-500/[0.01]'
                                                    : isCurrentMatch
                                                    ? 'border-cyan-500/30 hover:border-cyan-400 cursor-pointer hover:bg-[#0f131c] shadow-lg shadow-cyan-500/[0.02]'
                                                    : 'border-slate-800/80'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-black text-slate-500 tracking-wider font-mono">
                                                    {activeLeague?.name.toUpperCase()} • ROUND {fixture.matchday}
                                                </span>
                                                {getStatusBadge(fixture.status)}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-cyan-400/10 flex items-center justify-center text-xs font-black text-cyan-400 border border-cyan-400/10 shrink-0">
                                                            {playerA.username ? playerA.username.charAt(0).toUpperCase() : '?' }
                                                        </div>
                                                        <span className={`text-xs md:text-sm font-bold truncate ${playerA._id === currentUserId ? 'text-cyan-400' : 'text-slate-200'}`}>
                                                            {playerA.username}
                                                            {playerA._id === currentUserId && <span className="text-[9px] font-black tracking-wide ml-1 opacity-80">(YOU)</span>}
                                                        </span>
                                                    </div>
                                                    {(fixture.status === 'confirmed' || fixture.status === 'disputed' || fixture.playerASubmittedScore !== null) && (
                                                        <span className="text-sm font-mono font-black text-white ml-2">
                                                            {fixture.status === 'confirmed' ? fixture.playerAScore : (fixture.playerASubmittedScore !== null ? fixture.playerASubmittedScore : '–')}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center text-xs font-black text-amber-400 border border-amber-400/10 shrink-0">
                                                            {playerB.username ? playerB.username.charAt(0).toUpperCase() : '?' }
                                                        </div>
                                                        <span className={`text-xs md:text-sm font-bold truncate ${playerB._id === currentUserId ? 'text-amber-400' : 'text-slate-200'}`}>
                                                            {playerB.username}
                                                            {playerB._id === currentUserId && <span className="text-[9px] font-black tracking-wide ml-1 opacity-80">(YOU)</span>}
                                                        </span>
                                                    </div>
                                                    {(fixture.status === 'confirmed' || fixture.status === 'disputed' || fixture.playerBSubmittedScore !== null) && (
                                                        <span className="text-sm font-mono font-black text-white ml-2">
                                                            {fixture.status === 'confirmed' ? fixture.playerBScore : (fixture.playerBSubmittedScore !== null ? fixture.playerBSubmittedScore : '–')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {fixture.status !== 'confirmed' && isCurrentMatch && (
                                                <div className="pt-2.5 border-t border-slate-900/60 flex items-center justify-center gap-1.5 text-[10px] text-cyan-400 font-black uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
                                                    ⚡ Tap to submit scores
                                                    
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 text-xs py-8 bg-[#0f131c]/20 rounded-2xl border border-dashed border-slate-800/60">
                                No matches scheduled for this matchday bracket.
                            </p>
                        )}
                    </div>
                </>
            )}

            {isModalOpen && selectedFixture && (
                <ScoreSubmissionModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedFixture(null);
                    }}
                    fixture={selectedFixture}
                    currentUserId={currentUserId}
                    onSubmissionComplete={handleSubmissionComplete}
                />
            )}
        </div>
    );
};

export default MatchdayHub;