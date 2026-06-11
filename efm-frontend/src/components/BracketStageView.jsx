// src/components/BracketStageView.jsx
import React from 'react';

const BracketStageView = ({ stageMatches, stageTitle }) => {
    if (!stageMatches || stageMatches.length === 0) {
        return (
            <div className="text-center py-12 bg-[#0f131c]/40 rounded-3xl border border-dashed border-slate-900 max-w-md mx-auto">
                <span className="text-xl block mb-2">🔒</span>
                <p className="text-slate-400 text-xs font-mono font-bold uppercase tracking-wider">
                    {stageTitle} unspawned or locked
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
            <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400 font-mono text-center">
                {stageTitle} Fixture Ties
            </h4>
            
            <div className="space-y-3">
                {stageMatches.map((match, idx) => {
                    const pA = match.playerA?.username || 'TBD';
                    const pB = match.playerB?.username || 'TBD';
                    const confirmed = match.status === 'confirmed';

                    return (
                        <div key={match._id || idx} className="bg-[#0f131c] border border-slate-900 p-4 rounded-2xl flex items-center justify-between gap-4">
                            {/* Player A */}
                            <div className="flex-1 text-right font-black text-sm tracking-tight truncate text-slate-200">
                                {pA}
                            </div>

                            {/* Score Matrix Badge */}
                            <div className="bg-[#070a0f] border border-slate-800 px-4 py-2 rounded-xl text-center font-mono font-black text-sm text-white min-w-[70px]">
                                {confirmed ? `${match.playerAScore} : ${match.playerBScore}` : 'VS'}
                            </div>

                            {/* Player B */}
                            <div className="flex-1 text-left font-black text-sm tracking-tight truncate text-slate-200">
                                {pB}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BracketStageView;