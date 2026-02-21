import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap, LogOut } from 'lucide-react';

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-bg-dark/80 backdrop-blur-md border-b border-neon-cyan/20 flex items-center justify-between px-6 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/50 group-hover:bg-neon-cyan transition-all duration-300">
                    <Zap className="text-neon-cyan group-hover:text-bg-dark" size={20} />
                </div>
                <span className="font-display font-bold text-xl tracking-wider text-white">
                    AI<span className="text-neon-cyan">REEL</span>
                </span>
            </Link>

            <nav className="flex items-center gap-6">
                {user && (
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-display text-neon-cyan tracking-wider">OPERATOR</span>
                            <span className="text-sm font-bold">{user.full_name}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full border border-white/20 hover:border-neon-pink hover:text-neon-pink transition-all duration-300 bg-white/5"
                            title="Disconnect"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
