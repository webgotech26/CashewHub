import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  useEffect(() => {
    api.get(`/api/invoices?search=${search}&page=${page}&limit=15`)
      .then(r => setInvoices(r.data.data || [])).catch(() => {});
  }, [search, page]);

  const download = async (id) => {
    try {
      const res = await api.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('PDF download unavailable.');
    }
  };

  return (
    <div>
      <h1 className="erp-page-title">🧾 GST Invoice Management</h1>

      <div className="erp-toolbar">
        <input className="erp-toolbar__search" placeholder="Search by order or customer…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice #</th><th>Order</th><th>Customer</th>
                <th>Amount</th><th>GST</th><th>Total</th><th>Date</th><th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'#aaa', padding:30 }}>
                  No invoices found.
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id}>
                  <td><strong>INV-{String(inv.id).padStart(5, '0')}</strong></td>
                  <td>#{inv.order_id}</td>
                  <td>{inv.customer_name || '—'}</td>
                  <td>₹{Number(inv.subtotal || 0).toFixed(2)}</td>
                  <td>₹{Number(inv.gst_amount || 0).toFixed(2)}</td>
                  <td><strong>₹{Number(inv.total_amount || 0).toFixed(2)}</strong></td>
                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="erp-btn erp-btn--secondary erp-btn--sm" onClick={() => download(inv.id)}>
                      ⬇ PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="erp-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
          <span>Page {page}</span>
          <button disabled={invoices.length < 15} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
