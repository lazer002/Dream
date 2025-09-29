/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
	  extend: {
	
		outline: {
			none: ['0', 'none'],
		  },
		colors: {
		  // Replace brand 500 with your navy or add new navy
		  brand: {
			50: '#f0f8ff',
			500: '#042354', // <-- rgb(4,35,84)
			600: '#031f5a', // darker variant
			700: '#03194a', // even darker for hover
		  },
		  navy: { // optional custom name
			DEFAULT: '#042354',
			dark: '#031f5a',
			light: '#1a3b78',
		  },
		  background: 'hsl(var(--background))',
		  foreground: 'hsl(var(--foreground))',
		  card: {
			DEFAULT: 'hsl(var(--card))',
			foreground: 'hsl(var(--card-foreground))'
		  },
		  popover: {
			DEFAULT: 'hsl(var(--popover))',
			foreground: 'hsl(var(--popover-foreground))'
		  },
		  primary: {
			DEFAULT: 'hsl(var(--primary))',
			foreground: 'hsl(var(--primary-foreground))'
		  },
		  secondary: {
			DEFAULT: 'hsl(var(--secondary))',
			foreground: 'hsl(var(--secondary-foreground))'
		  },
		  muted: {
			DEFAULT: 'hsl(var(--muted))',
			foreground: 'hsl(var(--muted-foreground))'
		  },
		  accent: {
			DEFAULT: 'hsl(var(--accent))',
			foreground: 'hsl(var(--accent-foreground))'
		  },
		  destructive: {
			DEFAULT: 'hsl(var(--destructive))',
			foreground: 'hsl(var(--destructive-foreground))'
		  },
		  border: 'hsl(var(--border))',
		  input: 'hsl(var(--input))',
		  ring: 'hsl(var(--ring))',
		  chart: {
			1: 'hsl(var(--chart-1))',
			2: 'hsl(var(--chart-2))',
			3: 'hsl(var(--chart-3))',
			4: 'hsl(var(--chart-4))',
			5: 'hsl(var(--chart-5))'
		  }
		},
		borderRadius: {
		  lg: 'var(--radius)',
		  md: 'calc(var(--radius) - 2px)',
		  sm: 'calc(var(--radius) - 4px)'
		},
		keyframes: {
		  'accordion-down': {
			from: { height: '0' },
			to: { height: 'var(--radix-accordion-content-height)' }
		  },
		  'accordion-up': {
			from: { height: 'var(--radix-accordion-content-height)' },
			to: { height: '0' }
		  }
		},
		animation: {
		  'accordion-down': 'accordion-down 0.2s ease-out',
		  'accordion-up': 'accordion-up 0.2s ease-out'
		},
			 keyframes: {
        blink: {
          '0%, 100%': { backgroundColor: 'white' },
          '50%': { backgroundColor: 'antiquewhite' },
        },
      },
      animation: {
        blink: 'blink 4s infinite',
      },
	  
	   }
	},
	plugins: [require('@tailwindcss/forms'), require("tailwindcss-animate"),
		function({ addBase }) {
			addBase({
			  'input, textarea, select, button': {
				outline: 'none !important',
				boxShadow: 'none !important',
			  },
			  '*:focus': {
				outline: 'none !important',
				boxShadow: 'none !important',
			  },
			  'input:-webkit-autofill': {
				'-webkit-box-shadow': '0 0 0px 1000px #1B1A1A inset !important',
				'-webkit-text-fill-color': '#fff !important',
			  },
			})
		  }
	]
  }
  