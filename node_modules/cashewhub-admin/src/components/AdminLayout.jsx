import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import '../styles/components/adminLayout.css';

/* ── Grouped nav config ──────────────────────────────────────────
   Removed: Audit Logs, Reports, Admin Users, Purchases, Suppliers, Returns
   ─────────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Core Operations',
    items: [
      { label: 'Dashboard',  path: '/admin/dashboard',  icon: '📊' },
      { label: 'Orders',     path: '/admin/orders',     icon: '🛒' },
      { label: 'Products',   path: '/admin/products',   icon: '🥜' },
      { label: 'Inventory',  path: '/admin/inventory',  icon: '📦' },
      { label: 'Customers',  path: '/admin/customers',  icon: '👥' },
      { label: 'Delivery',   path: '/admin/delivery',   icon: '🚚' },
    ],
  },
  {
    label: 'Marketing & Settings',
    items: [
      { label: 'Coupons',    path: '/admin/coupons',    icon: '🎟️'  },
      { label: 'Banners',    path: '/admin/banners',    icon: '🖼️'  },
      { label: 'Reviews',    path: '/admin/reviews',    icon: '⭐' },
      { label: 'Categories', path: '/admin/categories', icon: '🗂️'  },
      { label: 'Invoices',   path: '/admin/invoices',   icon: '🧾' },
    ],
  },
];

export default function AdminLayout() {
  const navigate   = useNavigate();
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

        {/* Brand */}
        <div className="erp-sidebar__brand">
          <span className="erp-sidebar__logo">🌰</span>
          {!collapsed && (
            <div className="erp-sidebar__brand-text">
              <span className="erp-sidebar__name">H²B³ Cashew</span>
              <span className="erp-sidebar__sub">Admin Panel</span>
            </div>
          )}
        </div>

        {/* Grouped Nav */}
        <nav className="erp-sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="erp-nav-group">
              {!collapsed && (
                <span className="erp-nav-group__label">{group.label}</span>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `erp-nav-item ${isActive ? 'erp-nav-item--active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="erp-nav-item__icon">{item.icon}</span>
                  {!collapsed && (
                    <span className="erp-nav-item__label">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User info + logout at bottom */}
        <div className="erp-sidebar__footer">
          {!collapsed && (
            <div className="erp-sidebar__user-info">
              <div className="erp-sidebar__avatar">
                {(user.name || user.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="erp-sidebar__user-details">
                <span className="erp-sidebar__user-name">
                  {user.name || user.username || 'Admin'}
                </span>
                <span className="erp-sidebar__user-role">Administrator</span>
              </div>
            </div>
          )}
          <button
            className="erp-sidebar__logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            {collapsed ? '🚪' : '🚪 Logout'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          className="erp-sidebar__collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────── */}
      <div className="erp-main">

        {/* Top bar */}
        <header className="erp-topbar">
          <div className="erp-topbar__left">
            <h2 className="erp-topbar__title">H²B³ Cashew — Admin</h2>
          </div>
          <div className="erp-topbar__right">
            <div className="erp-topbar__user-pill">
              <span className="erp-topbar__user-dot" />
              <span>👤 {user.name || user.username || 'Admin'}</span>
            </div>
            <button className="erp-topbar__logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="erp-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
