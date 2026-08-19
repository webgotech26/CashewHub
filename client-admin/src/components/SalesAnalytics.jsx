/**
 * SalesAnalytics.jsx
 *
 * Self-contained Sales Analytics section for AdminDashboard.
 * Uses pure SVG — no Recharts or external chart library required.
 *
 * Features:
 *  • Time-range toggle: 7D / 30D / 6M
 *  • SVG area + line chart with smooth cubic-bezier curves
 *  • Interactive hover: vertical guide line + dot highlight + floating tooltip
 *  • Gradient fill under the line
 *  • Summary KPI row (total revenue, total orders, avg order value)
 *  • Top Products horizontal bar chart
 *  • Orders-by-Status donut-style bar breakdown
 *  • Fully responsive — chart width recalculates on container resize
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api';

/* ── constants ──────────────────────────────────────────────── */
const RANGES = [
  { key: '7d',  label: '7D'  },
  { key: '30d', label: '30D' },
  { key: '6m',  label: '6M'  },
];

const STATUS_COLOR = {
  pending:    '#F97316',
  confirmed:  '#0EA5E9',
  processing: '#8B5CF6',
  shipped:    '#06B6D4',
  delivered:  '#22C55E',
  cancelled:  '#EF4444',
};

const TOP_COLORS = ['#2d6a4f', '#52b788', '#0ea5e9', '#f59e0b', '#8b5cf6'];

/* ── helpers ─────────────────────────────────────────────────── */
function fmtINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function fmtDate(raw) {
  const d = new Date(raw);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
function fmtDateLong(raw) {
  const d = new Date(raw);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Build an SVG smooth-curve path from (x,y) pairs.
 * Uses cubic Bezier control points for the "wave" effect.
 */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx  = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/* ── SVG Line Chart ──────────────────────────────────────────── */
function LineChart({ data }) {
  const containerRef = useRef(null);
  const [width, setWidth]         = useState(600);
  const [tooltip, setTooltip]     = useState(null);  // { x, y, point }
  const [hoverIdx, setHoverIdx]   = useState(null);

  /* Observe container width */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.floor(w));
    });
    ro.observe(containerRef.current);
    setWidth(containerRef.current.offsetWidth || 600);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>
        No revenue data for this period.
      </div>
    );
  }

  const H          = 200;          // SVG viewport height
  const PAD_LEFT   = 56;
  const PAD_RIGHT  = 16;
  const PAD_TOP    = 20;
  const PAD_BOTTOM = 32;
  const chartW     = width - PAD_LEFT - PAD_RIGHT;
  const chartH     = H - PAD_TOP - PAD_BOTTOM;

  const maxRev  = Math.max(...data.map(d => d.revenue), 1);
  const minRev  = 0;
  const revRange = maxRev - minRev || 1;

  /* Map data points to SVG coordinates */
  const pts = data.map((d, i) => ({
    x: PAD_LEFT + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD_TOP  + chartH - ((d.revenue - minRev) / revRange) * chartH,
    d,
  }));

  const linePath = smoothPath(pts);
  /* Area path: line + vertical drop to baseline + back */
  const areaPath = linePath
    + ` L ${pts[pts.length - 1].x} ${PAD_TOP + chartH}`
    + ` L ${pts[0].x} ${PAD_TOP + chartH} Z`;

  /* Y-axis grid lines */
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
    y:     PAD_TOP + chartH - frac * chartH,
    label: fmtINR(minRev + frac * revRange),
  }));

  /* X-axis labels — show ~5–7 evenly spaced */
  const xStep = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .map((d, i) => ({ i, d }))
    .filter(({ i }) => i === 0 || i === data.length - 1 || i % xStep === 0);

  /* Mouse move on SVG → find nearest point */
  const handleMouseMove = useCallback((e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx   = e.clientX - rect.left;

    let closest = null;
    let minDist = Infinity;
    pts.forEach((pt, i) => {
      const dist = Math.abs(pt.x - mx);
      if (dist < minDist) { minDist = dist; closest = i; }
    });

    if (closest === null) return;
    const pt = pts[closest];
    setHoverIdx(closest);

    /* Position tooltip: flip left if near right edge */
    const tipW = 160;
    const tipX = mx + tipW + 16 > width ? mx - tipW - 8 : mx + 12;
    setTooltip({ svgX: pt.x, svgY: pt.y, screenX: tipX, point: pt.d });
  }, [pts, width]);

  const handleMouseLeave = () => { setHoverIdx(null); setTooltip(null); };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        width={width}
        height={H}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', cursor: 'crosshair', overflow: 'visible' }}
      >
        <defs>
          {/* Gradient fill */}
          <linearGradient id="sa-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2d6a4f" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2d6a4f" stopOpacity="0.02" />
          </linearGradient>
          {/* Glow filter for the hover dot */}
          <filter id="sa-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Y-axis grid lines + labels ── */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD_LEFT} y1={t.y} x2={PAD_LEFT + chartW} y2={t.y}
              stroke="#f0f0f0" strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '4 4'}
            />
            <text
              x={PAD_LEFT - 6} y={t.y + 4}
              textAnchor="end" fontSize="9" fill="#b0b8c1" fontFamily="'DM Sans',sans-serif"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* ── Area fill ── */}
        <path d={areaPath} fill="url(#sa-grad)" />

        {/* ── Line ── */}
        <path
          d={linePath}
          fill="none"
          stroke="#2d6a4f"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ── Hover: vertical guide + highlighted dot ── */}
        {hoverIdx !== null && tooltip && (
          <>
            <line
              x1={tooltip.svgX} y1={PAD_TOP}
              x2={tooltip.svgX} y2={PAD_TOP + chartH}
              stroke="#2d6a4f" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"
            />
            {/* outer ring */}
            <circle cx={pts[hoverIdx].x} cy={pts[hoverIdx].y} r="8"
              fill="#2d6a4f" opacity="0.18" />
            {/* dot */}
            <circle cx={pts[hoverIdx].x} cy={pts[hoverIdx].y} r="5"
              fill="#fff" stroke="#2d6a4f" strokeWidth="2.5"
              filter="url(#sa-glow)" />
          </>
        )}

        {/* ── Data dots (always visible, small) ── */}
        {pts.length <= 14 && pts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3"
            fill={hoverIdx === i ? '#2d6a4f' : '#fff'}
            stroke="#2d6a4f" strokeWidth="1.8" />
        ))}

        {/* ── X-axis labels ── */}
        {xLabels.map(({ i, d }) => (
          <text
            key={i}
            x={pts[i]?.x ?? 0}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            fill={hoverIdx === i ? '#2d6a4f' : '#b0b8c1'}
            fontFamily="'DM Sans',sans-serif"
            fontWeight={hoverIdx === i ? '700' : '400'}
          >
            {fmtDate(d.date)}
          </text>
        ))}
      </svg>

      {/* ── Floating tooltip ── */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: Math.max(0, tooltip.svgY - 60),
          left: tooltip.screenX,
          background: '#1a3c2e',
          borderRadius: 10,
          padding: '10px 14px',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          minWidth: 148,
        }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)',
            margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {fmtDateLong(tooltip.point.date)}
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#52b788', margin: '0 0 2px' }}>
            {fmtINR(tooltip.point.revenue)}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            {tooltip.point.orders} order{tooltip.point.orders !== 1 ? 's' : ''}
          </p>
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: 12, left: -6,
            width: 12, height: 12,
            background: '#1a3c2e',
            transform: 'rotate(45deg)',
            borderRadius: 2,
          }} />
        </div>
      )}
    </div>
  );
}

