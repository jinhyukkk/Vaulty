// Vaulty design tokens — premium, natural palette, serif-led
const VAULTY = {
  light: {
    bg: '#F5F1E8',
    surface: '#FBF8F1',
    surfaceAlt: '#EFE9DB',
    ink: '#1C1A15',
    inkSoft: '#4A4339',
    inkMuted: '#8B8270',
    line: '#D9D1BF',
    lineSoft: '#E8E2D1',
    accent: '#2F4A3A',      // deep forest
    accentSoft: '#E4ECE5',
    bronze: '#8C6A3E',      // bronze
    bronzeSoft: '#EADFCB',
    up: '#2F6B4F',
    down: '#A83A2C',
    gold: '#B8925A',
  },
  dark: {
    bg: '#141210',
    surface: '#1C1915',
    surfaceAlt: '#26221C',
    ink: '#F2ECDD',
    inkSoft: '#C4BCA8',
    inkMuted: '#867E6B',
    line: '#2F2A22',
    lineSoft: '#252019',
    accent: '#8BA998',
    accentSoft: '#273530',
    bronze: '#C69966',
    bronzeSoft: '#3A2E20',
    up: '#7FB598',
    down: '#D68477',
    gold: '#D4AE74',
  },
};

const FONTS = {
  serif: '"Geist", "IBM Plex Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
  sans: '"IBM Plex Sans KR", "IBM Plex Sans", "Geist", -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"IBM Plex Mono", "JetBrains Mono", "SF Mono", Menlo, monospace',
};

// Format currency (KRW base, convert to USD at fixed rate for demo)
const USD_RATE = 1380;
const fmtMoney = (krw, currency = 'KRW') => {
  if (currency === 'USD') {
    const v = krw / USD_RATE;
    return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (krw >= 1e8) return '₩' + (krw / 1e8).toFixed(2) + '억';
  if (krw >= 1e4) return '₩' + (krw / 1e4).toFixed(1) + '만';
  return '₩' + krw.toLocaleString('ko-KR');
};
const fmtPct = (v) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
const fmtNum = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

Object.assign(window, { VAULTY, FONTS, fmtMoney, fmtPct, fmtNum, USD_RATE });
