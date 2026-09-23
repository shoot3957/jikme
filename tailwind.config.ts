import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 10개 구단 포인트 컬러 (예시 - 추후 조정)
        team: {
          doosan: '#131230',
          lg: '#C30452',
          kt: '#000000',
          samsung: '#074CA1',
          lotte: '#041E42',
          hanwha: '#FF6600',
          kia: '#EA0029',
          ssg: '#CE0E2D',
          nc: '#315288',
          kiwoom: '#570514',
        },
        // 나이트게임 팔레트 (인증 화면 등 브랜드 표면용)
        ink: {
          700: '#1B2C45',
          900: '#0F1B2D',
        },
        field: {
          600: '#2F7A52',
          700: '#1F4D3A',
        },
        chalk: {
          50: '#F5F3ED',
          100: '#EDEAE0',
        },
        gold: {
          400: '#F0B65C',
          500: '#E8A33D',
          600: '#C98526',
        },
        stitch: {
          500: '#C23B3B',
          600: '#A62F2F',
        },
        dirt: {
          500: '#B08968',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        glow: 'glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
