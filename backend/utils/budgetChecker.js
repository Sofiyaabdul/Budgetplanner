const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');

/**
 * Checks budget threshold for a given user, category and transaction date.
 * Creates notifications without duplicates for the same budget threshold in the same month.
 */
const checkBudgetThresholds = async (rawUserId, category, transactionDate = new Date()) => {
  try {
    const userId = new mongoose.Types.ObjectId(rawUserId);
    const txDate = new Date(transactionDate);
    const month = txDate.getMonth() + 1; // 1-12
    const year = txDate.getFullYear();

    // Find active budget for this category and month/year
    const budget = await Budget.findOne({
      userId,
      category,
      month,
      year
    });

    if (!budget) {
      return null;
    }

    // Calculate total expenses for this category in the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const expenseAggregate = await Expense.aggregate([
      {
        $match: {
          userId,
          category,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = expenseAggregate.length > 0 ? expenseAggregate[0].totalSpent : 0;
    const utilization = (totalSpent / budget.amount) * 100;

    let targetThreshold = null;
    let title = '';
    let message = '';
    let type = 'warning';

    if (totalSpent > budget.amount) {
      targetThreshold = 'exceeded';
      title = 'Budget Exceeded';
      message = `You have exceeded your ${budget.category} budget of $${budget.amount.toLocaleString()} with spending of $${totalSpent.toLocaleString()}.`;
      type = 'danger';
    } else if (utilization >= 100) {
      targetThreshold = '100';
      title = 'Budget Limit Reached';
      message = `Your ${budget.category} budget has reached its limit ($${budget.amount.toLocaleString()}).`;
      type = 'warning';
    } else if (utilization >= 80) {
      targetThreshold = '80';
      title = 'Budget Warning (80%)';
      message = `You have used ${Math.round(utilization)}% of your ${budget.category} budget ($${totalSpent.toLocaleString()} of $${budget.amount.toLocaleString()}).`;
      type = 'warning';
    }

    if (targetThreshold) {
      // Check if alert already exists for this budget, threshold in the current period
      const existingAlert = await Notification.findOne({
        userId,
        relatedBudgetId: budget._id,
        threshold: targetThreshold,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (!existingAlert) {
        await Notification.create({
          userId,
          title,
          message,
          type,
          isRead: false,
          relatedBudgetId: budget._id,
          threshold: targetThreshold
        });
      }
    }

    return {
      budget,
      totalSpent,
      remaining: budget.amount - totalSpent,
      utilization: Math.round(utilization * 10) / 10,
      threshold: targetThreshold
    };
  } catch (err) {
    console.error('Error checking budget thresholds:', err);
    return null;
  }
};

module.exports = {
  checkBudgetThresholds
};
