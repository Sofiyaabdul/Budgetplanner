const mongoose = require('mongoose');

const savingsTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero']
    },
    transactionType: {
      type: String,
      enum: ['deposit', 'withdrawal'],
      required: [true, 'Transaction type is required']
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

savingsTransactionSchema.index({ goalId: 1, date: -1 });

module.exports = mongoose.model('SavingsTransaction', savingsTransactionSchema);
