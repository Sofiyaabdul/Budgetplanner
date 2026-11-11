import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  DollarSign,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  LogOut,
  Calendar
} from 'lucide-react';
import { profileService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || '$');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCurrency(user.currency || '$');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('Full name cannot be empty');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await profileService.updateProfile({ name, currency });
      if (res.data.success) {
        updateUser(res.data.user);
        setProfileSuccess('Profile details saved successfully!');
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await profileService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      if (res.data.success) {
        setPasswordSuccess('Your password has been updated securely.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page-content" style={{ maxWidth: '840px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            User Account & Profile
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Manage identity, security credentials, and system currency preferences
          </p>
        </div>

        <button onClick={handleLogout} className="btn btn-danger-ghost btn-sm">
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* Account Overview Summary Card */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.5rem'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            flexShrink: 0
          }}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            {user?.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Mail size={14} color="var(--color-text-muted)" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {user?.email}
            </span>
          </div>
          {user?.createdAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Calendar size={14} color="var(--color-text-light)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                Member since {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 1. Personal Information */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>
          <User size={18} /> Personal Information
        </h3>

        {profileSuccess && (
          <div className="alert-banner success">
            <CheckCircle size={16} />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="alert-banner danger">
            <AlertCircle size={16} />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="user-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="user-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="user-email">
                Email Address
              </label>
              <input
                id="user-email"
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                title="Email address cannot be changed"
              />
              <span className="form-hint">Email address cannot be modified</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user-currency">
              Display Currency
            </label>
            <select
              id="user-currency"
              className="form-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ maxWidth: '300px' }}
            >
              <option value="$">$ - US Dollar (USD)</option>
              <option value="€">€ - Euro (EUR)</option>
              <option value="£">£ - British Pound (GBP)</option>
              <option value="₹">₹ - Indian Rupee (INR)</option>
              <option value="¥">¥ - Japanese Yen (JPY)</option>
              <option value="A$">A$ - Australian Dollar (AUD)</option>
              <option value="C$">C$ - Canadian Dollar (CAD)</option>
            </select>
            <span className="form-hint">Applies to all charts, tables, and budget summaries</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={profileLoading}
            style={{ marginTop: '0.5rem' }}
          >
            <Save size={15} /> {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* 2. Security & Password Change */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>
          <Lock size={18} /> Change Password
        </h3>

        {passwordSuccess && (
          <div className="alert-banner success">
            <CheckCircle size={16} />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="alert-banner danger">
            <AlertCircle size={16} />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="current-pass">
              Current Password <span className="required">*</span>
            </label>
            <input
              id="current-pass"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-pass">
                New Password <span className="required">*</span>
              </label>
              <input
                id="new-pass"
                type="password"
                className="form-input"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pass">
                Confirm New Password <span className="required">*</span>
              </label>
              <input
                id="confirm-pass"
                type="password"
                className="form-input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-navy"
            disabled={passwordLoading}
            style={{ marginTop: '0.5rem' }}
          >
            <Shield size={15} /> {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
