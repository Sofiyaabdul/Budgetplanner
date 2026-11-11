import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Filter
} from 'lucide-react';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const { unreadNotifications, setUnreadNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll({
        unreadOnly: unreadOnly ? 'true' : undefined,
        limit: 100
      });
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadNotifications(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id) => {
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

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'danger':
        return <AlertCircle size={18} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'success':
        return <CheckCircle size={18} color="#10b981" />;
      default:
        return <Info size={18} color="#3b82f6" />;
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: '900px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              Notifications & Budget Alerts
            </h2>
            {unreadNotifications > 0 && (
              <span className="badge badge-warning">{unreadNotifications} unread</span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Real-time threshold triggers, spending warnings, and goal achievements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`btn btn-sm ${unreadOnly ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter size={14} /> {unreadOnly ? 'Showing Unread' : 'Filter Unread'}
          </button>
          {unreadNotifications > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-navy btn-sm">
              <CheckCheck size={14} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading notification stream...
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Bell size={24} />
            </div>
            <p className="empty-state-title">No notifications found</p>
            <p className="empty-state-desc">
              When your expenses cross 80% or exceed budget allocations, alert notifications will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  backgroundColor: n.isRead ? 'transparent' : 'rgba(13, 148, 136, 0.03)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'background-color 150ms ease'
                }}
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>{getIcon(n.type)}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: n.isRead ? 600 : 700,
                          color: 'var(--color-text-main)'
                        }}
                      >
                        {n.title}
                      </span>
                      {!n.isRead && <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>New</span>}
                      {n.threshold && n.threshold !== 'none' && (
                        <span
                          className={`badge ${
                            n.threshold === 'exceeded'
                              ? 'badge-danger'
                              : n.threshold === '100'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {n.threshold === 'exceeded' ? 'Exceeded' : `${n.threshold}% Threshold`}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-muted)',
                      marginTop: '0.35rem',
                      lineHeight: 1.45
                    }}
                  >
                    {n.message}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="btn btn-ghost btn-icon"
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="btn btn-danger-ghost btn-icon"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
