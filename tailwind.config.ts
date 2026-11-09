import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* 사이트 공통 색 (blog.dowha.kim · dowha.kim 동일하게 유지) */
        page: '#FCFCFC', // 바탕
        brand: { DEFAULT: '#0086FF', dark: '#006FD6', bg: '#eef6ff', border: '#b3dbff' }, // 주 색·링크 hover / 진한 파랑(선택·제안·버튼 hover) / 연한 배경·테두리
        warn: { DEFAULT: '#c8481c', light: '#ee6033', dark: '#a93c17', bg: '#fef3ee', border: '#f8c8b5' }, // 경고·삭제 / N 배지 / hover / 연한 배경·테두리
      },
    },
  },
  plugins: [],
};

export default config;
