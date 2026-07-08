/**
 * client-admin/src/App.jsx
 * Admin ERP — all admin routes, protected by role=admin.
 * Runs on port 3001.
 */
import { Routes, Route, Navigate } from 'react-router-dom';

import Login               from './pages/Login';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminLayout         from './components/AdminLayout';

// Admin pages (copy from client/src/pages/admin/)
import AdminDashboard from './pages/admin/AdminDashboard';
import Products       from './pages/admin/Products';
import Categories     from './pages/admin/Categories';
import Stock          from './pages/admin/Stock';
import Inventory      from './pages/admin/Inventory';
import Orders         from './pages/admin/Orders';
import Customers      from './pages/admin/Customers';
import Purchases      from './pages/admin/Purchases';
import Suppliers      from './pages/admin/Suppliers';
import Delivery       from './pages/admin/Delivery';
import Returns        from './pages/admin/Returns';
import Coupons        from './pages/admin/Coupons';
import Banners        from './pages/admin/Banners';
import Reviews        from './pages/admin/Reviews';
import Invoices       from './pages/admin/Invoices';
import Reports        from './pages/admin/Reports';
import AuditLogs      from './pages/admin/AuditLogs';
import AdminUsers     from './pages/admin/AdminUsers';

export default function App() {
  return (
    <Routes>
      {/* Admin login — only accepts admin credentials */}
      <Route path="/"      element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* All admin routes — role=admin required */}
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminLayout />
        </ProtectedAdminRoute>
      }>
        <Route index                element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<AdminDashboard />} />
        <Route path="products"      element={<Products />} />
        <Route path="categories"    element={<Categories />} />
        <Route path="stock"         element={<Stock />} />
        <Route path="inventory"     element={<Inventory />} />
        <Route path="orders"        element={<Orders />} />
        <Route path="customers"     element={<Customers />} />
        <Route path="purchases"     element={<Purchases />} />
        <Route path="suppliers"     element={<Suppliers />} />
        <Route path="delivery"      element={<Delivery />} />
        <Route path="returns"       element={<Returns />} />
        <Route path="coupons"       element={<Coupons />} />
        <Route path="banners"       element={<Banners />} />
        <Route path="reviews"       element={<Reviews />} />
        <Route path="invoices"      element={<Invoices />} />
        <Route path="reports"       element={<Reports />} />
        <Route path="audit-logs"    element={<AuditLogs />} />
        <Route path="admins"        element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
