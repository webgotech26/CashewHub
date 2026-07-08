# CashewHub Monorepo Migration Guide

## Current state: D:\Cashew\client  (single combined app)
## Target state:  D:\Cashew\client-customer + D:\Cashew\client-admin

---

## Files to copy into client-customer/src/

### Pages
```
client/src/pages/Login.jsx              → client-customer/src/pages/Login.jsx
client/src/pages/Register.jsx           → client-customer/src/pages/Register.jsx
client/src/pages/customer/*             → client-customer/src/pages/customer/*
```

### Components
```
client/src/components/CartDrawer.jsx    → client-customer/src/components/
client/src/components/ProductGrid.jsx   → client-customer/src/components/
client/src/components/ProtectedRoute.jsx→ client-customer/src/components/
client/src/components/SplashScreen.jsx  → client-customer/src/components/
client/src/components/WhatsAppButton.jsx→ client-customer/src/components/
```

### Context / Styles / Services
```
client/src/context/CartContext.jsx      → client-customer/src/context/
client/src/styles/                      → client-customer/src/styles/
client/src/index.css                    → client-customer/src/
client/src/main.jsx                     → client-customer/src/main.jsx  (edit App import)
```

### App.jsx (customer-only version)
Create client-customer/src/App.jsx with only /home/* routes.

---

## Files to copy into client-admin/src/

### Pages
```
client/src/pages/Login.jsx              → client-admin/src/pages/Login.jsx  (admin-only)
client/src/pages/admin/*                → client-admin/src/pages/admin/*
```

### Components
```
client/src/components/AdminLayout.jsx   → client-admin/src/components/
client/src/components/AddProductForm.jsx→ client-admin/src/components/
(already created) ProtectedAdminRoute   → client-admin/src/components/
```

### Styles / Services
```
client/src/styles/components/adminLayout.css → client-admin/src/styles/
client/src/styles/pages/inventory.css        → client-admin/src/styles/
client/src/index.css                         → client-admin/src/
client/src/main.jsx                          → client-admin/src/main.jsx  (edit App import)
```

---

## Import path updates required after move

In every admin page (client-admin/src/pages/admin/*.jsx):
  ../../services/api      → stays same (already relative)
  ../../components/...    → stays same

In every customer page (client-customer/src/pages/customer/*.jsx):
  ../../services/api      → stays same
  ../../context/CartContext → stays same

---

## Key principle
The monorepo split is a COPY operation, not a DELETE.
Keep client/ working until both new apps build and deploy successfully.
Only then archive client/.
