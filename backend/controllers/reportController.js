const mongoose = require('mongoose');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const SavingsTransaction = require('../models/SavingsTransaction');

// Helper to calculate date range based on filter
const parseDateRange = (period, startDate, endDate, month, year) => {
  const now = new Date();
  let start;
  let end;

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const targetYear = year ? parseInt(year, 10) : now.getFullYear();
  const targetMonth = month ? parseInt(month, 10) - 1 : now.getMonth();

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'weekly':
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      start = new Date(targetYear, 0, 1, 0, 0, 0, 0);
      end = new Date(targetYear, 11, 31, 23, 59, 59, 999);
      break;
    case 'monthly':
    default:
      start = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
      end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
      break;
  }

  return { start, end };
};

// @desc    Get complete financial overview (Dashboard metrics)
// @route   GET /api/reports/overview
// @access  Private
const getOverview = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { month, year } = req.query;

    const now = new Date();
    const currentYear = year ? parseInt(year, 10) : now.getFullYear();
    const currentMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

    // Date range for current selected month
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Date range for previous month (for comparison)
    const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;
    const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1);
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    // Aggregate Current Month Income & Expense
    const [currentIncomeAgg, currentExpenseAgg, prevIncomeAgg, prevExpenseAgg] = await Promise.all([
      Income.aggregate([
        { $match: { userId, date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Income.aggregate([
        { $match: { userId, date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalIncome = currentIncomeAgg[0]?.total || 0;
    const totalExpenses = currentExpenseAgg[0]?.total || 0;
    const availableBalance = totalIncome - totalExpenses;

    const prevIncome = prevIncomeAgg[0]?.total || 0;
    const prevExpense = prevExpenseAgg[0]?.total || 0;

    const incomeChangePercent =
      prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100 * 10) / 10 : 0;
    const expenseChangePercent =
      prevExpense > 0 ? Math.round(((totalExpenses - prevExpense) / prevExpense) * 100 * 10) / 10 : 0;

    // Savings Goals Totals
    const savingsGoals = await SavingsGoal.find({ userId });
    const totalSavings = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);

    // Monthly Budget Summary
    const budgets = await Budget.find({ userId, month: currentMonth, year: currentYear });
    const totalAllocatedBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

    // Budget utilization & remaining
    const categoryExpenses = await Expense.aggregate([
      { $match: { userId, date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const catExpenseMap = {};
    categoryExpenses.forEach((ce) => {
      catExpenseMap[ce._id] = ce.total;
    });

    const budgetProgress = budgets.map((b) => {
      const spent = catExpenseMap[b.category] || 0;
      const remaining = b.amount - spent;
      const utilization = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      let status = 'safe';
      if (spent > b.amount) status = 'exceeded';
      else if (utilization >= 80) status = 'warning';

      return {
        id: b._id,
        category: b.category,
        amount: b.amount,
        spent,
        remaining,
        utilization,
        status
      };
    });

    const totalSpentBudget = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
    const remainingBudget = totalAllocatedBudget - totalSpentBudget;
    const overallBudgetUtilization =
      totalAllocatedBudget > 0 ? Math.round((totalSpentBudget / totalAllocatedBudget) * 100) : 0;

    // Expense Breakdown for current month
    const expenseBreakdown = categoryExpenses.map((ce) => ({
      name: ce._id,
      value: ce.total,
      percentage: totalExpenses > 0 ? Math.round((ce.total / totalExpenses) * 100 * 10) / 10 : 0
    }));

    // Monthly Income vs Expense comparison (Last 6 months)
    const monthlyComparison = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth() + 1;
      const mStart = new Date(mYear, mMonth - 1, 1);
      const mEnd = new Date(mYear, mMonth, 0, 23, 59, 59, 999);

      const [inc, exp] = await Promise.all([
        Income.aggregate([
          { $match: { userId, date: { $gte: mStart, $lte: mEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Expense.aggregate([
          { $match: { userId, date: { $gte: mStart, $lte: mEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const monthName = d.toLocaleString('en-US', { month: 'short' });
      monthlyComparison.push({
        month: `${monthName} ${mYear.toString().slice(-2)}`,
        income: inc[0]?.total || 0,
        expense: exp[0]?.total || 0,
        net: (inc[0]?.total || 0) - (exp[0]?.total || 0)
      });
    }

    // Recent Transactions (Last 8 income and expense combined)
    const [recentIncomes, recentExpenses] = await Promise.all([
      Income.find({ userId }).sort({ date: -1 }).limit(8),
      Expense.find({ userId }).sort({ date: -1 }).limit(8)
    ]);

    const formattedIncomes = recentIncomes.map((inc) => ({
      _id: inc._id,
      title: inc.title,
      category: inc.category,
      amount: inc.amount,
      date: inc.date,
      type: 'income',
      description: inc.description,
      source: inc.paymentSource
    }));

    const formattedExpenses = recentExpenses.map((exp) => ({
      _id: exp._id,
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      type: 'expense',
      description: exp.description,
      paymentMethod: exp.paymentMethod
    }));

    const recentTransactions = [...formattedIncomes, ...formattedExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    // Savings goals overview
    const savingsGoalsOverview = savingsGoals.slice(0, 4).map((g) => ({
      id: g._id,
      goalName: g.goalName,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate,
      progress: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
      status: g.status
    }));

    res.status(200).json({
      success: true,
      selectedPeriod: { month: currentMonth, year: currentYear },
      summary: {
        totalIncome,
        totalExpenses,
        availableBalance,
        totalSavings,
        incomeChangePercent,
        incomeChangeAbsolute: totalIncome - prevIncome,
        expenseChangePercent,
        expenseChangeAbsolute: totalExpenses - prevExpense,
        budgetOverview: {
          totalAllocated: totalAllocatedBudget,
          totalSpent: totalSpentBudget,
          remaining: remainingBudget,
          utilization: overallBudgetUtilization
        }
      },
      budgetProgress,
      expenseBreakdown,
      monthlyComparison,
      recentTransactions,
      savingsGoalsOverview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed income report
// @route   GET /api/reports/income
// @access  Private
const getIncomeReport = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { period = 'monthly', startDate, endDate, month, year } = req.query;
    const { start, end } = parseDateRange(period, startDate, endDate, month, year);

    const matchQuery = {
      userId,
      date: { $gte: start, $lte: end }
    };

    const incomes = await Income.find(matchQuery).sort({ date: -1 });

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const averageIncome = incomes.length > 0 ? Math.round((totalIncome / incomes.length) * 100) / 100 : 0;

    // Category breakdown
    const categoryAgg = await Income.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const categoryBreakdown = categoryAgg.map((c) => ({
      name: c._id,
      total: c.total,
      count: c.count,
      percentage: totalIncome > 0 ? Math.round((c.total / totalIncome) * 100 * 10) / 10 : 0
    }));

    // Payment source breakdown
    const sourceAgg = await Income.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$paymentSource', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const sourceBreakdown = sourceAgg.map((s) => ({
      source: s._id || 'Not Specified',
      total: s.total,
      count: s.count,
      percentage: totalIncome > 0 ? Math.round((s.total / totalIncome) * 100 * 10) / 10 : 0
    }));

    // Date-wise timeline trend
    const trendAgg = await Income.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const trend = trendAgg.map((t) => ({
      date: t._id,
      amount: t.total,
      count: t.count
    }));

    res.status(200).json({
      success: true,
      dateRange: { start, end, period },
      summary: {
        totalIncome,
        totalRecords: incomes.length,
        averageIncome
      },
      categoryBreakdown,
      sourceBreakdown,
      trend,
      incomes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed expense report
// @route   GET /api/reports/expenses
// @access  Private
const getExpenseReport = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { period = 'monthly', startDate, endDate, month, year } = req.query;
    const { start, end } = parseDateRange(period, startDate, endDate, month, year);

    const matchQuery = {
      userId,
      date: { $gte: start, $lte: end }
    };

    const expenses = await Expense.find(matchQuery).sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const averageExpense = expenses.length > 0 ? Math.round((totalExpenses / expenses.length) * 100) / 100 : 0;

    // Category breakdown
    const categoryAgg = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const categoryBreakdown = categoryAgg.map((c) => ({
      name: c._id,
      total: c.total,
      count: c.count,
      percentage: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100 * 10) / 10 : 0
    }));

    // Payment method breakdown
    const paymentMethodAgg = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const paymentMethodBreakdown = paymentMethodAgg.map((p) => ({
      method: p._id || 'Other',
      total: p.total,
      count: p.count,
      percentage: totalExpenses > 0 ? Math.round((p.total / totalExpenses) * 100 * 10) / 10 : 0
    }));

    // Date-wise timeline trend
    const trendAgg = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const trend = trendAgg.map((t) => ({
      date: t._id,
      amount: t.total,
      count: t.count
    }));

    res.status(200).json({
      success: true,
      dateRange: { start, end, period },
      summary: {
        totalExpenses,
        totalRecords: expenses.length,
        averageExpense
      },
      categoryBreakdown,
      paymentMethodBreakdown,
      trend,
      expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category-wise financial report (Income & Expense)
// @route   GET /api/reports/categories
// @access  Private
const getCategoryReport = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { period = 'monthly', startDate, endDate, month, year } = req.query;
    const { start, end } = parseDateRange(period, startDate, endDate, month, year);

    const matchQuery = {
      userId,
      date: { $gte: start, $lte: end }
    };

    const [expenseCategoryAgg, incomeCategoryAgg] = await Promise.all([
      Expense.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Income.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);

    const totalExpense = expenseCategoryAgg.reduce((s, c) => s + c.total, 0);
    const totalIncome = incomeCategoryAgg.reduce((s, c) => s + c.total, 0);

    const expenseCategories = expenseCategoryAgg.map((c) => ({
      category: c._id,
      total: c.total,
      count: c.count,
      percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100 * 10) / 10 : 0
    }));

    const incomeCategories = incomeCategoryAgg.map((c) => ({
      category: c._id,
      total: c.total,
      count: c.count,
      percentage: totalIncome > 0 ? Math.round((c.total / totalIncome) * 100 * 10) / 10 : 0
    }));

    res.status(200).json({
      success: true,
      dateRange: { start, end, period },
      totalExpense,
      totalIncome,
      expenseCategories,
      incomeCategories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get budget performance report
// @route   GET /api/reports/budgets
// @access  Private
const getBudgetReport = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { month, year } = req.query;

    const now = new Date();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const budgets = await Budget.find({
      userId,
      month: targetMonth,
      year: targetYear
    }).sort({ amount: -1 });

    const expensesAgg = await Expense.aggregate([
      { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const expenseMap = {};
    expensesAgg.forEach((e) => {
      expenseMap[e._id] = e.total;
    });

    const performance = budgets.map((b) => {
      const spent = expenseMap[b.category] || 0;
      const remaining = b.amount - spent;
      const utilization = b.amount > 0 ? Math.round((spent / b.amount) * 100 * 10) / 10 : 0;
      let status = 'safe';
      if (spent > b.amount) status = 'exceeded';
      else if (utilization >= 80) status = 'warning';

      return {
        id: b._id,
        name: b.name,
        category: b.category,
        allocated: b.amount,
        spent,
        remaining,
        utilization,
        status,
        exceededAmount: spent > b.amount ? spent - b.amount : 0
      };
    });

    const totalAllocated = performance.reduce((sum, p) => sum + p.allocated, 0);
    const totalSpent = performance.reduce((sum, p) => sum + p.spent, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const exceededCount = performance.filter((p) => p.status === 'exceeded').length;
    const warningCount = performance.filter((p) => p.status === 'warning').length;
    const safeCount = performance.filter((p) => p.status === 'safe').length;

    res.status(200).json({
      success: true,
      period: { month: targetMonth, year: targetYear },
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        overallUtilization: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100 * 10) / 10 : 0,
        totalBudgets: performance.length,
        exceededCount,
        warningCount,
        safeCount
      },
      performance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get savings performance report
// @route   GET /api/reports/savings
// @access  Private
const getSavingsReport = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });

    const transactions = await SavingsTransaction.find({ userId }).sort({ date: -1 });

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalRemaining = Math.max(0, totalTarget - totalSaved);
    const completedGoals = goals.filter((g) => g.status === 'completed' || g.currentAmount >= g.targetAmount);

    const deposits = transactions.filter((t) => t.transactionType === 'deposit');
    const withdrawals = transactions.filter((t) => t.transactionType === 'withdrawal');

    const totalDeposited = deposits.reduce((s, t) => s + t.amount, 0);
    const totalWithdrawn = withdrawals.reduce((s, t) => s + t.amount, 0);

    const goalBreakdown = goals.map((g) => ({
      id: g._id,
      goalName: g.goalName,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      remaining: Math.max(0, g.targetAmount - g.currentAmount),
      progress: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
      targetDate: g.targetDate,
      status: g.status
    }));

    res.status(200).json({
      success: true,
      summary: {
        totalTarget,
        totalSaved,
        totalRemaining,
        overallProgress: totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0,
        totalGoals: goals.length,
        completedCount: completedGoals.length,
        activeCount: goals.length - completedGoals.length,
        totalDeposited,
        totalWithdrawn,
        netSaved: totalDeposited - totalWithdrawn
      },
      goalBreakdown,
      recentTransactions: transactions.slice(0, 10)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getIncomeReport,
  getExpenseReport,
  getCategoryReport,
  getBudgetReport,
  getSavingsReport
};
