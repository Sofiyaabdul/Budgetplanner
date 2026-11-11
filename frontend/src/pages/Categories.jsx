import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  AlertCircle,
  FolderPlus
} from 'lucide-react';
import { categoryService, reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const Categories = () => {
  const { user } = useAuth();
  const currency = user?.currency || '$';

  const [activeTab, setActiveTab] = useState('expense'); // expense | income
  const [categories, setCategories] = useState([]);
  const [categoryReport, setCategoryReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#0d9488',
    icon: 'Tag'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const colors = [
    '#0d9488',
    '#f59e0b',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#10b981',
    '#f97316',
    '#0ea5e9',
    '#6366f1',
    '#64748b'
  ];

  const fetchCategoriesAndReport = async () => {
    try {
      setLoading(true);
      const [catRes, reportRes] = await Promise.all([
        categoryService.getAll({ type: activeTab }),
        reportService.getCategories({ period: 'monthly' })
      ]);

      if (catRes.data.success) {
        setCategories(catRes.data.categories);
      }
      if (reportRes.data.success) {
        setCategoryReport(reportRes.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndReport();
  }, [activeTab]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: activeTab,
      color: activeTab === 'income' ? '#10b981' : '#f59e0b',
      icon: 'Tag'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c._id);
    setFormData({
      name: c.name,
      type: c.type,
      color: c.color || '#0d9488',
      icon: c.icon || 'Tag'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await categoryService.delete(id);
        fetchCategoriesAndReport();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name) {
      setFormError('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await categoryService.update(editingId, {
          name: formData.name,
          color: formData.color,
          icon: formData.icon
        });
      } else {
        await categoryService.create(formData);
      }
      setIsModalOpen(false);
      fetchCategoriesAndReport();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Error saving category'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Match spending statistics with categories
  const spendingList =
    activeTab === 'expense'
      ? categoryReport?.expenseCategories || []
      : categoryReport?.incomeCategories || [];

  const spendingMap = {};
  spendingList.forEach((item) => {
    spendingMap[item.category] = item;
  });

  const formatCurrency = (val) => {
    return `${currency}${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
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
            Category Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Classify and organize cash flows with custom tags and visual badges
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '1.5rem'
        }}
      >
        <button
          onClick={() => setActiveTab('expense')}
          style={{
            padding: '0.625rem 1.25rem',
            borderBottom: activeTab === 'expense' ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: activeTab === 'expense' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <TrendingDown size={16} /> Expense Categories
        </button>
        <button
          onClick={() => setActiveTab('income')}
          style={{
            padding: '0.625rem 1.25rem',
            borderBottom: activeTab === 'income' ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: activeTab === 'income' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <TrendingUp size={16} /> Income Categories
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Tags size={24} />
          </div>
          <p className="empty-state-title">No categories found</p>
          <p className="empty-state-desc">Create custom categories to organize your transactions.</p>
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus size={15} /> Add Category
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {categories.map((c) => {
            const stats = spendingMap[c.name];
            return (
              <div
                key={c._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  borderTop: `3px solid ${c.color || '#0d9488'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: c.color || '#0d9488'
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                      {c.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="btn btn-ghost btn-icon"
                      title="Edit Category"
                    >
                      <Edit size={14} />
                    </button>
                    {!c.isDefault && (
                      <button
                        onClick={() => handleDelete(c._id, c.name)}
                        className="btn btn-danger-ghost btn-icon"
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem'
                  }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>This Month:</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: activeTab === 'income' ? 'var(--color-success)' : 'var(--color-text-main)'
                    }}
                    className="tabular-nums"
                  >
                    {stats ? formatCurrency(stats.total) : `${currency}0.00`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>{stats?.count || 0} transaction(s)</span>
                  <span>{c.isDefault ? 'Default Category' : 'Custom Category'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Category' : 'Create New Category'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="alert-banner danger" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="cat-name">
              Category Name <span className="required">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              className="form-input"
              placeholder="e.g. Subscriptions, Fitness, Pet Care"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {!editingId && (
            <div className="form-group">
              <label className="form-label" htmlFor="cat-type">
                Category Type <span className="required">*</span>
              </label>
              <select
                id="cat-type"
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="expense">Expense Category</option>
                <option value="income">Income Category</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Color Indicator</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {colors.map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: clr })}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: clr,
                    border: formData.color === clr ? '3px solid #0f172a' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
