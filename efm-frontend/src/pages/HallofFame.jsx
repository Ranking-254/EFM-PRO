import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HallOfFamePage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHallOfFame = async () => {
            try {
                // Read from development/production env variables automatically
                const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
                const res = await axios.get(`${baseUrl}/api/v1/hall-of-fame`);
                
                if (res.data.success) {
                    setRecords(res.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch the trophy room logs.');
            } finally {
                setLoading(false);
            }
        };
        fetchHallOfFame();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center font-mono">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Accessing Historical Logs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center font-mono px-4">
                <div className="border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-xs uppercase tracking-wider max-w-md text-center">
                    ⚠️ {error}
                </div>
            </div>
        );
    }

    const latestRecord = records[0];
    const historicalRecords = records.slice(1);

    return (
        <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-5xl mx-auto">
                
                {/* Header Block */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                        Hall Of Fame
                    </h1>
                    <p className="text-slate-400 font-mono text-xs mt-2 uppercase tracking-widest">
                        // Permanent Record of Competitive eFootball Milestones
                    </p>
                    <div className="w-16 h-[2px] bg-cyan-500/50 mx-auto mt-4"></div>
                </div>

                {records.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">No completed tournament records stored inside the database yet.</p>
                    </div>
                ) : (
                    <>
                        {/* 🏆 THE PODIUM: Showcases Latest Tournament's Top 3 */}
                        {latestRecord && (
                            <div className="mb-20">
                                <h2 className="text-center font-mono text-xs text-slate-500 uppercase tracking-widest mb-8">
                                    ★ LATEST RECRUITMENT CAMPAIGN: <span className="text-cyan-400">{latestRecord.leagueName}</span> ★
                                </h2>
                                
                                <div className="flex flex-col md:flex-row items-end justify-center gap-4 max-w-3xl mx-auto px-4">
                                    
                                    {/* 🥈 2ND PLACE (RUNNER UP) */}
                                    <div className="w-full md:w-1/3 flex flex-col items-center order-2 md:order-1 mt-6 md:mt-0">
                                        <div className="text-center font-mono text-xs text-slate-400 mb-2 truncate max-w-[180px]">
                                            <span className="block font-black text-slate-200">{latestRecord.podium?.runnerUp?.username || '—'}</span>
                                            <span className="text-[10px] text-slate-500 uppercase">{latestRecord.podium?.runnerUp ? (latestRecord.podium.runnerUp.teamName || 'Runner-Up') : 'Contender'}</span>
                                        </div>
                                        <div className="w-full h-28 bg-gradient-to-t from-slate-950 to-slate-900/60 border-x border-t border-slate-900 rounded-t-xl flex flex-col items-center justify-center shadow-lg shadow-black/40">
                                            <span className="text-2xl font-black text-slate-500 font-mono">2nd</span>
                                        </div>
                                    </div>

                                    {/* 👑 1ST PLACE (GRAND CHAMPION) */}
                                    <div className="w-full md:w-1/3 flex flex-col items-center order-1 md:order-2">
                                        <div className="text-2xl mb-1 animate-bounce">👑</div>
                                        <div className="text-center font-mono text-xs text-cyan-400 mb-2 truncate max-w-[200px]">
                                            <span className="block font-black text-slate-100 text-sm">{latestRecord.podium?.winner?.username || 'Champion'}</span>
                                            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">{latestRecord.podium?.winner?.teamName || 'Elite Placement'}</span>
                                        </div>
                                        <div className="w-full h-36 bg-gradient-to-t from-slate-950 to-[#0e1726] border-x border-t border-cyan-500/20 rounded-t-xl flex flex-col items-center justify-center shadow-xl shadow-cyan-500/[0.02] relative">
                                            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
                                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-cyan-600 font-mono">1st</span>
                                        </div>
                                    </div>

                                    {/* 🥉 3RD PLACE */}
                                    <div className="w-full md:w-1/3 flex flex-col items-center order-3 mt-6 md:mt-0">
                                        <div className="text-center font-mono text-xs text-slate-400 mb-2 truncate max-w-[180px]">
                                            <span className="block font-black text-slate-300">{latestRecord.podium?.thirdPlace?.username || '—'}</span>
                                            <span className="text-[10px] text-slate-500 uppercase">{latestRecord.podium?.thirdPlace ? (latestRecord.podium.thirdPlace.teamName || 'Bronze Medalist') : 'Contender'}</span>
                                        </div>
                                        <div className="w-full h-20 bg-gradient-to-t from-slate-950 to-slate-900/60 border-x border-t border-slate-900 rounded-t-xl flex flex-col items-center justify-center shadow-lg shadow-black/40">
                                            <span className="text-xl font-black text-amber-900/40 font-mono">3rd</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* 📜 HISTORIC TROPHY ROSTER LIST */}
                        {historicalRecords.length > 0 && (
                            <div className="mt-12">
                                <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-900 pb-2">
                                    // Historical Archive Board
                                </h3>
                                <div className="grid gap-3">
                                    {historicalRecords.map((record) => (
                                        <div 
                                            key={record._id} 
                                            className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-800 hover:bg-slate-950/90"
                                        >
                                            <div>
                                                <h4 className="text-sm font-black uppercase text-slate-200 tracking-wide">{record.leagueName}</h4>
                                                <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500 uppercase mt-1">
                                                    <span>Format: <span className="text-slate-300">{record.formatType}</span></span>
                                                    <span>•</span>
                                                    <span className={record.isPaid ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                                                        {record.isPaid ? `🏆 KES ${record.prizePool}` : 'FREE TIER'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 font-mono text-xs bg-black/30 px-4 py-2 rounded-lg border border-slate-900/50 self-start sm:self-auto">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-cyan-400 font-bold text-[10px]">1st:</span>
                                                    <span className="text-slate-300 truncate max-w-[100px]">{record.podium?.winner?.username || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-500 text-[10px]">2nd:</span>
                                                    <span className="text-slate-400 truncate max-w-[100px]">{record.podium?.runnerUp?.username || '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HallOfFamePage;