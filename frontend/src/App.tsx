import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { BrandProvider } from './contexts/BrandContext';
import { SiteMeta } from './components/site/SiteMeta';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { CatalogPage } from './pages/site/CatalogPage';
import { CartPage } from './pages/site/CartPage';
import { SiteSettingsPage } from './pages/settings/SiteSettingsPage';
import { SalesSettingsPage } from './pages/settings/SalesSettingsPage';
import { UserAgreementPage } from './pages/settings/UserAgreementPage';
import { DataExportsPage } from './pages/settings/DataExportsPage';
import { AgreementPage } from './pages/site/AgreementPage';
import { HowToOrderPage } from './pages/site/HowToOrderPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { QuickActionsPage } from './pages/home/QuickActionsPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { ContactsPage } from './pages/contacts/ContactsPage';
import { ContactDetailPage } from './pages/contacts/ContactDetailPage';
// Categories are now managed inside ProductsPage
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductDetailPage } from './pages/products/ProductDetailPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { StockPage } from './pages/stock/StockPage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { FinancialsPage } from './pages/financials/FinancialsPage';
import { UsersPage } from './pages/users/UsersPage';
import { MyAccountPage } from './pages/users/MyAccountPage';

// Protected Route Component – redirects unauthenticated users to /admin/login
const RouteSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <RouteSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <RouteSpinner />;
  if (user?.is_sales_consultant && !user.is_admin) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <RouteSpinner />;
  if (!user?.is_admin) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

// Admin Public Route Component – redirect already-authenticated users to the admin home
const AdminPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <RouteSpinner />;

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <BrandProvider>
        <SiteMeta />
        <Routes>
          {/* Public Landing Page – no auth required */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/urunler" element={<CatalogPage />} />
          <Route path="/sepet" element={<CartPage />} />
          <Route path="/sozlesme" element={<AgreementPage />} />
          <Route path="/nasil-siparis" element={<HowToOrderPage />} />

          {/* Admin sub-application routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <QuickActionsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin public routes (login, forgot-password) */}
          <Route
            path="/admin/login"
            element={
              <AdminPublicRoute>
                <LoginPage />
              </AdminPublicRoute>
            }
          />
          <Route
            path="/admin/forgot-password"
            element={
              <AdminPublicRoute>
                <ForgotPasswordPage />
              </AdminPublicRoute>
            }
          />

          {/* Admin protected routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers/:id"
            element={
              <ProtectedRoute>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contacts"
            element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contacts/:id"
            element={
              <ProtectedRoute>
                <ContactDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <StaffRoute><ProductsPage /></StaffRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products/:id"
            element={
              <ProtectedRoute>
                <StaffRoute><ProductDetailPage /></StaffRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute>
                <StaffRoute><PaymentsPage /></StaffRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stock"
            element={
              <ProtectedRoute>
                <StaffRoute><StockPage /></StaffRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/expenses"
            element={
              <ProtectedRoute>
                <StaffRoute><ExpensesPage /></StaffRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/financials"
            element={
              <ProtectedRoute>
                <StaffRoute><FinancialsPage /></StaffRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminRoute><UsersPage /></AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales-settings"
            element={
              <ProtectedRoute>
                <AdminRoute><SalesSettingsPage /></AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/site-settings"
            element={
              <ProtectedRoute>
                <AdminRoute><SiteSettingsPage /></AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sozlesme"
            element={
              <ProtectedRoute>
                <AdminRoute><UserAgreementPage /></AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/veriler"
            element={
              <ProtectedRoute>
                <AdminRoute><DataExportsPage /></AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/my-account"
            element={
              <ProtectedRoute>
                <MyAccountPage />
              </ProtectedRoute>
            }
          />

          {/* Backward compatibility: old /login redirects to /admin/login */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/admin/forgot-password" replace />} />

          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

          {/* Catch all other unknown routes → redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrandProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
