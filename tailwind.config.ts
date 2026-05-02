import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
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
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
        /**
         * Sukull semantik renkler — değerler `app/globals.css` içindeki
         * `--suk-*` değişkenlerinden gelir; palet değişimi tek dosyada yapılır.
         */
        suk: {
          surface: {
            page: "hsl(var(--suk-surface-page) / <alpha-value>)",
            muted: "hsl(var(--suk-surface-muted) / <alpha-value>)",
            card: "hsl(var(--suk-surface-card) / <alpha-value>)",
          },
          border: {
            DEFAULT: "hsl(var(--suk-border) / <alpha-value>)",
            strong: "hsl(var(--suk-border-strong) / <alpha-value>)",
          },
          fg: {
            primary: "hsl(var(--suk-fg-primary) / <alpha-value>)",
            secondary: "hsl(var(--suk-fg-secondary) / <alpha-value>)",
            muted: "hsl(var(--suk-fg-muted) / <alpha-value>)",
          },
          brand: {
            DEFAULT: "hsl(var(--suk-brand) / <alpha-value>)",
            fg: "hsl(var(--suk-brand-fg) / <alpha-value>)",
            hover: "hsl(var(--suk-brand-hover) / <alpha-value>)",
            border: "hsl(var(--suk-brand-border) / <alpha-value>)",
            soft: {
              DEFAULT: "hsl(var(--suk-brand-soft) / <alpha-value>)",
              fg: "hsl(var(--suk-brand-soft-fg) / <alpha-value>)",
            },
          },
          payment: {
            DEFAULT: "hsl(var(--suk-payment) / <alpha-value>)",
            fg: "hsl(var(--suk-payment-fg) / <alpha-value>)",
            hover: "hsl(var(--suk-payment-hover) / <alpha-value>)",
            border: "hsl(var(--suk-payment-border) / <alpha-value>)",
            soft: {
              DEFAULT: "hsl(var(--suk-payment-soft) / <alpha-value>)",
              fg: "hsl(var(--suk-payment-soft-fg) / <alpha-value>)",
            },
            ring: "hsl(var(--suk-payment-ring) / <alpha-value>)",
          },
          play: {
            DEFAULT: "hsl(var(--suk-play) / <alpha-value>)",
            fg: "hsl(var(--suk-play-fg) / <alpha-value>)",
            hover: "hsl(var(--suk-play-hover) / <alpha-value>)",
            border: "hsl(var(--suk-play-border) / <alpha-value>)",
            soft: {
              DEFAULT: "hsl(var(--suk-play-soft) / <alpha-value>)",
              fg: "hsl(var(--suk-play-soft-fg) / <alpha-value>)",
            },
            line: "hsl(var(--suk-play-outline-border) / <alpha-value>)",
          },
          danger: {
            DEFAULT: "hsl(var(--suk-danger) / <alpha-value>)",
            fg: "hsl(var(--suk-danger-fg) / <alpha-value>)",
            hover: "hsl(var(--suk-danger-hover) / <alpha-value>)",
            border: "hsl(var(--suk-danger-border) / <alpha-value>)",
            soft: "hsl(var(--suk-danger-soft) / <alpha-value>)",
            line: "hsl(var(--suk-danger-outline-border) / <alpha-value>)",
          },
          warning: {
            DEFAULT: "hsl(var(--suk-warning) / <alpha-value>)",
            soft: "hsl(var(--suk-warning-soft) / <alpha-value>)",
            "soft-fg": "hsl(var(--suk-warning-soft-fg) / <alpha-value>)",
            border: "hsl(var(--suk-warning-border) / <alpha-value>)",
          },
          neutral: {
            locked: "hsl(var(--suk-neutral-locked) / <alpha-value>)",
            "locked-border": "hsl(var(--suk-neutral-locked-border) / <alpha-value>)",
            "locked-fg": "hsl(var(--suk-neutral-locked-fg) / <alpha-value>)",
          },
          info: {
            DEFAULT: "hsl(var(--suk-info) / <alpha-value>)",
            soft: "hsl(var(--suk-info-soft) / <alpha-value>)",
          },
        },
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
