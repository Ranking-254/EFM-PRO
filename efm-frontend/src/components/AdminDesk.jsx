// src/components/AdminDesk.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLeagueManager from './AdminLeagueManager';
import AdminApprovalsManager from './AdminApprovalsManager'; 

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const AdminDesk = ({ leagueId, onSelectLeague }) => {
    const [activeTab, setActiveTab] = useState('leagues');
    const [disputedFixtures, setDisputedFixtures] = useState([]);
    const [pendingUsersCount, setPendingUsersCount] = useState(0); 
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [leagues, setLeagues] = useState([]);

    // 🚀 State tracker for current matchday dropdown filter
    const [selectedMatchday, setSelectedMatchday] = useState('all');

    const [resolveForm, setResolveForm] = useState({
        fixtureId: null,
        playerAScore: '',
        playerBScore: ''
    });

    useEffect(() => {
        fetchLeagues();
        fetchPendingUsersCount(); 
    }, []);

    const fetchLeagues = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/leagues/all`);
            if (res.data.success) {
                setLeagues(res.data.data);
            }
        } catch (err) {
            setError('Failed to load leagues.');
            console.error('Leagues fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingUsersCount = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/pending-users`);
            if (res.data.success) {
                setPendingUsersCount(res.data.data.length);
            }
        } catch (err) {
            console.error('Pending count sync failure:', err.message);
        }
    };

    const fetchDisputedFixtures = async () => {
        if (!leagueId) {
            setDisputedFixtures([]);
            setLoading(false);
            return;
        }
        try {
            const fixturesRes = await axios.get(`${API_BASE_URL}/leagues/${leagueId}/fixtures`);
            if (fixturesRes.data.success) {
                const administrativeTargets = fixturesRes.data.data.filter(
                    f => f.status === 'disputed' || f.status === 'pending' || f.status === 'awaiting_confirmation'
                );
                
                setDisputedFixtures(administrativeTargets);

                if (administrativeTargets.length > 0) {
                    const dynamicMatchdays = [...new Set(administrativeTargets.map(f => f.matchday))].sort((a, b) => a - b);
                    if (selectedMatchday === 'all' && dynamicMatchdays[0] !== undefined) {
                        setSelectedMatchday(dynamicMatchdays[0].toString());
                    }
                } else {
                    setSelectedMatchday('all');
                }
            }
        } catch (err) {
            setError('Failed to load match fixtures.');
            console.error('Fixtures admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (leagueId) {
            fetchDisputedFixtures();
        }
    }, [leagueId]);

    const handleResolve = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const scoreA = parseInt(resolveForm.playerAScore);
        const scoreB = parseInt(resolveForm.playerBScore);

        if (isNaN(scoreA) || isNaN(scoreB)) {
            setError('Both scores must be valid numbers.');
            return;
        }

        setResolving(resolveForm.fixtureId);

        try {
            const res = await axios.patch(
                `${API_BASE_URL}/leagues/fixtures/${resolveForm.fixtureId}/resolve`,
                { playerAScore: scoreA, playerBScore: scoreB }
            );

            if (res.data.success) {
                setSuccess('Fixtures resolved and standings re-compiled successfully!');
                setResolveForm({ fixtureId: null, playerAScore: '', playerBScore: '' });
                fetchDisputedFixtures();
            }
        } catch (err) {
            const serverErr = err.response?.data?.error || 'Failed to resolve match scoreline.';
            setError(serverErr);
        } finally {
            setResolving(null);
        }
    };

    const openResolveForm = (fixture) => {
        setResolveForm({ fixtureId: fixture._id, playerAScore: '', playerBScore: '' });
    };

    const handleViewLeague = (leagueId) => {
        if (onSelectLeague) {
            onSelectLeague(leagueId);
        }
        setActiveTab('disputes');
    };

    // 🚀 FIXED: Robust communication logic handles both Object payloads and flat relational text names
  const handleContactPlayer = async (playerObjOrId, fallbackUsername, isReportingParty = false) => {
        let lookupKey = null;
        let displayUsername = fallbackUsername || 'Player';

        if (playerObjOrId && typeof playerObjOrId === 'object') {
            lookupKey = playerObjOrId._id || playerObjOrId.id;
            displayUsername = playerObjOrId.username || displayUsername;
        } else if (typeof playerObjOrId === 'string') {
            lookupKey = playerObjOrId;
        }

        if (!lookupKey) {
            lookupKey = displayUsername;
        }

        try {
            const res = await axios.get(`${API_BASE_URL}/auth/profile/${lookupKey}`);
            if (res.data.success) {
                const profileData = res.data.data || {};
                
                // 🚀 FIXED: Added whatsappNumber to match your backend Mongoose schema key!
               let phoneNumber = profileData.whatsappNumber || 
                                    profileData.WhatsApp || 
                                    profileData.whatsapp || 
                                    profileData.WhatsAppNumber ||
                                    profileData.phone;

                if (!phoneNumber) {
                    alert(`Target manager @${displayUsername} has not linked a valid telephone configuration on their account routing card profiles.`);
                    return;
                }
                
                // 🚀 FIXED: Dynamic Kenyan International Formatting Sanitizer Loop
                let cleanPhone = String(phoneNumber).trim().replace(/[+\s\-()]/g, ''); // Strip spaces/symbols
                if (cleanPhone.startsWith('0')) {
                    // Turn "0799708228" into "254799708228"
                    cleanPhone = '254' + cleanPhone.substring(1);
                } else if (cleanPhone.startsWith('1')) {
                    // Handle newer "01..." lines
                    cleanPhone = '254' + cleanPhone;
                } else if (!cleanPhone.startsWith('254') && cleanPhone.length === 9) {
                    // Fallback boundary match if user left out the leading zero entirely
                    cleanPhone = '254' + cleanPhone;
                }
                
                const warningMessage = isReportingParty
                    ? `👋 Hello @${displayUsername}, this is an EFM-PRO Administrator contacting you regarding your active match dispute case reporting channels.`
                    : `🚨 *EFM-PRO ADMINISTRATIVE NOTICE* 🚨\n\n@${displayUsername}, an official match delay dispute has been logged against your roster account regarding your current pending matchday fixtures.\n\nPlease communicate and sync score metrics immediately. Failure to settle matches promptly will result in an automatic default walkover loss forfeiture decision outcome.`;
                
                const encodedText = encodeURIComponent(warningMessage);
                
                // 🚀 FIXED: Updated routing API link passing our clean formatted string variable
                window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
            }
        } catch (err) {
            console.error('Failed to parse remote contact properties:', err);
            alert(`Could not pull contact tables for member: @${displayUsername}`);
        }
    };

    const uniqueMatchdays = [...new Set(disputedFixtures.map(f => f.matchday))].sort((a, b) => a - b);

    const filteredFixtures = selectedMatchday === 'all' 
        ? disputedFixtures 
        : disputedFixtures.filter(f => f.matchday.toString() === selectedMatchday);

    if (loading && leagues.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading Admin Panel</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-left">
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-4">
                <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider">⚖️ Administrative Resolution Desk</h4>
                <p className="text-xs text-slate-400 mt-1">Manage tournaments, leagues, verify members, and resolve disputes.</p>
            </div>

            {/* --- TAB NAVIGATION HUD --- */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-[#0f131c] border border-slate-800 rounded-xl p-1.5">
                <button
                    onClick={() => setActiveTab('leagues')}
                    className={`flex-1 text-xs font-black uppercase tracking-wider py-3 rounded-lg transition-all ${
                        activeTab === 'leagues' ? 'bg-cyan-400 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Tournament Manager
                </button>
                
                <button
                    onClick={() => { setActiveTab('approvals'); fetchPendingUsersCount(); }}
                    className={`flex-1 text-xs font-black uppercase tracking-wider py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'approvals' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Player Approvals
                    {pendingUsersCount > 0 && (
                        <span className="bg-white text-emerald-950 text-[10px] px-2 py-0.5 rounded-full font-black tracking-normal animate-pulse">
                            {pendingUsersCount} New
                        </span>
                    )}
                </button>

                <button
                    onClick={() => { setActiveTab('disputes'); if (leagueId) fetchDisputedFixtures(); }}
                    className={`flex-1 text-xs font-black uppercase tracking-wider py-3 rounded-lg transition-all ${
                        activeTab === 'disputes' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Dispute Resolution
                    {disputedFixtures.length > 0 && (
                        <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                            {disputedFixtures.length}
                        </span>
                    )}
                </button>
            </div>

            {error && <div className="p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">{error}</div>}
            {success && <div className="p-4 rounded-xl text-sm font-medium border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">{success}</div>}

            {activeTab === 'leagues' && (
                <AdminLeagueManager leagues={leagues} onRefresh={fetchLeagues} onViewLeague={handleViewLeague} />
            )}

            {activeTab === 'approvals' && (
                <AdminApprovalsManager onCounterChange={fetchPendingUsersCount} />
            )}

            {activeTab === 'disputes' && (
                <div className="space-y-4">
                    {!leagueId ? (
                        <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-8 text-center">
                            <span className="text-4xl mb-3 block">📋</span>
                            <p className="text-sm text-slate-400">Select a league from Tournament Manager to view disputes and pending fixtures.</p>
                            <button onClick={() => setActiveTab('leagues')} className="mt-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all">
                                Go to Tournament Manager
                            </button>
                        </div>
                    ) : (
                        <>
                            {resolveForm.fixtureId && (
                                <div className="bg-[#0f131c] border border-amber-400/30 rounded-2xl p-5 space-y-4">
                                    <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                                        Admin Override — Set Official Score
                                    </h4>
                                    <form onSubmit={handleResolve} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Player A Official Score</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={resolveForm.playerAScore}
                                                    onChange={(e) => setResolveForm({ ...resolveForm, playerAScore: e.target.value })}
                                                    placeholder="0"
                                                    className="w-full bg-[#0b0f17] border border-amber-400/30 rounded-xl px-4 py-3 text-center text-lg font-black text-white font-mono focus:outline-none focus:border-amber-400 transition-all"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Player B Official Score</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={resolveForm.playerBScore}
                                                    onChange={(e) => setResolveForm({ ...resolveForm, playerBScore: e.target.value })}
                                                    placeholder="0"
                                                    className="w-full bg-[#0b0f17] border border-amber-400/30 rounded-xl px-4 py-3 text-center text-lg font-black text-white font-mono focus:outline-none focus:border-amber-400 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={resolving === resolveForm.fixtureId} className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 uppercase tracking-wider">
                                            {resolving === resolveForm.fixtureId ? 'Resolving Match...' : 'Lock Scoreline & Update Rankings'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                    Roster Fixtures ({filteredFixtures.length} Shown / {disputedFixtures.length} Total)
                                </h4>
                                
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Filter Week:</label>
                                    <select
                                        value={selectedMatchday}
                                        onChange={(e) => setSelectedMatchday(e.target.value)}
                                        className="bg-[#0b0f17] border border-slate-800 text-xs text-cyan-400 font-bold font-mono px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 transition-all"
                                    >
                                        <option value="all">Display All Matchdays</option>
                                        {uniqueMatchdays.map((day) => (
                                            <option key={day} value={day.toString()}>Matchday {day}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {filteredFixtures.length === 0 ? (
                                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-8 text-center">
                                    <span className="text-4xl mb-3 block">✅</span>
                                    <p className="text-sm text-slate-400">All matches for the selected filtering week are fully finalized!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredFixtures.map((fixture) => {
                                        // 🚀 FIXED: Dynamic parsing fallback handles flat text strings as well as object structures cleanly
                                        const pAId = fixture.playerA?._id || fixture.playerA;
                                        const pAName = fixture.playerA?.username || (typeof fixture.playerA === 'string' ? fixture.playerA : 'Player A');
                                        
                                        const pBId = fixture.playerB?._id || fixture.playerB;
                                        const pBName = fixture.playerB?.username || (typeof fixture.playerB === 'string' ? fixture.playerB : 'Player B');

                                        const isResolving = resolving === fixture._id;
                                        const isTrueDispute = fixture.status === 'disputed';
                                        
                                        const borderClass = isTrueDispute ? 'border-rose-500/30 bg-[#0f131c]' : 'border-slate-800/80 bg-[#0f131c]/60';
                                        const badgeClass = isTrueDispute 
                                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' 
                                            : 'border-amber-500/20 bg-amber-500/5 text-amber-400';

                                        return (
                                            <div key={fixture._id} className={`border rounded-2xl p-5 space-y-4 transition-all ${borderClass}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matchday {fixture.matchday}</span>
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
                                                        {isTrueDispute ? 'DISPUTED' : 'STALLED / PENDING'}
                                                    </span>
                                                </div>
                                                {/* --- INSIDE THE RE-MAPPING MATRIX LOOP BLOCK --- */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    
    {/* 📱 INTERACTIVE HOVER CONTEXT FOR PLAYER A */}
    <div 
        onClick={() => handleContactPlayer(pAId, pAName, isTrueDispute)}
        className="text-sm font-black text-white truncate max-w-full sm:max-w-[45%] hover:text-cyan-400 cursor-pointer group flex items-center gap-2 transition-colors py-1"
        title={`Click to alert @${pAName} via WhatsApp`}
    >
        <span>@{pAName}</span>
        <span className="text-[9px] font-mono opacity-100 text-cyan-400 bg-cyan-400/5 border border-cyan-500/10 px-1.5 py-0.5 rounded transition-opacity">
            💬 contact
        </span>
        {isTrueDispute && <span className="text-rose-400 text-xs ml-2 font-mono block sm:inline font-normal">claimed {fixture.playerASubmittedScore ?? '?'}</span>}
    </div>
    
    <span className="text-slate-600 font-mono text-xs text-center shrink-0">VS</span>
    
    {/* 📱 INTERACTIVE HOVER CONTEXT FOR PLAYER B */}
    <div 
        onClick={() => handleContactPlayer(pBId, pBName, false)}
        className="text-sm font-black text-white text-left sm:text-right truncate max-w-full sm:max-w-[45%] hover:text-cyan-400 cursor-pointer group flex sm:flex-row-reverse items-center gap-2 transition-colors py-1"
        title={`Click to alert @${pBName} via WhatsApp`}
    >
        <span>@{pBName}</span>
        <span className="text-[9px] font-mono opacity-100 text-cyan-400 bg-cyan-400/5 border border-cyan-500/10 px-1.5 py-0.5 rounded transition-opacity">
            💬 contact
        </span>
        {isTrueDispute && <span className="text-rose-400 text-xs mr-2 font-mono block sm:inline font-normal">claimed {fixture.playerBSubmittedScore ?? '?'}</span>}
    </div>
</div>
                                                <button 
                                                    onClick={() => openResolveForm(fixture)} 
                                                    disabled={isResolving} 
                                                    className="w-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all disabled:opacity-50"
                                                >
                                                    {isTrueDispute ? '⚖️ Override & Resolve Dispute' : '⚡ Force Scoreline (Walkover / Default)'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDesk;