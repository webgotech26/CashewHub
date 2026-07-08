import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import '../styles/components/adminLayout.css';

const NAV_ITEMS = [
  { label: 'Dashboard',      path: '/admin/dashboard',    icon: '📊' },
  { label: 'Products',       path: '/admin/products',     icon: '🥜' },
  { label: 'Categories',     path: '/admin/categories',   icon: '🗂️'  },
  { label: 'Stock',          path: '/admin/stock',        icon: '📦' },
  { label: 'Inventory',      path: '/admin/inventory',    icon: '📱' },
  { label: 'Orders',         path: '/admin/orders',       icon: '🛒' },
  { label: 'Customers',      path: '/admin/customers',    icon: '👥' },
  { label: 'Purchases',      path: '/admin/purchases',    icon: '🏭' },
  { label: 'Suppliers',      path: '/admin/suppliers',    icon: '🤝' },
  { label: 'Delivery',       path: '/admin/delivery',     icon: '🚚' },
  { label: 'Returns',        path: '/admin/returns',      icon: '↩️'  },
  { label: 'Coupons',        path: '/admin/coupons',      icon: '🎟️'  },
  { label: 'Banners',        path: '/admin/banners',      icon: '🖼️'  },
  { label: 'Reviews',        path: '/admin/reviews',      icon: '⭐' },
  { label: 'Invoices',       path: '/admin/invoices',     icon: '🧾' },
  { label: 'Reports',        path: '/admin/reports',      icon: '📈' },
  { label: 'Audit Logs',     path: '/admin/audit-logs',   icon: '🔍' },
  { label: 'Admin Users',    path: '/admin/admins',       icon: '🛡️'  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={`erp-layout ${collapsed ? 'erp-layout--collapsed' : ''}`}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="erp-sidebar">
        <div className="erp-sidebar__brand">
          <span className="erp-sidebar__logo">🌰</span>
          {!collapsed && <span className="erp-sidebar__name">Cashew ERP</span>}
        </div>

        <nav className="erp-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `erp-nav-item ${isActive ? 'erp-nav-item--active' : ''}`
              }
            >
              <span className="erp-nav-item__icon">{item.icon}</span>
              {!collapsed && <span className="erp-nav-item__label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          className="erp-sidebar__collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────── */}
      <div className="erp-main">
        {/* Top bar */}
        <header className="erp-topbar">
          <h2 className="erp-topbar__title">Cashew Business ERP</h2>
          <div className="erp-topbar__right">
            <span className="erp-topbar__user">👤 {user.name || 'Admin'}</span>
            <button className="erp-topbar__logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Page content injected here */}
        <main className="erp-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
