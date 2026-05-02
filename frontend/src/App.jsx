import React from 'react';
import { Shield, Wifi, Zap } from 'lucide-react';

const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 relative">
    <div className="max-w-[1600px] mx-auto space-y-6">

    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
    <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 glow-text">
    <Shield className="text-cyan-400" size={36} />
    NetOps <span className="text-cyan-400">Observer</span>
    </h1>
    <p className="text-slate-400 mt-1">Hybrid Machine Learning Intrusion Prevention System</p>
    </div>
    <div className="glass-card px-4 py-2 flex items-center gap-3">
    <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-[0_0_10px_#64748b]"></div>
    <span className="font-semibold text-sm tracking-wide text-slate-400">SYSTEM INITIALIZING...</span>
    </div>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[700px]">
    <div className="flex justify-between items-center mb-6">
    <h2 className="text-xl font-semibold flex items-center gap-2">
    <Wifi className="text-cyan-400" size={24} />
    Live Traffic Feed
    </h2>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
    <Zap size={48} className="text-slate-700" />
    <p>Frontend scaffolded. Waiting for backend integration...</p>
    </div>
    </div>

    <div className="glass-card p-6 flex flex-col h-[700px]">
    <h2 className="text-xl font-semibold mb-6">System Status</h2>
    <p className="text-slate-500 text-center mt-10">UI Shell Loaded. Data stream offline.</p>
    </div>
    </div>

    </div>
    </div>
  );
};

export default App;
