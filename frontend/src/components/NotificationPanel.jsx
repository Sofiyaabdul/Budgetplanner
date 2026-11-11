import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertTriangle, AlertCircle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { unreadNotifications, setUnreadNotifications } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll({ limit: 6 });
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadNotifications(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'danger':
        return <AlertCircle size={16} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'success':
        return <CheckCircle size={16} color="#10b981" />;
      default:
        return <Info size={16} color="#3b82f6" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: '0',
        width: '360px',
        maxWidth: '90vw',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-dropdown)',
        border: '1px solid var(--color-border)',
        zIndex: 50,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.875rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafbfc'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
            Notifications
          </span>
          {unreadNotifications > 0 && (
            <span className="badge badge-warning">{unreadNotifications} new</span>
          )}
        </div>
        {unreadNotifications > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', gap: '0.25rem' }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
            Loading alerts...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Bell size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>No notifications yet</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              You'll be alerted when spending reaches budget thresholds.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => {
                onClose();
                navigate('/notifications');
              }}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--color-border-subtle)',
                backgroundColor: n.isRead ? 'transparent' : 'rgba(13, 148, 136, 0.04)',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.75rem',
                transition: 'background-color 150ms ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = n.isRead ? 'transparent' : 'rgba(13, 148, 136, 0.04)')
              }
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>{getIcon(n.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: n.isRead ? 500 : 700,
                      color: 'var(--color-text-main)'
                    }}
                  >
                    {n.title}
                  </span>
                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n._id, e)}
                      title="Mark as read"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-accent)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  )}
                </div>
                <p
                  style={{
                    fontSize: '0.775rem',
                    color: 'var(--color-text-muted)',
                    marginTop: '2px',
                    lineHeight: 1.35
                  }}
                >
                  {n.message}
                </p>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: '4px', display: 'block' }}>
                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '0.625rem 1rem',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          backgroundColor: '#fafbfc'
        }}
      >
        <button
          onClick={() => {
            onClose();
            navigate('/notifications');
          }}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', fontSize: '0.8125rem', gap: '0.35rem' }}
        >
          View all notifications <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
