'use strict';
const pool = require('../config/db');

/**
 * GET /api/orders/manifest
 *
 * Query params:
 *   ?ids=1,2,3          → specific order IDs (comma-separated)
 *   ?date=today         → all orders placed today
 *   ?status=pending     → filter by status (optional, combined with date)
 *
 * Returns: text/html  — a self-contained print-ready dispatch manifest.
 * The browser opens it in a new tab; admin clicks Print → saves as PDF.
 */
const generateManifest = async (req, res) => {
  try {
    const { ids, date, status } = req.query;

    /* ── Build WHERE clause ──────────────────────────────────── */
    const params = [];
    let where = [];

    if (ids && ids.trim()) {
      const idList = ids.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      if (idList.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid order IDs provided.' });
      }
      where.push(`o.id IN (${idList.map(() => '?').join(',')})`);
      params.push(...idList);
    } else if (date === 'today' || !date) {
      where.push('DATE(o.created_at) = CURDATE()');
    } else {
      /* Accept YYYY-MM-DD */
      where.push('DATE(o.created_at) = ?');
      params.push(date);
    }

    if (status && status !== 'all') {
      where.push('o.status = ?');
      params.push(status);
    }

    const whereSQL = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    /* ── Fetch orders ────────────────────────────────────────── */
    const [orders] = await pool.query(
      `SELECT
         o.id,
         o.status,
         o.total_amount,
         o.address,
         o.created_at,
         c.name   AS customer_name,
         c.mobile AS customer_phone,
         c.email  AS customer_email
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ${whereSQL}
       ORDER BY o.created_at ASC`,
      params
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'No orders found for the given criteria.' });
    }

    /* ── Fetch items for all those orders in one query ───────── */
    const orderIds = orders.map(o => o.id);
    const [items] = await pool.query(
      `SELECT
         oi.order_id,
         p.name AS product_name,
         oi.quantity,
         oi.unit_price,
         oi.line_total
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})
       ORDER BY oi.order_id, oi.id`,
      orderIds
    );

    /* Group items by order_id */
    const itemMap = {};
    items.forEach(item => {
      if (!itemMap[item.order_id]) itemMap[item.order_id] = [];
      itemMap[item.order_id].push(item);
    });

    /* ── Build HTML ──────────────────────────────────────────── */
    const dateLabel = date === 'today' || !date
      ? new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      : date;

    const totalGrand = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

    const orderCards = orders.map((o, idx) => {
      const orderItems = itemMap[o.id] || [];
      const displayId  = o.id < 100000 ? o.id + 100000 : o.id;

      const itemRows = orderItems.map(i => `
        <tr>
          <td>${i.product_name || '—'}</td>
          <td class="center">${i.quantity}</td>
          <td class="right">₹${Number(i.unit_price || 0).toFixed(2)}</td>
          <td class="right bold">₹${Number(i.line_total || i.unit_price * i.quantity).toFixed(2)}</td>
        </tr>`).join('');

      const statusColor = {
        pending: '#F59E0B', confirmed: '#3B82F6', processing: '#8B5CF6',
        shipped: '#06B6D4', delivered: '#22C55E', cancelled: '#EF4444',
      }[o.status] || '#9CA3AF';

      return `
        <div class="order-card" style="page-break-inside:avoid">
          <div class="order-header">
            <div class="order-meta">
              <span class="serial">${idx + 1}</span>
              <div>
                <div class="order-id">Order #${displayId}</div>
                <div class="order-date">${new Date(o.created_at).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
              </div>
            </div>
            <span class="status-pill" style="background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}50">
              ${o.status.toUpperCase()}
            </span>
          </div>

          <div class="two-col">
            <div class="info-block">
              <div class="label">Customer</div>
              <div class="value bold">${o.customer_name || '—'}</div>
              ${o.customer_phone ? `<div class="value">${o.customer_phone}</div>` : ''}
              ${o.customer_email ? `<div class="value muted">${o.customer_email}</div>` : ''}
            </div>
            <div class="info-block">
              <div class="label">Delivery Address</div>
              <div class="value">${o.address || '<em class="muted">Not provided</em>'}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr><th>Product</th><th class="center">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr>
            </thead>
            <tbody>${itemRows || '<tr><td colspan="4" class="muted center">No items</td></tr>'}</tbody>
          </table>

          <div class="order-total">
            <span>Order Total</span>
            <span class="grand">₹${Number(o.total_amount).toFixed(2)}</span>
          </div>
        </div>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dispatch Manifest — ${dateLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #f5f5f5; padding: 24px; }
    .page-header { background: #1a3c2e; color: #fff; padding: 20px 28px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .page-header h1 { font-size: 20px; font-weight: 800; }
    .page-header .meta { font-size: 13px; opacity: .7; margin-top: 3px; }
    .summary-bar { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 20px; flex: 1; min-width: 140px; }
    .summary-card .s-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #9ca3af; }
    .summary-card .s-value { font-size: 22px; font-weight: 800; color: #1a3c2e; margin-top: 4px; }
    .order-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; }
    .order-meta { display: flex; align-items: center; gap: 12px; }
    .serial { width: 28px; height: 28px; background: #1a3c2e; color: #f5c842; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
    .order-id { font-size: 16px; font-weight: 800; color: #1a3c2e; }
    .order-date { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .status-pill { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
    .info-block { background: #f9fafb; border-radius: 8px; padding: 12px; }
    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #9ca3af; margin-bottom: 5px; }
    .value { font-size: 13px; color: #374151; line-height: 1.6; }
    .value.bold { font-weight: 700; color: #111; }
    .muted { color: #9ca3af !important; font-style: italic; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
    .items-table th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; }
    .items-table td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
    .items-table tr:last-child td { border-bottom: none; }
    .center { text-align: center !important; }
    .right  { text-align: right !important; }
    .bold   { font-weight: 700; }
    .order-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; border-top: 2px solid #e5e7eb; padding-top: 10px; color: #374151; }
    .order-total .grand { font-size: 16px; font-weight: 800; color: #1a3c2e; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1a3c2e; color: #f5c842; border: none; border-radius: 50px; padding: 14px 28px; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.25); z-index: 999; }
    .print-btn:hover { background: #2d6a4f; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
    @media print {
      body { background: #fff; padding: 0; }
      .print-btn { display: none; }
      .page-header { border-radius: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .order-card { border: 1px solid #ccc; margin-bottom: 0; border-radius: 0; }
      .order-card + .order-card { border-top: none; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    <div>
      <h1>📦 Petrichor Naturals — Dispatch Manifest</h1>
      <div class="meta">Generated on ${new Date().toLocaleString('en-IN')} · ${dateLabel}</div>
    </div>
    <div style="text-align:right;font-size:13px;opacity:.8">${orders.length} order${orders.length !== 1 ? 's' : ''}</div>
  </div>

  <div class="summary-bar">
    <div class="summary-card">
      <div class="s-label">Total Orders</div>
      <div class="s-value">${orders.length}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Total Items</div>
      <div class="s-value">${items.reduce((s, i) => s + Number(i.quantity || 0), 0)}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Grand Total</div>
      <div class="s-value">₹${totalGrand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Date</div>
      <div class="s-value" style="font-size:14px">${dateLabel}</div>
    </div>
  </div>

  ${orderCards}

  <div class="footer">Petrichor Naturals · contact.cashewhub@gmail.com · +91 63741 39363 · India</div>

  <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);

  } catch (err) {
    console.error('generateManifest error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to generate manifest.' });
  }
};

module.exports = { generateManifest };
