import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PieChart,
  Tags,
  Target,
  ArrowLeftRight,
  BarChart3,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, logout, unreadNotifications } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Income', path: '/income', icon: TrendingUp },
    { name: 'Expenses', path: '/expenses', icon: TrendingDown },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Savings Goals', path: '/savings', icon: Target },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : null
    },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  const closeMobile = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 35
          }}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand header */}
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <Wallet size={18} strokeWidth={2.2} />
            </div>
            {!collapsed && <span>PlanWise</span>}
          </div>

          <button
            className="sidebar-toggle-btn"
            style={{ display: window.innerWidth <= 768 ? 'none' : 'flex' }}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                title={collapsed ? item.name : undefined}
              >
                <Icon size={18} strokeWidth={2} />
                {!collapsed && <span>{item.name}</span>}
                {!collapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer profile & logout */}
        <div className="sidebar-footer">
          {!collapsed && user && (
            <div className="sidebar-user">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          )}

          <button
            className="nav-item btn-danger-ghost"
            style={{ width: '100%', border: 'none', textAlign: 'left' }}
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
