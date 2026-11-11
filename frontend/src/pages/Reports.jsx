import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Target,
  FileSpreadsheet
} from 'lucide-react';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ExpenseDonutChart,
  IncomeExpenseBarChart,
  FinancialTrendArea,
  BudgetComparisonBarChart
} from '../components/ChartComponents';

const Reports = () => {
  const { user } = useAuth();
  const currency = user?.currency || '$';

  const [activeReport, setActiveReport] = useState('monthly'); // monthly, category, income, expense, budget, savings
  const [period, setPeriod] = useState('monthly'); // daily, weekly, monthly, yearly, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
        month,
        year
      };

      let res;
      switch (activeReport) {
        case 'monthly':
          res = await reportService.getOverview(params);
          break;
        case 'category':
          res = await reportService.getCategories(params);
          break;
        case 'income':
          res = await reportService.getIncome(params);
          break;
        case 'expense':
          res = await reportService.getExpenses(params);
          break;
        case 'budget':
          res = await reportService.getBudgets(params);
          break;
        case 'savings':
          res = await reportService.getSavings();
          break;
        default:
          res = await reportService.getOverview(params);
      }

      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load financial report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, period, startDate, endDate, month, year]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeReport === 'income' && reportData?.incomes) {
      csvContent += 'Title,Category,Amount,Date,Source\n';
      reportData.incomes.forEach((i) => {
        csvContent += `"${i.title}","${i.category}",${i.amount},"${i.date}","${i.paymentSource || ''}"\n`;
      });
    } else if (activeReport === 'expense' && reportData?.expenses) {
      csvContent += 'Title,Category,Amount,Date,PaymentMethod\n';
      reportData.expenses.forEach((e) => {
        csvContent += `"${e.title}","${e.category}",${e.amount},"${e.date}","${e.paymentMethod || ''}"\n`;
      });
    } else if (activeReport === 'budget' && reportData?.performance) {
      csvContent += 'Category,Allocated,Spent,Remaining,Utilization\n';
      reportData.performance.forEach((b) => {
        csvContent += `"${b.category}",${b.allocated},${b.spent},${b.remaining},${b.utilization}%\n`;
      });
    } else {
      csvContent += 'Report,GeneratedAt\n';
      csvContent += `"${activeReport.toUpperCase()} Report","${new Date().toISOString()}"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReport}_financial_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            Financial Reports & Analytics
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Data-driven intelligence on cash inflows, spending distribution, and savings trajectory
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handlePrint} className="btn btn-navy btn-sm">
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div
        className="card"
        style={{
          padding: '0.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem'
        }}
      >
        {[
          { id: 'monthly', label: 'Overview Report' },
          { id: 'category', label: 'Category-wise' },
          { id: 'income', label: 'Income Analysis' },
          { id: 'expense', label: 'Expense Distribution' },
          { id: 'budget', label: 'Budget Performance' },
          { id: 'savings', label: 'Savings Progress' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: activeReport === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeReport === tab.id ? '#ffffff' : 'var(--color-text-muted)',
              transition: 'all 150ms ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar (Period selector, month/year, custom date range) */}
      {activeReport !== 'savings' && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Period:
            </span>
            <select
              className="form-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
            >
              <option value="daily">Daily (Today)</option>
              <option value="weekly">Weekly (Last 7 Days)</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {period === 'monthly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className="form-select"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                className="form-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {period === 'yearly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className="form-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: 'auto', padding: '0.4rem 0.5rem', fontSize: '0.8125rem' }}
              />
              <span style={{ color: 'var(--color-text-muted)' }}>to</span>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: 'auto', padding: '0.4rem 0.5rem', fontSize: '0.8125rem' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Render Selected Report View */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Generating report from MongoDB ledger...
        </div>
      ) : !reportData ? (
        <div className="card empty-state">
          <p className="empty-state-title">No report data generated</p>
        </div>
      ) : (
        <>
          {/* 1. Monthly Financial Overview Report */}
          {activeReport === 'monthly' && (
            <div>
              <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    TOTAL INCOME
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalIncome)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    TOTAL EXPENSES
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalExpenses)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    NET AVAILABLE BALANCE
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: (reportData.summary?.availableBalance || 0) >= 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                      marginTop: '0.25rem'
                    }}
                    className="tabular-nums"
                  >
                    {formatCurrency(reportData.summary?.availableBalance)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    TOTAL ALLOCATED SAVINGS
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6', marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalSavings)}
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '1rem' }}>Cash Flow Comparison</h3>
                  <IncomeExpenseBarChart data={reportData.monthlyComparison} currency={currency} height={280} />
                </div>
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '1rem' }}>Expense Breakdown</h3>
                  <ExpenseDonutChart data={reportData.expenseBreakdown} currency={currency} height={280} />
                </div>
              </div>
            </div>
          )}

          {/* 2. Category-Wise Report */}
          {activeReport === 'category' && (
            <div className="grid-2">
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Expense Spending by Category</h3>
                <ExpenseDonutChart
                  data={reportData.expenseCategories?.map((c) => ({ name: c.category, value: c.total }))}
                  currency={currency}
                  height={260}
                />
                <div className="table-responsive" style={{ marginTop: '1rem' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Transactions</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        <th style={{ textAlign: 'right' }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expenseCategories?.map((c) => (
                        <tr key={c.category}>
                          <td style={{ fontWeight: 600 }}>{c.category}</td>
                          <td>{c.count}</td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums amount-expense">
                            {formatCurrency(c.total)}
                          </td>
                          <td style={{ textAlign: 'right' }}>{c.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Income Streams by Category</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Transactions</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        <th style={{ textAlign: 'right' }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.incomeCategories?.map((c) => (
                        <tr key={c.category}>
                          <td style={{ fontWeight: 600 }}>{c.category}</td>
                          <td>{c.count}</td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums amount-income">
                            {formatCurrency(c.total)}
                          </td>
                          <td style={{ textAlign: 'right' }}>{c.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. Income Analysis Report */}
          {activeReport === 'income' && (
            <div>
              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>TOTAL PERIOD INFLOWS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalIncome)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>TRANSACTION COUNT</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }} className="tabular-nums">
                    {reportData.summary?.totalRecords || 0}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>AVERAGE INFLOW</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.averageIncome)}
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Inflow Timeline Trend</h3>
                <FinancialTrendArea data={reportData.trend} currency={currency} height={260} />
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '1rem' }}>Income Sources Breakdown</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Payment Source</th>
                          <th>Count</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ textAlign: 'right' }}>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.sourceBreakdown?.map((s) => (
                          <tr key={s.source}>
                            <td style={{ fontWeight: 600 }}>{s.source}</td>
                            <td>{s.count}</td>
                            <td style={{ textAlign: 'right' }} className="tabular-nums amount-income">
                              {formatCurrency(s.total)}
                            </td>
                            <td style={{ textAlign: 'right' }}>{s.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '1rem' }}>Categories Breakdown</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Count</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ textAlign: 'right' }}>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.categoryBreakdown?.map((c) => (
                          <tr key={c.name}>
                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                            <td>{c.count}</td>
                            <td style={{ textAlign: 'right' }} className="tabular-nums amount-income">
                              {formatCurrency(c.total)}
                            </td>
                            <td style={{ textAlign: 'right' }}>{c.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Expense Distribution Report */}
          {activeReport === 'expense' && (
            <div>
              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>TOTAL PERIOD EXPENSES</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalExpenses)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>RECORDED EXPENSES</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }} className="tabular-nums">
                    {reportData.summary?.totalRecords || 0}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>AVERAGE TRANSACTION</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.averageExpense)}
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Expense Timeline Trend</h3>
                <FinancialTrendArea data={reportData.trend} currency={currency} height={260} />
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '1rem' }}>Category Distribution</h3>
                  <ExpenseDonutChart
                    data={reportData.categoryBreakdown?.map((c) => ({ name: c.name, value: c.total }))}
                    currency={currency}
                    height={260}
                  />
                </div>

                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '1rem' }}>Payment Methods Distribution</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th>Count</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ textAlign: 'right' }}>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.paymentMethodBreakdown?.map((p) => (
                          <tr key={p.method}>
                            <td style={{ fontWeight: 600 }}>{p.method}</td>
                            <td>{p.count}</td>
                            <td style={{ textAlign: 'right' }} className="tabular-nums amount-expense">
                              {formatCurrency(p.total)}
                            </td>
                            <td style={{ textAlign: 'right' }}>{p.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Budget Performance Report */}
          {activeReport === 'budget' && (
            <div>
              <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>TOTAL ALLOCATED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalAllocated)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>TOTAL SPENT</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalSpent)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>REMAINING BUDGET</div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: (reportData.summary?.totalRemaining || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                      marginTop: '0.25rem'
                    }}
                    className="tabular-nums"
                  >
                    {formatCurrency(reportData.summary?.totalRemaining)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>UTILIZATION RATE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }} className="tabular-nums">
                    {reportData.summary?.overallUtilization}%
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Allocated vs Actual Spent Comparison</h3>
                <BudgetComparisonBarChart data={reportData.performance} currency={currency} height={280} />
              </div>

              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Category Budget Performance Table</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Allocated</th>
                        <th style={{ textAlign: 'right' }}>Spent</th>
                        <th style={{ textAlign: 'right' }}>Remaining</th>
                        <th style={{ textAlign: 'right' }}>Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.performance?.map((b) => (
                        <tr key={b.id || b.category}>
                          <td style={{ fontWeight: 600 }}>{b.category}</td>
                          <td>
                            <span
                              className={`badge ${
                                b.status === 'exceeded'
                                  ? 'badge-danger'
                                  : b.status === 'warning'
                                  ? 'badge-warning'
                                  : 'badge-success'
                              }`}
                            >
                              {b.status === 'exceeded' ? 'Exceeded' : b.status === 'warning' ? '80% Warning' : 'Safe'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums">
                            {formatCurrency(b.allocated)}
                          </td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums amount-expense">
                            {formatCurrency(b.spent)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              color: b.remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                            }}
                            className="tabular-nums"
                          >
                            {formatCurrency(b.remaining)}
                          </td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums">
                            {b.utilization}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. Savings Progress Report */}
          {activeReport === 'savings' && (
            <div>
              <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>CUMULATIVE TARGET</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalTarget)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>CUMULATIVE SAVED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.25rem' }} className="tabular-nums">
                    {formatCurrency(reportData.summary?.totalSaved)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>OVERALL PROGRESS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }} className="tabular-nums">
                    {reportData.summary?.overallProgress}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>COMPLETED GOALS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }} className="tabular-nums">
                    {reportData.summary?.completedCount} / {reportData.summary?.totalGoals}
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Savings Goals Performance Ledger</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Goal Name</th>
                        <th>Status</th>
                        <th>Target Date</th>
                        <th style={{ textAlign: 'right' }}>Target</th>
                        <th style={{ textAlign: 'right' }}>Saved</th>
                        <th style={{ textAlign: 'right' }}>Remaining</th>
                        <th style={{ textAlign: 'right' }}>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.goalBreakdown?.map((g) => (
                        <tr key={g.id}>
                          <td style={{ fontWeight: 600 }}>{g.goalName}</td>
                          <td>
                            <span
                              className={`badge ${
                                g.status === 'completed' || g.progress >= 100
                                  ? 'badge-success'
                                  : 'badge-neutral'
                              }`}
                            >
                              {g.status === 'completed' || g.progress >= 100 ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                            {new Date(g.targetDate).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums">
                            {formatCurrency(g.targetAmount)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-accent)' }} className="tabular-nums">
                            {formatCurrency(g.currentAmount)}
                          </td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums">
                            {formatCurrency(g.remaining)}
                          </td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums">
                            {g.progress}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
