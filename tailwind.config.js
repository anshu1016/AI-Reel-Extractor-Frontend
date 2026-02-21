/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-dark': '#01012b',
                'neon-pink': '#ff2a6d',
                'neon-cyan': '#05d9e8',
                'neon-purple': '#b967ff',
                'neon-yellow': '#fef01b',
            },
            fontFamily: {
                display: ['Orbitron', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'neon-pink': '0 0 10px #ff2a6d',
                'neon-cyan': '0 0 10px #05d9e8',
                'neon-purple': '0 0 10px #b967ff',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glitch': 'glitch 1s linear infinite',
            },
            keyframes: {
                glitch: {
                    '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
                    '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
                    '62%': { transform: 'translate(0,0) skew(5deg)' },
                },
            },
        },
    },
    plugins: [],
}
