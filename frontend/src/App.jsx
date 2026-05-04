import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Shield, Wifi } from 'lucide-react';

const SOCKET_URL = 'http://localhost:3000';

const App = () => {
  const [packets, setPackets] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [maxPackets] = useState(50);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('live_traffic', (data) => {
      setPackets((prev) => [data, ...prev].slice(0, maxPackets));
    });

    return () => socket.disconnect();
  }, [maxPackets]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 relative">
    <div className="max-w-[1200px] mx-auto space-y-6">
    <header className="flex justify-between items-center">
    <h1 className="text-4xl font-bold flex items-center gap-3">
    <Shield className="text-cyan-400" size={36} /> NetOps Observer
    </h1>
    <div className="glass-card px-4 py-2 flex items-center gap-3">
    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
    <span>{isConnected ? 'CONNECTED' : 'OFFLINE'}</span>
    </div>
    </header>

    <div className="glass-card p-6 flex flex-col h-[700px]">
    <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
    <Wifi className="text-cyan-400" size={24} /> Live Traffic Feed
    </h2>
    <div className="flex-1 overflow-auto">
    <table className="w-full text-left border-collapse">
    <thead>
    <tr className="text-slate-400 border-b border-slate-800">
    <th className="p-3">Protocol</th>
    <th className="p-3">Source</th>
    <th className="p-3">Target</th>
    <th className="p-3">Classification</th>
    </tr>
    </thead>
    <tbody>
    {packets.map((pkt, idx) => (
      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20">
      <td className="p-3">{pkt.protocol}</td>
      <td className="p-3">{pkt.source_ip}:{pkt.source_port}</td>
      <td className="p-3">{pkt.dest_ip}:{pkt.dest_port}</td>
      <td className="p-3">{pkt.classification} ({pkt.confidence}%)</td>
      </tr>
    ))}
    </tbody>
    </table>
    </div>
    </div>
    </div>
    </div>
  );
};

export default App;
