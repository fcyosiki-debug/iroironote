import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // 教育向けのフレンドリーなカラーパレット
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                accent: {
                    yellow: '#fbbf24',
                    pink: '#f472b6',
                    green: '#34d399',
                    purple: '#a78bfa',
                    orange: '#fb923c',
                },
                card: {
                    yellow: '#fef3c7',
                    pink: '#fce7f3',
                    green: '#d1fae5',
                    blue: '#dbeafe',
                    purple: '#ede9fe',
                    orange: '#ffedd5',
                },
            },
            fontFamily: {
                sans: ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
            },
            animation: {
                'bounce-gentle': 'bounce-gentle 2s infinite',
                'pulse-slow': 'pulse 3s infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                'bounce-gentle': {
                    '0%, 100%': { transform: 'translateY(-5%)' },
                    '50%': { transform: 'translateY(0)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 15px rgba(14, 165, 233, 0.5)',
            },
        },
    },
    plugins: [],
};

export default config;
