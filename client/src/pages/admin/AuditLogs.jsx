import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AuditLogs() {
  const [logs, setLogs]     = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  useEffect(() => {
    api.get(`/api/audit-logs?search=${search}&page=${page}&limit=20`)
      .then(r => setLogs(r.data.data || [])).catch(() => {});
  }, [search, page]);

  const actionBadge = (a) => {
    const map = { CREATE:'green', UPDATE:'blue', DELETE:'red', LOGIN:'gray', LOGOUT:'gray' };
    return <span className={`erp-badge erp-badge--${map[a] || 'gray'}`}>{a}</span>;
  };

  return (
    <div>
      <h1 className="erp-page-title">🔍 Audit Logs</h1>

      <div className="erp-toolbar">
        <input className="erp-toolbar__search" placeholder="Search by user or action…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <span style={{ fontSize:13, color:'#888' }}>Read-only. Immutable records.</span>
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th><th>User</th><th>Role</th><th>Action</th>
                <th>Module</th><th>Details</th><th>IP</th><th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No logs found.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.user_name || log.user_id}</td>
                  <td><span className="erp-badge erp-badge--gray">{log.user_role || '—'}</span></td>
                  <td>{actionBadge(log.action)}</td>
                  <td>{log.module || '—'}</td>
                  <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'#666' }}>
                    {log.details || '—'}
                  </td>
                  <td style={{ fontSize:12, color:'#888' }}>{log.ip_address || '—'}</td>
                  <td style={{ fontSize:12, color:'#888', whiteSpace:'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="erp-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
          <span>Page {page}</span>
          <button disabled={logs.length < 20} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
