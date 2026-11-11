const express = require('express');
const router = express.Router();
const {
  getOverview,
  getIncomeReport,
  getExpenseReport,
  getCategoryReport,
  getBudgetReport,
  getSavingsReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', getOverview);
router.get('/income', getIncomeReport);
router.get('/expenses', getExpenseReport);
router.get('/categories', getCategoryReport);
router.get('/budgets', getBudgetReport);
router.get('/savings', getSavingsReport);

module.exports = router;
