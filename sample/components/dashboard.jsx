// Vaulty — Compact Grid dashboard (main prototype)
// Sidebar + dense KPI / chart / holdings grid, with holding detail drawer & order modal.
const { VAULTY, FONTS, fmtMoney, fmtPct, fmtNum } = window;
const { PORTFOLIO, ALLOCATION, HOLDINGS, INDICES, PERF_SERIES, BENCH_SERIES, INSIGHTS, NEWS, WATCHLIST } = window;
const { DonutChart, PerfChart, Spark, StackBar } = window;

// ── Order modal ──────────────────────────────────────────
function OrderModal({ holding, onClose, theme, currency }) {
  const t = VAULTY[theme];
  const [side, setSide] = React.useState('buy');
  const [qty, setQty] = React.useState(10);
  const [limitPrice, setLimitPrice] = React.useState(holding.price);
  const [mode, setMode] = React.useState('limit');
  const total = qty * limitPrice;
  const fee = total * 0.00015;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(20,18,15,.55)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, fontFamily: FONTS.sans,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 460, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 2,
        padding: 28, color: t.ink,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: t.inkMuted }}>PLACE ORDER</div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 24, fontWeight: 500, marginTop: 4 }}>{holding.name}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>{holding.ticker} · 현재가 {fmtNum(holding.price, 0)} · {holding.type}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, color: t.inkMuted, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
          <button onClick={() => setSide('buy')} style={{ flex: 1, padding: '11px', border: `1px solid ${side === 'buy' ? t.up : t.line}`, background: side === 'buy' ? t.up : 'transparent', color: side === 'buy' ? t.surface : t.ink, fontFamily: FONTS.sans, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>매수 · BUY</button>
          <button onClick={() => setSide('sell')} style={{ flex: 1, padding: '11px', border: `1px solid ${side === 'sell' ? t.down : t.line}`, background: side === 'sell' ? t.down : 'transparent', color: side === 'sell' ? t.surface : t.ink, fontFamily: FONTS.sans, fontSize: 13, cursor: 'pointer', fontWeight: 500, borderLeft: 'none' }}>매도 · SELL</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['market', 'limit', 'stop'].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '5px 12px', border: `1px solid ${mode === m ? t.ink : t.line}`,
              background: mode === m ? t.ink : 'transparent', color: mode === m ? t.surface : t.inkSoft,
              fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase',
            }}>{m}</button>
          ))}
        </div>
        {[['수량 · QTY', qty, setQty, 1], ...(mode !== 'market' ? [['지정가 · PRICE', limitPrice, setLimitPrice, 100]] : [])].map(([label, v, setv, step]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: t.inkMuted, marginBottom: 6 }}>{label}</div>
            <input type="number" value={v} onChange={(e) => setv(Number(e.target.value))} step={step}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.line}`, background: t.surface, color: t.ink, fontFamily: FONTS.mono, fontSize: 14, boxSizing: 'border-box', borderRadius: 2, outline: 'none' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[25, 50, 75, 100].map((p) => (
            <button key={p} onClick={() => setQty(Math.floor(holding.qty * p / 100))}
              style={{ flex: 1, padding: '5px', border: `1px solid ${t.line}`, background: t.surfaceAlt, fontFamily: FONTS.mono, fontSize: 10, color: t.inkSoft, cursor: 'pointer' }}>{p}%</button>
          ))}
        </div>
        <div style={{ background: t.surfaceAlt, padding: 14, marginBottom: 20, borderLeft: `2px solid ${side === 'buy' ? t.up : t.down}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.inkSoft, marginBottom: 6 }}><span>예상 체결금액</span><span style={{ fontFamily: FONTS.mono, color: t.ink, fontWeight: 500 }}>{fmtMoney(total, currency)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.inkSoft, marginBottom: 6 }}><span>수수료 (0.015%)</span><span style={{ fontFamily: FONTS.mono }}>{fmtMoney(fee, currency)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.inkSoft, paddingTop: 6, borderTop: `1px solid ${t.line}` }}><span style={{ fontWeight: 500, color: t.ink }}>총 {side === 'buy' ? '매수' : '매도'} 금액</span><span style={{ fontFamily: FONTS.mono, fontWeight: 500, color: t.ink }}>{fmtMoney(total + fee, currency)}</span></div>
        </div>
        <button style={{ width: '100%', padding: '14px', background: side === 'buy' ? t.up : t.down, color: t.surface, border: 'none', fontFamily: FONTS.sans, fontSize: 14, fontWeight: 500, cursor: 'pointer', letterSpacing: 0.5 }}>
          {side === 'buy' ? '매수 주문' : '매도 주문'} · CONFIRM
        </button>
      </div>
    </div>
  );
}

