import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { CartUIProvider } from './context/CartUIContext';
import { CartDrawer } from './components/cart/CartDrawer';
import { FloatingCartButton } from './components/cart/FloatingCartButton';
import { PageLoader } from './components/PageLoader';
import { useAuth } from './hooks/useAuth';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { ForgotPassword } from './pages/ForgotPassword';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { OrderDetail } from './pages/OrderDetail';
import { ProductDetail } from './pages/ProductDetail';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminOrders } from './pages/admin/Orders';
import { AdminOrderDetail } from './pages/admin/OrderDetail';
import { AdminProducts } from './pages/admin/Products';
import { AdminCatalog } from './pages/admin/Catalog';
import { AdminUsers } from './pages/admin/Users';
import { AdminAnalytics } from './pages/admin/Analytics';
import { AdminRoute } from './components/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { Login, Register } from './pages/Auth';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';

function AppContent() {
  const { isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return (
    <>
      <CartDrawer />
      <FloatingCartButton />
      <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="catalog" element={<AdminCatalog />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>
            </Route>
            </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CartUIProvider>
          <Router>
            <AppContent />
          </Router>
        </CartUIProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
