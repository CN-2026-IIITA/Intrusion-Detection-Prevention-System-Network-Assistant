import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import { Shield, ShieldAlert, Activity, Wifi, Database, AlertTriangle, Zap, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = 'http://localhost:3000';

const App = () => {
  const [packets, setPackets] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [totalTraffic, setTotalTraffic] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxPackets] = useState(50);

  // Stats
  const [totalAttacks, setTotalAttacks] = useState(0);
  const [attackerIps, setAttackerIps] = useState({});
  const [recentAlerts, setRecentAlerts] = useState([]);

  // Toasts
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to IDS Backend');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('live_traffic', (data) => {
      setPackets((prev) => [data, ...prev].slice(0, maxPackets));
      setTotalTraffic((prev) => prev + (data.packet_size || 0));
      setCurrentSpeed(data.speed_kbps || 0);

      // Attack Logic
      if (data.is_blocked || (data.classification && data.classification !== 'Normal')) {
        setTotalAttacks((prev) => prev + 1);

        // Track attacker IP frequency
        setAttackerIps((prev) => {
          const ip = data.source_ip || 'Unknown';
          return { ...prev, [ip]: (prev[ip] || 0) + 1 };
        });

        // Add to Recent Alerts panel (max 10)
        setRecentAlerts((prev) => {
          const newAlerts = [data, ...prev];
          return newAlerts.slice(0, 10);
        });

        // Show Toast
        addToast(`SECURITY ALERT: ${data.classification} detected from ${data.source_ip}`);
      }
    });

    return () => socket.disconnect();
  }, [maxPackets]);

  const addToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  const mostFrequentAttacker = useMemo(() => {
    let maxIp = 'None';
    let maxCount = 0;
    for (const [ip, count] of Object.entries(attackerIps)) {
      if (count > maxCount) {
        maxCount = count;
        maxIp = ip;
      }
    }
    return maxCount > 0 ? `${maxIp} (${maxCount} times)` : 'None';
  }, [attackerIps]);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 relative">
    {/* Toasts Container */}
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
    <AnimatePresence>
    {toasts.map((toast) => (
      <motion.div
      key={toast.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-red-500/20 border border-red-500/50 backdrop-blur-md text-red-100 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4 min-w-[300px]"
      >
      <div className="flex items-center gap-3">
      <ShieldAlert className="text-red-400" size={20} />
      <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button onClick={() => removeToast(toast.id)} className="text-red-400 hover:text-red-200">
      <X size={16} />
      </button>
      </motion.div>
    ))}
    </AnimatePresence>
    </div>

    <div className="max-w-[1600px] mx-auto space-y-6">
    {/* Header */}
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
    <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 glow-text">
    <Shield className="text-cyan-400" size={36} />
    NetOps <span className="text-cyan-400">Observer</span>
    </h1>
    <p className="text-slate-400 mt-1">Hybrid Machine Learning Intrusion Prevention System</p>
    </div>
    <div className="glass-card px-4 py-2 flex items-center gap-3">
    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
    <span className="font-semibold text-sm tracking-wide">{isConnected ? 'BACKEND CONNECTED' : 'BACKEND OFFLINE'}</span>
    </div>
    </header>

    {/* Attack Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
    icon={<ShieldAlert size={24} />}
    title="Total Attacks Blocked"
    value={totalAttacks}
    color="red"
    />
    <StatCard
    icon={<AlertTriangle size={24} />}
    title="Most Frequent Attacker IP"
    value={mostFrequentAttacker}
    color="orange"
    />
    <StatCard
    icon={<Activity size={24} />}
    title="Current Network Speed"
    value={`${currentSpeed} KB/s`}
    color="cyan"
    />
    <StatCard
    icon={<Database size={24} />}
    title="Total Data Analyzed"
    value={formatSize(totalTraffic)}
    color="purple"
    />
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

    {/* Live Traffic Feed (Occupies 2 columns on large screens) */}
    <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[700px]">
    <div className="flex justify-between items-center mb-6">
    <h2 className="text-xl font-semibold flex items-center gap-2">
    <Wifi className="text-cyan-400" size={24} />
    Live Traffic Feed
    </h2>
    <span className="text-xs text-slate-500 font-mono">MONITORING LAST {maxPackets} FLOWS</span>
    </div>

    <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
    <table className="w-full border-collapse">
    <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-sm z-10">
    <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
    <th className="p-3 pb-4">Status</th>
    <th className="p-3 pb-4">Protocol</th>
    <th className="p-3 pb-4">Source</th>
    <th className="p-3 pb-4">Target</th>
    <th className="p-3 pb-4">Classification</th>
    </tr>
    </thead>
    <tbody>
    <AnimatePresence initial={false}>
    {packets.map((pkt, idx) => {
      const isAttack = pkt.is_blocked || (pkt.classification && pkt.classification !== 'Normal');

      return (
        <motion.tr
        key={pkt.timestamp + '-' + idx}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`
          border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors
          ${isAttack ? 'bg-red-500/10 hover:bg-red-500/20' : ''}
          `}
          >
          <td className="p-3">
          {isAttack ? (
            <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs bg-red-500/10 px-2 py-1 rounded-md w-fit border border-red-500/20">
            <ShieldAlert size={14} /> BLOCKED
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-md w-fit border border-emerald-500/20">
            <ShieldCheck size={14} /> SAFE
            </div>
          )}
          </td>
          <td className="p-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
            pkt.protocol === 'TCP' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
            pkt.protocol === 'UDP' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
          }`}>
          {pkt.protocol || 'UNK'}
          </span>
          </td>
          <td className="p-3">
          <div className="flex flex-col">
          <span className="font-medium text-sm text-slate-200">{pkt.source_name || pkt.source_ip}</span>
          <span className="text-xs text-slate-500 font-mono">{pkt.source_ip}:{pkt.source_port}</span>
          </div>
          </td>
          <td className="p-3">
          <div className="flex flex-col">
          <span className="font-medium text-sm text-slate-200">{pkt.destination_name || pkt.dest_ip}</span>
          <span className="text-xs text-slate-500 font-mono">{pkt.dest_ip}:{pkt.dest_port}</span>
          </div>
          </td>
          <td className="p-3">
          <span className={`text-sm font-medium ${isAttack ? 'text-red-400' : 'text-emerald-400'}`}>
          {pkt.classification || 'Normal'}
          </span>
          {pkt.confidence > 0 && (
            <span className="text-xs text-slate-500 ml-2">({pkt.confidence}%)</span>
          )}
          </td>
          </motion.tr>
      );
    })}
    </AnimatePresence>
    </tbody>
    </table>
    {packets.length === 0 && (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
      <div className="animate-pulse">
      <Zap size={48} className="text-slate-700" />
      </div>
      <p>Awaiting live network traffic from sensor...</p>
      </div>
    )}
    </div>
    </div>

    {/* Recent Alerts Panel */}
    <div className="glass-card p-6 flex flex-col h-[700px]">
    <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
    <ShieldAlert className="text-red-400" size={24} />
    Recent Alerts
    </h2>

    <div className="flex-1 overflow-auto pr-2 custom-scrollbar space-y-3">
    <AnimatePresence>
    {recentAlerts.length === 0 ? (
      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
      <ShieldCheck size={48} className="mx-auto mb-4 text-emerald-500/30" />
      <p>No threats detected recently.</p>
      </div>
    ) : (
      recentAlerts.map((alert, idx) => {
        const time = new Date(
          typeof alert.timestamp === 'number' ? alert.timestamp * 1000 : alert.timestamp
        ).toLocaleTimeString();

        return (
          <motion.div
          key={alert.timestamp + '-' + idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden"
          >
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />

          <div className="flex justify-between items-start">
          <span className="text-red-400 font-bold text-sm tracking-wide">
          {alert.classification}
          </span>
          <span className="text-xs text-slate-500 font-mono">{time}</span>
          </div>

          <div className="text-sm mt-1">
          <span className="text-slate-400">Attacker:</span> <span className="font-mono text-slate-200 ml-1">{alert.source_ip}</span>
          </div>

          <div className="flex justify-between items-center mt-2">
          <div className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30 font-semibold flex items-center gap-1">
          <ShieldAlert size={12} /> BLOCKED
          </div>
          {alert.confidence && (
            <span className="text-xs text-slate-400">Confidence: {alert.confidence}%</span>
          )}
          </div>
          </motion.div>
        );
      })
    )}
    </AnimatePresence>
    </div>
    </div>

    </div>
    </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => {
  const colorMap = {
    red: 'bg-red-500/15 text-red-400 border-red-500/20',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20'
  };

  const iconColorMap = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400'
  };

  return (
    <div className={`glass-card p-5 flex items-center gap-4 border ${colorMap[color].split(' ')[2]}`}>
    <div className={`p-3 rounded-xl ${colorMap[color]}`}>
    {React.cloneElement(icon, { className: iconColorMap[color] })}
    </div>
    <div className="overflow-hidden">
    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">{title}</p>
    <p className="text-2xl font-bold text-slate-100 mt-1 truncate" title={value}>{value}</p>
    </div>
    </div>
  );
};

export default App;
