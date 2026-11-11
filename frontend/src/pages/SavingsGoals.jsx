import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Trophy,
  History,
  Trash2,
  Edit,
  ArrowRight,
  AlertCircle,
  PiggyBank
} from 'lucide-react';
import { savingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const SavingsGoals = () => {
  const { user, refreshNotifications } = useAuth();
  const currency = user?.currency || '$';

  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({
    totalTarget: 0,
    totalSaved: 0,
    totalRemaining: 0,
    overallProgress: 0,
    completedCount: 0,
    activeCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalFormData, setGoalFormData] = useState({
    goalName: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: ''
  });

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [depositFormData, setDepositFormData] = useState({
    amount: '',
    transactionType: 'deposit',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [goalTransactions, setGoalTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formError, setFormError] = useState('');
  const [congratsMessage, setCongratsMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await savingsService.getAll();
      if (res.data.success) {
        setGoals(res.data.goals);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenAddGoal = () => {
    setEditingGoalId(null);
    setGoalFormData({
      goalName: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: ''
    });
    setFormError('');
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (goal) => {
    setEditingGoalId(goal._id);
    setGoalFormData({
      goalName: goal.goalName,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
      description: goal.description || ''
    });
    setFormError('');
    setIsGoalModalOpen(true);
  };

  const handleOpenDeposit = (goal) => {
    setSelectedGoal(goal);
    setDepositFormData({
      amount: '',
      transactionType: 'deposit',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setFormError('');
    setIsDepositModalOpen(true);
  };

  const handleOpenHistory = async (goal) => {
    setSelectedGoal(goal);
    setIsHistoryModalOpen(true);
    try {
      setHistoryLoading(true);
      const res = await savingsService.getTransactions(goal._id);
      if (res.data.success) {
        setGoalTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this savings goal and its history?')) {
      try {
        await savingsService.delete(id);
        fetchGoals();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete savings goal');
      }
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!goalFormData.goalName || !goalFormData.targetAmount || !goalFormData.targetDate) {
      setFormError('Please fill in goal name, target amount, and target date');
      return;
    }

    if (Number(goalFormData.targetAmount) <= 0) {
      setFormError('Target amount must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      if (editingGoalId) {
        await savingsService.update(editingGoalId, goalFormData);
      } else {
        await savingsService.create(goalFormData);
      }
      setIsGoalModalOpen(false);
      fetchGoals();
      refreshNotifications();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Error saving goal'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!depositFormData.amount || Number(depositFormData.amount) <= 0) {
      setFormError('Please enter a valid amount greater than zero');
      return;
    }

    if (
      depositFormData.transactionType === 'withdrawal' &&
      Number(depositFormData.amount) > selectedGoal.currentAmount
    ) {
      setFormError(`Cannot withdraw more than current saved amount (${formatCurrency(selectedGoal.currentAmount)})`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await savingsService.addTransaction(selectedGoal._id, depositFormData);
      if (res.data.newlyCompleted) {
        setCongratsMessage(res.data.message);
      }
      setIsDepositModalOpen(false);
      fetchGoals();
      refreshNotifications();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Error recording transaction'
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
            Savings Goal Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Establish targets, schedule contributions, and visualize financial milestones
          </p>
        </div>

        <button onClick={handleOpenAddGoal} className="btn btn-primary">
          <Plus size={16} /> New Savings Goal
        </button>
      </div>

      {/* Congratulatory Alert */}
      {congratsMessage && (
        <div
          className="alert-banner success"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={20} color="#10b981" />
            <span>
              <strong>Milestone Achieved!</strong> {congratsMessage}
            </span>
          </div>
          <button onClick={() => setCongratsMessage('')} className="btn btn-ghost btn-sm">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Statistics Banner */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Target
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem' }} className="tabular-nums">
            {formatCurrency(summary.totalTarget)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Cumulative target across {goals.length} goal(s)
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Saved
          </div>
          <div
            style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--color-accent)' }}
            className="tabular-nums"
          >
            {formatCurrency(summary.totalSaved)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Funds currently deposited
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Remaining Required
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem' }} className="tabular-nums">
            {formatCurrency(summary.totalRemaining)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            To reach 100% target
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Completion Rate
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginTop: '0.35rem',
              color: 'var(--color-success)'
            }}
            className="tabular-nums"
          >
            {summary.overallProgress}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {summary.completedCount} goal(s) completed
          </div>
        </div>
      </div>

      {/* Savings Goals Cards Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading savings goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <PiggyBank size={24} />
          </div>
          <p className="empty-state-title">No savings goals established yet</p>
          <p className="empty-state-desc">
            Define savings targets for Emergency Fund, Vacation, New Laptop, or Down Payment.
          </p>
          <button onClick={handleOpenAddGoal} className="btn btn-primary btn-sm">
            <Plus size={15} /> Create Goal
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {goals.map((g) => {
            const isCompleted = g.status === 'completed' || g.isCompleted;

            return (
              <div
                key={g._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: isCompleted ? '3px solid var(--color-success)' : '3px solid var(--color-accent)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {g.goalName}
                      </h3>
                      {isCompleted ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge badge-neutral">In Progress</span>
                      )}
                    </div>
                    {g.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        {g.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleOpenHistory(g)}
                      className="btn btn-ghost btn-icon"
                      title="Savings History"
                    >
                      <History size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEditGoal(g)}
                      className="btn btn-ghost btn-icon"
                      title="Edit Goal"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(g._id)}
                      className="btn btn-danger-ghost btn-icon"
                      title="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      Progress: {g.progress}%
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Target Date:{' '}
                      {new Date(g.targetDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="progress-bar-container" style={{ height: '10px' }}>
                    <div
                      className="progress-bar-fill safe"
                      style={{ width: `${Math.min(100, g.progress)}%` }}
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Target</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }} className="tabular-nums">
                      {formatCurrency(g.targetAmount)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Current Saved</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-accent)' }} className="tabular-nums">
                      {formatCurrency(g.currentAmount)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Remaining</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }} className="tabular-nums">
                      {formatCurrency(g.remaining)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => handleOpenDeposit(g)}
                    className="btn btn-navy btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Plus size={14} /> Contribute / Withdraw
                  </button>
                  <button
                    onClick={() => handleOpenHistory(g)}
                    className="btn btn-secondary btn-sm"
                  >
                    View History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={editingGoalId ? 'Edit Savings Goal' : 'Create New Savings Goal'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGoalSubmit}
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingGoalId ? 'Update Goal' : 'Create Goal'}
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

        <form onSubmit={handleGoalSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="goal-name">
              Goal Name <span className="required">*</span>
            </label>
            <input
              id="goal-name"
              type="text"
              className="form-input"
              placeholder="e.g. Emergency Fund, Japan Trip 2027"
              value={goalFormData.goalName}
              onChange={(e) => setGoalFormData({ ...goalFormData, goalName: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="target-amount">
                Target Amount ({currency}) <span className="required">*</span>
              </label>
              <input
                id="target-amount"
                type="number"
                step="0.01"
                min="1"
                className="form-input"
                placeholder="2000.00"
                value={goalFormData.targetAmount}
                onChange={(e) => setGoalFormData({ ...goalFormData, targetAmount: e.target.value })}
                required
              />
            </div>

            {!editingGoalId && (
              <div className="form-group">
                <label className="form-label" htmlFor="initial-amount">
                  Initial Saved Amount
                </label>
                <input
                  id="initial-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={goalFormData.currentAmount}
                  onChange={(e) => setGoalFormData({ ...goalFormData, currentAmount: e.target.value })}
                />
              </div>
            )}

            <div className="form-group" style={{ gridColumn: editingGoalId ? 'span 2' : 'span 1' }}>
              <label className="form-label" htmlFor="target-date">
                Target Date <span className="required">*</span>
              </label>
              <input
                id="target-date"
                type="date"
                className="form-input"
                value={goalFormData.targetDate}
                onChange={(e) => setGoalFormData({ ...goalFormData, targetDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="goal-desc">
              Description / Motivation (Optional)
            </label>
            <textarea
              id="goal-desc"
              className="form-textarea"
              rows="3"
              placeholder="Why this goal matters, timeline notes..."
              value={goalFormData.description}
              onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Deposit / Withdrawal Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title={`Update Savings: ${selectedGoal?.goalName}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDepositSubmit}
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Recording...' : 'Record Transaction'}
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

        {selectedGoal && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.8125rem'
            }}
          >
            <div>
              Current Saved Balance:{' '}
              <strong className="tabular-nums">{formatCurrency(selectedGoal.currentAmount)}</strong>
            </div>
            <div style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Goal Target: {formatCurrency(selectedGoal.targetAmount)} (
              {formatCurrency(selectedGoal.remaining)} remaining)
            </div>
          </div>
        )}

        <form onSubmit={handleDepositSubmit}>
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDepositFormData({ ...depositFormData, transactionType: 'deposit' })}
                className={`btn ${
                  depositFormData.transactionType === 'deposit' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <TrendingUp size={15} /> Deposit (Add)
              </button>
              <button
                type="button"
                onClick={() => setDepositFormData({ ...depositFormData, transactionType: 'withdrawal' })}
                className={`btn ${
                  depositFormData.transactionType === 'withdrawal' ? 'btn-danger' : 'btn-secondary'
                }`}
              >
                <TrendingDown size={15} /> Withdrawal
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="deposit-amount">
                Amount ({currency}) <span className="required">*</span>
              </label>
              <input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="100.00"
                value={depositFormData.amount}
                onChange={(e) => setDepositFormData({ ...depositFormData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="deposit-date">
                Date <span className="required">*</span>
              </label>
              <input
                id="deposit-date"
                type="date"
                className="form-input"
                value={depositFormData.date}
                onChange={(e) => setDepositFormData({ ...depositFormData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="deposit-desc">
              Description / Source Note
            </label>
            <input
              id="deposit-desc"
              type="text"
              className="form-input"
              placeholder="e.g. Monthly transfer, Bonus allocation"
              value={depositFormData.description}
              onChange={(e) => setDepositFormData({ ...depositFormData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Savings History: ${selectedGoal?.goalName}`}
        maxWidth="600px"
        footer={
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(false)}
            className="btn btn-secondary"
          >
            Close
          </button>
        }
      >
        {historyLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading savings ledger...
          </div>
        ) : goalTransactions.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p className="empty-state-title" style={{ fontSize: '0.95rem' }}>No transaction history</p>
            <p className="empty-state-desc" style={{ fontSize: '0.8rem' }}>
              Contributions and withdrawals for this goal will be logged here.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Note</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {goalTransactions.map((tx) => {
                  const isDeposit = tx.transactionType === 'deposit';
                  return (
                    <tr key={tx._id}>
                      <td>
                        <span className={`badge ${isDeposit ? 'badge-success' : 'badge-danger'}`}>
                          {isDeposit ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>
                        {tx.description || '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`tabular-nums ${isDeposit ? 'amount-income' : 'amount-expense'}`}
                        >
                          {isDeposit ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SavingsGoals;