// ── Holding detail drawer ────────────────────────────────
function HoldingDrawer({ holding, onClose, onTrade, theme, currency }) {
  const t = VAULTY[theme];
  const [tab, setTab] = React.useState('overview');
  // Build a small price series for drawer chart
  const series = React.useMemo(() => Array.from({ length: 60 }, (_, i) =>
    holding.avg + (holding.price - holding.avg) * (i / 59) + Math.sin(i * 0.5) * holding.price * 0.025 + Math.cos(i * 0.23) * holding.price * 0.015
  ), [holding.ticker]);

  const pnlColor = holding.pnl >= 0 ? t.up : t.down;
  const row = (label, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: `1px solid ${t.lineSoft}` }}>
      <span style={{ fontSize: 12, color: t.inkMuted }}>{label}</span>
      <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 500, color: color || t.ink }}>{value}</span>
    </div>
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(20,18,15,.35)', zIndex: 80, fontFamily: FONTS.sans,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 500, height: '100%', background: t.surface, borderLeft: `1px solid ${t.line}`,
        overflow: 'auto', display: 'flex', flexDirection: 'column',
        animation: 'slideIn .25s cubic-bezier(.2,.7,.3,1)',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: t.inkMuted, marginBottom: 4 }}>{holding.type} · {holding.ticker}</div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 500, letterSpacing: -0.3 }}>{holding.name}</div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontStyle: 'italic', color: t.inkMuted, marginTop: 2 }}>{holding.en}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, color: t.inkMuted, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Price hero */}
        <div style={{ padding: '20px 24px', background: t.surfaceAlt, borderBottom: `1px solid ${t.line}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{fmtNum(holding.price, 0)}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: pnlColor, fontWeight: 500 }}>{fmtPct(holding.pct)}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: pnlColor }}>{holding.pnl >= 0 ? '+' : ''}{fmtMoney(Math.abs(holding.pnl), currency)}</div>
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted, letterSpacing: 1, marginTop: 6 }}>
            평균단가 {fmtNum(holding.avg, 0)} · {holding.qty < 1 ? holding.qty.toFixed(4) : holding.qty}주 보유
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${t.line}`, padding: '0 24px', gap: 2 }}>
          {[['overview', '개요'], ['chart', '차트'], ['news', '뉴스'], ['financials', '재무']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '12px 14px', border: 'none', background: 'transparent',
              fontFamily: FONTS.sans, fontSize: 12, color: tab === k ? t.ink : t.inkMuted,
              borderBottom: `1.5px solid ${tab === k ? t.accent : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer', fontWeight: tab === k ? 500 : 400,
            }}>{label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          {tab === 'overview' && (
            <>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: t.inkMuted, marginBottom: 10 }}>POSITION SUMMARY</div>
              {row('평가금액', fmtMoney(holding.value, currency))}
              {row('투자원금', fmtMoney(holding.qty * holding.avg, currency))}
              {row('총 손익', (holding.pnl >= 0 ? '+' : '') + fmtMoney(Math.abs(holding.pnl), currency), pnlColor)}
              {row('수익률', fmtPct(holding.pct), pnlColor)}
              {row('포트폴리오 비중', ((holding.value / PORTFOLIO.totalKRW) * 100).toFixed(2) + '%')}
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: t.inkMuted, margin: '20px 0 10px' }}>MARKET DATA</div>
              {row('52주 최고', fmtNum(holding.price * 1.12, 0))}
              {row('52주 최저', fmtNum(holding.price * 0.74, 0))}
              {row('거래량 (일)', fmtNum(holding.price * 12000, 0))}
              {row('시가총액', fmtMoney(holding.price * 5_800_000, currency))}
            </>
          )}
          {tab === 'chart' && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {['1D', '1W', '1M', '3M', '1Y'].map((r) => (
                  <button key={r} style={{ padding: '4px 10px', border: `1px solid ${t.line}`, background: r === '1M' ? t.ink : 'transparent', color: r === '1M' ? t.surface : t.inkSoft, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>{r}</button>
                ))}
              </div>
              <PerfChart series={series} height={220} theme={theme} color={pnlColor} showBench={false} />
              <div style={{ background: t.surfaceAlt, padding: 14, marginTop: 16, borderLeft: `2px solid ${pnlColor}` }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: t.inkMuted, marginBottom: 6 }}>PATTERN</div>
                <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{holding.pnl >= 0 ? '상승 추세 — 20일 이평선 상단 유지' : '단기 조정 구간 — 주요 지지선 근접'}</div>
              </div>
            </>
          )}
          {tab === 'news' && (
            NEWS.map((n, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: i < NEWS.length - 1 ? `1px solid ${t.lineSoft}` : 'none' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.bronze, marginBottom: 4 }}>{n.src.toUpperCase()} · {n.time} · {n.tag}</div>
                <div style={{ fontFamily: FONTS.serif, fontSize: 15, fontWeight: 500, lineHeight: 1.35 }}>{n.head}</div>
              </div>
            ))
          )}
          {tab === 'financials' && (
            <>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: t.inkMuted, marginBottom: 10 }}>KEY RATIOS</div>
              {row('P/E (TTM)', '24.6x')}
              {row('P/B', '3.2x')}
              {row('EPS', fmtNum(holding.price / 24.6, 0))}
              {row('배당수익률', '1.84%')}
              {row('ROE', '18.7%')}
              {row('부채비율', '42.3%')}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: 20, borderTop: `1px solid ${t.line}`, display: 'flex', gap: 10, background: t.surface }}>
          <button onClick={() => onTrade(holding)} style={{ flex: 1, padding: '12px', background: t.up, color: t.surface, border: 'none', fontFamily: FONTS.sans, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>매수</button>
          <button onClick={() => onTrade(holding)} style={{ flex: 1, padding: '12px', background: t.down, color: t.surface, border: 'none', fontFamily: FONTS.sans, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>매도</button>
          <button style={{ padding: '12px 16px', background: 'transparent', border: `1px solid ${t.line}`, color: t.inkSoft, fontFamily: FONTS.sans, fontSize: 13, cursor: 'pointer' }}>★ 워치</button>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────
function Dashboard({ theme = 'light', currency = 'KRW' }) {
  const t = VAULTY[theme];
  const [range, setRange] = React.useState('3M');
  const [orderOpen, setOrderOpen] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(null);
  const [activeNav, setActiveNav] = React.useState('dash');
  const [dismissed, setDismissed] = React.useState([]);
  const [clock, setClock] = React.useState(new Date());
  React.useEffect(() => {
    const i = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(i);
  }, []);

  const pane = { background: t.surface, border: `1px solid ${t.line}`, borderRadius: 2 };
  const paneP = { ...pane, padding: 18 };
  const secHead = (label, sub, right) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${t.lineSoft}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: 500, letterSpacing: -0.2 }}>{label}</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>{sub}</div>
      </div>
      {right}
    </div>
  );

  const timeStr = clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div style={{ width: '100%', height: '100vh', background: t.bg, color: t.ink, fontFamily: FONTS.sans, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 68, borderRight: `1px solid ${t.line}`, background: t.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0', gap: 6, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, background: t.accent, color: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.serif, fontSize: 18, fontWeight: 600, marginBottom: 16, borderRadius: 2 }}>V</div>
        {[
          ['dash', 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', '대시'],
          ['assets', 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', '자산'],
          ['trade', 'M3 12l4-4 4 4 6-6 4 4', '주문'],
          ['analyze', 'M3 21V7M9 21V3M15 21v-8M21 21V11', '분석'],
          ['research', 'M4 4h16v3H4zM4 10h16v3H4zM4 16h10v3H4z', '리서치'],
          ['alert', 'M12 2a6 6 0 00-6 6v4l-2 3h16l-2-3V8a6 6 0 00-6-6zM9 18a3 3 0 006 0', '알림'],
        ].map(([k, path, label]) => (
          <button key={k} onClick={() => setActiveNav(k)} title={label}
            style={{
              width: 52, height: 52, border: 'none',
              background: activeNav === k ? t.accentSoft : 'transparent',
              color: activeNav === k ? t.accent : t.inkMuted,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 2,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { if (activeNav !== k) e.currentTarget.style.background = t.surfaceAlt; }}
            onMouseLeave={(e) => { if (activeNav !== k) e.currentTarget.style.background = 'transparent'; }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={path} />
            </svg>
            <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 0.5 }}>{label}</div>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ width: 36, height: 36, borderRadius: 18, background: t.bronzeSoft, color: t.bronze, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.serif, fontSize: 13, fontWeight: 600 }}>JK</div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header */}
        <header style={{ height: 56, borderBottom: `1px solid ${t.line}`, background: t.surface, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 20 }}>
          <div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 18, fontWeight: 500, letterSpacing: -0.3 }}>
              {activeNav === 'assets' ? '자산' : activeNav === 'trade' ? '주문' : activeNav === 'analyze' ? '분석' : activeNav === 'research' ? '리서치' : activeNav === 'alert' ? '알림' : '대시보드'}
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>
              {activeNav === 'assets' ? 'ASSETS · HOLDINGS' : activeNav === 'trade' ? 'ORDERS · TRADING' : activeNav === 'analyze' ? 'ANALYTICS' : activeNav === 'research' ? 'RESEARCH' : activeNav === 'alert' ? 'ALERTS' : 'DASHBOARD · OVERVIEW'}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surfaceAlt, padding: '6px 12px', border: `1px solid ${t.line}`, width: 280, borderRadius: 2 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.inkMuted} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input placeholder="종목, 티커 검색…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: FONTS.sans, fontSize: 12, color: t.ink }} />
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: t.inkMuted, background: t.surface, padding: '2px 5px', border: `1px solid ${t.line}` }}>⌘K</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONTS.mono, fontSize: 11, color: t.inkMuted }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: t.up, boxShadow: `0 0 0 3px ${t.up}22` }} />
            LIVE · {timeStr} KST
          </div>
        </header>

        {/* Ticker strip */}
        {activeNav === 'dash' && <div style={{ height: 36, borderBottom: `1px solid ${t.line}`, background: t.surfaceAlt, display: 'flex', alignItems: 'center', padding: '0 24px', overflow: 'hidden' }}>
          {INDICES.map((ix, i) => (
            <div key={ix.name} style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingRight: 20, marginRight: 20, borderRight: i < INDICES.length - 1 ? `1px solid ${t.line}` : 'none', fontFamily: FONTS.mono }}>
              <span style={{ fontSize: 9, letterSpacing: 1, color: t.inkMuted }}>{ix.name}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: t.ink }}>{fmtNum(ix.value)}</span>
              <span style={{ fontSize: 10, color: ix.pct >= 0 ? t.up : t.down }}>{fmtPct(ix.pct)}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.inkMuted }}>DELAYED · 15MIN</div>
        </div>}

        {/* Main grid */}
        {activeNav === 'assets' ? (
          <AssetsPage theme={theme} currency={currency}
            onSelectHolding={(h) => setDrawerOpen(h)}
            onTrade={(h) => setOrderOpen(h)} />
        ) : activeNav !== 'dash' ? (
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: t.inkMuted }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 22, fontStyle: 'italic' }}>준비 중입니다</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2 }}>COMING SOON</div>
          </main>
        ) : (
        <main style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: '총 자산', en: 'TOTAL ASSETS', v: fmtMoney(PORTFOLIO.totalKRW, currency), sub: fmtPct(PORTFOLIO.todayPct) + ' 오늘', color: t.up, spark: PERF_SERIES.slice(-24) },
              { label: '오늘 손익', en: "TODAY'S P&L", v: '+' + fmtMoney(PORTFOLIO.todayPnLKRW, currency), sub: 'vs 어제 +0.79%', color: t.up, spark: Array.from({ length: 24 }, (_, i) => 100 + Math.sin(i * 0.8) * 2 + i * 0.1) },
              { label: '전체 수익률', en: 'ALL-TIME RETURN', v: fmtPct(PORTFOLIO.allTimePct), sub: '+' + fmtMoney(PORTFOLIO.allTimePnLKRW, currency), color: t.up, spark: PERF_SERIES.slice(0, 24) },
              { label: '현금 가용', en: 'CASH AVAILABLE', v: fmtMoney(PORTFOLIO.cashKRW, currency), sub: '7.0% 비중 · 주문 가능', color: t.bronze, spark: null },
            ].map((k, i) => (
              <div key={i} style={{ ...paneP, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 13, fontWeight: 500 }}>{k.label}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>{k.en}</div>
                </div>
                <div style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.1, color: t.ink }}>{k.v}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: k.color }}>{k.sub}</div>
                  {k.spark && <Spark data={k.spark} width={64} height={18} color={k.color} />}
                </div>
              </div>
            ))}
          </div>

          {/* Performance + Allocation */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div style={paneP}>
              {secHead('포트폴리오 성과', 'PERFORMANCE · ' + range,
                <div style={{ display: 'flex', gap: 0, background: t.surfaceAlt, padding: 2, borderRadius: 2 }}>
                  {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((r) => (
                    <button key={r} onClick={() => setRange(r)} style={{
                      padding: '4px 10px', border: 'none',
                      background: range === r ? t.surface : 'transparent',
                      color: range === r ? t.ink : t.inkMuted,
                      fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                      boxShadow: range === r ? `0 1px 2px rgba(0,0,0,.06)` : 'none',
                      borderRadius: 1, fontWeight: range === r ? 500 : 400,
                    }}>{r}</button>
                  ))}
                </div>
              )}
              <PerfChart series={PERF_SERIES} bench={BENCH_SERIES} height={200} theme={theme} color={t.accent} />
              <div style={{ display: 'flex', gap: 4, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.lineSoft}` }}>
                {[
                  ['TWR', '+8.42%', t.up],
                  ['vs KOSPI', '+3.18%', t.up],
                  ['VOL', '14.2%', t.ink],
                  ['SHARPE', '1.62', t.ink],
                  ['BETA', '1.24', t.bronze],
                  ['MAX DD', '-6.8%', t.down],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ flex: 1, padding: '4px 10px', borderRight: l !== 'MAX DD' ? `1px solid ${t.lineSoft}` : 'none' }}>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.inkMuted }}>{l}</div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 500, color: c, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={paneP}>
              {secHead('자산 배분', 'ALLOCATION')}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
                <DonutChart data={ALLOCATION} size={150} stroke={20} theme={theme} />
              </div>
              <StackBar data={ALLOCATION} height={6} theme={theme} />
              <div style={{ marginTop: 12 }}>
                {ALLOCATION.map((a) => (
                  <div key={a.key} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', gap: 8, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, background: a.color, borderRadius: 1, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: t.inkSoft }}>{a.label}</span>
                    <span style={{ fontFamily: FONTS.mono, color: t.inkMuted, fontSize: 10 }}>{fmtMoney(a.value, currency)}</span>
                    <span style={{ fontFamily: FONTS.mono, color: t.ink, fontWeight: 500, minWidth: 42, textAlign: 'right' }}>{a.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Holdings + Insights + News+Watch */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            {/* Holdings */}
            <div style={{ ...pane, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: 500 }}>보유 종목</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>{HOLDINGS.length} POSITIONS</div>
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted }}>클릭 → 상세</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.sans, fontSize: 12 }}>
                <thead>
                  <tr style={{ background: t.surfaceAlt }}>
                    {['종목 · NAME', '수량', '현재가', '평가금액', '손익 %', ''].map((h, i) => (
                      <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 14px', fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.inkMuted, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOLDINGS.map((h) => (
                    <HoldingRow key={h.ticker} h={h} theme={theme} currency={currency}
                      onSelect={() => setDrawerOpen(h)}
                      onTrade={(e) => { e.stopPropagation(); setOrderOpen(h); }} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Insights */}
            <div style={paneP}>
              {secHead('AI 인사이트', 'INSIGHTS')}
              {INSIGHTS.filter((_, i) => !dismissed.includes(i)).map((ins, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < INSIGHTS.length - 1 - dismissed.length ? `1px solid ${t.lineSoft}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, color: t.bronze, background: t.bronzeSoft, padding: '2px 6px' }}>{ins.tag}</div>
                    <button onClick={() => setDismissed([...dismissed, INSIGHTS.indexOf(ins)])} style={{ background: 'transparent', border: 'none', color: t.inkMuted, cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>{ins.title}</div>
                  <div style={{ fontSize: 10.5, color: t.inkSoft, lineHeight: 1.4, marginBottom: 6 }}>{ins.body}</div>
                  <button style={{ background: 'transparent', border: 'none', color: t.accent, fontFamily: FONTS.sans, fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0 }}>{ins.action} →</button>
                </div>
              ))}
            </div>

            {/* News + Watch */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={paneP}>
                {secHead('뉴스', 'THE WIRE')}
                {NEWS.slice(0, 3).map((n, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? `1px solid ${t.lineSoft}` : 'none', cursor: 'pointer' }}>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: t.bronze, marginBottom: 3 }}>{n.src.toUpperCase()} · {n.time}</div>
                    <div style={{ fontFamily: FONTS.serif, fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{n.head}</div>
                  </div>
                ))}
              </div>
              <div style={paneP}>
                {secHead('워치리스트', 'WATCHLIST', <button style={{ background: 'transparent', border: 'none', color: t.accent, fontSize: 11, cursor: 'pointer', padding: 0 }}>+</button>)}
                {WATCHLIST.map((w, i) => (
                  <div key={w.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < WATCHLIST.length - 1 ? `1px solid ${t.lineSoft}` : 'none' }}>
                    <div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 500 }}>{w.ticker}</div>
                      {w.name && <div style={{ fontSize: 9.5, color: t.inkMuted }}>{w.name}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 11 }}>{fmtNum(w.price, 0)}</div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: w.pct >= 0 ? t.up : t.down }}>{fmtPct(w.pct)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        )}
      </div>

      {drawerOpen && <HoldingDrawer holding={drawerOpen} onClose={() => setDrawerOpen(null)} onTrade={(h) => { setDrawerOpen(null); setOrderOpen(h); }} theme={theme} currency={currency} />}
      {orderOpen && <OrderModal holding={orderOpen} onClose={() => setOrderOpen(null)} theme={theme} currency={currency} />}
    </div>
  );
}

function HoldingRow({ h, theme, currency, onSelect, onTrade }) {
  const t = VAULTY[theme];
  const [hover, setHover] = React.useState(false);
  return (
    <tr onClick={onSelect}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ borderBottom: `1px solid ${t.lineSoft}`, cursor: 'pointer', background: hover ? t.surfaceAlt : 'transparent', transition: 'background .12s' }}>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, background: t.bronzeSoft, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, color: t.bronze, letterSpacing: 0.5 }}>
            {h.type}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 12 }}>{h.name}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: t.inkMuted }}>{h.ticker}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: FONTS.mono, fontSize: 11, color: t.inkSoft }}>{h.qty < 1 ? h.qty.toFixed(4) : h.qty}</td>
      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: FONTS.mono, fontSize: 11 }}>{fmtNum(h.price, 0)}</td>
      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: FONTS.mono, fontSize: 11, fontWeight: 500 }}>{fmtMoney(h.value, currency)}</td>
      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: h.pnl >= 0 ? t.up : t.down, fontWeight: 500 }}>{fmtPct(h.pct)}</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: h.pnl >= 0 ? t.up : t.down, opacity: 0.75 }}>{h.pnl >= 0 ? '+' : ''}{fmtMoney(Math.abs(h.pnl), currency)}</div>
      </td>
      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
        <button onClick={onTrade} style={{
          background: hover ? t.ink : 'transparent', color: hover ? t.surface : t.inkSoft,
          border: `1px solid ${hover ? t.ink : t.line}`, padding: '4px 10px',
          fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, cursor: 'pointer', transition: 'all .12s',
        }}>TRADE</button>
      </td>
    </tr>
  );
}

Object.assign(window, { Dashboard });
