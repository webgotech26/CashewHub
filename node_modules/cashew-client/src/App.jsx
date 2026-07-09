/**
 * client-admin/src/App.jsx
 * Admin ERP — cleaned up routes.
 * Removed: Purchases, Suppliers, Returns, Reports, Audit Logs, Admin Users
 * Runs on port 3001.
 */
import { Routes, Route, Navigate } from 'react-router-dom';

import Login               from './pages/Login';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminLayout         from './components/AdminLayout';

// Core Operations
import AdminDashboard from './pages/admin/AdminDashboard';
import Orders         from './pages/admin/Orders';
import Products       from './pages/admin/Products';
import Inventory      from './pages/admin/Inventory';
import Customers      from './pages/admin/Customers';
import Delivery       from './pages/admin/Delivery';

// Marketing & Settings
import Coupons        from './pages/admin/Coupons';
import Banners        from './pages/admin/Banners';
import Reviews        from './pages/admin/Reviews';
import Categories     from './pages/admin/Categories';
import Invoices       from './pages/admin/Invoices';

export default function App() {
  return (
    <Routes>
      <Route path="/"      element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* ── Core Operations ───────────────────────────── */}
        <Route path="dashboard"  element={<AdminDashboard />} />
        <Route path="orders"     element={<Orders />} />
        <Route path="products"   element={<Products />} />
        <Route path="inventory"  element={<Inventory />} />
        <Route path="customers"  element={<Customers />} />
        <Route path="delivery"   element={<Delivery />} />

        {/* ── Marketing & Settings ──────────────────────── */}
        <Route path="coupons"    element={<Coupons />} />
        <Route path="banners"    element={<Banners />} />
        <Route path="reviews"    element={<Reviews />} />
        <Route path="categories" element={<Categories />} />
        <Route path="invoices"   element={<Invoices />} />

        {/* Catch-all redirects old deep links to dashboard */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
