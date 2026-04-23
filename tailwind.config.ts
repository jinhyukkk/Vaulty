import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vaulty: {
          bg: "#F5F1E8",
          surface: "#FBF8F1",
          surfaceAlt: "#EFE9DB",
          ink: "#1C1A15",
          inkSoft: "#4A4339",
          inkMuted: "#8B8270",
          line: "#D9D1BF",
          lineSoft: "#E8E2D1",
          accent: "#2F4A3A",
          accentSoft: "#E4ECE5",
          bronze: "#8C6A3E",
          bronzeSoft: "#EADFCB",
          up: "#2F6B4F",
          down: "#A83A2C",
          gold: "#B8925A",
        },
      },
      fontFamily: {
        serif: [
          "Geist",
          "IBM Plex Sans KR",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        sans: [
          "IBM Plex Sans KR",
          "IBM Plex Sans",
          "Geist",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "IBM Plex Mono",
          "JetBrains Mono",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        vault: "2px",
      },
      keyframes: {
        slideInRight: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        hide: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        slideDownAndFade: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideLeftAndFade: {
          from: { opacity: "0", transform: "translateX(6px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideUpAndFade: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideRightAndFade: {
          from: { opacity: "0", transform: "translateX(-6px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        accordionOpen: {
          from: { height: "0px" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        accordionClose: {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0px" },
        },
        dialogOverlayShow: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        dialogContentShow: {
          from: {
            opacity: "0",
            transform: "translate(-50%, -45%) scale(0.95)",
          },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
      },
      animation: {
        hide: "hide 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideDownAndFade: "slideDownAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideLeftAndFade: "slideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideUpAndFade: "slideUpAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideRightAndFade: "slideRightAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideInRight: "slideInRight 250ms cubic-bezier(.2,.7,.3,1)",
        accordionOpen: "accordionOpen 150ms cubic-bezier(0.87, 0, 0.13, 1)",
        accordionClose: "accordionClose 150ms cubic-bezier(0.87, 0, 0.13, 1)",
        dialogOverlayShow: "dialogOverlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        dialogContentShow: "dialogContentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [forms],
};

export default config;
