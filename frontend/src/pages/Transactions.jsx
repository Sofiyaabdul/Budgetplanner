import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Calendar,
  Tag,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { transactionService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const Transactions = () => {
  const { user } = useAuth();
  const currency = user?.currency || '$';

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState('all'); // all | income | expense
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState({
    totalIncomeSum: 0,
    totalExpenseSum: 0,
    netBalance: 0
  });

  // Details Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getAll();
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        type: typeFilter,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 15
      };

      const res = await transactionService.getAll(params);
      if (res.data.success) {
        setTransactions(res.data.transactions);
        setTotalPages(res.data.totalPages);
        setTotalRecords(res.data.totalRecords);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, search, startDate, endDate, sortBy, sortOrder, currentPage]);

  const handleOpenDetail = (tx) => {
    setSelectedTx(tx);
    setIsDetailModalOpen(true);
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
            Transaction History
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Centralized ledger of all financial activities, income streams, and expenditures
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Total Filtered Income
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }} className="tabular-nums">
            +{formatCurrency(summary.totalIncomeSum)}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Total Filtered Expenses
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.25rem' }} className="tabular-nums">
            -{formatCurrency(summary.totalExpenseSum)}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Net Ledger Cash Flow
          </div>
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: summary.netBalance >= 0 ? 'var(--color-accent)' : 'var(--color-danger)',
              marginTop: '0.25rem'
            }}
            className="tabular-nums"
          >
            {formatCurrency(summary.netBalance)}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
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
            placeholder="Search by title, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{ paddingLeft: '2.25rem' }}
          />
          <Search
            size={16}
            color="var(--color-text-light)"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeftRight size={16} color="var(--color-text-muted)" />
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Tag size={16} color="var(--color-text-muted)" />
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name} ({c.type})
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
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: 'auto', padding: '0.4rem 0.5rem' }}
            title="Start Date"
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>to</span>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
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
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary btn-icon"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {(search || typeFilter !== 'all' || categoryFilter !== 'All' || startDate || endDate) && (
          <button
            onClick={() => {
              setSearch('');
              setTypeFilter('all');
              setCategoryFilter('All');
              setStartDate('');
              setEndDate('');
              setCurrentPage(1);
            }}
            className="btn btn-ghost btn-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* Transactions Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ArrowLeftRight size={24} />
            </div>
            <p className="empty-state-title">No transactions match your search</p>
            <p className="empty-state-desc">Try clearing your filters or date range.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Transaction</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Method / Source</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr key={tx._id}>
                        <td>
                          <span className={`badge ${isIncome ? 'badge-success' : 'badge-danger'}`}>
                            {isIncome ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {tx.title}
                          </div>
                          {tx.description && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                maxWidth: '240px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {tx.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-neutral">{tx.category}</span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          {new Date(tx.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          {tx.methodOrSource || 'Standard'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className={`tabular-nums ${isIncome ? 'amount-income' : 'amount-expense'}`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenDetail(tx)}
                            className="btn btn-ghost btn-icon"
                            title="View Transaction Details"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination" style={{ padding: '0.875rem 1.25rem' }}>
              <div>
                Showing{' '}
                <strong>
                  {Math.min(totalRecords, (currentPage - 1) * 15 + 1)} -{' '}
                  {Math.min(totalRecords, currentPage * 15)}
                </strong>{' '}
                of <strong>{totalRecords}</strong> transaction(s)
              </div>

              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.25rem' }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span style={{ fontSize: '0.8125rem', padding: '0 0.5rem' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.25rem' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Transaction Details"
        footer={
          <button
            type="button"
            onClick={() => setIsDetailModalOpen(false)}
            className="btn btn-secondary"
          >
            Close
          </button>
        }
      >
        {selectedTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div>
                <span
                  className={`badge ${
                    selectedTx.type === 'income' ? 'badge-success' : 'badge-danger'
                  }`}
                  style={{ marginBottom: '0.35rem' }}
                >
                  {selectedTx.type.toUpperCase()}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  {selectedTx.title}
                </h3>
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: selectedTx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'
                }}
                className="tabular-nums"
              >
                {selectedTx.type === 'income' ? '+' : '-'}
                {formatCurrency(selectedTx.amount)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Category:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px' }}>
                  {selectedTx.category}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Date:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px' }}>
                  {new Date(selectedTx.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Method / Source:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px' }}>
                  {selectedTx.methodOrSource || 'Standard'}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Recorded On:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px' }}>
                  {new Date(selectedTx.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {selectedTx.description && (
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Notes / Description:</span>
                <div
                  style={{
                    backgroundColor: '#fafbfc',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '4px',
                    color: 'var(--color-text-main)',
                    lineHeight: 1.5
                  }}
                >
                  {selectedTx.description}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
