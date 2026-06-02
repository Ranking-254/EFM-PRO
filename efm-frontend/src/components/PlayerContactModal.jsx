import React from 'react';

const PlayerContactModal = ({ isOpen, onClose, player, opponent, leagueName }) => {
    if (!isOpen || !player) return null;

    const buildWhatsAppLink = () => {
        let phone = (opponent?.whatsappNumber || '').replace(/\D/g, '');
        if (!phone) return null;

        // 🛠️ FIX: If the number starts with a local '0', swap it with your country code.
        // Example assumes US (+1). Replace '1' with your country prefix (e.g., '44' for UK, '254' for Kenya)
        if (phone.startsWith('0')) {
            phone = '254' + phone.substring(1); 
        }

        const message = encodeURIComponent(
            `Hey ${opponent?.username || 'Opponent'}! This is ${player.username} from ${leagueName || 'EFM-PRO'}. Let's coordinate our upcoming efootball match! 🔥`
        );
        return `https://wa.me/${phone}?text=${message}`;
    };

    const waLink = buildWhatsAppLink();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#121824] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white tracking-tight">Manager Contact</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        ✕ Close
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-[#0b0f17] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">You</span>
                            <span className="text-xs font-black text-cyan-400">{player.username}</span>
                        </div>
                        <div className="h-px bg-slate-800"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opponent</span>
                            <span className="text-xs font-black text-white">{opponent?.username || 'Unknown'}</span>
                        </div>
                    </div>

                    {opponent?.whatsappNumber ? (
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1da851] text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all active:scale-[0.99]"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            WhatsApp Opponent
                        </a>
                    ) : (
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                            <p className="text-xs text-slate-400">No WhatsApp number on file for this opponent.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayerContactModal;