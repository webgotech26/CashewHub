import { Routes, Route, Navigate } from 'react-router-dom';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Guards & Layout
import ProtectedRoute  from './components/ProtectedRoute';
import AdminLayout     from './components/AdminLayout';
import CustomerLayout  from './pages/customer/CustomerLayout';
import ProductCatalog  from './pages/customer/ProductCatalog';
import Checkout        from './pages/customer/Checkout';
import MyOrders        from './pages/customer/MyOrders';

// Admin ERP modules
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

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"          element={<Navigate to="/login" replace />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/register"  element={<Register />} />

      {/* Customer routes — under /home with shared shop layout */}
      <Route path="/home" element={
        <ProtectedRoute>
          <CustomerLayout />
        </ProtectedRoute>
      }>
        <Route index            element={<ProductCatalog />} />
        <Route path="checkout"  element={<Checkout />} />
        <Route path="orders"    element={<MyOrders />} />
      </Route>

      {/* Admin ERP — all nested under /admin with shared layout */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout />
        </ProtectedRoute>
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

      {/* Legacy redirect from old dashboard URL */}
      <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
