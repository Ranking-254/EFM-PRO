// src/components/SupportPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const SupportPage = ({ onNavigate }) => {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 bg-cyan-400/10 text-cyan-400 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-cyan-400/20">
                    Need Help?
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Support Center</h2>
                <p className="text-sm text-slate-400">
                    Get in touch with our team for account issues, league disputes, or technical support.
                </p>
            </div>

            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/30 transition-all">
                    <div className="text-2xl">📋</div>
                    <h4 className="text-sm font-black text-white">FAQ</h4>
                    <p className="text-xs text-slate-400">
                        Browse common questions about leagues, scoring, and matchday submissions.
                    </p>
                    <Link
                         to="/faq" 
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all"
          >
                        View FAQs
               </Link>
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/30 transition-all">
                    <div className="text-2xl">📱</div>
                    <h4 className="text-sm font-black text-white">WhatsApp Support</h4>
                    <p className="text-xs text-slate-400">
                        Chat directly with our support team on WhatsApp for quick resolutions.
                    </p>
                    <a
                        href="https://wa.me/254799708228"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all"
                    >
                        Open WhatsApp
                    </a>
                </div>

                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/30 transition-all">
                    <div className="text-2xl">🌐</div>
                    <h4 className="text-sm font-black text-white">Discord</h4>
                    <p className="text-xs text-slate-400">
                        Join our Discord community for real-time help and updates.
                    </p>
                    <a
                        href="https://discord.gg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all"
                    >
                        Join Discord
                    </a>
                </div>

                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/30 transition-all">
                    <div className="text-2xl">📧</div>
                    <h4 className="text-sm font-black text-white">Email Support</h4>
                    <p className="text-xs text-slate-400">
                        Send us a detailed message and we’ll respond within 24 hours.
                    </p>
                    <a
                        href="mailto:support@efmpro.com"
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all"
                    >
                        Email Us
                    </a>
                </div>

                
                
            </div>
        </div>
    );
};

export default SupportPage;
