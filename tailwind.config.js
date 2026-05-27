/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design System: Psicologia das Cores para "Bora!"
        brand: {
          // Coral - Energia, ação, "Bora!" (Cor principal de ação)
          coral: {
            50: '#fff4f0',
            100: '#ffe6dc',
            200: '#ffcfbe',
            300: '#ffad92',
            400: '#ff7e58',
            500: '#ff5422', // Ação Primária
            600: '#f03b0a',
            700: '#c82d07',
            800: '#a0250a',
            900: '#81220c',
          },
          // Teal - Confiança, frescor, descoberta (Ação secundária/Categorias)
          teal: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
          },
          // Deep Indigo - Sofisticação, vida noturna, prêmio (Background dark)
          indigo: {
            50: '#f3f2fc',
            100: '#e9e6fb',
            200: '#d7d0f7',
            300: '#bbaeef',
            400: '#9b84e4',
            500: '#7e5fd6',
            600: '#693fc4',
            700: '#5631a7',
            800: '#462889',
            900: '#1b0e3f', // Fundo Dark Principal
            950: '#0d0724', // Fundo Dark Super Escuro
          },
          // Yellow - Destaques, favoritos, calor
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'premium': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'premium-hover': '0 20px 40px rgba(0, 0, 0, 0.22)',
        'glass': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
