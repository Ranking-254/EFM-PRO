// src/components/AdminApprovalsManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const AdminReserveManager = ({ onCounterChange }) => {
    const [reservePlayers, setReservePlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false); // For bulk league launcher
    const [actionLoading, setActionLoading] = useState({}); // For single card actions
    const [selectedPlayerIds, setSelectedPlayerIds] = useState([]); // Tracks checkboxes for bulk creation
    const [expandedProvisionId, setExpandedProvisionId] = useState(null); // Tracks single card inline forms
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Bulk League creation form state (Right-hand launcher)
    const [bulkLeagueForm, setBulkLeagueForm] = useState({
        name: '',
        maxStrengthLimit: 3200,
        capacity: 10,
        rounds: 0,
        rules: '' 
    });

    // Isolated dynamic form for single-user inline league creation
    const [inlineLeagueForm, setInlineLeagueForm] = useState({
        name: '',
        maxStrengthLimit: 3200,
        capacity: 10,
        rounds: 0,
        rules: '' 
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
            setSelectedPlayerIds([]);
        } else {
            setSelectedPlayerIds(reservePlayers.map(p => p._id));
        }
    };

    const handleBulkProvisionLeague = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (selectedPlayerIds.length === 0) {
            setError('Please select at least one manager from the checkboxes to create a bulk league.');
            return;
        }

        if (selectedPlayerIds.length > bulkLeagueForm.capacity) {
            setError(`You selected ${selectedPlayerIds.length} players, but your league capacity is set to ${bulkLeagueForm.capacity}.`);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                leagueName: bulkLeagueForm.name,
                maxStrengthLimit: bulkLeagueForm.maxStrengthLimit,
                capacity: bulkLeagueForm.capacity,
                rounds: bulkLeagueForm.rounds,
                playerIds: selectedPlayerIds, 
                rules: bulkLeagueForm.rules || '' 
            };

            const res = await axios.post(`${API_BASE_URL}/admin/leagues/create-from-reserve`, payload);

            if (res.data.success) {
                setSuccess(`Bulk Success: "${bulkLeagueForm.name}" launched with ${selectedPlayerIds.length} managers!`);
                setReservePlayers(prev => prev.filter(p => !selectedPlayerIds.includes(p._id)));
                setSelectedPlayerIds([]);
                setBulkLeagueForm({ name: '', maxStrengthLimit: 3200, capacity: 10, rounds: 0, rules: '' });
                if (onCounterChange) onCounterChange();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to bulk-provision tournament.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSingleApprove = async (playerId) => {
        setError('');
        setSuccess('');
        setActionLoading(prev => ({ ...prev, [playerId]: 'approving' }));

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/users/${playerId}/approve`);
            if (res.data.success) {
                setSuccess(`Manager profile approved successfully!`);
                setReservePlayers(prev => prev.filter(p => p._id !== playerId));
                setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
                if (onCounterChange) onCounterChange();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to approve manager.');
        } finally {
            setActionLoading(prev => ({ ...prev, [playerId]: null }));
        }
    };

    const handleSingleReject = async (playerId) => {
        if (!window.confirm('Are you sure you want to completely reject this applicant?')) return;
        
        setError('');
        setSuccess('');
        setActionLoading(prev => ({ ...prev, [playerId]: 'rejecting' }));

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/users/${playerId}/reject`);
            if (res.data.success) {
                setSuccess('Manager application rejected and removed.');
                setReservePlayers(prev => prev.filter(p => p._id !== playerId));
                setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
                if (onCounterChange) onCounterChange();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject candidate.');
        } finally {
            setActionLoading(prev => ({ ...prev, [playerId]: null }));
        }
    };

    const toggleInlineForm = (player) => {
        if (expandedProvisionId === player._id) {
            setExpandedProvisionId(null);
        } else {
            setExpandedProvisionId(player._id);
            setInlineLeagueForm({
                name: `${player.username.toUpperCase()}_League`,
                maxStrengthLimit: player.teamStrength || 3200,
                capacity: 10,
                rounds: 3, // 🚀 UPDATED: Modified fallback baseline default directly from 0 to 3
                rules: '' 
            });
        }
    };

    const handleInlineProvisionSubmit = async (e, playerId) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setActionLoading(prev => ({ ...prev, [playerId]: 'provisioning' }));

        try {
            const payload = {
                leagueName: inlineLeagueForm.name,
                maxStrengthLimit: inlineLeagueForm.maxStrengthLimit,
                capacity: inlineLeagueForm.capacity,
                rounds: inlineLeagueForm.rounds, // 🚀 TRANSMITTING CLEANLY NOW
                playerIds: [playerId],
                rules: inlineLeagueForm.rules || '' 
            };

            const res = await axios.post(`${API_BASE_URL}/admin/leagues/create-from-reserve`, payload);

            if (res.data.success) {
                setSuccess(`League "${inlineLeagueForm.name}" created for @${reservePlayers.find(p => p._id === playerId)?.username}!`);
                setReservePlayers(prev => prev.filter(p => p._id !== playerId));
                setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
                setExpandedProvisionId(null);
                if (onCounterChange) onCounterChange();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to provision single league.');
        } finally {
            setActionLoading(prev => ({ ...prev, [playerId]: null }));
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
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-[#0f131c] border border-slate-800/80 rounded-2xl p-5">
                <h4 className="text-base font-black text-white tracking-tight">Manager Application Desk</h4>
                <p className="text-xs text-slate-400 mt-1">
                    Process registrations in bulk or individually. Check boxes to create a multi-user league, or manage accounts individually below.
                </p>
            </div>

            {error && <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">⚠️ {error}</div>}
            {success && <div className="p-4 rounded-xl text-sm font-medium border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">✨ {success}</div>}

            {reservePlayers.length === 0 ? (
                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm">
                    📭 Queue clear. There are no pending manager profiles waiting for approval.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* --- LEFT COLUMNS: PENDING MANAGERS LIST --- */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                Applications Inbox ({reservePlayers.length})
                            </h4>
                            <button 
                                onClick={handleSelectAll}
                                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                {selectedPlayerIds.length === reservePlayers.length ? 'Deselect All' : 'Select All for Bulk League'}
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                            {reservePlayers.map((player) => {
                                const isChecked = selectedPlayerIds.includes(player._id);
                                const isBusy = actionLoading[player._id];
                                const isFormOpen = expandedProvisionId === player._id;

                                return (
                                    <div 
                                        key={player._id}
                                        className={`bg-[#0f131c] border rounded-2xl transition-all overflow-hidden ${
                                            isFormOpen ? 'border-cyan-500/40' : isChecked ? 'border-cyan-500/20 bg-cyan-500/[0.01]' : 'border-slate-800/80'
                                        }`}
                                    >
                                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handlePlayerSelect(player._id)}
                                                    className="w-4 h-4 rounded text-cyan-500 border-slate-800 focus:ring-0 accent-cyan-400 cursor-pointer shrink-0"
                                                />
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h5 className="text-sm font-extrabold text-white truncate">{player.fullname}</h5>
                                                        <span className="text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">
                                                            @{player.username}
                                                        </span>
                                                        {player.hasBookedUpcoming && (
                                                            <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                                                                🎟️ Priority
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-medium">
                                                        <span>WhatsApp: <strong className="text-slate-300 font-mono">{player.whatsappNumber}</strong></span>
                                                        <span className="text-slate-700">•</span>
                                                        <span>STR: <strong className="text-[#a3e635] font-mono">{player.teamStrength || 'Unrated'}</strong></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 ml-7 sm:ml-0">
                                                {player.screenshotUrl && (
                                                    <button
                                                        onClick={() => setPreviewImage(player.screenshotUrl)}
                                                        className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 transition-colors"
                                                    >
                                                        🖼️ Inspect
                                                    </button>
                                                )}

                                                <button
                                                    disabled={isBusy}
                                                    onClick={() => toggleInlineForm(player)}
                                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                                                        isFormOpen 
                                                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                                                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                                    }`}
                                                >
                                                    🏆 {isFormOpen ? 'Close' : 'Deploy League'}
                                                </button>

                                                <button
                                                    disabled={isBusy}
                                                    onClick={() => handleSingleReject(player._id)}
                                                    className="bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors"
                                                >
                                                    {isBusy === 'rejecting' ? '...' : 'Reject'}
                                                </button>

                                                <button
                                                    disabled={isBusy}
                                                    onClick={() => handleSingleApprove(player._id)}
                                                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all"
                                                >
                                                    {isBusy === 'approving' ? '...' : 'Approve'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline single league deployment accordion */}
                                        {isFormOpen && (
                                            <div className="bg-[#090d14] border-t border-slate-800/60 p-4 sm:p-5 animate-in slide-in-from-top duration-200 space-y-4">
                                                <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                                                    ⚡ Launch Isolated League for @{player.username}
                                                </div>
                                                <form onSubmit={(e) => handleInlineProvisionSubmit(e, player._id)} className="space-y-4">
                                                    {/* 🚀 FIXED: Grid layout altered from grid-cols-3 to grid-cols-4 to neatly make space for the rounds tracker field */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                                        <div className="space-y-1 sm:col-span-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">League Name</label>
                                                            <input
                                                                type="text" required
                                                                value={inlineLeagueForm.name}
                                                                onChange={(e) => setInlineLeagueForm({ ...inlineLeagueForm, name: e.target.value })}
                                                                className="w-full bg-[#0f131c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                                            />
                                                        </div>
                                                        <div className="space-y-1 sm:col-span-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max STR</label>
                                                            <input
                                                                type="number" required
                                                                value={inlineLeagueForm.maxStrengthLimit}
                                                                onChange={(e) => setInlineLeagueForm({ ...inlineLeagueForm, maxStrengthLimit: parseInt(e.target.value) || 0 })}
                                                                className="w-full bg-[#0f131c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-1 sm:col-span-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacity</label>
                                                            <input
                                                                type="number" required
                                                                value={inlineLeagueForm.capacity}
                                                                onChange={(e) => setInlineLeagueForm({ ...inlineLeagueForm, capacity: parseInt(e.target.value) || 10 })}
                                                                className="w-full bg-[#0f131c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                                                            />
                                                        </div>
                                                        {/* 🚀 FIXED: Added the missing Rounds Input Box element directly inside the single player launch configuration form */}
                                                        <div className="space-y-1 sm:col-span-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rounds Count</label>
                                                            <input
                                                                type="number" required
                                                                value={inlineLeagueForm.rounds}
                                                                onChange={(e) => setInlineLeagueForm({ ...inlineLeagueForm, rounds: parseInt(e.target.value, 10) || 0 })}
                                                                className="w-full bg-[#0f131c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Tournament Briefing / Rules Instructions</label>
                                                        <textarea
                                                            rows={2}
                                                            value={inlineLeagueForm.rules}
                                                            onChange={(e) => setInlineLeagueForm({ ...inlineLeagueForm, rules: e.target.value })}
                                                            placeholder="Enter group guidelines, prize info, match reporting deadlines or WhatsApp group invite links..."
                                                            className="w-full bg-[#0f131c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all resize-none"
                                                        />
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <button
                                                            type="submit"
                                                            className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-md shadow-cyan-400/5"
                                                        >
                                                            Initialize & Launch League
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: BULK MATCHMAKING TERMINAL --- */}
                    <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-6">
                        <div className="border-b border-slate-800/60 pb-3">
                            <h4 className="text-sm font-black text-white tracking-tight">Bulk Provision Terminal</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Deploy a league for all checked users instantly.</p>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Checked Managers:</span>
                            <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg border ${
                                selectedPlayerIds.length > 0 
                                    ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20' 
                                    : 'bg-slate-900 text-slate-500 border-slate-800/40'
                            }`}>
                                {selectedPlayerIds.length} Checked
                            </span>
                        </div>

                        <form onSubmit={handleBulkProvisionLeague} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulk League Name</label>
                                <input
                                    type="text" required
                                    value={bulkLeagueForm.name}
                                    onChange={(e) => setBulkLeagueForm({ ...bulkLeagueForm, name: e.target.value })}
                                    placeholder="e.g. Meru Super Bracket B"
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max STR Rating</label>
                                    <input
                                        type="number" required
                                        value={bulkLeagueForm.maxStrengthLimit}
                                        onChange={(e) => setBulkLeagueForm({ ...bulkLeagueForm, maxStrengthLimit: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Capacity</label>
                                    <input
                                        type="number" required
                                        value={bulkLeagueForm.capacity}
                                        onChange={(e) => setBulkLeagueForm({ ...bulkLeagueForm, capacity: parseInt(e.target.value) || 10 })}
                                        className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:opacity-100"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rounds (0 = full robin)</label>
                                <input
                                    type="number" required
                                    value={bulkLeagueForm.rounds}
                                    onChange={(e) => setBulkLeagueForm({ ...bulkLeagueForm, rounds: parseInt(e.target.value, 10) || 0 })}
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulk Tournament Rules & Guidelines</label>
                                <textarea
                                    rows={3}
                                    value={bulkLeagueForm.rules}
                                    onChange={(e) => setBulkLeagueForm({ ...bulkLeagueForm, rules: e.target.value })}
                                    placeholder="Enter global group parameters or specific regulations for this batch tournament..."
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || selectedPlayerIds.length === 0}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
                            >
                                {submitting ? 'Generating Group...' : '🚀 Launch Bulk Tournament'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- LIGHTBOX MODAL --- */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl w-full bg-[#0f131c] border border-slate-800 rounded-3xl p-2.5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 z-10 bg-slate-950/80 border border-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-slate-900"
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