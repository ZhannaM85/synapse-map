/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                border: 'hsl(var(--border))',
                ring: 'hsl(var(--ring))',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'node-appear': {
                    '0%': { opacity: '0', transform: 'scale(0.8)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                'node-appear': 'node-appear 0.3s ease-out',
            },
        },
    },
    plugins: [],
};
