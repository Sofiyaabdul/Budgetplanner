const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');

// @desc    Get all categories for the user (with usage counts/amounts)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { userId: req.user.id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    const categories = await Category.find(query).sort({ type: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category name and type (income/expense)'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Category type must be either income or expense'
      });
    }

    // Check duplicate
    const existing = await Category.findOne({
      userId: req.user.id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      type
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category "${name}" already exists for ${type}`
      });
    }

    const category = await Category.create({
      userId: req.user.id,
      name: name.trim(),
      type,
      icon: icon || 'Tag',
      color: color || (type === 'income' ? '#10b981' : '#f59e0b'),
      isDefault: false
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;

    let category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const oldName = category.name;

    if (name) {
      // Check for duplicate name
      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        userId: req.user.id,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        type: category.type
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Category "${name}" already exists for ${category.type}`
        });
      }

      category.name = name.trim();
    }

    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    // If name changed, update existing transactions with this category name
    if (name && oldName !== category.name) {
      if (category.type === 'expense') {
        await Expense.updateMany(
          { userId: req.user.id, category: oldName },
          { $set: { category: category.name } }
        );
      } else {
        await Income.updateMany(
          { userId: req.user.id, category: oldName },
          { $set: { category: category.name } }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category is in use
    let inUseCount = 0;
    if (category.type === 'expense') {
      inUseCount = await Expense.countDocuments({
        userId: req.user.id,
        category: category.name
      });
    } else {
      inUseCount = await Income.countDocuments({
        userId: req.user.id,
        category: category.name
      });
    }

    if (inUseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because it is used in ${inUseCount} transaction(s). Please reassign them first.`
      });
    }

    await Category.findByIdAndDelete(category._id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
