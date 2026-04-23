// Shared chart primitives — all SVG, no deps
const { VAULTY, FONTS, fmtMoney, fmtPct, fmtNum } = window;

// Donut chart with hover interaction
function DonutChart({ data, size = 220, stroke = 28, theme = 'light', onHover }) {
  const t = VAULTY[theme];
  const [hover, setHover] = React.useState(null);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size} style={{ overflow: 'visible', display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.lineSoft} strokeWidth={stroke} />
      {data.map((d, i) => {
        const len = (d.pct / 100) * c;
        const off = c - (acc / 100) * c;
        const isHover = hover === i;
        const seg = (
          <circle
            key={d.key}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={isHover ? stroke + 4 : stroke}
            strokeDasharray={`${len - 1.5} ${c}`}
            strokeDashoffset={off}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-width .2s, opacity .2s', opacity: hover !== null && !isHover ? 0.35 : 1, cursor: 'pointer' }}
            onMouseEnter={() => { setHover(i); onHover && onHover(d); }}
            onMouseLeave={() => { setHover(null); onHover && onHover(null); }}
          />
        );
        acc += d.pct;
        return seg;
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.5, fill: t.inkMuted }}>TOTAL</text>
      <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontFamily: FONTS.serif, fontSize: 24, fontWeight: 500, fill: t.ink }}>
        {hover !== null ? `${data[hover].pct.toFixed(1)}%` : '100%'}
      </text>
      <text x={cx} y={cy + 34} textAnchor="middle" style={{ fontFamily: FONTS.sans, fontSize: 10, fill: t.inkMuted, letterSpacing: 0.5 }}>
        {hover !== null ? data[hover].label : '자산 배분'}
      </text>
    </svg>
  );
}

// Area + line performance chart
function PerfChart({ series, bench, width = 600, height = 200, theme = 'light', showBench = true, color }) {
  const t = VAULTY[theme];
  const primary = color || t.accent;
  const all = [...series, ...(bench || [])];
  const min = Math.min(...all) - 1;
  const max = Math.max(...all) + 1;
  const xStep = width / (series.length - 1);
  const toY = (v) => height - ((v - min) / (max - min)) * height;
  const pathLine = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * xStep},${toY(v)}`).join(' ');
  const pathArea = pathLine + ` L${width},${height} L0,${height} Z`;
  const benchPath = bench ? bench.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * xStep},${toY(v)}`).join(' ') : '';

  const [hover, setHover] = React.useState(null);
  const svgRef = React.useRef(null);
  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const i = Math.min(series.length - 1, Math.max(0, Math.round((x / rect.width) * (series.length - 1))));
    setHover(i);
  };

  const gradId = `perf-grad-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" height={height}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block', cursor: 'crosshair' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity="0.22" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" y1={height * f} x2={width} y2={height * f} stroke={t.lineSoft} strokeWidth="1" strokeDasharray="2 4" />
        ))}
        <path d={pathArea} fill={`url(#${gradId})`} />
        {showBench && bench && <path d={benchPath} fill="none" stroke={t.inkMuted} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />}
        <path d={pathLine} fill="none" stroke={primary} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
        {hover !== null && (
          <g>
            <line x1={hover * xStep} y1="0" x2={hover * xStep} y2={height} stroke={t.ink} strokeWidth="0.8" opacity="0.4" />
            <circle cx={hover * xStep} cy={toY(series[hover])} r="4" fill={t.surface} stroke={primary} strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div style={{
          position: 'absolute', left: Math.min(Math.max(40, (hover / (series.length - 1)) * 100 + '%'), 'calc(100% - 100px)'),
          top: 8, background: t.surface, border: `1px solid ${t.line}`, padding: '6px 10px', borderRadius: 2,
          fontFamily: FONTS.mono, fontSize: 11, color: t.ink, pointerEvents: 'none',
          transform: 'translateX(-50%)', whiteSpace: 'nowrap',
        }}>
          D-{series.length - hover} · {series[hover].toFixed(2)}
          {bench && <span style={{ color: t.inkMuted, marginLeft: 8 }}>vs {bench[hover].toFixed(2)}</span>}
        </div>
      )}
    </div>
  );
}

// Tiny sparkline
function Spark({ data, width = 60, height = 20, color = '#2F4A3A', positive }) {
  const c = positive === undefined ? color : (positive ? '#2F6B4F' : '#A83A2C');
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i) => (i / (data.length - 1)) * width;
  const y = (v) => height - ((v - min) / (max - min || 1)) * height;
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  return <svg width={width} height={height} style={{ display: 'block' }}><path d={d} fill="none" stroke={c} strokeWidth="1.3" /></svg>;
}

// Horizontal stacked allocation bar
function StackBar({ data, height = 8, theme = 'light', gap = 2 }) {
  return (
    <div style={{ display: 'flex', gap, height, width: '100%' }}>
      {data.map((d) => (
        <div key={d.key} style={{ flex: d.pct, background: d.color, height: '100%' }} title={`${d.label} ${d.pct}%`} />
      ))}
    </div>
  );
}

Object.assign(window, { DonutChart, PerfChart, Spark, StackBar });