/* ── KPI summary row ─────────────────────────────────────────── */
function KpiRow({ data, range }) {
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = data.reduce((s, d) => s + d.orders,  0);
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const rangeLabel = range === '7d' ? 'Last 7 days' : range === '6m' ? 'Last 6 months' : 'Last 30 days';

  const kpis = [
    { label: 'Total Revenue',    value: fmtINR(totalRevenue), icon: '💰', color: '#2d6a4f' },
    { label: 'Total Orders',     value: totalOrders,          icon: '🛒', color: '#0ea5e9' },
    { label: 'Avg Order Value',  value: fmtINR(avgOrder),     icon: '📈', color: '#f59e0b' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
      marginBottom: 20,
    }}>
      {kpis.map(k => (
        <div key={k.label} style={{
          background: '#f9fafb',
          border: '1px solid #f0f0f0',
          borderRadius: 12,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{k.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {k.label}
            </span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#1a3c2e', margin: 0 }}>
            {k.value}
          </p>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: '3px 0 0' }}>{rangeLabel}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Top Products horizontal bars ───────────────────────────── */
function TopProducts({ data }) {
  if (!data || data.length === 0) return null;
  const maxRev = Math.max(...data.map(p => p.revenue), 1);

  return (
    <div className="erp-card" style={{ padding: '20px 20px 16px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a3c2e', marginBottom: 4 }}>
        🏆 Top Products by Revenue
      </p>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 18 }}>
        Best-selling products (all time, non-cancelled)
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((p, i) => {
          const pct = (p.revenue / maxRev) * 100;
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: TOP_COLORS[i], color: '#fff',
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: '#1a1a1a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={p.name}>{p.name}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1a3c2e', margin: 0 }}>
                    {fmtINR(p.revenue)}
                  </p>
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>
                    {p.units_sold} units
                  </p>
                </div>
              </div>
              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: TOP_COLORS[i],
                  width: `${pct}%`,
                  transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Orders by Status ────────────────────────────────────────── */
function OrdersByStatus({ data }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.count, 0) || 1;

  const STATUS_LABEL = {
    pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
    shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
  };

  return (
    <div className="erp-card" style={{ padding: '20px 20px 16px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a3c2e', marginBottom: 4 }}>
        📋 Orders by Status
      </p>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 18 }}>
        All-time breakdown
      </p>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 10, borderRadius: 8,
        overflow: 'hidden', marginBottom: 18, gap: 1 }}>
        {data.map(s => (
          <div
            key={s.status}
            title={`${STATUS_LABEL[s.status] || s.status}: ${s.count}`}
            style={{
              flex: s.count,
              background: STATUS_COLOR[s.status] || '#9ca3af',
              transition: 'flex 0.5s ease',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(s => {
          const pct  = Math.round((s.count / total) * 100);
          const color = STATUS_COLOR[s.status] || '#9ca3af';
          return (
            <div key={s.status}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                    {STATUS_LABEL[s.status] || s.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{s.count}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 34, textAlign: 'right' }}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div style={{ height: 5, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, background: color,
                  width: `${pct}%`,
                  transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-stat footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
        {[
          { label: 'Delivered',  key: 'delivered',  color: '#22c55e' },
          { label: 'Pending',    key: 'pending',    color: '#f97316' },
          { label: 'Cancelled',  key: 'cancelled',  color: '#ef4444' },
        ].map(({ label, key, color }) => (
          <div key={key} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color, margin: 0 }}>
              {data.find(s => s.status === key)?.count ?? 0}
            </p>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────── */
function ChartSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`@keyframes sa-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      {[180, 120, 120].map((h, i) => (
        <div key={i} style={{
          height: h, borderRadius: 14,
          background: '#f3f4f6',
          animation: `sa-pulse 1.6s ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ── Main exported component ─────────────────────────────────── */
export default function SalesAnalytics() {
  const [range,        setRange]        = useState('30d');
  const [chartData,    setChartData]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchData = useCallback((r) => {
    setLoading(true);
    setError(null);
    api.get(`/api/admin/charts?range=${r}`)
      .then(res => setChartData(res.data.data || null))
      .catch(() => setError('Could not load analytics data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  const handleRange = (r) => {
    if (r === range) return;
    setRange(r);
  };

  return (
    <div style={{ marginBottom: 32 }}>

      {/* ── Section header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        marginBottom: 18,
      }}>
        <div>
          <h2 style={{
            fontSize: 18, fontWeight: 800, color: '#1a3c2e', margin: 0,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            📈 Sales Analytics
          </h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>
            Revenue trends, top products &amp; order breakdown
          </p>
        </div>

        {/* ── Time-range toggle ── */}
        <div style={{
          display: 'flex', background: '#f3f4f6',
          borderRadius: 10, padding: 4, gap: 2,
        }}>
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => handleRange(r.key)}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                border: 'none',
                background: range === r.key
                  ? '#1a3c2e'
                  : 'transparent',
                color: range === r.key ? '#fff' : '#6b7280',
                fontSize: 12,
                fontWeight: range === r.key ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                fontFamily: 'inherit',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error state ── */}
      {error && !loading && (
        <div className="erp-card" style={{
          padding: '24px', textAlign: 'center', color: '#ef4444',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
          <p style={{ fontWeight: 600, fontSize: 13 }}>{error}</p>
          <button
            onClick={() => fetchData(range)}
            className="erp-btn erp-btn--sm"
            style={{ marginTop: 12, background: '#1a3c2e', color: '#fff', border: 'none' }}
          >
            🔄 Retry
          </button>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && <ChartSkeleton />}

      {/* ── Charts ── */}
      {!loading && !error && chartData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Revenue line chart card */}
          <div className="erp-card" style={{ padding: '20px 20px 12px' }}>
            {/* Card header */}
            <div style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 16, flexWrap: 'wrap', gap: 10,
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1a3c2e', margin: 0 }}>
                  💰 Daily Revenue
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>
                  {range === '7d' ? 'Last 7 days'
                    : range === '6m' ? 'Last 6 months'
                    : 'Last 30 days'} · non-cancelled orders only
                </p>
              </div>
              {chartData.dailyRevenue.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 8, padding: '5px 12px',
                }}>
                  <div style={{ width: 10, height: 3, borderRadius: 2, background: '#2d6a4f' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2d6a4f' }}>Revenue</span>
                </div>
              )}
            </div>

            {/* KPI summary row */}
            <KpiRow data={chartData.dailyRevenue} range={range} />

            {/* Line chart */}
            <LineChart data={chartData.dailyRevenue} />
          </div>

          {/* Two-column row: Top Products + Status */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}>
            <TopProducts  data={chartData.topProducts}     />
            <OrdersByStatus data={chartData.ordersByStatus} />
          </div>

        </div>
      )}

      {/* No data at all */}
      {!loading && !error && chartData && chartData.dailyRevenue.length === 0
        && chartData.topProducts.length === 0 && (
        <div className="erp-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p style={{ fontWeight: 700, color: '#1a3c2e', fontSize: 15 }}>No data yet</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Place some orders to start seeing analytics here.
          </p>
        </div>
      )}

    </div>
  );
}
