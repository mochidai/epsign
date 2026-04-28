import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "ep-red": "#ff0000",
        "ep-green": "#00ff00",
        "ep-blue": "#0000ff",
        "ep-yellow": "#ffff00",
        "ep-orange": "#ff8000",
        "ep-white": "#ffffff",
        "ep-black": "#000000",

        "sub-gray": "#808080",
        "sub-light-gray": "#c0c0c0",
        "sub-dark-gray": "#404040",

        "sub-light-red": "#ff2222",
        "sub-light-blue": "#2222ff",
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      scale: {
        "200": "2",
      },
    },
  },
  plugins: [],
} satisfies Config;
