// src/pages/TournamentRulesPage.jsx
import React from 'react';

const TournamentRulesPage = ({ onBack }) => {
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
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Tournament Rules</h2>
                </div>
            </div>

            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 text-sm text-slate-400 leading-relaxed">
                <h3 className="text-base font-black text-white">1. General Conduct</h3>
                <p>All managers must maintain respectful conduct toward opponents, organizers, and staff. Any form of harassment, abuse, or unsportsmanlike behavior will result in immediate disqualification from the current tournament and potential future bans.</p>

                <h3 className="text-base font-black text-white pt-2">2. Squad Registration</h3>
                <p>Teams must register before the deadline with an accurate eFootball ID, full name, and WhatsApp contact. Any attempt to register multiple accounts under the same user is prohibited and will lead to removal from all active leagues.</p>

                <h3 className="text-base font-black text-white pt-2">3. Matchday Schedule</h3>
                <p>All fixtures must be played within the designated matchday window. Failure to submit results by the deadline may result in a default loss or admin discretion depending on tournament settings.</p>

                <h3 className="text-base font-black text-white pt-2">4. Score Submission & Trust Engine</h3>
                <p>Both players are required to submit scores independently. The system’s Trust Engine compares both submissions. If both players agree, the result is confirmed automatically. If they differ, the fixture is flagged as DISPUTED and the league admin will issue an official resolution.</p>

                <h3 className="text-base font-black text-white pt-2">5. Dispute Resolution</h3>
                <p>Once a dispute is raised, both parties must provide evidence (screenshots, video clips) to the admin via WhatsApp or Discord. The admin’s decision is final and will be reflected instantly in the league standings.</p>

                <h3 className="text-base font-black text-white pt-2">6. Standings Calculation</h3>
                <p>Standings are updated only from confirmed fixtures. Rankings are determined by Points (PTS), then Goal Difference (GD), then Goals For (GF). In the event of a tied scoreline review, the admin may override and award points accordingly.</p>

                <h3 className="text-base font-black text-white pt-2">7. Eligibility & Team Strength</h3>
                <p>Each league enforces a maximum team strength (STR) limit. Teams found exceeding this limit after registration may be disqualified or asked to adjust their squad before the next matchday.</p>

                <h3 className="text-base font-black text-white pt-2">8. Admin Authority</h3>
                <p>Tournament organizers reserve the right to amend rules, reschedule fixtures, or remove participants in the interest of fair play. Changes will be communicated through the official Discord server and WhatsApp groups.</p>
            </div>
        </div>
    );
};

export default TournamentRulesPage;
