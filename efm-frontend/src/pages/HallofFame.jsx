import React, { useEffect, useState } from "react";
import axios from "axios";

const HallOfFamePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const res = await axios.get(`${baseUrl}/api/v1/hall-of-fame`);

        if (res.data.success) {
          setRecords(res.data.data);
        }
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to fetch the trophy room logs.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchHallOfFame();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)]"></div>
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]"></div>
        <p className="text-xs uppercase tracking-widest text-cyan-400/70 font-bold animate-pulse">
          Syncing Historical Championship Arrays...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center font-mono px-4">
        <div className="border border-rose-500/30 bg-rose-500/5 text-rose-400 px-5 py-4 rounded-2xl text-xs uppercase tracking-wider max-w-md text-center shadow-2xl backdrop-blur-md">
          <span className="block text-xl mb-1">⚠️</span> {error}
        </div>
      </div>
    );
  }

  const latestRecord = records[0];
  const historicalRecords = records.slice(1);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 py-16 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Cyber Grid Ambient Backgrounds */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Block */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
            🏆 EFM-PRO Elite Archives
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-400 to-emerald-400 filter drop-shadow-sm">
            Hall Of Fame
          </h1>
          <p className="text-slate-500 font-mono text-xs mt-2.5 uppercase tracking-widest">
            // The Official Record of Tournament Champions & Team Legends
          </p>
          <div className="w-12 h-[2px] bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto mt-5 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
        </div>

        {records.length === 0 ? (
          <div className="border border-slate-800/60 bg-slate-950/20 backdrop-blur-md rounded-2xl p-12 text-center max-w-md mx-auto shadow-xl">
            <div className="text-2xl mb-2 opacity-40">📭</div>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">
              No completed tournament records discovered inside the cloud server
              yet.
            </p>
          </div>
        ) : (
          <>
            {/* 🏆 THE PODIUM SECTION */}
            {latestRecord && (
              <div className="mb-24">
                <div className="text-center mb-10">
                  <h2 className="inline-block font-mono text-[11px] font-black tracking-widest uppercase text-slate-400 bg-slate-950/80 border border-slate-800/80 px-4 py-1.5 rounded-xl shadow-inner">
                    ✨ Current Reigning Campaign:{" "}
                    <span className="text-cyan-400 font-bold">
                      {latestRecord.leagueName}
                    </span>{" "}
                    ✨
                  </h2>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-end justify-center gap-4 max-w-4xl mx-auto px-2">
                  {/* 🥈 2ND PLACE (RUNNER UP) */}
                  <div className="w-full md:w-1/3 flex flex-col order-2 md:order-1 mt-4 md:mt-0">
                    <div className="text-center font-mono mb-3 bg-slate-950/40 border border-slate-900 rounded-xl p-3 shadow-sm mx-4 backdrop-blur-sm">
                      <span className="block font-black text-slate-200 text-sm truncate">
                        {latestRecord.podium?.runnerUp?.username || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                        {latestRecord.podium?.runnerUp
                          ? latestRecord.podium.runnerUp.teamName || "Runner-Up"
                          : "Contender"}
                      </span>
                    </div>
                    <div className="h-32 bg-gradient-to-t from-slate-950 to-slate-900/40 border-x border-t border-slate-800/80 rounded-t-2xl flex flex-col items-center justify-center shadow-2xl relative group overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-slate-500/30"></div>
                      <span className="text-3xl font-black text-slate-500 font-mono tracking-tight group-hover:scale-105 transition-transform duration-300">
                        2nd
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-600 mt-0.5 uppercase tracking-widest">
                        Silver Medalist
                      </span>
                    </div>
                  </div>

                  {/* 👑 1ST PLACE (GRAND CHAMPION) */}
                  <div className="w-full md:w-1/3 flex flex-col order-1 md:order-2 scale-105 relative z-10">
                    <div className="text-center mb-2 animate-bounce text-xl filter drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                      👑
                    </div>
                    <div className="text-center font-mono mb-3 bg-cyan-500/[0.02] border border-cyan-500/20 rounded-xl p-4 shadow-md mx-2 backdrop-blur-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none"></div>
                      <span className="block font-black text-white text-base truncate tracking-wide">
                        {latestRecord.podium?.winner?.username || "Champion"}
                      </span>
                      <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">
                        {latestRecord.podium?.winner?.teamName ||
                          "Elite Placement"}
                      </span>
                    </div>
                    <div className="h-44 bg-gradient-to-t from-slate-950 to-[#0d1624] border-x border-t border-cyan-500/30 rounded-t-2xl flex flex-col items-center justify-center shadow-[0_-15px_30px_rgba(6,182,212,0.05)] relative group overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                      <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-700 font-mono tracking-tighter group-hover:scale-110 transition-transform duration-300">
                        1st
                      </span>
                      <span className="text-[10px] font-mono font-black text-cyan-400/80 mt-1 uppercase tracking-widest">
                        Grand Champion
                      </span>
                    </div>
                  </div>

                  {/* 🥉 3RD PLACE */}
                  <div className="w-full md:w-1/3 flex flex-col order-3 mt-4 md:mt-0">
                    <div className="text-center font-mono mb-3 bg-slate-950/40 border border-slate-900 rounded-xl p-3 shadow-sm mx-4 backdrop-blur-sm">
                      <span className="block font-black text-slate-300 text-sm truncate">
                        {latestRecord.podium?.thirdPlace?.username || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                        {latestRecord.podium?.thirdPlace
                          ? latestRecord.podium.thirdPlace.teamName ||
                            "Bronze Medalist"
                          : "Contender"}
                      </span>
                    </div>
                    <div className="h-24 bg-gradient-to-t from-slate-950 to-slate-900/40 border-x border-t border-slate-800/80 rounded-t-2xl flex flex-col items-center justify-center shadow-2xl relative group overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-amber-700/30"></div>
                      <span className="text-2xl font-black text-amber-700/60 font-mono tracking-tight group-hover:scale-105 transition-transform duration-300">
                        3rd
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-600 mt-0.5 uppercase tracking-widest">
                        Bronze Medal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 📜 HISTORIC TROPHY ROSTER LIST */}
            {historicalRecords.length > 0 && (
              <div className="mt-16">
                <div className="flex items-center justify-between mb-6 border-b border-slate-900 pb-3">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold">
                    // Historical Championship Timeline
                  </h3>
                  <span className="text-[10px] font-mono text-slate-600 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                    {historicalRecords.length} Records Logged
                  </span>
                </div>

                <div className="grid gap-3">
                  {historicalRecords.map((record) => (
                    <div
                      key={record._id}
                      className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-800/80 hover:bg-[#0b101b] shadow-sm relative group overflow-hidden"
                    >
                      {/* Left Hover Border Accent */}
                      <div className="absolute left-0 inset-y-0 w-[3px] bg-transparent group-hover:bg-gradient-to-b group-hover:from-cyan-500 group-hover:to-emerald-500 transition-colors"></div>

                      <div className="space-y-1 pl-1">
                        <h4 className="text-sm font-black uppercase text-slate-200 tracking-wide font-sans group-hover:text-cyan-400 transition-colors">
                          {record.leagueName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 font-mono text-[10px] text-slate-500 uppercase">
                          <span className="flex items-center gap-1">
                            <span className="text-slate-600">MODE:</span>{" "}
                            <span className="text-slate-300 font-medium">
                              {record.formatType}
                            </span>
                          </span>
                          <span>•</span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] ${record.isPaid ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400" : "bg-slate-900 border border-slate-800 text-slate-500"}`}
                          >
                            {record.isPaid
                              ? `🏆 KES ${record.prizePool}`
                              : "FREE SEED"}
                          </span>
                        </div>
                      </div>

                      {/* Right Ledger Side Display */}
                      <div className="flex items-center gap-4 font-mono text-xs self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start border-t border-slate-900 sm:border-0 pt-3 sm:pt-0">
                        <div className="flex items-center gap-4 bg-black/40 border border-slate-900/60 px-4 py-2.5 rounded-xl min-w-[240px] justify-around shadow-inner">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest mb-0.5">
                              1st Place
                            </span>
                            <span className="text-slate-200 font-bold truncate max-w-[90px]">
                              {record.podium?.winner?.username || "N/A"}
                            </span>
                          </div>
                          <div className="w-[1px] h-6 bg-slate-900"></div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">
                              2nd Place
                            </span>
                            <span className="text-slate-400 truncate max-w-[90px]">
                              {record.podium?.runnerUp?.username || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HallOfFamePage;
