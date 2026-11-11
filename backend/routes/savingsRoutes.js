const express = require('express');
const router = express.Router();
const {
  getSavingsGoals,
  getSavingsGoalById,
  createSavingsGoal,
  updateSavingsGoal,
  addSavingsTransaction,
  getSavingsTransactions,
  deleteSavingsGoal
} = require('../controllers/savingsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSavingsGoals)
  .post(createSavingsGoal);

router.route('/:id')
  .get(getSavingsGoalById)
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

router.route('/:id/transactions')
  .get(getSavingsTransactions)
  .post(addSavingsTransaction);

module.exports = router;
