// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Fallback to production API link if running live on Vercel
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const DashboardPage = ({ currentUser, onNavigate }) => {
    const [profile, setProfile] = useState(null);
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Resolve MongoDB _id vs standard id variance safely
    const currentUserId = currentUser?.id || currentUser?._id;

    const [form, setForm] = useState({
        fullname: '',
        username: '',
        whatsappNumber: '',
        
        teamStrength: 3100,
        squadImage: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (currentUserId) {
            fetchProfile();
            fetchMyLeagues();
        } else {
            setLoading(false);
        }
    }, [currentUser, currentUserId]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/profile/${currentUserId}`);
            if (res.data.success) {
                const data = res.data.data;
                setProfile(data);
                setForm({
                    fullname: data.fullname || '',
                    username: data.username || '',
                    whatsappNumber: data.whatsappNumber || '',
                    teamStrength: data.teamStrength || 3100,
                    squadImage: data.squadImage || ''
                });
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyLeagues = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/leagues/my-leagues/${currentUserId}`);
            if (res.data.success) {
                setLeagues(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load leagues:', err);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
    };

    const handleImageUpload = async (file) => {
        if (!file) return;

        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64data = reader.result;
                try {
                    const res = await axios.post(
                        `${API_BASE_URL}/auth/profile/${currentUserId}/upload-image`,
                        { image: base64data }
                    );
                    if (res.data.success) {
                        setForm(prev => ({ ...prev, squadImage: res.data.data.squadImage }));
                        setProfile(prev => ({ ...prev, squadImage: res.data.data.squadImage }));
                        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
                    }
                } catch (err) {
                    const serverErr = err.response?.data?.error || 'Upload failed.';
                    setMessage({ type: 'error', text: serverErr });
                } finally {
                    setUploading(false);
                }
            };
            reader.onerror = () => {
                setMessage({ type: 'error', text: 'Failed to read image file.' });
                setUploading(false);
            };
        } catch (err) {
            setMessage({ type: 'error', text: 'Upload failed.' });
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await axios.put(
                `${API_BASE_URL}/auth/profile/${currentUserId}`,
                {
                    fullname: form.fullname,
                    username: form.username,
                    whatsappNumber: form.whatsappNumber,
                    teamStrength: form.teamStrength,
                    squadImage: form.squadImage
                }
            );

            if (res.data.success) {
                setProfile(res.data.data);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setEditing(false);
            }
        } catch (err) {
            const serverErr = err.response?.data?.error || 'Failed to update profile.';
            setMessage({ type: 'error', text: serverErr });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading Dashboard</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 bg-[#a3e635]/10 text-[#a3e635] text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-[#a3e635]/20">
                        Manager Hub
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">My Dashboard</h2>
                </div>
                <button
                    onClick={() => onNavigate && onNavigate('league-recruitment')}
                    className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider py-3 px-5 rounded-xl shadow-lg shadow-cyan-400/10 transition-all"
                >
                    Browse Tournaments
                </button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl text-sm font-medium border transition-all duration-300 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-4 text-center">
                        <div className="w-24 h-24 mx-auto rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                            {form.squadImage ? (
                                <img src={form.squadImage} alt="Squad" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">😎</span>
                            )}
                        </div>
                        {!editing ? (
                            <div>
                                <h4 className="text-base font-black text-white">{profile?.username || currentUser?.username}</h4>
                                <p className="text-xs text-slate-400">STR {profile?.teamStrength || '—'}</p>
                            </div>
                        ) : (
                            <div className="space-y-3 text-left">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upload Squad Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0])}
                                        disabled={uploading}
                                        className="w-full mt-1 text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                                    />
                                    {uploading && <p className="text-[10px] text-cyan-400 mt-1 animate-pulse">Uploading...</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3">
                        <h4 className="text-sm font-black text-white">Quick Stats</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Team Strength</span>
                                <span className="text-white font-black font-mono">{profile?.teamStrength || '—'}</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-lg h-2">
                                <div
                                    className="h-full rounded-lg bg-cyan-400 transition-all duration-500"
                                    style={{ width: `${Math.min(((profile?.teamStrength || 0) / 4000) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs pt-1">
                            <span className="text-slate-400">Leagues Joined</span>
                            <span className="text-white font-black">{leagues.length}</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-black text-white">Profile Details</h4>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-[11px] font-black uppercase tracking-wider py-2 px-3 rounded-lg transition-all"
                            >
                                {editing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {!editing ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Full Name</span>
                                    <span className="text-white font-bold">{profile?.fullname || '—'}</span>
                                </div>
                                <div className="h-px bg-slate-800"></div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Username</span>
                                    <span className="text-white font-bold">{profile?.username || '—'}</span>
                                </div>
                                <div className="h-px bg-slate-800"></div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">eFootball ID</span>
                                    <span className="text-white font-mono font-bold">{profile?.efootballId || 'Not Added'}</span>
                                </div>
                                <div className="h-px bg-slate-800"></div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">WhatsApp</span>
                                    <span className="text-white font-bold">{profile?.whatsappNumber || '—'}</span>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            name="fullname"
                                            value={form.fullname}
                                            onChange={handleChange}
                                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={form.username}
                                            onChange={handleChange}
                                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">eFootball ID</label>
                                        <input
                                            type="text"
                                            name="efootballId"
                                            placeholder="Enter eFootball Owner ID"
                                            value={form.efootballId}
                                            onChange={handleChange}
                                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp Number</label>
                                        <input
                                            type="text"
                                            name="whatsappNumber"
                                            value={form.whatsappNumber}
                                            onChange={handleChange}
                                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Team Strength: <span className="text-cyan-400 font-black">{form.teamStrength}</span></label>
                                    <input
                                        type="range"
                                        name="teamStrength"
                                        min="2500"
                                        max="4000"
                                        step="5"
                                        value={form.teamStrength}
                                        onChange={handleChange}
                                        className="w-full h-1.5 bg-[#0b0f17] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-cyan-400/10 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h4 className="text-base font-black text-white">My Leagues ({leagues.length})</h4>
                        {leagues.length === 0 ? (
                            <p className="text-xs text-slate-500">You haven't joined any leagues yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {leagues.map((league) => (
                                    <div
                                        key={league._id}
                                        onClick={() => onNavigate && onNavigate('standings', league._id)}
                                        className="flex items-center justify-between bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 cursor-pointer hover:border-cyan-500/30 transition-all"
                                    >
                                        <div>
                                            <span className="text-sm font-black text-white">{league.name}</span>
                                            <span className={`ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded ${league.status === 'active' ? 'bg-[#a3e635]/10 text-[#a3e635]' : league.status === 'completed' ? 'bg-slate-500/10 text-slate-400' : 'bg-cyan-400/10 text-cyan-400'}`}>
                                                {league.status}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-400">{league.slotsFilled} / {league.capacity}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;