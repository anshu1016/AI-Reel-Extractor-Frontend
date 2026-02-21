import React from 'react';
import { CheckCircle, Clock, AlertTriangle, Loader, FileText } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const s = status ? status.toLowerCase() : 'pending';

    const config = {
        pending: { color: "text-gray-400 border-gray-400", icon: Clock },
        processing: { color: "text-blue-400 border-blue-400 shadow-blue-400/50", icon: Loader, animate: true },
        transcribing: { color: "text-blue-400 border-blue-400 shadow-blue-400/50", icon: Loader, animate: true },
        extracting: { color: "text-neon-purple border-neon-purple shadow-neon-purple/50", icon: Loader, animate: true },
        completed: { color: "text-neon-cyan border-neon-cyan shadow-neon-cyan/50", icon: CheckCircle },
        failed: { color: "text-neon-pink border-neon-pink shadow-neon-pink/50", icon: AlertTriangle },
        awaiting_selection: { color: "text-neon-yellow border-neon-yellow shadow-neon-yellow/50", icon: FileText },
    };

    const current = config[s] || config.pending;
    const Icon = current.icon;

    return (
        <span className={`flex items-center gap-2 px-3 py-1 text-xs font-display uppercase border rounded-full shadow-[0_0_5px_rgba(0,0,0,0.2)] ${current.color} bg-bg-dark/50 backdrop-blur-sm`}>
            <Icon size={14} className={current.animate ? "animate-spin" : ""} />
            {s.replace(/_/g, ' ')}
        </span>
    );
};

export default StatusBadge;
