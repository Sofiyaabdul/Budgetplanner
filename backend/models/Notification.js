const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['warning', 'danger', 'info', 'success'],
      default: 'info'
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    relatedBudgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      default: null
    },
    threshold: {
      type: String,
      enum: ['80', '100', 'exceeded', 'custom', 'none'],
      default: 'none'
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
