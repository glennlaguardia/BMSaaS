/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                display: ['var(--font-display)', 'Georgia', 'serif'],
                body: ['var(--font-body)', 'system-ui', 'sans-serif'],
            },
            colors: {
                forest: {
                    DEFAULT: '#3D4A28',
                    50: '#f5f6f1',
                    100: '#e6eadc',
                    200: '#cdd6bb',
                    300: '#a9b98e',
                    400: '#7a9458',
                    500: '#3D4A28',
                    600: '#333F22',
                    700: '#2A341C',
                    800: '#1F2714',
                    900: '#151C0E',
                },
                amber: {
                    DEFAULT: '#C9975E',
                    50: '#fdf8f2',
                    100: '#f7eaD5',
                    200: '#efd5ab',
                    300: '#C9975E',
                    400: '#B88650',
                    500: '#A07243',
                    600: '#8A5F37',
                    700: '#704C2D',
                    800: '#573A23',
                    900: '#402B1A',
                },
                cream: {
                    DEFAULT: '#F5F0E8',
                    50: '#fdfcfa',
                    100: '#F5F0E8',
                    200: '#ede5d7',
                    300: '#ddd1bd',
                    400: '#c5b49a',
                },
                terracotta: {
                    DEFAULT: '#C0593B',
                    50: '#fdf5f2',
                    100: '#fae6de',
                    200: '#f4c8b6',
                    300: '#e8a085',
                    400: '#D4724F',
                    500: '#C0593B',
                    600: '#A44A30',
                    700: '#863C27',
                    800: '#6A2F1E',
                    900: '#502417',
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                text: {
                    secondary: 'hsl(var(--text-secondary))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            animation: {
                'fade-up': 'fade-up 0.6s ease-out both',
                'fade-in': 'fade-in 0.5s ease-out both',
                'slide-in-right': 'slide-in-right 0.5s ease-out both',
            },
            keyframes: {
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'slide-in-right': {
                    from: { opacity: '0', transform: 'translateX(20px)' },
                    to: { opacity: '1', transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
