
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
	extend: {
		fontFamily: {
			'abril-fatface': ['Abril Fatface', 'serif'],
			'miftah': ['Miftah', 'serif'],
			'mencken': ['Mencken', 'serif'],
		},
		colors: {
			border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        supera: {
          DEFAULT: '#FF9500', // Laranja Supera principal atualizado
          50: '#FFF5EB',
          100: '#FEEDDC',
          200: '#FCDAB9',
          300: '#FAC796',
          400: '#F89F54',
          500: '#FF9500', // PANTONE principal atualizado
          600: '#E45E00',
          700: '#B24800',
          800: '#7F3300',
          900: '#4C1F00',
          foreground: '#FFFFFF'
        },
        laranja: {
          DEFAULT: '#FF9500', // Atualizado para o novo laranja primário
          light: '#FF6B00', // Usado intercambiavelmente com o DEFAULT
          medium: '#FF9500',
          dark: '#E25E4A',
        },
        roxo: {
          DEFAULT: '#4F46E5', // Roxo profundo atualizado
          light: '#4F46E5', // Mais claro
          medium: '#311D64', // Roxo sidebar
        },
        cinza: {
          DEFAULT: '#0F172A', // Text dark atualizado
          medium: '#64748b',
          light: '#f1f5f9',
        },
        azul: {
          // Mantendo cores azuis para compatibilidade
          50: '#E6F2FF',
          100: '#B3E0FF',
          200: '#66C2FF',
          300: '#1E90FF',
          400: '#0066CC',
          500: '#003366',
          600: '#001A33',
          foreground: '#003366'
        },
        'vivid-purple': '#4F46E5',
        'secondary-purple': '#7E69AB',
        // Adicionando cores para visualização de dados
        chart: {
          primary: '#4361ee',
          secondary: [
            '#ef476f', '#06d6a0', '#ffd166', '#118ab2', '#ff9f1c', 
            '#7209b7', '#2b9348', '#e07a5f', '#3a86ff', '#bc4749', 
            '#0077b6', '#fb8500', '#7b2cbf', '#3f8efc', '#55a630'
          ],
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
