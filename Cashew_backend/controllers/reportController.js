const pool = require('../config/db');

const getSalesReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    let dateFilter = '';
    const params = [];
    if (from && to) {
      dateFilter = ' AND o.created_at BETWEEN ? AND ?';
      params.push(from, to + ' 23:59:59');
    } else if (from) {
      dateFilter = ' AND o.created_at >= ?';
      params.push(from);
    } else if (to) {
      dateFilter = ' AND o.created_at <= ?';
      params.push(to + ' 23:59:59');
    }

    const baseWhere = `FROM orders o WHERE o.status != 'cancelled'${dateFilter}`;

    // Summary stats
    const [[summary]] = await pool.query(
      `SELECT
         COUNT(*)               AS total_orders,
         SUM(o.total_amount)    AS total_revenue,
         AVG(o.total_amount)    AS avg_order_value,
         COUNT(DISTINCT o.customer_id) AS unique_customers
       ${baseWhere}`,
      [...params]
    );

    // Top selling products
    const [topProducts] = await pool.query(
      `SELECT p.name AS product_name, SUM(o.quantity) AS total_qty, SUM(o.total_amount) AS revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.status != 'cancelled'${dateFilter}
       GROUP BY p.id, p.name
       ORDER BY total_qty DESC
       LIMIT 10`,
      [...params]
    );

    return res.status(200).json({
      success: true,
      data: {
        total_orders:     summary.total_orders     || 0,
        total_revenue:    summary.total_revenue    || 0,
        avg_order_value:  summary.avg_order_value  || 0,
        new_customers:    summary.unique_customers || 0,
        total_items_sold: 0,
        total_refunds:    0,
        top_products: topProducts,
      },
    });
  } catch (err) {
    console.error('getSalesReport error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getSalesReport };
