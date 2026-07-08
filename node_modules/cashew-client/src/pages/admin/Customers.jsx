import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);

  useEffect(() => {
    api.get(`/api/customers?search=${search}&page=${page}&limit=15`)
      .then(r => setCustomers(r.data.data || [])).catch(() => {});
  }, [search, page]);

  return (
    <div>
      <h1 className="erp-page-title">👥 Customer Management</h1>

      <div className="erp-toolbar">
        <input className="erp-toolbar__search" placeholder="Search by name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Email</th><th>Mobile</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No customers found.</td></tr>
              ) : customers.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email}</td>
                  <td>{c.mobile || '—'}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="erp-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
          <span>Page {page}</span>
          <button disabled={customers.length < 15} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
