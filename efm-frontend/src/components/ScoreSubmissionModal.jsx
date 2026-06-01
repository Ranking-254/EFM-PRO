// src/components/ScoreSubmissionModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScoreSubmissionModal = ({ isOpen, onClose, fixture, currentUserId, onSubmissionComplete }) => {
    const [yourScore, setYourScore] = useState('');
    const [opponentScore, setOpponentScore] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen && fixture) {
            setYourScore('');
            setOpponentScore('');
            setError('');
            setSuccess('');
        }
    }, [isOpen, fixture]);

    if (!isOpen || !fixture) return null;

    const isPlayerA = fixture.playerA._id === currentUserId || fixture.playerA === currentUserId;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const parsedYourScore = parseInt(yourScore);
        const parsedOpponentScore = parseInt(opponentScore);

        if (isNaN(parsedYourScore) || parsedYourScore < 0) {
            setError('Please enter a valid score for your team.');
            return;
        }
        if (isNaN(parsedOpponentScore) || parsedOpponentScore < 0) {
            setError('Please enter a valid score for the opponent.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await axios.post(
                `http://localhost:5000/api/v1/leagues/fixtures/${fixture._id}/submit`,
                {
                    userId: currentUserId,
                    yourScore: parsedYourScore,
                    opponentScore: parsedOpponentScore
                }
            );

            if (res.data.success) {
                setSuccess(`Score submitted. Status: ${res.data.data.status.toUpperCase()}`);
                setTimeout(() => {
                    onClose();
                    if (onSubmissionComplete) onSubmissionComplete();
                }, 1500);
            }
        } catch (err) {
            const serverErr = err.response?.data?.error || 'Failed to submit score.';
            setError(serverErr);
        } finally {
            setIsSubmitting(false);
        }
    };

    const opponentName = isPlayerA ? fixture.playerB.username : fixture.playerA.username;
    const playerName = isPlayerA ? fixture.playerA.username : fixture.playerB.username;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#121824] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white tracking-tight">Submit Match Result</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        ✕ Close
                    </button>
                </div>

                <div className="bg-[#0b0f17] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matchday {fixture.matchday}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-cyan-400">{playerName} (You)</span>
                        <span className="text-slate-500 text-xs">VS</span>
                        <span className="text-sm font-bold text-slate-300">{opponentName}</span>
                    </div>
                </div>

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

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {playerName} (Your Score) — {isPlayerA ? 'Home' : 'Away'}
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={yourScore}
                                onChange={(e) => setYourScore(e.target.value)}
                                placeholder="0"
                                className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-4 text-center text-2xl font-black text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {opponentName} (Opponent Score) — {isPlayerA ? 'Away' : 'Home'}
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={opponentScore}
                                onChange={(e) => setOpponentScore(e.target.value)}
                                placeholder="0"
                                className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-4 text-center text-2xl font-black text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm py-4 rounded-xl shadow-lg shadow-cyan-400/10 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider"
                        >
                            {isSubmitting ? 'Verifying...' : 'Submit Scoreline'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ScoreSubmissionModal;
