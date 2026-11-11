import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Tag,
  Trash2,
  Edit,
  AlertCircle,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { expenseService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const Expenses = () => {
  const { user, refreshNotifications } = useAuth();
  const currency = user?.currency || '$';

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Credit Card',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [budgetAlertNotice, setBudgetAlertNotice] = useState(null);

  // Fetch expense categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getAll({ type: 'expense' });
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to load expense categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        paymentMethod: paymentMethodFilter !== 'All' ? paymentMethodFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: minAmount || undefined,
        maxAmount: maxAmount || undefined,
        sortBy,
        sortOrder
      };
      const res = await expenseService.getAll(params);
      if (res.data.success) {
        setExpenses(res.data.expenses);
        setTotalAmount(res.data.totalAmount || 0);
        setCategoryBreakdown(res.data.categoryBreakdown || []);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter, paymentMethodFilter, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      amount: '',
      category: categories[0]?.name || 'Food',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Credit Card',
      description: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: new Date(item.date).toISOString().split('T')[0],
      paymentMethod: item.paymentMethod || 'Credit Card',
      description: item.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      try {
        await expenseService.delete(id);
        fetchExpenses();
        refreshNotifications();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete expense record');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title || !formData.amount || !formData.category) {
      setFormError('Please fill in title, amount, and category');
      return;
    }

    if (Number(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (editingId) {
        res = await expenseService.update(editingId, formData);
      } else {
        res = await expenseService.create(formData);
      }

      if (res.data.budgetStatus?.threshold) {
        setBudgetAlertNotice({
          threshold: res.data.budgetStatus.threshold,
          category: formData.category,
          spent: res.data.budgetStatus.totalSpent,
          budget: res.data.budgetStatus.budget?.amount
        });
      }

      setIsModalOpen(false);
      fetchExpenses();
      refreshNotifications();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Error recording expense'
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
      {/* Top Header */}
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
            Expense Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Track, filter, and audit every expenditure in real time
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-navy">
          <Plus size={16} /> Record Expense
        </button>
      </div>

      {/* Budget Alert Notice if triggered recently */}
      {budgetAlertNotice && (
        <div
          className={`alert-banner ${
            budgetAlertNotice.threshold === 'exceeded' ? 'danger' : 'warning'
          }`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>
              <strong>Budget Notice:</strong> {budgetAlertNotice.category} spending is now at{' '}
              {formatCurrency(budgetAlertNotice.spent)} of {formatCurrency(budgetAlertNotice.budget)}{' '}
              ({budgetAlertNotice.threshold === 'exceeded' ? 'Budget Exceeded!' : 'Threshold Alert'}).
            </span>
          </div>
          <button
            onClick={() => setBudgetAlertNotice(null)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid var(--color-danger)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingDown size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Total Filtered Outflows
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-main)'
              }}
              className="tabular-nums"
            >
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>

        {categoryBreakdown.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categoryBreakdown.slice(0, 3).map((cb) => (
              <span key={cb._id} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                {cb._id}: {formatCurrency(cb.total)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search and Advanced Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.25rem',
          padding: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
          <Search
            size={16}
            color="var(--color-text-light)"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Tag size={16} color="var(--color-text-muted)" />
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CreditCard size={16} color="var(--color-text-muted)" />
          <select
            className="form-select"
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="Digital Wallet">Digital Wallet</option>
            <option value="Check">Check</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Date Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={16} color="var(--color-text-muted)" />
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.5rem' }}
            title="Start Date"
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>to</span>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.5rem' }}
            title="End Date"
          />
        </div>

        {/* Min / Max Amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <input
            type="number"
            className="form-input"
            placeholder="Min $"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            style={{ width: '75px', padding: '0.4rem 0.5rem' }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>-</span>
          <input
            type="number"
            className="form-input"
            placeholder="Max $"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            style={{ width: '75px', padding: '0.4rem 0.5rem' }}
          />
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowUpDown size={16} color="var(--color-text-muted)" />
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="title">Title</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary btn-icon"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {(search || categoryFilter !== 'All' || paymentMethodFilter !== 'All' || startDate || endDate || minAmount || maxAmount) && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
              setPaymentMethodFilter('All');
              setStartDate('');
              setEndDate('');
              setMinAmount('');
              setMaxAmount('');
            }}
            className="btn btn-ghost btn-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading expense records...
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <TrendingDown size={24} />
            </div>
            <p className="empty-state-title">No expense records found</p>
            <p className="empty-state-desc">
              Keep your finances organized by recording your groceries, bills, travel, and shopping.
            </p>
            <button onClick={handleOpenAdd} className="btn btn-navy btn-sm">
              <Plus size={15} /> Record Expense
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Expense Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {item.title}
                      </div>
                      {item.description && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            maxWidth: '260px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-warning">{item.category}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {item.paymentMethod || 'Cash'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="tabular-nums amount-expense">
                        -{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-ghost btn-icon"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="btn btn-danger-ghost btn-icon"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Expense Record' : 'Record New Expense'}
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
              className="btn btn-navy"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingId ? 'Update Expense' : 'Record Expense'}
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
            <label className="form-label" htmlFor="expense-title">
              Expense Title <span className="required">*</span>
            </label>
            <input
              id="expense-title"
              type="text"
              className="form-input"
              placeholder="e.g. Whole Foods Groceries, Electric Bill"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="expense-amount">
                Amount ({currency}) <span className="required">*</span>
              </label>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-category">
                Category <span className="required">*</span>
              </label>
              <select
                id="expense-category"
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
              <label className="form-label" htmlFor="expense-date">
                Transaction Date <span className="required">*</span>
              </label>
              <input
                id="expense-date"
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-paymentMethod">
                Payment Method
              </label>
              <select
                id="expense-paymentMethod"
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Digital Wallet">Digital Wallet</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="expense-desc">
              Description (Optional)
            </label>
            <textarea
              id="expense-desc"
              className="form-textarea"
              rows="3"
              placeholder="Notes, store location, invoice details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
