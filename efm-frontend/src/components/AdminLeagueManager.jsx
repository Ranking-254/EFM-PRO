// src/components/AdminLeagueManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const AdminLeagueManager = ({ leagues, onRefresh, onViewLeague }) => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingLeague, setEditingLeague] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        maxStrengthLimit: 3100,
        capacity: 10,
        rounds: 0,
        status: 'recruiting',
        tournamentFormat: 'classic',    // 🚀 NEW: Tracks tournament format state
        groupStageCount: 4,             // 🚀 NEW: Tracks sub-group pool configuration
        rules: '',       
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [membersMap, setMembersMap] = useState({});

    useEffect(() => {
        leagues.forEach(league => {
            if (league.players && league.players.length > 0) {
                fetchMembers(league._id, league.players);
            }
        });
    }, [leagues]);

    const fetchMembers = async (leagueId, playerIds) => {
        try {
            const promises = playerIds.map(id =>
                axios.get(`${API_BASE_URL}/auth/profile/${id}`)
            );
            const results = await Promise.all(promises);
            const members = {};
            results.forEach((res, idx) => {
                if (res.data.success) {
                    members[playerIds[idx]] = res.data.data;
                }
            });
            setMembersMap(prev => ({ ...prev, [leagueId]: members }));
        } catch (err) {
            console.error('Failed to fetch members:', err);
        }
    };

    const resetForm = () => {
        setFormData({ 
            name: '', 
            maxStrengthLimit: 3100, 
            capacity: 10, 
            rounds: 0, 
            status: 'recruiting',
            tournamentFormat: 'classic', // 🚀 NEW: Clean slate resetting link
            groupStageCount: 4,          // 🚀 NEW: Clean slate resetting link
            rules: '',       
        });
        setEditingLeague(null);
        setShowCreateForm(false);
        setError('');
        setSuccess('');
    };

    const handleEdit = (league) => {
        setFormData({
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            rounds: league.rounds || 0,
            status: league.status,
            tournamentFormat: league.tournamentFormat || 'classic', // 🚀 NEW: Hydrate format tracking
            groupStageCount: league.groupStageCount || 4,          // 🚀 NEW: Hydrate group configuration
            rules: league.rules || '',          
        });
        setEditingLeague(league);
        setShowCreateForm(true);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            if (editingLeague) {
                const res = await axios.put(
                    `${API_BASE_URL}/leagues/${editingLeague._id}`,
                    { 
                        name: formData.name, 
                        maxStrengthLimit: formData.maxStrengthLimit, 
                        capacity: formData.capacity, 
                        rounds: formData.rounds,
                        status: formData.status,
                        tournamentFormat: formData.tournamentFormat, // 🚀 TRANSMITTING NEW PROPERTIES
                        groupStageCount: formData.tournamentFormat === 'group_knockout' ? formData.groupStageCount : 0, // 🚀 TRANSMITTING
                        rules: formData.rules,         
                    }
                );
                if (res.data.success) {
                    setSuccess('League updated successfully!');
                    resetForm();
                    onRefresh();
                }
            } else {
                const res = await axios.post(`${API_BASE_URL}/leagues`, {
                    name: formData.name,
                    maxStrengthLimit: formData.maxStrengthLimit,
                    capacity: formData.capacity,
                    rounds: formData.rounds,
                    status: formData.status,
                    tournamentFormat: formData.tournamentFormat, // 🚀 TRANSMITTING NEW PROPERTIES
                    groupStageCount: formData.tournamentFormat === 'group_knockout' ? formData.groupStageCount : 0, // 🚀 TRANSMITTING
                    players: [],
                    rules: formData.rules,         
                });
                if (res.data.success) {
                    setSuccess('League created successfully!');
                    resetForm();
                    onRefresh();
                }
            }
        } catch (err) {
            const serverErr = err.response?.data?.error || 'Operation failed. Please try again.';
            setError(serverErr);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (leagueId, leagueName) => {
        if (!window.confirm(`Are you sure you want to delete "${leagueName}"? This cannot be undone.`)) return;

        setSubmitting(true);
        try {
            const res = await axios.delete(`${API_BASE_URL}/leagues/${leagueId}`);
            if (res.data.success) {
                setSuccess(res.data.message);
                onRefresh();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete league.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveMember = async (leagueId, memberId, memberName) => {
        if (!window.confirm(`Remove ${memberName} from this league?`)) return;

        setSubmitting(true);
        try {
            const res = await axios.delete(`${API_BASE_URL}/leagues/${leagueId}/remove-member/${memberId}`);
            if (res.data.success) {
                setSuccess(`${memberName} removed successfully.`);
                onRefresh();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove member.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 text-left">
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h4 className="text-base font-black text-white tracking-tight">Tournament Management</h4>
                    <p className="text-xs text-slate-400 mt-1">Create, edit, and delete tournament leagues. Manage player registrations.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreateForm(true); }}
                    className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider py-3 px-5 rounded-xl shadow-lg shadow-cyan-400/10 transition-all active:scale-[0.98]"
                >
                    + Create League
                </button>
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

            {showCreateForm && (
                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-5">
                    <h4 className="text-base font-black text-white tracking-tight">
                        {editingLeague ? 'Edit League' : 'Create New League'}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">League Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Nairobi Premier Championship"
                                    required
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Team Strength</label>
                                <input
                                    type="number"
                                    value={formData.maxStrengthLimit}
                                    onChange={(e) => setFormData({ ...formData, maxStrengthLimit: parseInt(e.target.value) || 0 })}
                                    min="1000"
                                    max="4000"
                                    required
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity (Max players)</label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                                    min="2"
                                    max="100"
                                    required
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                />
                                <p className="text-[10px] text-slate-500">Min 2, Max 100</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {formData.tournamentFormat === 'classic' ? 'Rounds (1 = Single, 2 = Home & Away)' : 'Leg Rounds Count'}
                                </label>
                                <input
                                    type="number"
                                    value={formData.rounds}
                                    disabled={formData.tournamentFormat === 'knockout'}
                                    onChange={(e) => setFormData({ ...formData, rounds: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    max="50"
                                    required
                                    className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                                <p className="text-[10px] text-slate-500">0 = every team plays each other once</p>
                            </div>
                        </div>

                        {/* 🚀 NEW DYNAMIC FORMAT SELECTOR AND DESCRIPTION BOX */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tournament Structure Format</label>
                                <select
                                    value={formData.tournamentFormat}
                                    onChange={(e) => setFormData({ ...formData, tournamentFormat: e.target.value })}
                                    className="w-full bg-[#0b0f17] border border-slate-800 text-xs text-cyan-400 font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 transition-all"
                                >
                                    <option value="classic">🏆 Classic League (Round Robin)</option>
                                    <option value="knockout">🪓 Bracket Elimination (Knockout)</option>
                                    <option value="group_knockout">⭐ Group Stage + Knockout</option>
                                </select>
                                
                                <div className="mt-1 px-1 text-[10px] text-slate-400 font-medium leading-relaxed">
                                    {formData.tournamentFormat === 'classic' && (
                                        <span className="text-cyan-400 font-semibold">💡 Hint: EPL / LaLiga Style. Every manager plays against each other sequentially over scheduled legs.</span>
                                    )}
                                    {formData.tournamentFormat === 'knockout' && (
                                        <span className="text-amber-400 font-semibold">💡 Hint: UCL Championship Knockout / FA Cup Style. Single elimination sudden death layout tree with automatic progression mapping.</span>
                                    )}
                                    {formData.tournamentFormat === 'group_knockout' && (
                                        <span className="text-emerald-400 font-semibold">💡 Hint: Authentic World Cup / Champions League Style. Splits users into local group pools, then advances the top 2 into brackets.</span>
                                    )}
                                </div>
                            </div>

                            {formData.tournamentFormat === 'group_knockout' ? (
                                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                                    <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Group Pool Dividers Count</label>
                                    <select
                                        value={formData.groupStageCount}
                                        onChange={(e) => setFormData({ ...formData, groupStageCount: parseInt(e.target.value, 10) })}
                                        className="w-full bg-[#0b0f17] border border-slate-800 text-xs text-white font-mono px-3 py-2.5 rounded-xl focus:outline-none"
                                    >
                                        <option value="2">Divide into 2 Groups</option>
                                        <option value="4">Divide into 4 Groups (Standard)</option>
                                        <option value="8">Divide into 8 Groups</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="hidden sm:block text-center text-slate-600 text-[11px] self-center font-mono uppercase tracking-wider font-semibold">
                                    ⚙️ Structural Rules Set
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                            >
                                <option value="recruiting">Recruiting</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tournament Rules & Instructions</label>
                            <textarea
                                value={formData.rules}
                                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                                placeholder="Enter specific pairing formats, connection downtime policies, match speed targets, or registration instructions here..."
                                rows="4"
                                className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none custom-scrollbar"
                            />
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Schedule Preview</p>
                            <p className="text-xs text-slate-300">
                                Total matches: <span className="text-cyan-400 font-black">{
                                    (() => {
                                        const cap = formData.capacity || 0;
                                        const r = formData.rounds || 0;
                                        if (cap < 2) return 0;
                                        const matchesPerRound = Math.floor(cap / 2);
                                        const totalRounds = r > 0 ? r : (cap % 2 === 0 ? cap - 1 : cap);
                                        return matchesPerRound * totalRounds;
                                    })()
                                }</span>
                            </p>
                            <p className="text-[10px] text-slate-500">
                                {formData.rounds > 0
                                    ? `${formData.rounds} round(s) × ${Math.floor((formData.capacity || 0) / 2)} match(es)/round`
                                    : `Full round-robin: ${(formData.capacity || 0) % 2 === 0 ? (formData.capacity || 0) - 1 : (formData.capacity || 0)} rounds`}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl shadow-lg shadow-cyan-400/10 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {submitting ? 'Saving...' : editingLeague ? 'Update League' : 'Create League'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider">
                    Existing Tours ({leagues.length})
                </h4>

                {leagues.length === 0 ? (
                    <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-8 text-center">
                        <span className="text-4xl mb-3 block">📭</span>
                        <p className="text-sm text-slate-400">No tournaments found. Create one above to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leagues.map((league) => {
                            const leagueMembers = membersMap[league._id] || {};
                            const memberEntries = Object.values(leagueMembers);

                            return (
                                <div key={league._id} className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h5 className="text-base font-black text-white">{league.name}</h5>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                                    league.status === 'active'
                                                        ? 'bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/20'
                                                        : league.status === 'completed'
                                                        ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                        : 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20'
                                                }`}>
                                                    {league.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                                <span className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                                    Max STR: {league.maxStrengthLimit}
                                                </span>
                                                <span className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                                    {league.slotsFilled} / {league.capacity} Players
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => handleEdit(league)}
                                                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-[11px] font-black uppercase tracking-wider py-2 px-3 rounded-lg transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onViewLeague && onViewLeague(league._id)}
                                                className="bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 text-[11px] font-black uppercase tracking-wider py-2 px-3 rounded-lg transition-all"
                                            >
                                                Manage
                                            </button>
                                            <button
                                                onClick={() => handleDelete(league._id, league.name)}
                                                disabled={submitting}
                                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-black uppercase tracking-wider py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {memberEntries.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                Registered Players ({memberEntries.length})
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {memberEntries.map((member) => (
                                                    <div
                                                        key={member.efootballId || member.username}
                                                        className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg pl-2 pr-1 py-1"
                                                    >
                                                        <div className="w-6 h-6 rounded bg-cyan-400/10 flex items-center justify-center text-[10px] font-black text-cyan-400 border border-cyan-400/20">
                                                            {member.username?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="font-bold text-white">{member.username}</span>
                                                            <span className="text-slate-500 text-[10px] ml-1">STR: {member.teamStrength || 'N/A'}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveMember(league._id, member._id, member.username)}
                                                            disabled={submitting}
                                                            className="text-rose-400 hover:text-rose-300 text-xs font-bold px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
                                                            title="Remove member"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLeagueManager;