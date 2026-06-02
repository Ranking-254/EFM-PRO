// src/components/AdminApprovalsManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const AdminReserveManager = ({ onCounterChange }) => {
    const [reservePlayers, setReservePlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // League creation form state
    const [leagueForm, setLeagueForm] = useState({
        name: '',
        maxStrengthLimit: 3200,
        capacity: 10,
        rounds: 0
    });

    useEffect(() => {
        fetchReservePool();
    }, []);

    const fetchReservePool = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/admin/pending-users`);
            if (res.data.success) {
                setReservePlayers(res.data.data);
            }
        } catch (err) {
            setError('Failed to fetch unassigned reserve players.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerSelect = (playerId) => {
        setSelectedPlayerIds(prev => 
            prev.includes(playerId) 
                ? prev.filter(id => id !== playerId) 
                : [...prev, playerId]
        );
    };

    const handleSelectAll = () => {
        if (selectedPlayerIds.length === reservePlayers.length) {
            setSelectedPlayerIds([]); // Clear selection
        } else {
            setSelectedPlayerIds(reservePlayers.map(p => p._id)); // Select all available
        }
    };

    const handleProvisionLeague = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (selectedPlayerIds.length === 0) {
            setError('Please select at least one reserve player to populate the new league bracket.');
            return;
        }

        if (selectedPlayerIds.length > leagueForm.capacity) {
            setError(`You selected ${selectedPlayerIds.length} players, but the target league capacity is set to ${leagueForm.capacity}. Raise the capacity or deselect players.`);
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                leagueName: leagueForm.name,
                maxStrengthLimit: leagueForm.maxStrengthLimit,
                capacity: leagueForm.capacity,
                rounds: leagueForm.rounds,
                playerIds: selectedPlayerIds
            };

            const res = await axios.post(`${API_BASE_URL}/admin/leagues/create-from-reserve`, payload);

            if (res.data.success) {
                setSuccess(res.data.message || 'New league generated and reserve players assigned successfully!');
                
                // Remove newly assigned players from the view state pool
                setReservePlayers(prev => prev.filter(p => !selectedPlayerIds.includes(p._id)));
                setSelectedPlayerIds([]); // Reset selection checkboxes
                
                // Clear out form text field fields
                setLeagueForm({ name: '', maxStrengthLimit: 3200, capacity: 10, rounds: 0 });
                
                if (onCounterChange) onCounterChange(); // Sync navbar notification counts
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to provision tournament from reserve assets.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                <h4 className="text-base font-black text-white tracking-tight">Overflow Reserve Pool Hub</h4>
                <p className="text-xs text-slate-400 mt-1">
                    When active brackets are full, unregistered managers end up here. Select eligible unassigned players below to launch a targeted new tournament bracket.
                </p>
            </div>

            {error && <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">{error}</div>}
            {success && <div className="p-4 rounded-xl text-sm font-medium border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">{success}</div>}

            {reservePlayers.length === 0 ? (
                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm">
                     📭 Reserve pool empty. All signed-up managers are currently slotted inside official leagues.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* --- LEFT COLUMNS: RESERVE MANAGER DIRECTORY LISTING --- */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                Unassigned Candidates ({reservePlayers.length})
                            </h4>
                            <button 
                                onClick={handleSelectAll}
                                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                {selectedPlayerIds.length === reservePlayers.length ? 'Deselect All' : 'Select All Available'}
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                            {reservePlayers.map((player) => {
                                const isChecked = selectedPlayerIds.includes(player._id);
                                return (
                                    <div 
                                        key={player._id} 
                                        onClick={() => handlePlayerSelect(player._id)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                            isChecked 
                                                ? 'bg-cyan-500/5 border-cyan-500/40 shadow-md shadow-cyan-500/5' 
                                                : 'bg-[#0f131c] border-slate-800/80 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {}} // Controlled by outer div wrapper click handler
                                                className="w-4 h-4 rounded text-cyan-500 border-slate-800 focus:ring-0 accent-cyan-400"
                                            />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h5 className="text-sm font-bold text-white">{player.fullname}</h5>
                                                    
                                                    {/* 🚀 NEW INJECTED RESERVATION BADGE: Flags priority applicants */}
                                                    {player.hasBookedUpcoming && (
                                                        <span className="bg-amber-400/20 text-amber-400 border border-amber-400/30 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                                            🎟️ Reserved Slot
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400">@{player.username} • <span className="font-mono font-bold text-[#a3e635]">STR: {player.teamStrength}</span></p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">WhatsApp: {player.whatsappNumber}</p>
                                            </div>
                                        </div>

                                        {player.screenshotUrl && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Avoid checking box when opening screenshot modal
                                                    setPreviewImage(player.screenshotUrl);
                                                }}
                                                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg p-1.5 text-[11px] font-bold text-slate-300 transition-colors"
                                            >
                                                🖼️ View Squad
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: LEAGUE LAUNCHPAD PROVISION FORM --- */}
                    <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-6">
                        <div className="border-b border-slate-800/60 pb-3">
                            <h4 className="text-sm font-black text-white tracking-tight">Provisioning Terminal</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Deploy a new round-robin configuration using selected candidates.</p>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Selected Managers:</span>
                            <span className="bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                                {selectedPlayerIds.length} Slotted
                            </span>
                        </div>

                        <form onSubmit={handleProvisionLeague} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New League Name</label>
                                <input
                                    type="text"
                                    required
                                    value={leagueForm.name}
                                    onChange={(e) => setLeagueForm({ ...leagueForm, name: e.target.value })}
                                    placeholder="e.g. Meru Elite Bracket B"
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max STR Rating</label>
                                    <input
                                        type="number"
                                        required
                                        value={leagueForm.maxStrengthLimit}
                                        onChange={(e) => setLeagueForm({ ...leagueForm, maxStrengthLimit: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Capacity</label>
                                    <input
                                        type="number"
                                        required
                                        value={leagueForm.capacity}
                                        onChange={(e) => setLeagueForm({ ...leagueForm, capacity: parseInt(e.target.value) || 10 })}
                                        className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Rounds (0 = full robin)</label>
                                <input
                                    type="number"
                                    required
                                    value={leagueForm.rounds}
                                    onChange={(e) => setLeagueForm({ ...leagueForm, rounds: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || selectedPlayerIds.length === 0}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none"
                            >
                                {submitting ? 'Generating Bracket...' : '🚀 Launch Official League'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- LIGHTBOX SCREENSHOT PREVIEW MODAL --- */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl w-full bg-[#0f131c] border border-slate-800 rounded-3xl p-2.5 shadow-2xl animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 z-10 bg-slate-950/80 border border-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors hover:bg-slate-900"
                        >
                            ✕ Close
                        </button>
                        <img src={previewImage} alt="Squad Sheet" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl bg-[#070a0f]" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReserveManager;