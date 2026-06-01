// src/components/LeagueSelector.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeagueSelector = ({ currentUser, onSelectLeague }) => {
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser?.id) {
            fetchLeagues();
        }
    }, [currentUser]);

    const fetchLeagues = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`http://localhost:5000/api/v1/leagues/my-leagues/${currentUser.id}`);
            if (res.data.success) {
                setLeagues(res.data.data);
            }
        } catch (err) {
            setError('Failed to load your leagues.');
            console.error('My leagues fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading Your Leagues</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
                    <p className="font-bold">{error}</p>
                </div>
            </div>
        );
    }

    if (leagues.length === 0) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-[#0f131c] border border-slate-800 rounded-3xl p-10 text-center space-y-4">
                    <div className="text-slate-500 text-6xl">🏆</div>
                    <h3 className="text-xl font-bold text-white">No Leagues Yet</h3>
                    <p className="text-slate-400 text-sm">You haven't joined any tournament brackets. Head to the Tournament Hub to find open leagues.</p>
                    <button
                        onClick={onSelectLeague}
                        className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all"
                    >
                        Browse Tournaments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-[#a3e635]/10 text-[#a3e635] text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-[#a3e635]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping"></span>
                    Your Brackets
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Select a League</h2>
                <p className="text-xs text-slate-400">Choose the tournament you want to view standings for.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leagues.map((league) => (
                    <div
                        key={league._id}
                        onClick={() => onSelectLeague(league)}
                        className="bg-[#0f131c] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 space-y-3 cursor-pointer transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors">
                                {league.name}
                            </h4>
                            {league.status === 'active' ? (
                                <span className="bg-[#a3e635]/10 text-[#a3e635] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-[#a3e635]/20 animate-pulse">
                                    LIVE
                                </span>
                            ) : (
                                <span className="bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-cyan-400/20">
                                    OPEN
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            <span className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                Max STR: {league.maxStrengthLimit}
                            </span>
                            <span className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                {league.slotsFilled} / {league.capacity} Players
                            </span>
                        </div>

                        {league.status === 'active' && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="w-1.5 h-1.5 bg-[#a3e635] rounded-full animate-pulse"></span>
                                Matchday {league.currentMatchday} in progress
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeagueSelector;
