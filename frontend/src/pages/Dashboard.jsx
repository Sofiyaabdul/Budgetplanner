import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PieChart as PieIcon,
  PlusCircle,
  Calendar,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Target
} from 'lucide-react';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SummaryCard from '../components/SummaryCard';
import TransactionTable from '../components/TransactionTable';
import {
  ExpenseDonutChart,
  IncomeExpenseBarChart
} from '../components/ChartComponents';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currency = user?.currency || '$';

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await reportService.getOverview({
        month: selectedMonth,
        year: selectedYear
      });
      if (res.data.success) {
        setOverviewData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
      setError('Could not retrieve dashboard financial summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedMonth, selectedYear]);

  const summary = overviewData?.summary || {};
  const budgetProgress = overviewData?.budgetProgress || [];
  const expenseBreakdown = overviewData?.expenseBreakdown || [];
  const monthlyComparison = overviewData?.monthlyComparison || [];
  const recentTransactions = overviewData?.recentTransactions || [];
  const savingsGoalsOverview = overviewData?.savingsGoalsOverview || [];

  const formatCurrency = (val) => {
    return `${currency}${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
      {/* Top Filter Bar */}
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
            Financial Overview
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Real-time balance, budgets, and spending performance
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

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => navigate('/income')}
              className="btn btn-primary btn-sm"
            >
              <PlusCircle size={15} /> Add Income
            </button>
            <button
              onClick={() => navigate('/expenses')}
              className="btn btn-navy btn-sm"
            >
              <PlusCircle size={15} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-banner danger">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <SummaryCard
          title="Total Income"
          amount={formatCurrency(summary.totalIncome)}
          icon={TrendingUp}
          color="#10b981"
          bg="#ecfdf5"
          trend={{
            value: `${summary.incomeChangePercent >= 0 ? '+' : ''}${summary.incomeChangePercent}%`,
            isPositive: summary.incomeChangePercent >= 0,
            isNegative: summary.incomeChangePercent < 0,
            label: 'vs prev month'
          }}
        />

        <SummaryCard
          title="Total Expenses"
          amount={formatCurrency(summary.totalExpenses)}
          icon={TrendingDown}
          color="#ef4444"
          bg="#fef2f2"
          trend={{
            value: `${summary.expenseChangePercent >= 0 ? '+' : ''}${summary.expenseChangePercent}%`,
            isPositive: summary.expenseChangePercent < 0, // Lower expense is good
            isNegative: summary.expenseChangePercent > 0,
            label: 'vs prev month'
          }}
        />

        <SummaryCard
          title="Available Balance"
          amount={formatCurrency(summary.availableBalance)}
          icon={Wallet}
          color="#0d9488"
          bg="#f0fdfa"
          subtitle={
            summary.availableBalance >= 0
              ? 'Healthy Cash Surplus'
              : 'Deficit (Expenses exceed income)'
          }
        />

        <SummaryCard
          title="Total Savings"
          amount={formatCurrency(summary.totalSavings)}
          icon={PiggyBank}
          color="#8b5cf6"
          bg="#f5f3ff"
          subtitle="Allocated to goals"
        />
      </div>

      {/* Monthly Budget Summary Banner */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          backgroundColor: '#ffffff',
          borderLeft: '4px solid var(--color-accent)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieIcon size={18} color="var(--color-accent)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                Monthly Budget Utilization: {summary.budgetOverview?.utilization || 0}%
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Spent {formatCurrency(summary.budgetOverview?.totalSpent)} of {formatCurrency(summary.budgetOverview?.totalAllocated)} allocated
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Remaining Budget</div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: (summary.budgetOverview?.remaining || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                }}
                className="tabular-nums"
              >
                {formatCurrency(summary.budgetOverview?.remaining)}
              </div>
            </div>

            <Link to="/budgets" className="btn btn-secondary btn-sm">
              Manage Budgets <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Utilization Bar */}
        <div style={{ marginTop: '0.875rem' }}>
          <div className="progress-bar-container">
            <div
              className={`progress-bar-fill ${
                (summary.budgetOverview?.utilization || 0) > 100
                  ? 'danger'
                  : (summary.budgetOverview?.utilization || 0) >= 80
                  ? 'warning'
                  : 'safe'
              }`}
              style={{ width: `${Math.min(100, summary.budgetOverview?.utilization || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Income vs Expense Bar */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Income vs Expenses (Last 6 Months)</h3>
              <p className="card-subtitle">Monthly cash flow trends comparison</p>
            </div>
          </div>
          <IncomeExpenseBarChart data={monthlyComparison} currency={currency} height={260} />
        </div>

        {/* Category Breakdown Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Expense Distribution</h3>
              <p className="card-subtitle">Current month spending by category</p>
            </div>
          </div>
          <ExpenseDonutChart data={expenseBreakdown} currency={currency} height={260} />
        </div>
      </div>

      {/* Two Column Section: Budget Progress & Active Savings Goals */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Budget Progress Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Category Budget Progress</h3>
              <p className="card-subtitle">Track individual category limits</p>
            </div>
            <Link to="/budgets" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
              View All
            </Link>
          </div>

          {budgetProgress.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
              <PieIcon size={24} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>No budgets set for this month</p>
              <Link to="/budgets" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                Create Budget
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {budgetProgress.slice(0, 5).map((b) => (
                <div key={b.id || b.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      {b.category}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }} className="tabular-nums">
                      {formatCurrency(b.spent)} / {formatCurrency(b.amount)} ({b.utilization}%)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar-fill ${b.status}`}
                      style={{ width: `${Math.min(100, b.utilization)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Savings Goals Overview */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Savings Goals Progress</h3>
              <p className="card-subtitle">Targets and milestone achievement</p>
            </div>
            <Link to="/savings" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
              View All
            </Link>
          </div>

          {savingsGoalsOverview.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
              <Target size={24} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>No active savings goals found</p>
              <Link to="/savings" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                Set a Savings Goal
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savingsGoalsOverview.map((goal) => (
                <div key={goal.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {goal.goalName}
                      </span>
                      {goal.status === 'completed' && (
                        <CheckCircle2 size={14} color="var(--color-success)" />
                      )}
                    </div>
                    <span style={{ color: 'var(--color-text-muted)' }} className="tabular-nums">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)} ({goal.progress}%)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill safe"
                      style={{ width: `${Math.min(100, goal.progress)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Financial Transactions</h3>
            <p className="card-subtitle">Latest recorded income and expenses</p>
          </div>
          <Link to="/transactions" className="btn btn-secondary btn-sm">
            View All Transactions <ArrowRight size={14} />
          </Link>
        </div>

        <TransactionTable
          transactions={recentTransactions}
          currency={currency}
          showActions={false}
          emptyMessage="No recent transactions found"
        />
      </div>
    </div>
  );
};

export default Dashboard;
