const mongoose = require('mongoose');

const splitDetailSchema = new mongoose.Schema({
  participantName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    default: null
  }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  payer: {
    type: String,
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  splitMode: {
    type: String,
    enum: ['equal', 'custom', 'percentage'],
    required: true,
    default: 'equal'
  },
  participants: {
    type: [String],
    required: true,
    validate: {
      validator: function(participants) {
        return participants.length > 0;
      },
      message: 'At least one participant is required'
    }
  },
  splitDetails: {
    type: [splitDetailSchema],
    required: true
  },
  category: {
    type: String,
    default: 'Other'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
