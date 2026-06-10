// src/components/LeagueRosterModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const LeagueRosterModal = ({ league, onClose, onRosterUpdated }) => {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Explicit array overrides to bypass stale snapshots
    const [localPlayers, setLocalPlayers] = useState([]);
    const [localStatus, setLocalStatus] = useState(league?.status || 'recruiting');

    const forceSyncData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // 🚀 TARGET: Hits our populated backend endpoint directly
            const res = await axios.get(`${API_BASE_URL}/leagues/${league._id}/roster`);
            if (res.data.success) {
                // Safely commit populated data straight into your state engine
                setLocalPlayers(res.data.players || []);
                setLocalStatus(res.data.status || 'recruiting');
            }
        } catch (err) {
            console.error("Frontend roster sync engine failure:", err);
            setError('Failed to pull live table arrays from the database server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (league) {
            forceSyncData();
        }
    }, [league]);

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        if (!identifier.trim()) return;

        try {
            setError('');
            setSuccess('');
            const res = await axios.post(`${API_BASE_URL}/leagues/${league._id}/admin-add`, { identifier });
            
            if (res.data.success) {
                setSuccess(res.data.message);
                setIdentifier('');
                await forceSyncData(); // Force live structural refresh
                if (onRosterUpdated) onRosterUpdated();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to manually log manager.');
        }
    };

    const handleRemovePlayer = async (userId, targetName) => {
        if (!window.confirm(`⚠️ EXPLICIT OVERRIDE: Kick @${targetName} from tournament brackets?`)) return;

        try {
            setActionLoading(userId);
            setError('');
            setSuccess('');
            const res = await axios.delete(`${API_BASE_URL}/leagues/${league._id}/remove-member/${userId}`);
            
            if (res.data.success) {
                setSuccess(`Successfully wiped @${targetName} from roster settings.`);
                await forceSyncData(); // Force live list refresh
                if (onRosterUpdated) onRosterUpdated();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Roster modification failure.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#0f131c] border border-slate-800 rounded-2xl p-5 shadow-2xl relative text-left">
                
                {/* Upper Right Close Utility */}
                <button 
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-base font-black uppercase tracking-wider text-slate-200 mb-1">
                    Manage League Roster
                </h3>
                
                {/* READS THE REAL-TIME LENGTH STATE INSTANTLY */}
                <p className="text-xs text-cyan-400 font-medium mb-4 font-mono">
                    Group: <span className="text-white">{league.name}</span> ({localPlayers.length}/{league.capacity} Slots filled)
                </p>

                {/* Status Readout Blocks */}
                {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl mb-3 font-medium">{error}</div>}
                {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl mb-3 font-medium">{success}</div>}

                {/* Manual Registration Controls Form */}
                {localStatus === 'recruiting' && localPlayers.length < league.capacity ? (
                    <form onSubmit={handleAddPlayer} className="mb-5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Inject Player Manually
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Username or WhatsApp Number"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                            />
                            <button 
                                type="submit"
                                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all tracking-wide"
                            >
                                Add
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl mb-5 text-[11px] text-amber-400 font-bold text-center border-amber-500/20 bg-amber-500/5 tracking-wide">
                        🔒 Additions Locked. Tournament State is {localStatus.toUpperCase()}
                    </div>
                )}

                {/* Master Active Members Ledger */}
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Registered Managers Ledger
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {loading && localPlayers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 font-mono animate-pulse">
                            🔄 Running database crosscheck...
                        </div>
                    ) : localPlayers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-600 font-medium italic">
                            No managers registered inside this tournament bracket yet.
                        </div>
                    ) : (
                        localPlayers.map((player, idx) => {
                            // 🚀 THE CRITICAL FIX: Extract user fields directly out of the populated response object!
                            const playerId = typeof player === 'object' ? player?._id : player;
                            const usernameDisplay = typeof player === 'object' ? player?.username : `User ID: ...${String(playerId).slice(-6)}`;
                            const strengthDisplay = typeof player === 'object' && player?.teamStrength ? `STR: ${player.teamStrength}` : 'Roster profile synced';

                            return (
                                <div 
                                    key={playerId || idx} 
                                    className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs"
                                >
                                    <div className="flex items-center gap-2 max-w-[65%]">
                                        <span className="text-cyan-400 font-mono text-[10px] font-bold">[{idx + 1}]</span>
                                        <div className="truncate">
                                            <div className="font-black text-slate-200 truncate font-mono tracking-wide">{usernameDisplay}</div>
                                            <div className="text-[9px] font-mono text-slate-500 font-medium">{strengthDisplay}</div>
                                        </div>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        disabled={actionLoading === playerId}
                                        onClick={() => handleRemovePlayer(playerId, usernameDisplay)}
                                        className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-wider bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-30 shrink-0"
                                    >
                                        {actionLoading === playerId ? 'Kicking...' : 'Kick User'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
};

export default LeagueRosterModal;