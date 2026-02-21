export const GlassCard = ({ children, className = "", onClick }) => {
    return (
        <div
            className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-neon-cyan/50 hover:shadow-lg hover:shadow-neon-cyan/10 ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
