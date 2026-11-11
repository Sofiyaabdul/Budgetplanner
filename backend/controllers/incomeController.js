const mongoose = require('mongoose');
const Income = require('../models/Income');

// @desc    Get all income records for logged in user (with filter, search, sort, pagination)
// @route   GET /api/income
// @access  Private
const getIncomes = async (req, res, next) => {
  try {
    const { search, category, startDate, endDate, sortBy = 'date', sortOrder = 'desc', page = 1, limit = 50 } = req.query;

    const query = { userId: req.user.id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { paymentSource: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
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

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const totalRecords = await Income.countDocuments(query);
    const incomes = await Income.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Calculate total amount for the filtered query
    const matchForAggregate = {
      ...query,
      userId: new mongoose.Types.ObjectId(req.user.id)
    };
    const totalAmountAggregate = await Income.aggregate([
      { $match: matchForAggregate },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalAmountAggregate.length > 0 ? totalAmountAggregate[0].total : 0;

    res.status(200).json({
      success: true,
      count: incomes.length,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      currentPage: pageNum,
      totalAmount,
      incomes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single income by ID
// @route   GET /api/income/:id
// @access  Private
const getIncomeById = async (req, res, next) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found'
      });
    }

    res.status(200).json({
      success: true,
      income
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new income
// @route   POST /api/income
// @access  Private
const createIncome = async (req, res, next) => {
  try {
    const { title, amount, category, date, description, paymentSource } = req.body;

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

    const income = await Income.create({
      userId: req.user.id,
      title,
      amount: Number(amount),
      category,
      date: date ? new Date(date) : new Date(),
      description: description || '',
      paymentSource: paymentSource || 'Bank Transfer'
    });

    res.status(201).json({
      success: true,
      message: 'Income recorded successfully',
      income
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update income record
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = async (req, res, next) => {
  try {
    const { title, amount, category, date, description, paymentSource } = req.body;

    let income = await Income.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found'
      });
    }

    if (title !== undefined) income.title = title;
    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than zero'
        });
      }
      income.amount = Number(amount);
    }
    if (category !== undefined) income.category = category;
    if (date !== undefined) income.date = new Date(date);
    if (description !== undefined) income.description = description;
    if (paymentSource !== undefined) income.paymentSource = paymentSource;

    await income.save();

    res.status(200).json({
      success: true,
      message: 'Income record updated successfully',
      income
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete income record
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Income record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome
};
