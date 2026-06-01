// src/components/Register.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';

const Register = ({ onRegistrationSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        whatsappNumber: '',
        teamStrength: ''
    });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ocrStatus, setOcrStatus] = useState('');
    const [ocrWorking, setOcrWorking] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const runOCR = async (file) => {
        if (!file) return;

        setOcrWorking(true);
        setOcrStatus('Reading squad image...');
        setStatusMessage({ type: '', text: '' });

        try {
            const result = await Tesseract.recognize(
                file,
                'eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setOcrStatus(`Scanning image... ${Math.round(m.progress * 100)}%`);
                        } else if (m.status === 'loading language traineddata') {
                            setOcrStatus('Loading OCR engine...');
                        }
                    }
                }
            );

            const text = result.data.text;
            console.log('OCR raw text:', text);

            const cleanedText = text.replace(/\s+/g, ' ').trim();

            const strengthPatterns = [
                /(?:team\s*strength|team\s*str|squad\s*str|total\s*str|overall|str)[\s:]*(\d{4})/i,
                /^[\s\n]*(\d{4})[\s\n]*$/m
            ];

            let detected = null;
            for (const pattern of strengthPatterns) {
                const match = cleanedText.match(pattern);
                if (match) {
                    detected = parseInt(match[1], 10);
                    break;
                }
            }

            if (!detected) {
                const allNumbers = Array.from(cleanedText.matchAll(/\b(\d{4})\b/g)).map(m => parseInt(m[1], 10)).filter(n => n >= 2500 && n <= 4000);
                if (allNumbers.length === 1) {
                    detected = allNumbers[0];
                } else if (allNumbers.length > 1) {
                    const freq = {};
                    allNumbers.forEach(n => freq[n] = (freq[n] || 0) + 1);
                    detected = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
                }
            }

            if (detected && detected >= 2500 && detected <= 4000) {
                setFormData(prev => ({ ...prev, teamStrength: detected }));
                setOcrStatus(`Detected team strength: ${detected}`);
                setTimeout(() => setOcrStatus(''), 4000);
            } else {
                setOcrStatus('Could not detect a valid strength number. Please enter it manually.');
                setTimeout(() => setOcrStatus(''), 5000);
            }
        } catch (err) {
            console.error('OCR error:', err);
            setOcrStatus('Image analysis failed. Please enter team strength manually.');
            setTimeout(() => setOcrStatus(''), 5000);
        } finally {
            setOcrWorking(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            runOCR(file);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });

        const strength = parseInt(formData.teamStrength, 10);
        if (isNaN(strength) || strength < 2500 || strength > 4000) {
            setStatusMessage({ type: 'error', text: 'Please provide a valid team strength between 2500 and 4000.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                fullname: formData.fullname,
                username: formData.username,
                whatsappNumber: formData.whatsappNumber,
                teamStrength: strength
            };

           const response = await axios.post('https://efm-pro.onrender.com/api/v1/auth/register', payload, {
    headers: { 'Content-Type': 'application/json' }
});
            setStatusMessage({
                type: 'success',
                text: response.data.message || 'Registration completed successfully!'
            });

            setTimeout(() => {
                if (onRegistrationSuccess) {
                    onRegistrationSuccess(response.data.data || { username: formData.username, id: response.data.data?.id });
                }
            }, 1500);

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
                    statusMessage.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
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

                <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Squad Screenshot (OCR Auto-Detect)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={ocrWorking}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                    />
                    {ocrWorking && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[11px] text-cyan-400 font-bold">{ocrStatus}</span>
                        </div>
                    )}
                    {!ocrWorking && ocrStatus && (
                        <p className={`text-[11px] font-medium ${ocrStatus.includes('Detected') ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {ocrStatus}
                        </p>
                    )}

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                            <span className="text-slate-400">Team Strength</span>
                            <span className="text-[#a3e635] font-mono font-black text-base">
                                {formData.teamStrength || '—'}
                            </span>
                        </div>
                        <input
                            type="number"
                            name="teamStrength"
                            min="2500"
                            max="4000"
                            step="1"
                            value={formData.teamStrength}
                            onChange={handleInputChange}
                            placeholder="Enter manually or detect from image"
                            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm py-4 px-4 rounded-xl shadow-xl shadow-cyan-400/10 hover:shadow-cyan-300/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider"
                >
                    {isSubmitting ? 'Verifying Dossier...' : 'Submit Registration'}
                </button>

            </form>
        </div>
    );
};

export default Register;
