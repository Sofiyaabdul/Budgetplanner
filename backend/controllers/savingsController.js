const SavingsGoal = require('../models/SavingsGoal');
const SavingsTransaction = require('../models/SavingsTransaction');
const Notification = require('../models/Notification');

// Helper to enrich savings goal with calculations
const enrichSavingsGoal = (goal) => {
  const target = goal.targetAmount;
  const current = goal.currentAmount;
  const remaining = Math.max(0, target - current);
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const isCompleted = current >= target;

  return {
    ...goal.toObject(),
    remaining,
    progress,
    isCompleted
  };
};

// @desc    Get all savings goals with progress
// @route   GET /api/savings
// @access  Private
const getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.user.id }).sort({ createdAt: -1 });

    const enrichedGoals = goals.map(enrichSavingsGoal);

    // Summary calculation
    const totalTarget = enrichedGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = enrichedGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalRemaining = Math.max(0, totalTarget - totalSaved);
    const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    const completedCount = enrichedGoals.filter((g) => g.status === 'completed' || g.isCompleted).length;

    res.status(200).json({
      success: true,
      count: enrichedGoals.length,
      summary: {
        totalTarget,
        totalSaved,
        totalRemaining,
        overallProgress,
        completedCount,
        activeCount: enrichedGoals.length - completedCount
      },
      goals: enrichedGoals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single savings goal with transaction history
// @route   GET /api/savings/:id
// @access  Private
const getSavingsGoalById = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    const transactions = await SavingsTransaction.find({
      goalId: goal._id,
      userId: req.user.id
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      goal: enrichSavingsGoal(goal),
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new savings goal
// @route   POST /api/savings
// @access  Private
const createSavingsGoal = async (req, res, next) => {
  try {
    const { goalName, targetAmount, currentAmount = 0, targetDate, description } = req.body;

    if (!goalName || !targetAmount || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide goal name, target amount, and target date'
      });
    }

    if (Number(targetAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be greater than zero'
      });
    }

    const initialSaved = Number(currentAmount) || 0;
    if (initialSaved < 0) {
      return res.status(400).json({
        success: false,
        message: 'Initial amount cannot be negative'
      });
    }

    const status = initialSaved >= Number(targetAmount) ? 'completed' : 'in-progress';

    const goal = await SavingsGoal.create({
      userId: req.user.id,
      goalName,
      targetAmount: Number(targetAmount),
      currentAmount: initialSaved,
      targetDate: new Date(targetDate),
      description: description || '',
      status
    });

    // If initial deposit > 0, log transaction
    if (initialSaved > 0) {
      await SavingsTransaction.create({
        userId: req.user.id,
        goalId: goal._id,
        amount: initialSaved,
        transactionType: 'deposit',
        description: 'Initial deposit'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      goal: enrichSavingsGoal(goal)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update savings goal details
// @route   PUT /api/savings/:id
// @access  Private
const updateSavingsGoal = async (req, res, next) => {
  try {
    const { goalName, targetAmount, targetDate, description } = req.body;

    let goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (goalName !== undefined) goal.goalName = goalName;
    if (targetAmount !== undefined) {
      if (Number(targetAmount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Target amount must be greater than zero'
        });
      }
      goal.targetAmount = Number(targetAmount);
    }
    if (targetDate !== undefined) goal.targetDate = new Date(targetDate);
    if (description !== undefined) goal.description = description;

    // Recalculate status
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    } else {
      goal.status = 'in-progress';
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Savings goal updated successfully',
      goal: enrichSavingsGoal(goal)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add deposit or withdrawal to a savings goal
// @route   POST /api/savings/:id/transactions
// @access  Private
const addSavingsTransaction = async (req, res, next) => {
  try {
    const { amount, transactionType, description, date } = req.body;

    if (!amount || !transactionType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amount and transaction type (deposit/withdrawal)'
      });
    }

    const txAmount = Number(amount);
    if (txAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero'
      });
    }

    if (!['deposit', 'withdrawal'].includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be either deposit or withdrawal'
      });
    }

    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (transactionType === 'withdrawal') {
      if (txAmount > goal.currentAmount) {
        return res.status(400).json({
          success: false,
          message: `Cannot withdraw $${txAmount}. Current saved balance is only $${goal.currentAmount}`
        });
      }
      goal.currentAmount -= txAmount;
    } else {
      goal.currentAmount += txAmount;
    }

    const previouslyCompleted = goal.status === 'completed';
    let newlyCompleted = false;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
      if (!previouslyCompleted) {
        newlyCompleted = true;
        // Generate congratulatory notification
        await Notification.create({
          userId: req.user.id,
          title: 'Goal Achieved!',
          message: `Congratulations! You have reached your target for "${goal.goalName}" ($${goal.currentAmount} / $${goal.targetAmount})!`,
          type: 'success',
          threshold: 'custom'
        });
      }
    } else {
      goal.status = 'in-progress';
    }

    await goal.save();

    const transaction = await SavingsTransaction.create({
      userId: req.user.id,
      goalId: goal._id,
      amount: txAmount,
      transactionType,
      date: date ? new Date(date) : new Date(),
      description: description || (transactionType === 'deposit' ? 'Savings Contribution' : 'Savings Withdrawal')
    });

    res.status(201).json({
      success: true,
      message: newlyCompleted
        ? `Congratulations! You reached your goal "${goal.goalName}"!`
        : `Successfully recorded ${transactionType} of $${txAmount}`,
      goal: enrichSavingsGoal(goal),
      transaction,
      newlyCompleted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transactions for a specific savings goal
// @route   GET /api/savings/:id/transactions
// @access  Private
const getSavingsTransactions = async (req, res, next) => {
  try {
    const transactions = await SavingsTransaction.find({
      goalId: req.params.id,
      userId: req.user.id
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/savings/:id
// @access  Private
const deleteSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    // Also delete associated transactions
    await SavingsTransaction.deleteMany({ goalId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Savings goal and transaction history deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavingsGoals,
  getSavingsGoalById,
  createSavingsGoal,
  updateSavingsGoal,
  addSavingsTransaction,
  getSavingsTransactions,
  deleteSavingsGoal
};
