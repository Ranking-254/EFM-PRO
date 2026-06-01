// src/components/MatchdayHub.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScoreSubmissionModal from './ScoreSubmissionModal';

const MatchdayHub = ({ leagueId, currentUser }) => {
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedFixture, setSelectedFixture] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMatchday, setActiveMatchday] = useState(1);

    useEffect(() => {
        if (leagueId) {
            fetchFixtures();
        }
    }, [leagueId]);

    const fetchFixtures = async () => {
        try {
            const res = await axios.get(`https://efm-pro.onrender.com/api/v1/leagues/${leagueId}/fixtures`);
            if (res.data.success) {
                setFixtures(res.data.data);
                if (res.data.data.length > 0) {
                    setActiveMatchday(res.data.data[0].matchday);
                }
            }
        } catch (err) {
            setError('Failed to load fixtures. Please try again later.');
            console.error('Fixtures fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFixtureClick = (fixture) => {
        if (!currentUser) {
            setError('You must be registered to submit scores.');
            return;
        }

        const userA = fixture.playerA._id || fixture.playerA;
        const userB = fixture.playerB._id || fixture.playerB;
        const isParticipant = userA === currentUser.id || userB === currentUser.id;

        if (!isParticipant) {
            setError('You can only submit scores for your own matches.');
            return;
        }

        if (fixture.status === 'confirmed') {
            setError('This match has already been confirmed.');
            return;
        }

        setSelectedFixture(fixture);
        setIsModalOpen(true);
    };

    const handleSubmissionComplete = () => {
        setSelectedFixture(null);
        setIsModalOpen(false);
        fetchFixtures();
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
        fixturesList.forEach(f => {
            if (!grouped[f.matchday]) grouped[f.matchday] = [];
            grouped[f.matchday].push(f);
        });
        return grouped;
    };

    const matchdays = groupByMatchday(fixtures);
    const uniqueMatchdays = Object.keys(matchdays).map(Number).sort((a, b) => a - b);

    const currentUserA = currentUser ? currentUser.id : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading Fixtures</span>
                </div>
            </div>
        );
    }

    if (fixtures.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-slate-500 text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-white mb-2">No Fixtures Yet</h3>
                <p className="text-slate-400 text-sm">Fixtures will appear once the league is active and fully recruited.</p>
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

            <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {uniqueMatchdays.map((md) => (
                    <button
                        key={md}
                        onClick={() => setActiveMatchday(md)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                            activeMatchday === md
                                ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-400/10'
                                : 'bg-[#0f131c] text-slate-400 border-slate-800 hover:border-cyan-500/30 hover:text-white'
                        }`}
                    >
                        MD {md}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {matchdays[activeMatchday] && matchdays[activeMatchday].length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matchdays[activeMatchday].map((fixture) => {
                            const playerA = fixture.playerA._id ? fixture.playerA : { _id: fixture.playerA, username: 'Player A' };
                            const playerB = fixture.playerB._id ? fixture.playerB : { _id: fixture.playerB, username: 'Player B' };

                            const isCurrentMatch =
                                (currentUserA && (playerA._id === currentUserA || playerB._id === currentUserA));

                            return (
                                <div
                                    key={fixture._id}
                                    onClick={() => handleFixtureClick(fixture)}
                                    className={`bg-[#0f131c] border rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4 transition-all ${
                                        fixture.status === 'confirmed'
                                            ? 'border-[#a3e635]/20 opacity-75'
                                            : fixture.status === 'disputed'
                                            ? 'border-rose-500/40 hover:border-rose-400 cursor-pointer'
                                            : isCurrentMatch
                                            ? 'border-cyan-500/30 hover:border-cyan-400 cursor-pointer hover:bg-[#0f131c]/80'
                                            : 'border-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            MD {fixture.matchday}
                                        </span>
                                        {getStatusBadge(fixture.status)}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-xs font-black text-cyan-400 border border-cyan-400/20 flex-shrink-0">
                                                {playerA.username ? playerA.username.charAt(0).toUpperCase() : 'A'}
                                            </div>
                                            <span className="text-xs md:text-sm font-bold text-white truncate">
                                                {playerA.username}
                                                {currentUserA && playerA._id === currentUserA && (
                                                    <span className="text-cyan-400 text-[10px] ml-1">(YOU)</span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-center">
                                            <span className="px-3 py-1 bg-slate-900 rounded-md">
                                                <span className="text-xs font-black text-white font-mono">VS</span>
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-xs font-black text-amber-400 border border-amber-400/20 flex-shrink-0">
                                                {playerB.username ? playerB.username.charAt(0).toUpperCase() : 'B'}
                                            </div>
                                            <span className="text-xs md:text-sm font-bold text-white truncate">
                                                {playerB.username}
                                                {currentUserA && playerB._id === currentUserA && (
                                                    <span className="text-cyan-400 text-[10px] ml-1">(YOU)</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {(fixture.status === 'confirmed' || fixture.status === 'disputed') && (
                                        <div className="pt-3 border-t border-slate-800">
                                            <div className="flex items-center justify-center gap-4">
                                                <span className="text-xl md:text-2xl font-black font-mono text-white">
                                                    {fixture.playerAScore !== null ? fixture.playerAScore : '–'}
                                                </span>
                                                <span className="text-slate-500 text-sm">-</span>
                                                <span className="text-xl md:text-2xl font-black font-mono text-white">
                                                    {fixture.playerBScore !== null ? fixture.playerBScore : '–'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {(fixture.status === 'pending' || fixture.status === 'awaiting_confirmation') && isCurrentMatch && (
                                        <div className="pt-3 border-t border-slate-900">
                                            <p className="text-[10px] text-center text-cyan-400 font-bold uppercase tracking-wider">
                                                Tap to submit your result
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 text-sm py-8">No matches for this matchday.</p>
                )}
            </div>

            <ScoreSubmissionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedFixture(null);
                }}
                fixture={selectedFixture}
                currentUserId={currentUser.id}
                onSubmissionComplete={handleSubmissionComplete}
            />
        </div>
    );
};

export default MatchdayHub;
