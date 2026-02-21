import React from 'react';

export const NeonButton = ({ children, variant = "cyan", onClick, className = "", disabled, ...props }) => {
    const baseClasses = "relative px-6 py-2 font-display font-bold uppercase tracking-wider overflow-hidden transition-all duration-300 rounded disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = variant === "pink"
        ? "border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-white shadow-[0_0_10px_rgba(255,42,109,0.3)] hover:shadow-[0_0_20px_rgba(255,42,109,0.6)]"
        : "border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-bg-dark shadow-[0_0_10px_rgba(5,217,232,0.3)] hover:shadow-[0_0_20px_rgba(5,217,232,0.6)]";

    // If disabled, remove hover effects functionally (though css handles opacity)
    const finalClass = disabled ? `${baseClasses} border-2 border-gray-500 text-gray-500` : `${baseClasses} ${variantClasses}`;

    return (
        <button className={`${finalClass} ${className}`} onClick={onClick} disabled={disabled} {...props}>
            {children}
        </button>
    );
};
