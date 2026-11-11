const mongoose = require('mongoose');
const Income = require('../models/Income');
const Expense = require('../models/Expense');

// @desc    Get centralized transaction history (both income and expenses)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      type = 'all', // all, income, expense
      category,
      search,
      startDate,
      endDate,
      sortBy = 'date', // date, amount
      sortOrder = 'desc', // asc, desc
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const buildFilter = () => {
      const q = { userId: req.user.id };
      if (category && category !== 'All') {
        q.category = category;
      }
      if (search) {
        q.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (startDate || endDate) {
        q.date = {};
        if (startDate) q.date.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          q.date.$lte = end;
        }
      }
      return q;
    };

    let items = [];
    let totalIncomeCount = 0;
    let totalExpenseCount = 0;
    let totalIncomeSum = 0;
    let totalExpenseSum = 0;

    const fetchIncomes = type === 'all' || type === 'income';
    const fetchExpenses = type === 'all' || type === 'expense';

    const baseFilter = buildFilter();
    const aggregateMatchFilter = {
      ...baseFilter,
      userId: new mongoose.Types.ObjectId(req.user.id)
    };

    if (fetchIncomes) {
      const [incomeRecords, incomeAgg] = await Promise.all([
        Income.find(baseFilter),
        Income.aggregate([
          { $match: aggregateMatchFilter },
          { $group: { _id: null, sum: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
      ]);
      totalIncomeCount = incomeAgg[0]?.count || 0;
      totalIncomeSum = incomeAgg[0]?.sum || 0;

      items = items.concat(
        incomeRecords.map((i) => ({
          _id: i._id,
          title: i.title,
          amount: i.amount,
          category: i.category,
          date: i.date,
          type: 'income',
          description: i.description,
          methodOrSource: i.paymentSource || 'Bank Transfer',
          createdAt: i.createdAt
        }))
      );
    }

    if (fetchExpenses) {
      const [expenseRecords, expenseAgg] = await Promise.all([
        Expense.find(baseFilter),
        Expense.aggregate([
          { $match: aggregateMatchFilter },
          { $group: { _id: null, sum: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
      ]);
      totalExpenseCount = expenseAgg[0]?.count || 0;
      totalExpenseSum = expenseAgg[0]?.sum || 0;

      items = items.concat(
        expenseRecords.map((e) => ({
          _id: e._id,
          title: e.title,
          amount: e.amount,
          category: e.category,
          date: e.date,
          type: 'expense',
          description: e.description,
          methodOrSource: e.paymentMethod || 'Cash',
          createdAt: e.createdAt
        }))
      );
    }

    // Sort items
    items.sort((a, b) => {
      let fieldA;
      let fieldB;

      if (sortBy === 'amount') {
        fieldA = a.amount;
        fieldB = b.amount;
      } else {
        fieldA = new Date(a.date).getTime();
        fieldB = new Date(b.date).getTime();
      }

      if (sortOrder === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      }
      return fieldA < fieldB ? 1 : -1;
    });

    const totalRecords = items.length;
    const totalPages = Math.ceil(totalRecords / limitNum) || 1;
    const paginatedItems = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      totalRecords,
      totalPages,
      currentPage: pageNum,
      summary: {
        totalIncomeSum,
        totalExpenseSum,
        netBalance: totalIncomeSum - totalExpenseSum,
        totalIncomeCount,
        totalExpenseCount
      },
      transactions: paginatedItems
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions
};
