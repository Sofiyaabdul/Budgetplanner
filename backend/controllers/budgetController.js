const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { checkBudgetThresholds } = require('../utils/budgetChecker');

// Helper to calculate spending and utilization for a budget
const enrichBudgetWithSpending = async (budget, rawUserId) => {
  const userId = new mongoose.Types.ObjectId(rawUserId);
  const startOfMonth = new Date(budget.year, budget.month - 1, 1);
  const endOfMonth = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);

  const aggregate = await Expense.aggregate([
    {
      $match: {
        userId,
        category: budget.category,
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

  const spent = aggregate.length > 0 ? aggregate[0].totalSpent : 0;
  const remaining = budget.amount - spent;
  const utilization = (spent / budget.amount) * 100;

  let status = 'safe'; // green: < 80%
  if (spent > budget.amount) {
    status = 'exceeded'; // red: > 100%
  } else if (utilization >= 80) {
    status = 'warning'; // orange: 80% - 100%
  }

  return {
    ...budget.toObject(),
    spent,
    remaining,
    utilization: Math.round(utilization * 10) / 10,
    status
  };
};

// @desc    Get all budgets with active spending monitoring
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const query = { userId: req.user.id };

    if (month) query.month = parseInt(month, 10);
    if (year) query.year = parseInt(year, 10);

    const budgets = await Budget.find(query).sort({ month: -1, year: -1, category: 1 });

    const enrichedBudgets = await Promise.all(
      budgets.map((b) => enrichBudgetWithSpending(b, req.user._id))
    );

    // Calculate monthly summary
    const totalAllocated = enrichedBudgets.reduce((acc, b) => acc + b.amount, 0);
    const totalSpent = enrichedBudgets.reduce((acc, b) => acc + b.spent, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    res.status(200).json({
      success: true,
      count: enrichedBudgets.length,
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        overallUtilization: Math.round(overallUtilization * 10) / 10
      },
      budgets: enrichedBudgets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single budget by ID
// @route   GET /api/budgets/:id
// @access  Private
const getBudgetById = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const enriched = await enrichBudgetWithSpending(budget, req.user._id);

    res.status(200).json({
      success: true,
      budget: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res, next) => {
  try {
    const { name, amount, category, month, year, description } = req.body;

    if (!name || !amount || !category || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, amount, category, month, and year'
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget amount must be greater than zero'
      });
    }

    // Check duplicate
    const existing = await Budget.findOne({
      userId: req.user.id,
      category,
      month: parseInt(month, 10),
      year: parseInt(year, 10)
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A budget for category "${category}" already exists for ${month}/${year}`
      });
    }

    const budget = await Budget.create({
      userId: req.user.id,
      name,
      amount: Number(amount),
      category,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      description: description || ''
    });

    // Check thresholds immediately upon budget creation
    const now = new Date();
    await checkBudgetThresholds(req.user.id, category, new Date(year, month - 1, now.getDate()));

    const enriched = await enrichBudgetWithSpending(budget, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budget: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res, next) => {
  try {
    const { name, amount, category, month, year, description } = req.body;

    let budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    if (name !== undefined) budget.name = name;
    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Budget amount must be greater than zero'
        });
      }
      budget.amount = Number(amount);
    }
    if (category !== undefined) budget.category = category;
    if (month !== undefined) budget.month = parseInt(month, 10);
    if (year !== undefined) budget.year = parseInt(year, 10);
    if (description !== undefined) budget.description = description;

    // Check if duplicate exists if category/month/year changed
    if (category || month || year) {
      const duplicate = await Budget.findOne({
        _id: { $ne: budget._id },
        userId: req.user.id,
        category: budget.category,
        month: budget.month,
        year: budget.year
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Another budget for "${budget.category}" already exists for ${budget.month}/${budget.year}`
        });
      }
    }

    await budget.save();

    // Recheck thresholds
    await checkBudgetThresholds(
      req.user.id,
      budget.category,
      new Date(budget.year, budget.month - 1, 15)
    );

    const enriched = await enrichBudgetWithSpending(budget, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      budget: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
};
