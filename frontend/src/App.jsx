import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import SavingsGoals from './pages/SavingsGoals';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

// App Layout with Sidebar and Navbar
const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Page Title mapping
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Financial Dashboard', subtitle: 'Real-time overview of cash flow, balance and budgets' };
      case '/income':
        return { title: 'Income Management', subtitle: 'Manage recurring salary, business revenues and inflows' };
      case '/expenses':
        return { title: 'Expense Management', subtitle: 'Track and audit daily expenditures across categories' };
      case '/budgets':
        return { title: 'Monthly Budgets', subtitle: 'Enforce category limits and avoid deficit spending' };
      case '/categories':
        return { title: 'Financial Categories', subtitle: 'Custom organization for revenue and expenditure tags' };
      case '/savings':
        return { title: 'Savings Goals', subtitle: 'Track milestones, contributions and financial targets' };
      case '/transactions':
        return { title: 'Transaction Ledger', subtitle: 'Comprehensive searchable history of all movements' };
      case '/reports':
        return { title: 'Analytics & Reports', subtitle: 'Detailed visual breakdown and exported ledgers' };
      case '/notifications':
        return { title: 'Alerts & Notifications', subtitle: 'Automated threshold warnings and achievement logs' };
      case '/profile':
        return { title: 'Account Profile', subtitle: 'Manage identity settings and security preferences' };
      default:
        return { title: 'Budget Planning System', subtitle: 'Personal Finance Platform' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="app-container">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={`main-wrapper ${collapsed ? 'expanded' : ''}`}>
        <Navbar
          title={title}
          subtitle={subtitle}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main>{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Financial Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/income"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Income />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Expenses />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Budgets />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Categories />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/savings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SavingsGoals />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Transactions />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Notifications />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
