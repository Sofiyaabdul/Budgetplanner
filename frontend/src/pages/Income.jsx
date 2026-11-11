import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Tag,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react';
import { incomeService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const Income = () => {
  const { user } = useAuth();
  const currency = user?.currency || '$';

  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Salary',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentSource: 'Bank Transfer'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getAll({ type: 'income' });
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to load income categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch income records
  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder
      };
      const res = await incomeService.getAll(params);
      if (res.data.success) {
        setIncomes(res.data.incomes);
        setTotalAmount(res.data.totalAmount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch income records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [search, categoryFilter, startDate, endDate, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      amount: '',
      category: categories[0]?.name || 'Salary',
      date: new Date().toISOString().split('T')[0],
      description: '',
      paymentSource: 'Bank Transfer'
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
      description: item.description || '',
      paymentSource: item.paymentSource || 'Bank Transfer'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income record?')) {
      try {
        await incomeService.delete(id);
        fetchIncomes();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete income record');
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
      if (editingId) {
        await incomeService.update(editingId, formData);
      } else {
        await incomeService.create(formData);
      }
      setIsModalOpen(false);
      fetchIncomes();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Error saving income record'
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
            Income Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Record, categorize, and monitor all cash inflows
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Record Income
        </button>
      </div>

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
          borderLeft: '4px solid var(--color-success)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Total Filtered Inflows
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

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Showing <strong>{incomes.length}</strong> record(s)
        </div>
      </div>

      {/* Filter and Search Bar */}
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
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by title or description..."
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

        {/* Category Filter */}
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

        {(search || categoryFilter !== 'All' || startDate || endDate) && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
              setStartDate('');
              setEndDate('');
            }}
            className="btn btn-ghost btn-sm"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading income records...
          </div>
        ) : incomes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <TrendingUp size={24} />
            </div>
            <p className="empty-state-title">No income records found</p>
            <p className="empty-state-desc">
              Get started by recording your first paycheck, business revenue, or investment return.
            </p>
            <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
              <Plus size={15} /> Record Income
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Income Title</th>
                  <th>Category</th>
                  <th>Date Received</th>
                  <th>Payment Source</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((item) => (
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
                      <span className="badge badge-success">{item.category}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {item.paymentSource || 'Bank Transfer'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="tabular-nums amount-income">
                        +{formatCurrency(item.amount)}
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
        title={editingId ? 'Edit Income Record' : 'Record New Income'}
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
              {submitting ? 'Saving...' : editingId ? 'Update Income' : 'Record Income'}
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
            <label className="form-label" htmlFor="title">
              Income Title <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g. Monthly Salary, Freelance Web App"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Amount ({currency}) <span className="required">*</span>
              </label>
              <input
                id="amount"
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
              <label className="form-label" htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
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
                    <option value="Salary">Salary</option>
                    <option value="Business">Business</option>
                    <option value="Freelancing">Freelancing</option>
                    <option value="Investments">Investments</option>
                    <option value="Rental Income">Rental Income</option>
                    <option value="Other Income">Other Income</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="date">
                Date Received <span className="required">*</span>
              </label>
              <input
                id="date"
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="paymentSource">
                Payment Source
              </label>
              <select
                id="paymentSource"
                className="form-select"
                value={formData.paymentSource}
                onChange={(e) => setFormData({ ...formData, paymentSource: e.target.value })}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Direct Deposit">Direct Deposit</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="PayPal">PayPal</option>
                <option value="Stripe">Stripe</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description (Optional)
            </label>
            <textarea
              id="description"
              className="form-textarea"
              rows="3"
              placeholder="Additional notes about this income stream..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Income;
