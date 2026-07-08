/**
 * client-customer/src/App.jsx
 * Customer storefront — public + protected customer routes only.
 * No admin routes. Runs on port 3000.
 */
import { Routes, Route, Navigate } from 'react-router-dom';

import Login         from './pages/Login';
import Register      from './pages/Register';
import ProtectedRoute from './Components/ProtectedRoute';
import CustomerLayout from './pages/customer/CustomerLayout';

// Customer pages
import HomePage      from './pages/customer/HomePage';
import ShopPage      from './pages/customer/ShopPage';
import AboutPage     from './pages/customer/AboutPage';
import ProcessingPage from './pages/customer/ProcessingPage';
import ContactPage   from './pages/customer/ContactPage';
import Checkout      from './pages/customer/Checkout';
import MyOrders      from './pages/customer/MyOrders';

export default function App() {
  return (
    <Routes>
      {/* Public auth */}
      <Route path="/"         element={<Navigate to="/home" replace />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public storefront (no login required to browse) */}
      <Route path="/home" element={<CustomerLayout />}>
        <Route index             element={<HomePage />} />
        <Route path="shop"       element={<ShopPage />} />
        <Route path="about"      element={<AboutPage />} />
        <Route path="processing" element={<ProcessingPage />} />
        <Route path="contact"    element={<ContactPage />} />

        {/* Protected — login required */}
        <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="orders"   element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
