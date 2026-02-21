import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { GlassCard } from '../components/ui/GlassCard';
import { User, Lock, Mail, Building, Phone } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        company_name: '',
        phone: ''
    });
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        let success = false;

        if (isLogin) {
            if (!formData.email || !formData.password) {
                setLoading(false);
                return; // Toast handled by interceptor or context? Context handles it.
            }
            success = await login(formData.email, formData.password);
            if (success) navigate('/dashboard');
        } else {
            success = await signup(formData);
            if (success) {
                setIsLogin(true);
                setFormData({ ...formData, password: '' });
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-dark relative overflow-hidden">
            {/* Cyberpunk Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(5,217,232,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(5,217,232,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute inset-0 bg-radial-at-c from-bg-dark/50 to-bg-dark pointer-events-none" />

            <GlassCard className="w-full max-w-md p-8 relative z-10 border-neon-cyan/30 shadow-[0_0_40px_rgba(5,217,232,0.15)] flex flex-col gap-6">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-display font-bold tracking-widest text-white">
                        AI<span className="text-neon-cyan drop-shadow-[0_0_10px_rgba(5,217,232,0.8)]">REEL</span>
                    </h1>
                    <p className="text-xs font-mono text-neon-cyan/60 tracking-[0.2em] uppercase">
                        {isLogin ? 'Authorized Personnel Only' : 'New Operator Registration'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 text-neon-cyan/50 group-focus-within:text-neon-cyan transition-colors" size={18} />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-bg-dark/50 border border-white/10 rounded px-10 py-3 text-white placeholder-white/30 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all font-mono"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 text-neon-cyan/50 group-focus-within:text-neon-cyan transition-colors" size={18} />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-bg-dark/50 border border-white/10 rounded px-10 py-3 text-white placeholder-white/30 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all font-mono"
                                required
                            />
                        </div>

                        {!isLogin && (
                            <>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3.5 text-neon-cyan/50 group-focus-within:text-neon-cyan transition-colors" size={18} />
                                    <input
                                        type="text"
                                        name="full_name"
                                        placeholder="Full Name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className="w-full bg-bg-dark/50 border border-white/10 rounded px-10 py-3 text-white placeholder-white/30 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all font-mono"
                                        required
                                    />
                                </div>
                                <div className="relative group">
                                    <Building className="absolute left-3 top-3.5 text-neon-cyan/50 group-focus-within:text-neon-cyan transition-colors" size={18} />
                                    <input
                                        type="text"
                                        name="company_name"
                                        placeholder="Company Name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        className="w-full bg-bg-dark/50 border border-white/10 rounded px-10 py-3 text-white placeholder-white/30 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all font-mono"
                                    />
                                </div>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-3.5 text-neon-cyan/50 group-focus-within:text-neon-cyan transition-colors" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-bg-dark/50 border border-white/10 rounded px-10 py-3 text-white placeholder-white/30 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all font-mono"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <NeonButton
                        type="submit"
                        className="w-full mt-6"
                        disabled={loading}
                        variant="cyan"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Access Terminal' : 'Create Identity')}
                    </NeonButton>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-xs text-neon-cyan/70 hover:text-neon-cyan hover:underline tracking-wide transition-colors"
                    >
                        {isLogin ? "Need Access? Request Registration" : "Already Identified? Proceed to Login"}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default Login;
