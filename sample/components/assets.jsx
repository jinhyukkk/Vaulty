// Vaulty — Assets page (holdings browser)
// Asset-class cards at top, filterable/sortable table, group-by class option.
const { VAULTY, FONTS, fmtMoney, fmtPct, fmtNum } = window;
const { PORTFOLIO, ALLOCATION, HOLDINGS, ACCOUNTS } = window;
const { DonutChart, Spark, StackBar } = window;

function AssetsPage({ theme = 'light', currency = 'KRW', onSelectHolding, onTrade }) {
  const t = VAULTY[theme];
  const [filter, setFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'value', dir: 'desc' });
  const [group, setGroup] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const FILTERS = [
    ['all', '전체', HOLDINGS.length],
    ['KR', '국내 주식', HOLDINGS.filter((h) => h.type === 'KR').length],
    ['US', '해외 주식', HOLDINGS.filter((h) => h.type === 'US').length],
    ['ETF', 'ETF/펀드', HOLDINGS.filter((h) => h.type === 'ETF').length],
    ['CRYPTO', '암호화폐', HOLDINGS.filter((h) => h.type === 'CRYPTO').length],
  ];

  const sortFn = (a, b) => {
    const d = sort.dir === 'desc' ? -1 : 1;
    const av = a[sort.key], bv = b[sort.key];
    if (typeof av === 'number') return (av - bv) * d;
    return String(av).localeCompare(String(bv)) * d;
  };
  const rows = HOLDINGS
    .filter((h) => filter === 'all' || h.type === filter)
    .filter((h) => !query || h.name.toLowerCase().includes(query.toLowerCase()) || h.ticker.toLowerCase().includes(query.toLowerCase()) || h.en.toLowerCase().includes(query.toLowerCase()))
    .sort(sortFn);

  const totalValue = rows.reduce((s, h) => s + h.value, 0);
  const totalPnL = rows.reduce((s, h) => s + h.pnl, 0);
  const totalCost = rows.reduce((s, h) => s + (h.value - h.pnl), 0);
  const totalPct = totalCost ? (totalPnL / totalCost) * 100 : 0;

  const pane = { background: t.surface, border: `1px solid ${t.line}`, borderRadius: 2 };
  const sortBtn = (key, label, align = 'right') => {
    const active = sort.key === key;
    return (
      <button onClick={() => setSort({ key, dir: active && sort.dir === 'desc' ? 'asc' : 'desc' })}
        style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none',
          padding: 0, cursor: 'pointer', fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1,
          color: active ? t.ink : t.inkMuted, fontWeight: 500, marginLeft: align === 'right' ? 'auto' : 0,
        }}>
        {label}
        <span style={{ fontSize: 8, opacity: active ? 1 : 0.4 }}>{active ? (sort.dir === 'desc' ? '▼' : '▲') : '⇅'}</span>
      </button>
    );
  };

  // Group by asset class
  const groups = group ? FILTERS.slice(1).map(([k, label]) => ({ k, label, items: rows.filter((r) => r.type === k) })).filter((g) => g.items.length) : null;

  return (
    <main style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 12 }}>
        <div style={{ ...pane, padding: 20 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: t.inkMuted, marginBottom: 6 }}>FILTERED TOTAL · {filter === 'all' ? '전체 자산' : FILTERS.find((f) => f[0] === filter)[1]}</div>
          <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1 }}>{fmtMoney(totalValue, currency)}</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: FONTS.mono, fontSize: 11 }}>
            <span style={{ color: totalPnL >= 0 ? t.up : t.down, fontWeight: 500 }}>{totalPnL >= 0 ? '▲' : '▼'} {fmtPct(totalPct)}</span>
            <span style={{ color: totalPnL >= 0 ? t.up : t.down }}>{totalPnL >= 0 ? '+' : ''}{fmtMoney(Math.abs(totalPnL), currency)}</span>
            <span style={{ color: t.inkMuted }}>{rows.length} / {HOLDINGS.length} 종목</span>
          </div>
        </div>
        {[
          ['투자원금', 'COST BASIS', fmtMoney(totalCost, currency), 't.ink'],
          ['평균 수익률', 'AVG RETURN', fmtPct(totalPct), totalPct >= 0 ? 't.up' : 't.down'],
          ['최대 비중', 'TOP WEIGHT', rows[0] ? ((rows[0].value / PORTFOLIO.totalKRW) * 100).toFixed(1) + '%' : '—', 't.bronze'],
        ].map(([label, en, v, c], i) => (
          <div key={i} style={{ ...pane, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ fontFamily: FONTS.serif, fontSize: 13, fontWeight: 500 }}>{label}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>{en}</div>
            </div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 500, letterSpacing: -0.5, color: c === 't.up' ? t.up : c === 't.down' ? t.down : c === 't.bronze' ? t.bronze : t.ink, lineHeight: 1.1 }}>{v}</div>
            {i === 2 && rows[0] && <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted, marginTop: 4 }}>{rows[0].name}</div>}
          </div>
        ))}
      </div>

      {/* Asset class cards */}
      <div style={{ ...pane, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${t.lineSoft}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: 500 }}>자산군 요약</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>BY ASSET CLASS</div>
          </div>
          <StackBar data={ALLOCATION} height={5} theme={theme} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {ALLOCATION.map((a) => {
            const items = HOLDINGS.filter((h) => {
              if (a.key === 'kr_stock') return h.type === 'KR';
              if (a.key === 'us_stock') return h.type === 'US';
              if (a.key === 'etf') return h.type === 'ETF';
              if (a.key === 'crypto') return h.type === 'CRYPTO';
              return false;
            });
            const pnlSum = items.reduce((s, h) => s + h.pnl, 0);
            const costSum = items.reduce((s, h) => s + h.qty * h.avg, 0);
            const pct = costSum ? (pnlSum / costSum) * 100 : 0;
            return (
              <button key={a.key}
                onClick={() => { if (items.length) setFilter(items[0].type); }}
                style={{
                  textAlign: 'left', background: 'transparent', border: `1px solid ${t.lineSoft}`,
                  padding: 12, cursor: items.length ? 'pointer' : 'default',
                  borderLeft: `3px solid ${a.color}`, transition: 'background .12s',
                }}
                onMouseEnter={(e) => { if (items.length) e.currentTarget.style.background = t.surfaceAlt; }}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 13, fontWeight: 500 }}>{a.label}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted, fontWeight: 500 }}>{a.pct.toFixed(1)}%</div>
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 500 }}>{fmtMoney(a.value, currency)}</div>
                {items.length > 0 && (
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: pct >= 0 ? t.up : t.down, marginTop: 4 }}>
                    {fmtPct(pct)} · {items.length}종목
                  </div>
                )}
                {items.length === 0 && <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted, marginTop: 4 }}>보유 내역 없음</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter + controls bar */}
      <div style={{ ...pane, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 0, background: t.surfaceAlt, padding: 2, borderRadius: 2 }}>
          {FILTERS.map(([k, label, n]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '6px 12px', border: 'none',
              background: filter === k ? t.surface : 'transparent',
              color: filter === k ? t.ink : t.inkMuted,
              fontFamily: FONTS.sans, fontSize: 12, cursor: 'pointer',
              boxShadow: filter === k ? `0 1px 2px rgba(0,0,0,.06)` : 'none',
              fontWeight: filter === k ? 500 : 400, borderRadius: 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {label}
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: t.inkMuted, background: filter === k ? t.surfaceAlt : 'transparent', padding: '1px 5px', borderRadius: 1 }}>{n}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surfaceAlt, padding: '6px 10px', border: `1px solid ${t.line}`, width: 240, borderRadius: 2 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.inkMuted} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="종목 검색…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: FONTS.sans, fontSize: 12, color: t.ink }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: t.inkSoft }}>
          <input type="checkbox" checked={group} onChange={(e) => setGroup(e.target.checked)} style={{ margin: 0 }} />
          자산군별 그룹
        </label>
        <button style={{ padding: '6px 12px', border: `1px solid ${t.line}`, background: 'transparent', fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: t.inkSoft, cursor: 'pointer' }}>내보내기 ↓</button>
      </div>

      {/* Main holdings table */}
      <div style={{ ...pane, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.sans, fontSize: 12 }}>
          <thead>
            <tr style={{ background: t.surfaceAlt, borderBottom: `1px solid ${t.line}` }}>
              <th style={{ textAlign: 'left', padding: '10px 16px' }}>{sortBtn('name', '종목 · NAME', 'left')}</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', width: 100 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.inkMuted, fontWeight: 500 }}>자산군 · 계좌</span>
              </th>
              <th style={{ textAlign: 'right', padding: '10px 14px' }}>{sortBtn('qty', '수량')}</th>
              <th style={{ textAlign: 'right', padding: '10px 14px' }}>{sortBtn('avg', '평균가')}</th>
              <th style={{ textAlign: 'right', padding: '10px 14px' }}>{sortBtn('price', '현재가')}</th>
              <th style={{ textAlign: 'right', padding: '10px 14px' }}>{sortBtn('value', '평가금액')}</th>
              <th style={{ textAlign: 'right', padding: '10px 14px' }}>{sortBtn('pct', '수익률')}</th>
              <th style={{ textAlign: 'right', padding: '10px 14px', width: 80 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.inkMuted, fontWeight: 500 }}>비중</span>
              </th>
              <th style={{ textAlign: 'right', padding: '10px 14px', width: 120 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.inkMuted, fontWeight: 500 }}>30D 추세</span>
              </th>
              <th style={{ width: 80, padding: '10px 14px' }}></th>
            </tr>
          </thead>
          {group && groups ? (
            groups.map((g) => (
              <tbody key={g.k}>
                <tr style={{ background: t.surfaceAlt }}>
                  <td colSpan={10} style={{ padding: '8px 16px', borderTop: `1px solid ${t.line}`, borderBottom: `1px solid ${t.line}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontFamily: FONTS.serif, fontSize: 13, fontWeight: 500 }}>{g.label}</div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted }}>{g.items.length} 종목 · {fmtMoney(g.items.reduce((s, h) => s + h.value, 0), currency)}</div>
                    </div>
                  </td>
                </tr>
                {g.items.map((h) => <AssetRow key={h.ticker} h={h} theme={theme} currency={currency} onSelect={() => onSelectHolding(h)} onTrade={(e) => { e.stopPropagation(); onTrade(h); }} />)}
              </tbody>
            ))
          ) : (
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: t.inkMuted, fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 14 }}>검색 결과가 없습니다</td></tr>
              ) : (
                rows.map((h) => <AssetRow key={h.ticker} h={h} theme={theme} currency={currency} onSelect={() => onSelectHolding(h)} onTrade={(e) => { e.stopPropagation(); onTrade(h); }} />)
              )}
            </tbody>
          )}
        </table>
      </div>

      {/* Cash Management */}
      <CashManagement theme={theme} currency={currency}
        onSelectHolding={onSelectHolding} onTrade={onTrade} />
    </main>
  );
}

function AssetRow({ h, theme, currency, onSelect, onTrade }) {
  const t = VAULTY[theme];
  const [hover, setHover] = React.useState(false);
  const weight = (h.value / PORTFOLIO.totalKRW) * 100;
  // tiny 30d spark
  const spark = React.useMemo(() => Array.from({ length: 30 }, (_, i) =>
    h.avg + (h.price - h.avg) * (i / 29) + Math.sin(i * 0.6) * h.price * 0.02 + Math.cos(i * 0.3) * h.price * 0.01
  ), [h.ticker]);
  const weightColor = weight > 15 ? t.bronze : t.inkSoft;
  return (
    <tr onClick={onSelect}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ borderBottom: `1px solid ${t.lineSoft}`, cursor: 'pointer', background: hover ? t.surfaceAlt : 'transparent', transition: 'background .12s' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, background: t.accentSoft, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.serif, fontSize: 13, fontWeight: 600, color: t.accent }}>
            {h.ticker.slice(0, 2)}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13, color: t.ink }}>{h.name}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted, letterSpacing: 0.5 }}>{h.ticker} · {h.en}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.bronze, background: t.bronzeSoft, padding: '3px 7px', borderRadius: 1 }}>{h.type}</span>
        {h.account && (() => {
          const acct = ACCOUNTS.find((a) => a.id === h.account);
          return acct ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontFamily: FONTS.mono, fontSize: 9, color: t.inkMuted }}>
              <div style={{ width: 6, height: 6, background: acct.color, borderRadius: 1 }} />
              {acct.brokerEn}
            </div>
          ) : null;
        })()}
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: FONTS.mono, fontSize: 12, color: t.inkSoft }}>{h.qty < 1 ? h.qty.toFixed(4) : h.qty}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: FONTS.mono, fontSize: 12, color: t.inkMuted }}>{fmtNum(h.avg, 0)}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: FONTS.mono, fontSize: 12, fontWeight: 500 }}>{fmtNum(h.price, 0)}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: FONTS.mono, fontSize: 12, fontWeight: 500 }}>{fmtMoney(h.value, currency)}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: h.pnl >= 0 ? t.up : t.down, fontWeight: 500 }}>{fmtPct(h.pct)}</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: h.pnl >= 0 ? t.up : t.down, opacity: 0.75 }}>{h.pnl >= 0 ? '+' : ''}{fmtMoney(Math.abs(h.pnl), currency)}</div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: weightColor, fontWeight: 500 }}>{weight.toFixed(2)}%</div>
          <div style={{ width: 50, height: 3, background: t.lineSoft, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: Math.min(100, weight * 3) + '%', height: '100%', background: weightColor }} />
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
        <Spark data={spark} width={100} height={26} positive={h.pnl >= 0} />
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
        <button onClick={onTrade} style={{
          background: hover ? t.ink : 'transparent', color: hover ? t.surface : t.inkSoft,
          border: `1px solid ${hover ? t.ink : t.line}`, padding: '5px 12px',
          fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, cursor: 'pointer', transition: 'all .12s',
        }}>TRADE</button>
      </td>
    </tr>
  );
}

// -----------------------------------------------------------------------------
// CASH MANAGEMENT
// -----------------------------------------------------------------------------

function CashManagement({ theme, currency, onSelectHolding, onTrade }) {
  const t = VAULTY[theme];
  const [selected, setSelected] = React.useState(ACCOUNTS[0].id);
  const [transferOpen, setTransferOpen] = React.useState(false);

  const pane = { background: t.surface, border: `1px solid ${t.line}`, borderRadius: 2 };

  // Link holdings → accounts: compute each account's equity & total
  const enriched = ACCOUNTS.map((a) => {
    const holds = HOLDINGS.filter((h) => h.account === a.id);
    const equity = holds.reduce((s, h) => s + h.value, 0);
    const pnl = holds.reduce((s, h) => s + h.pnl, 0);
    const cost = holds.reduce((s, h) => s + (h.value - h.pnl), 0);
    const pnlPct = cost ? (pnl / cost) * 100 : 0;
    const cashKRW = a.balanceKRW ?? a.balance;
    const total = cashKRW + equity;
    return { ...a, holds, equity, pnl, pnlPct, total, cashKRW };
  });

  const grandTotal = enriched.reduce((s, a) => s + a.total, 0);
  const totalCash = enriched.reduce((s, a) => s + a.cashKRW, 0);
  const totalEquity = enriched.reduce((s, a) => s + a.equity, 0);
  const totalPnL = enriched.reduce((s, a) => s + a.pnl, 0);

  const sel = enriched.find((a) => a.id === selected);

  return (
    <>
      {/* Summary bar */}
      <div style={{ ...pane, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 17, fontWeight: 500, letterSpacing: -0.2 }}>계좌 · 포지션 관리</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>ACCOUNTS · LINKED POSITIONS</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setTransferOpen('deposit')} style={{ padding: '7px 14px', border: `1px solid ${t.line}`, background: 'transparent', fontFamily: FONTS.sans, fontSize: 12, color: t.inkSoft, cursor: 'pointer', borderRadius: 2 }}>입금</button>
            <button onClick={() => setTransferOpen('withdraw')} style={{ padding: '7px 14px', border: `1px solid ${t.line}`, background: 'transparent', fontFamily: FONTS.sans, fontSize: 12, color: t.inkSoft, cursor: 'pointer', borderRadius: 2 }}>출금</button>
            <button onClick={() => setTransferOpen('transfer')} style={{ padding: '7px 14px', border: 'none', background: t.ink, color: t.surface, fontFamily: FONTS.sans, fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 2 }}>계좌 이체</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${t.lineSoft}` }}>
          {[
            ['총 자산', 'TOTAL', fmtMoney(grandTotal, currency), t.ink, `${ACCOUNTS.length}개 계좌 · ${HOLDINGS.length}종목`],
            ['주식 평가액', 'EQUITY', fmtMoney(totalEquity, currency), t.accent, `${((totalEquity / grandTotal) * 100).toFixed(1)}% 비중`],
            ['예수금', 'CASH', fmtMoney(totalCash, currency), t.bronze, `${((totalCash / grandTotal) * 100).toFixed(1)}% 비중`],
            ['평가 손익', 'P&L', (totalPnL >= 0 ? '+' : '') + fmtMoney(totalPnL, currency), totalPnL >= 0 ? t.up : t.down, '전체 누적'],
          ].map(([label, en, v, c, sub], i) => (
            <div key={i} style={{ padding: '16px 20px', borderRight: i < 3 ? `1px solid ${t.lineSoft}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ fontFamily: FONTS.serif, fontSize: 12, fontWeight: 500, color: t.inkSoft }}>{label}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, color: t.inkMuted }}>{en}</div>
              </div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.4, color: c, lineHeight: 1.1 }}>{v}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted, marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Accounts + Detail split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr' }}>
          {/* Left: account list */}
          <div style={{ borderRight: `1px solid ${t.lineSoft}` }}>
            <div style={{ padding: '10px 20px', background: t.surfaceAlt, borderBottom: `1px solid ${t.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>ACCOUNTS · {ACCOUNTS.length}</div>
              <button style={{ background: 'transparent', border: 'none', color: t.accent, fontSize: 11, cursor: 'pointer', padding: 0, fontWeight: 500 }}>+ 계좌 연결</button>
            </div>
            {enriched.map((a) => {
              const isSel = selected === a.id;
              const cashPct = (a.cashKRW / a.total) * 100;
              const equityPct = 100 - cashPct;
              return (
                <div key={a.id} onClick={() => setSelected(a.id)}
                  style={{
                    padding: '14px 20px', borderBottom: `1px solid ${t.lineSoft}`, cursor: 'pointer',
                    background: isSel ? t.accentSoft : 'transparent',
                    borderLeft: isSel ? `3px solid ${t.accent}` : `3px solid transparent`,
                    transition: 'background .12s',
                  }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = t.surfaceAlt; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, background: a.color, color: '#fff', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.serif, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                      {a.broker.slice(0, 1)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                        <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontWeight: 500 }}>{a.broker}</div>
                        <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: a.color, background: a.color + '18', padding: '2px 6px' }}>{a.typeLabel}</div>
                        {a.currency === 'USD' && <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: t.bronze, border: `1px solid ${t.bronzeSoft}`, padding: '1px 5px' }}>USD</div>}
                      </div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted }}>{a.holds.length > 0 ? `${a.holds.length}종목 보유` : '보유 종목 없음'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 500 }}>{fmtMoney(a.total, currency)}</div>
                      {a.holds.length > 0 && (
                        <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: a.pnl >= 0 ? t.up : t.down, marginTop: 2 }}>
                          {fmtPct(a.pnlPct)} · {a.pnl >= 0 ? '+' : ''}{fmtMoney(Math.abs(a.pnl), currency)}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Composition bar: equity vs cash */}
                  <div>
                    <div style={{ display: 'flex', height: 5, borderRadius: 2, overflow: 'hidden', background: t.lineSoft }}>
                      {a.equity > 0 && <div style={{ width: `${equityPct}%`, background: a.color }} />}
                      <div style={{ width: `${cashPct}%`, background: t.bronzeSoft }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: FONTS.mono, fontSize: 9, color: t.inkMuted }}>
                      <span>주식 {fmtMoney(a.equity, currency)}</span>
                      <span>현금 {fmtMoney(a.cashKRW, currency)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: selected account detail + linked holdings */}
          <div style={{ padding: 0, background: t.surface, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.lineSoft}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: sel.color, color: '#fff', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.serif, fontSize: 15, fontWeight: 600 }}>
                {sel.broker.slice(0, 1)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: 500 }}>{sel.broker} · {sel.typeLabel}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted, marginTop: 2 }}>{sel.name}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['입금', 'deposit'], ['출금', 'withdraw'], ['이체', 'transfer']].map(([l, k]) => (
                  <button key={k} onClick={() => setTransferOpen(k)} style={{
                    padding: '6px 12px', border: `1px solid ${t.line}`, background: t.surface,
                    fontFamily: FONTS.sans, fontSize: 11, color: t.inkSoft, cursor: 'pointer', borderRadius: 2,
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${t.lineSoft}` }}>
              {[
                ['계좌 총액', fmtMoney(sel.total, currency), t.ink],
                ['주식 평가', fmtMoney(sel.equity, currency), t.accent],
                ['예수금 (가용)', fmtMoney(sel.availableKRW ?? sel.available, currency), t.bronze],
                ['손익', sel.holds.length ? fmtPct(sel.pnlPct) : '—', sel.pnl >= 0 ? t.up : t.down],
              ].map(([l, v, c], i) => (
                <div key={i} style={{ padding: '10px 16px', borderRight: i < 3 ? `1px solid ${t.lineSoft}` : 'none' }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: t.inkMuted, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 500, color: c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Linked holdings table */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '10px 20px', background: t.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted }}>LINKED HOLDINGS · {sel.holds.length}</div>
                {sel.holds.length > 0 && <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted }}>행 클릭 → 상세</div>}
              </div>
              {sel.holds.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontStyle: 'italic', color: t.inkMuted, marginBottom: 6 }}>보유 종목이 없습니다</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted, marginBottom: 14 }}>
                    {sel.yield ? `CMA · 연 ${sel.yield}% 일할 지급 중` : sel.autoDebit ? `자동이체 예약됨 · 다음 ${sel.autoDebit.next}` : '이 계좌로 첫 매수를 시작해보세요'}
                  </div>
                  <button style={{ padding: '7px 16px', border: `1px solid ${t.ink}`, background: t.ink, color: t.surface, fontFamily: FONTS.sans, fontSize: 11, fontWeight: 500, cursor: 'pointer', borderRadius: 2 }}>종목 검색</button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.sans, fontSize: 12 }}>
                  <tbody>
                    {sel.holds.map((h, i) => {
                      const weight = (h.value / sel.total) * 100;
                      return (
                        <tr key={h.ticker} onClick={() => onSelectHolding && onSelectHolding(h)}
                          style={{ borderBottom: i < sel.holds.length - 1 ? `1px solid ${t.lineSoft}` : 'none', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = t.surfaceAlt}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '11px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 28, height: 28, background: t.accentSoft, color: t.accent, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.serif, fontSize: 11, fontWeight: 600 }}>
                                {h.ticker.slice(0, 2)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 12.5 }}>{h.name}</div>
                                <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: t.inkMuted }}>{h.ticker} · {h.qty < 1 ? h.qty.toFixed(4) : h.qty}주</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                            <div style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 500 }}>{fmtMoney(h.value, currency)}</div>
                            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.inkMuted }}>계좌 내 {weight.toFixed(1)}%</div>
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                            <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: h.pnl >= 0 ? t.up : t.down, fontWeight: 500 }}>{fmtPct(h.pct)}</div>
                            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: h.pnl >= 0 ? t.up : t.down, opacity: 0.75 }}>{h.pnl >= 0 ? '+' : ''}{fmtMoney(Math.abs(h.pnl), currency)}</div>
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', width: 80 }}>
                            <button onClick={(e) => { e.stopPropagation(); onTrade && onTrade(h); }}
                              style={{ background: 'transparent', color: t.inkSoft, border: `1px solid ${t.line}`, padding: '4px 10px', fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}>
                              TRADE
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {transferOpen && <TransferModal kind={transferOpen} onClose={() => setTransferOpen(null)} theme={theme} currency={currency} defaultAccount={selected} />}
    </>
  );
}

function TransferModal({ kind, onClose, theme, currency, defaultAccount }) {
  const t = VAULTY[theme];
  const [from, setFrom] = React.useState(defaultAccount);
  const [to, setTo] = React.useState(ACCOUNTS[1].id);
  const [amount, setAmount] = React.useState('');
  const [bank, setBank] = React.useState('토스뱅크');
  const title = kind === 'deposit' ? '입금' : kind === 'withdraw' ? '출금' : '계좌 이체';
  const fromAcct = ACCOUNTS.find((a) => a.id === from);

  const quick = [100_000, 500_000, 1_000_000, 5_000_000];
  const pane = { background: t.surface, border: `1px solid ${t.line}`, borderRadius: 2 };

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,14,.4)', backdropFilter: 'blur(2px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ ...pane, width: 460, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${t.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 18, fontWeight: 500 }}>{title}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted, marginTop: 2 }}>{kind.toUpperCase()}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 18, color: t.inkMuted, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* From */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted, marginBottom: 6 }}>
              {kind === 'deposit' ? '입금 출처' : '출금 계좌'}
            </div>
            {kind === 'deposit' ? (
              <select value={bank} onChange={(e) => setBank(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.line}`, background: t.surface, fontFamily: FONTS.sans, fontSize: 13, borderRadius: 2 }}>
                <option>토스뱅크 1000-1234-5678</option>
                <option>카카오뱅크 3333-12-0987654</option>
                <option>KB국민은행 123-45-67890</option>
              </select>
            ) : (
              <select value={from} onChange={(e) => setFrom(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.line}`, background: t.surface, fontFamily: FONTS.sans, fontSize: 13, borderRadius: 2 }}>
                {ACCOUNTS.map((a) => <option key={a.id} value={a.id}>{a.broker} · {a.typeLabel} · 가용 {fmtMoney(a.availableKRW ?? a.available, currency)}</option>)}
              </select>
            )}
          </div>

          {/* arrow */}
          <div style={{ textAlign: 'center', margin: '8px 0', color: t.inkMuted }}>↓</div>

          {/* To */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted, marginBottom: 6 }}>
              {kind === 'withdraw' ? '입금 은행' : '입금 계좌'}
            </div>
            {kind === 'withdraw' ? (
              <select value={bank} onChange={(e) => setBank(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.line}`, background: t.surface, fontFamily: FONTS.sans, fontSize: 13, borderRadius: 2 }}>
                <option>토스뱅크 1000-1234-5678</option>
                <option>카카오뱅크 3333-12-0987654</option>
                <option>KB국민은행 123-45-67890</option>
              </select>
            ) : (
              <select value={to} onChange={(e) => setTo(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.line}`, background: t.surface, fontFamily: FONTS.sans, fontSize: 13, borderRadius: 2 }}>
                {ACCOUNTS.filter((a) => a.id !== from).map((a) => <option key={a.id} value={a.id}>{a.broker} · {a.typeLabel}</option>)}
              </select>
            )}
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: t.inkMuted, marginBottom: 6 }}>금액</div>
            <div style={{ position: 'relative' }}>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                style={{ width: '100%', padding: '14px 40px 14px 14px', border: `1px solid ${t.line}`, background: t.surface, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 500, textAlign: 'right', borderRadius: 2, outline: 'none', boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: FONTS.mono, fontSize: 12, color: t.inkMuted }}>원</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
              {quick.map((q) => (
                <button key={q} onClick={() => setAmount(String((Number(amount) || 0) + q))}
                  style={{ padding: '7px 0', border: `1px solid ${t.line}`, background: 'transparent', fontFamily: FONTS.mono, fontSize: 10, color: t.inkSoft, cursor: 'pointer', borderRadius: 2 }}>
                  +{q >= 10_000 ? (q / 10_000) + '만' : q}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: t.surfaceAlt, padding: 14, marginBottom: 16, borderLeft: `3px solid ${t.accent}` }}>
            {kind !== 'deposit' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: t.inkMuted }}>출금 가능액</span>
                <span style={{ fontFamily: FONTS.mono, fontWeight: 500 }}>{fmtMoney(fromAcct.availableKRW ?? fromAcct.available, currency)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: t.inkMuted }}>수수료</span>
              <span style={{ fontFamily: FONTS.mono, fontWeight: 500 }}>무료</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: t.inkMuted }}>입금 예정</span>
              <span style={{ fontFamily: FONTS.mono, fontWeight: 500 }}>즉시 · {kind === 'deposit' ? '영업일 기준' : 'T+0'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px 0', border: `1px solid ${t.line}`, background: 'transparent', fontFamily: FONTS.sans, fontSize: 13, color: t.inkSoft, cursor: 'pointer', borderRadius: 2 }}>취소</button>
            <button style={{ flex: 2, padding: '11px 0', border: 'none', background: t.ink, color: t.surface, fontFamily: FONTS.sans, fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 2 }}>
              {title} 실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AssetsPage, CashManagement });