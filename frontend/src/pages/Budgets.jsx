import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  ArrowRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { budgetService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const Budgets = () => {
  const { user, refreshNotifications } = useAuth();
  const currency = user?.currency || '$';

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    totalAllocated: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallUtilization: 0
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'Food',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  const years = [2024, 2025, 2026, 2027, 2028];

  // Fetch expense categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getAll({ type: 'expense' });
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch budgets
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await budgetService.getAll({
        month: selectedMonth,
        year: selectedYear
      });
      if (res.data.success) {
        setBudgets(res.data.budgets);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      amount: '',
      category: categories[0]?.name || 'Food',
      month: selectedMonth,
      year: selectedYear,
      description: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingId(b._id);
    setFormData({
      name: b.name,
      amount: b.amount,
      category: b.category,
      month: b.month,
      year: b.year,
      description: b.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetService.delete(id);
        fetchBudgets();
        refreshNotifications();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete budget');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.amount || !formData.category) {
      setFormError('Please fill in name, amount, and category');
      return;
    }

    if (Number(formData.amount) <= 0) {
      setFormError('Budget limit must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await budgetService.update(editingId, formData);
      } else {
        await budgetService.create(formData);
      }
      setIsModalOpen(false);
      fetchBudgets();
      refreshNotifications();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Error saving budget plan'
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            Monthly Budget Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Set category spending limits, track utilization, and enforce financial discipline
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--color-text-muted)" />
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> Create Budget
          </button>
        </div>
      </div>

      {/* Monthly Summary Statistics Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Allocated
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem' }} className="tabular-nums">
            {formatCurrency(summary.totalAllocated)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Across {budgets.length} category limit(s)
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Spent
          </div>
          <div
            style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--color-danger)' }}
            className="tabular-nums"
          >
            {formatCurrency(summary.totalSpent)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Actual expenses in budgeted categories
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Remaining Buffer
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginTop: '0.35rem',
              color: summary.totalRemaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
            }}
            className="tabular-nums"
          >
            {formatCurrency(summary.totalRemaining)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {summary.totalRemaining >= 0 ? 'Remaining funds to spend' : 'Over budget total deficit'}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Overall Utilization
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginTop: '0.35rem',
              color:
                summary.overallUtilization > 100
                  ? 'var(--color-danger)'
                  : summary.overallUtilization >= 80
                  ? 'var(--color-warning)'
                  : 'var(--color-success)'
            }}
            className="tabular-nums"
          >
            {summary.overallUtilization}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {summary.overallUtilization <= 80 ? 'Safe limit' : summary.overallUtilization <= 100 ? 'Warning threshold' : 'Exceeded'}
          </div>
        </div>
      </div>

      {/* Legend Indicators */}
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
          marginBottom: '1rem',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)'
        }}
      >
        <span>Status Legend:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
          <span>Safe (&lt; 80%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
          <span>Warning (80% - 100%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
          <span>Exceeded (&gt; 100%)</span>
        </div>
      </div>

      {/* Budgets Grid Cards */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading monthly budgets...
        </div>
      ) : budgets.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <PieChart size={24} />
          </div>
          <p className="empty-state-title">No budgets established for this month</p>
          <p className="empty-state-desc">
            Define targeted monthly spending allowances for Food, Transportation, Shopping, and more.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus size={15} /> Create Budget
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {budgets.map((b) => {
            const isExceeded = b.status === 'exceeded';
            const isWarning = b.status === 'warning';

            return (
              <div key={b._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {b.name}
                      </h3>
                      <span className="badge badge-neutral">{b.category}</span>
                    </div>
                    {b.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        {b.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="btn btn-ghost btn-icon"
                      title="Edit Budget"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="btn btn-danger-ghost btn-icon"
                      title="Delete Budget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      Utilization: {b.utilization}%
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: isExceeded ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : 'var(--color-success)'
                      }}
                    >
                      {isExceeded ? 'Exceeded' : isWarning ? 'Approaching Limit' : 'On Track'}
                    </span>
                  </div>

                  <div className="progress-bar-container" style={{ height: '10px' }}>
                    <div
                      className={`progress-bar-fill ${b.status}`}
                      style={{ width: `${Math.min(100, b.utilization)}%` }}
                    />
                  </div>
                </div>

                {/* Financial breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Allocated</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }} className="tabular-nums">
                      {formatCurrency(b.amount)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Spent</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-danger)' }} className="tabular-nums">
                      {formatCurrency(b.spent)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {b.remaining >= 0 ? 'Remaining' : 'Over Budget'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: b.remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                      }}
                      className="tabular-nums"
                    >
                      {formatCurrency(Math.abs(b.remaining))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Monthly Budget' : 'Create Monthly Budget'}
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
              {submitting ? 'Saving...' : editingId ? 'Update Budget' : 'Create Budget'}
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
            <label className="form-label" htmlFor="budget-name">
              Budget Name <span className="required">*</span>
            </label>
            <input
              id="budget-name"
              type="text"
              className="form-input"
              placeholder="e.g. Monthly Grocery Cap, Commute Allowance"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="budget-amount">
                Budget Limit ({currency}) <span className="required">*</span>
              </label>
              <input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="500.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="budget-category">
                Expense Category <span className="required">*</span>
              </label>
              <select
                id="budget-category"
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Food">Food</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Housing">Housing</option>
                    <option value="Bills and Utilities">Bills and Utilities</option>
                    <option value="Travel">Travel</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Other Expenses">Other Expenses</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="budget-month">
                Month <span className="required">*</span>
              </label>
              <select
                id="budget-month"
                className="form-select"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="budget-year">
                Year <span className="required">*</span>
              </label>
              <select
                id="budget-year"
                className="form-select"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="budget-description">
              Notes / Guidelines (Optional)
            </label>
            <textarea
              id="budget-description"
              className="form-textarea"
              rows="3"
              placeholder="Spending guidelines or savings target note..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;
