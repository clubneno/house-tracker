import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Vibrant accent colors
        vibrant: {
          blue: "hsl(var(--vibrant-blue))",
          green: "hsl(var(--vibrant-green))",
          orange: "hsl(var(--vibrant-orange))",
          pink: "hsl(var(--vibrant-pink))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Glass border radius
        glass: "var(--radius-glass)",
        "glass-lg": "var(--radius-glass-lg)",
        pill: "var(--radius-pill)",
      },
      backdropBlur: {
        xs: "4px",
        glass: "var(--glass-blur-md)",
        "glass-sm": "var(--glass-blur-sm)",
        "glass-lg": "var(--glass-blur-lg)",
        "glass-xl": "var(--glass-blur-xl)",
      },
      boxShadow: {
        "glass-sm": "var(--glass-shadow-sm)",
        glass: "var(--glass-shadow-md)",
        "glass-lg": "var(--glass-shadow-lg)",
        "glass-inner": "var(--glass-shadow-inner)",
      },
      transitionTimingFunction: {
        spring: "var(--ease-spring)",
        smooth: "var(--ease-smooth)",
      },
      animation: {
        "glass-in": "glassIn 200ms var(--ease-smooth)",
        "glass-out": "glassOut 150ms var(--ease-smooth)",
        "scale-in": "scaleIn 200ms var(--ease-spring)",
        "fade-up": "fadeUp 300ms var(--ease-smooth)",
      },
      keyframes: {
        glassIn: {
          "0%": { opacity: "0", backdropFilter: "blur(0px)" },
          "100%": { opacity: "1", backdropFilter: "blur(var(--glass-blur-md))" },
        },
        glassOut: {
          "0%": { opacity: "1", backdropFilter: "blur(var(--glass-blur-md))" },
          "100%": { opacity: "0", backdropFilter: "blur(0px)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
