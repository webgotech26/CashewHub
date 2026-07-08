import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Reports() {
  const [range, setRange]     = useState({ from:'', to:'' });
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = () => {
    setLoading(true);
    api.get(`/api/reports/sales?from=${range.from}&to=${range.to}`)
      .then(r => setData(r.data.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const StatBox = ({ label, value, color = '#2d6a4f' }) => (
    <div className="erp-stat-card">
      <span className="erp-stat-card__value" style={{ color }}>{value}</span>
      <span className="erp-stat-card__label">{label}</span>
    </div>
  );

  return (
    <div>
      <h1 className="erp-page-title">📈 Reports & Analytics</h1>

      {/* Date Filter */}
      <div className="erp-card" style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
        <div className="erp-form-group">
          <label>From Date</label>
          <input type="date" value={range.from} onChange={e => setRange({...range, from:e.target.value})} />
        </div>
        <div className="erp-form-group">
          <label>To Date</label>
          <input type="date" value={range.to} onChange={e => setRange({...range, to:e.target.value})} />
        </div>
        <button className="erp-btn erp-btn--primary" onClick={fetch} disabled={loading}>
          {loading ? 'Loading…' : 'Generate Report'}
        </button>
      </div>

      {data && (
        <>
          <div className="erp-stats-grid">
            <StatBox label="Total Revenue"    value={`₹${Number(data.total_revenue || 0).toLocaleString()}`} />
            <StatBox label="Total Orders"     value={data.total_orders || 0} />
            <StatBox label="Avg Order Value"  value={`₹${Number(data.avg_order_value || 0).toFixed(2)}`} />
            <StatBox label="New Customers"    value={data.new_customers || 0} />
            <StatBox label="Products Sold"    value={data.total_items_sold || 0} />
            <StatBox label="Refunds Issued"   value={`₹${Number(data.total_refunds || 0).toFixed(2)}`} color="#dc2626" />
          </div>

          {/* Top Products */}
          <div className="erp-card">
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'#1a3c2e' }}>🏆 Top Selling Products</h3>
            <div className="erp-table-wrapper">
              <table className="erp-table">
                <thead>
                  <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {(data.top_products || []).length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign:'center', color:'#aaa', padding:20 }}>No data.</td></tr>
                  ) : (data.top_products || []).map((p, i) => (
                    <tr key={i}>
                      <td>{p.product_name}</td>
                      <td>{p.total_qty}</td>
                      <td>₹{Number(p.revenue).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
