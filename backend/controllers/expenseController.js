const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { checkBudgetThresholds } = require('../utils/budgetChecker');

// @desc    Get all expense records for logged in user (with filter, search, sort, pagination)
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const {
      search,
      category,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    const query = { userId: req.user.id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined && minAmount !== '') query.amount.$gte = Number(minAmount);
      if (maxAmount !== undefined && maxAmount !== '') query.amount.$lte = Number(maxAmount);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const totalRecords = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Calculate total amount for filtered query
    const matchForAggregate = {
      ...query,
      userId: new mongoose.Types.ObjectId(req.user.id)
    };

    const totalAmountAggregate = await Expense.aggregate([
      { $match: matchForAggregate },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalAmountAggregate.length > 0 ? totalAmountAggregate[0].total : 0;

    // Calculate category-wise breakdown for filtered query
    const categoryBreakdown = await Expense.aggregate([
      { $match: matchForAggregate },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: expenses.length,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      currentPage: pageNum,
      totalAmount,
      categoryBreakdown,
      expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found'
      });
    }

    res.status(200).json({
      success: true,
      expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, paymentMethod, description } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, amount, and category'
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero'
      });
    }

    const txDate = date ? new Date(date) : new Date();

    const expense = await Expense.create({
      userId: req.user.id,
      title,
      amount: Number(amount),
      category,
      date: txDate,
      paymentMethod: paymentMethod || 'Cash',
      description: description || ''
    });

    // Check budget thresholds asynchronously & generate alerts if needed
    const budgetStatus = await checkBudgetThresholds(req.user.id, category, txDate);

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense,
      budgetStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense record
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, paymentMethod, description } = req.body;

    let expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found'
      });
    }

    const previousCategory = expense.category;

    if (title !== undefined) expense.title = title;
    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than zero'
        });
      }
      expense.amount = Number(amount);
    }
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (description !== undefined) expense.description = description;

    await expense.save();

    // Check budget thresholds for current category and previous if changed
    const budgetStatus = await checkBudgetThresholds(req.user.id, expense.category, expense.date);
    if (previousCategory !== expense.category) {
      await checkBudgetThresholds(req.user.id, previousCategory, expense.date);
    }

    res.status(200).json({
      success: true,
      message: 'Expense record updated successfully',
      expense,
      budgetStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense record
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found'
      });
    }

    // Re-check budget status after expense removal
    await checkBudgetThresholds(req.user.id, expense.category, expense.date);

    res.status(200).json({
      success: true,
      message: 'Expense record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};
