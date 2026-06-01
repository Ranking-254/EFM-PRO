// src/pages/PrivacyPolicyPage.jsx
import React from 'react';

const PrivacyPolicyPage = ({ onBack }) => {
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
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h2>
                </div>
            </div>

            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 text-sm text-slate-400 leading-relaxed">
                <h3 className="text-base font-black text-white">1. Information We Collect</h3>
                <p>We collect only the information necessary to run tournaments and provide support: your eFootball ID, full name, WhatsApp number, and team strength. Payment or financial data is not collected unless explicitly required for paid events.</p>

                <h3 className="text-base font-black text-white pt-2">2. How We Use Your Data</h3>
                <p>Your data is used solely for tournament operations, match scheduling, standings calculation, and support responses. We do not sell, rent, or share your personal information with third-party advertisers.</p>

                <h3 className="text-base font-black text-white pt-2">3. Data Storage & Security</h3>
                <p>All data is encrypted in transit and at rest. We implement industry-standard security measures to prevent unauthorized access, alteration, or deletion of your information.</p>

                <h3 className="text-base font-black text-white pt-2">4. Contact Sharing</h3>
                <p>Your WhatsApp number is only shared with a league opponent when both parties have provided it, and only when you choose to open the contact modal in View Live Table. It is never displayed publicly on the platform.</p>

                <h3 className="text-base font-black text-white pt-2">5. Cookies & Tracking</h3>
                <p>EFM-PRO uses minimal local storage to keep you logged in and remember your preferences. No invasive tracking cookies or third-party analytics scripts are deployed.</p>

                <h3 className="text-base font-black text-white pt-2">6. Your Rights</h3>
                <p>You may request a copy of your stored data, request correction of inaccurate details, or request deletion of your account at any time by contacting our support team through the Support Center.</p>

                <h3 className="text-base font-black text-white pt-2">7. Updates to This Policy</h3>
                <p>We may revise this Privacy Policy as the platform evolves. Significant changes will be announced through the Support Center and via in-app notifications.</p>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
