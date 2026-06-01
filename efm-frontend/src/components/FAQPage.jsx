// src/components/FAQPage.jsx
import React, { useState } from 'react';

const faqs = [
    {
        q: 'How do I register for a tournament?',
        a: 'Click Register Squad on the homepage, fill in your eFootball ID and team details, then submit. Once registered, you can join any open league from the Tournament Hub.'
    },
    {
        q: 'How does match score submission work?',
        a: 'When a match is pending, both players must submit their scores. If both submissions match, the result is auto-confirmed. If they differ, the match enters DISPUTED status for admin resolution.'
    },
    {
        q: 'What happens if there is a dispute?',
        a: 'If your claimed scores do not match your opponent’s, the fixture is flagged as DISPUTED. A league admin can then override the result through the Admin Desk, which also recalculates the standings.'
    },
    {
        q: 'How is the league winner decided?',
        a: 'Standings are calculated from confirmed matches only. Rankings follow standard football rules: most points, then goal difference, then goals scored.'
    },
    {
        q: 'Can I leave a league once I join?',
        a: 'League admins can remove members at any time from the Admin Desk. If you need to leave, contact the tournament organizer.'
    },
    {
        q: 'Why is my league still showing OPEN after all matches are played?',
        a: 'The status should auto-update to FINISHED once every fixture is confirmed. If it does not, refresh the Tournament page or use the Admin Desk to manually set the status to Completed.'
    },
    {
        q: 'How do I contact my opponent?',
        a: 'Open View Live Table, select your league, then tap your row in the standings. A contact modal will appear with a WhatsApp link to message your next opponent directly.'
    },
    {
        q: 'Is my WhatsApp number shared publicly?',
        a: 'No. Your WhatsApp number is only shared with league opponents when you open the contact modal, and only if both parties have provided it.'
    }
];

const FAQPage = ({ onBack }) => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (index) => {
        setOpenIndex(prev => prev === index ? null : index);
    };

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
                        Help Center
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
                </div>
            </div>

            <div className="space-y-3">
                {faqs.map((item, index) => (
                    <div
                        key={index}
                        className="bg-[#0f131c] border border-slate-800 rounded-2xl overflow-hidden transition-all"
                    >
                        <button
                            onClick={() => toggle(index)}
                            className="w-full flex items-center justify-between p-5 text-left"
                        >
                            <span className="text-sm font-black text-white pr-4">{item.q}</span>
                            <span className="text-slate-400 text-lg flex-shrink-0">
                                {openIndex === index ? '−' : '+'}
                            </span>
                        </button>
                        {openIndex === index && (
                            <div className="px-5 pb-5 pt-0">
                                <p className="text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
                                    {item.a}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQPage;
