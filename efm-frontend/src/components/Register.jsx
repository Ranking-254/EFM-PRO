// src/components/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://efm-pro.onrender.com/api/v1';

const Register = ({ onRegistrationSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        whatsappNumber: '',
        teamStrength: '',
        screenshot: '' // 🚀 NEW: Holds the base64 image data directly for server upload
    });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 🚀 NEW OPTIMIZED FILE PROCESSING FLOW
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingImage(true);
        setUploadStatus('Optimizing screenshot layout dimensions...');
        setStatusMessage({ type: '', text: '' });

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Standard Full HD constraints to minimize Render server network payload chunks
                const MAX_WIDTH = 1280;
                const MAX_HEIGHT = 720;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';
                ctx.drawImage(img, 0, 0, width, height);

                // Compress image down to a safe ~150KB string
                const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.75);

                setFormData(prev => ({ ...prev, screenshot: optimizedBase64 }));
                setUploadStatus('Screenshot attached successfully! Ready for registration.');
                setIsProcessingImage(false);
            };
        };

        reader.onerror = () => {
            setUploadStatus('Failed to compile file attachment format.');
            setIsProcessingImage(false);
        };
    };

   const handleFormSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });

        const strength = parseInt(formData.teamStrength, 10);
        if (isNaN(strength) || strength < 2500 || strength > 4000) {
            setStatusMessage({ type: 'error', text: 'Please provide a valid team strength between 2500 and 4000.' });
            return;
        }

        if (!formData.screenshot) {
            setStatusMessage({ type: 'error', text: 'Please upload a valid squad screenshot for admin verification.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                fullname: formData.fullname,
                username: formData.username,
                whatsappNumber: formData.whatsappNumber,
                teamStrength: strength,
                screenshot: formData.screenshot 
            };

            const response = await axios.post(`${API_BASE_URL}/auth/register`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            setStatusMessage({
                type: 'success',
                text: response.data.message || 'Registration submitted for approval!'
            });

            // 🚀 SNAPPY TRANSITION: Shorter delay so the user feels an instant navigation pop
            setTimeout(() => {
                if (onRegistrationSuccess) {
                    const responseUser = response.data.data;
                    
                    // 🚀 MATCH VALUE: Passes the exact payload structure App.jsx expects to cache
                    onRegistrationSuccess({
                        _id: responseUser?.id || responseUser?._id,
                        username: responseUser?.username || formData.username,
                        token: responseUser?.token, // ← Essential for bypassing the route guard
                        approvalStatus: responseUser?.approvalStatus || 'pending'
                    });
                }
            }, 600);

        } catch (error) {
            const serverError = error.response?.data?.error || 'Connection error. Ensure your backend is running.';
            setStatusMessage({ type: 'error', text: serverError });
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="w-full max-w-2xl bg-[#121824]/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8 relative">
            {onCancel && (
                <button
                    onClick={onCancel}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                    ✕ Close
                </button>
            )}

            <div className="text-center space-y-2">
                <h3 className="text-3xl font-extrabold text-white tracking-tight">Register for EFM-PRO</h3>
                <p className="text-sm text-slate-400">Create your manager profile and join the competition.</p>
            </div>

            {statusMessage.text && (
                <div className={`p-4 rounded-xl text-sm font-medium border transition-all duration-300 ${
                    statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                    {statusMessage.text}
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            placeholder="#efootball fc"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Names</label>
                        <input
                            type="text"
                            name="fullname"
                            required
                            placeholder="Enter full name"
                            value={formData.fullname}
                            onChange={handleInputChange}
                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
                        <input
                            type="text"
                            name="whatsappNumber"
                            required
                            placeholder="e.g. +254712345678"
                            value={formData.whatsappNumber}
                            onChange={handleInputChange}
                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        />
                    </div>
                </div>

                {/* 🚀 FORM SECTION REALIGNMENT */}
                <div className="space-y-4 border-t border-slate-800/60 pt-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Input Team Strength Manually</label>
                        <input
                            type="number"
                            name="teamStrength"
                            min="2500"
                            max="4000"
                            required
                            value={formData.teamStrength}
                            onChange={handleInputChange}
                            placeholder="Check your exact squad rating value"
                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Upload Squad Screenshot (Verification Hub)</label>
                        <input
                            type="file"
                            required
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isProcessingImage}
                            className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                        />
                        {uploadStatus && (
                            <p className={`text-[11px] font-bold ${formData.screenshot ? 'text-emerald-400' : 'text-cyan-400 animate-pulse'}`}>
                                {formData.screenshot ? '✓ ' : ''}{uploadStatus}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || isProcessingImage}
                    className="w-full mt-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm py-4 px-4 rounded-xl shadow-xl shadow-cyan-400/10 hover:shadow-cyan-300/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider"
                >
                    {isSubmitting ? 'Processing Registration...' : 'Submit Registration'}
                </button>
            </form>
        </div>
    );
};

export default Register;