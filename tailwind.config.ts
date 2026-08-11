import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Derived from the aged cream paper texture.
        paper: {
          DEFAULT: "#F3ECDD", // base ivory/cream
          deep: "#E7DCC4", // shadowed cream
          edge: "#D8CBAE", // torn-edge / margin tone
        },
        ink: {
          DEFAULT: "#211C15", // near-black warm brown (body/headlines)
          soft: "#1A1712",
        },
        sepia: {
          DEFAULT: "#6B5D4A", // faded umber — meta, datelines, captions
          light: "#8A7A63",
        },
        oxblood: {
          DEFAULT: "#7B2D26", // brick red — nameplate rule + DEBATE stamp
          deep: "#5E211C",
        },
        gold: {
          DEFAULT: "#9A7B3F", // antique ochre — primary-source seal
          deep: "#7C6231",
        },
      },
      fontFamily: {
        masthead: ["var(--font-masthead)", "var(--font-display)", "serif"],
        display: [
          "var(--font-display)",
          "var(--font-noto-deva)",
          "var(--font-noto-kannada)",
          "var(--font-noto-telugu)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        body: [
          "var(--font-body)",
          "var(--font-noto-deva)",
          "var(--font-noto-kannada)",
          "var(--font-noto-telugu)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
      },
      maxWidth: {
        broadsheet: "78rem",
        measure: "38rem", // comfortable single-column reading measure
      },
      letterSpacing: {
        kicker: "0.22em",
        wide2: "0.14em",
      },
      keyframes: {
        "ink-rise": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "ink-rise": "ink-rise 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
