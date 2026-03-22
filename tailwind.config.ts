import type { Config } from "tailwindcss";
const plugin = require("tailwindcss/plugin");

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
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      /* ===================================================== */
      /* COLORS                                                */
      /* ===================================================== */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground":
            "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground":
            "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* Custom */
        "text-primary": "hsl(var(--text-primary))",
        "text-secondary": "hsl(var(--text-secondary))",
        "text-muted": "hsl(var(--text-muted))",
        "glow-purple": "hsl(var(--glow-purple))",

        neon: "#3b82f6",
        purpleGlow: "#7c3aed",
      },

      /* ===================================================== */
      /* TYPOGRAPHY                                            */
      /* ===================================================== */
      fontFamily: {
        sans: ["Nixmat", "sans-serif"],
        display: ["FC Fast", "sans-serif"],
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
      },

      /* ===================================================== */
      /* SPACING SYSTEM                                        */
      /* ===================================================== */
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
      },

      /* ===================================================== */
      /* BORDER RADIUS                                         */
      /* ===================================================== */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },

      /* ===================================================== */
      /* SHADOWS                                               */
      /* ===================================================== */
      boxShadow: {
        glow: "0 0 20px rgba(59,130,246,0.4)",
        deep: "0 20px 50px rgba(0,0,0,0.6)",
        soft: "0 10px 30px rgba(0,0,0,0.3)",
      },

      /* ===================================================== */
      /* BACKDROP BLUR                                         */
      /* ===================================================== */
      backdropBlur: {
        xs: "2px",
      },

      /* ===================================================== */
      /* KEYFRAMES                                             */
      /* ===================================================== */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },

        glow: {
          "0%,100%": { boxShadow: "0 0 10px rgba(59,130,246,0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(59,130,246,0.6)" },
        },

        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },

        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },

        scaleIn: {
          from: { transform: "scale(0.8)", opacity: 0 },
          to: { transform: "scale(1)", opacity: 1 },
        },
      },

      /* ===================================================== */
      /* ANIMATIONS                                            */
      /* ===================================================== */
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        "spin-slow": "spinSlow 10s linear infinite",
        fade: "fadeIn 0.8s ease-out",
        scale: "scaleIn 0.5s ease-out",
      },
    },
  },

  /* ===================================================== */
  /* PLUGINS                                               */
  /* ===================================================== */
  plugins: [
    require("tailwindcss-animate"),

    plugin(function ({ addUtilities, addComponents }) {

      /* Custom Utilities */
      addUtilities({
        ".text-gradient": {
          background: "linear-gradient(135deg,#3b82f6,#7c3aed)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },

        ".glass": {
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.05)",
        },

        ".neon-border": {
          border: "1px solid rgba(59,130,246,0.5)",
          boxShadow: "0 0 10px rgba(59,130,246,0.5)",
        },
      });

      /* Custom Components */
      addComponents({
        ".btn-primary": {
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
          color: "#fff",
          fontWeight: "600",
          transition: "all 0.3s",
        },

        ".btn-primary:hover": {
          transform: "scale(1.05)",
        },

        ".card-modern": {
          padding: "1.5rem",
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
        },
      });
    }),
  ],
} satisfies Config;
