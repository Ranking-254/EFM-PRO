// src/pages/TermsOfServicePage.jsx
import React from 'react';

const TermsOfServicePage = ({ onBack }) => {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
                    >
                        ← Back
                    </button>
                )}
                <div>
                    <div className="inline-flex items-center gap-1.5 bg-cyan-400/10 text-cyan-400 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-cyan-400/20">
                        Legal
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Terms of Service</h2>
                </div>
            </div>

            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 text-sm text-slate-400 leading-relaxed">
                <h3 className="text-base font-black text-white">1. Acceptance of Terms</h3>
                <p>By accessing or using EFM-PRO, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the platform.</p>

                <h3 className="text-base font-black text-white pt-2">2. User Accounts</h3>
                <p>You are responsible for maintaining the confidentiality of your account information. You agree to provide accurate, current, and complete information during registration and keep your details updated.</p>

                <h3 className="text-base font-black text-white pt-2">3. Tournament Participation</h3>
                <p>Participation in any tournament hosted on EFM-PRO is subject to the specific tournament rules in addition to these general terms. By joining a league, you confirm that all registered squad details are accurate.</p>

                <h3 className="text-base font-black text-white pt-2">4. Prohibited Activities</h3>
                <p>Users may not exploit, manipulate, or interfere with the platform’s scoring engine, fixtures, or standings. Any attempt to cheat, collude, or misrepresent match results will result in immediate removal and possible legal action.</p>

                <h3 className="text-base font-black text-white pt-2">5. Intellectual Property</h3>
                <p>All content, branding, and software associated with EFM-PRO remain the property of the platform owners. Unauthorized reproduction or distribution is prohibited.</p>

                <h3 className="text-base font-black text-white pt-2">6. Limitation of Liability</h3>
                <p>EFM-PRO is provided on an “as is” basis. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform or participation in tournaments.</p>

                <h3 className="text-base font-black text-white pt-2">7. Changes to Terms</h3>
                <p>We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms. Major updates will be communicated via the Support Center.</p>
            </div>
        </div>
    );
};

export default TermsOfServicePage;
