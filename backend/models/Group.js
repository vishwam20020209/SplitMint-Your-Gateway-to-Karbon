const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  avatar: {
    type: String,
    default: null
  }
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: {
    type: [participantSchema],
    default: [],
    validate: {
      validator: function(participants) {
        // Max 3 participants + owner (primary user) = 4 total
        return participants.length <= 3;
      },
      message: 'A group can have at most 3 participants plus the owner'
    }
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

// Update the updatedAt timestamp before saving
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Group', groupSchema);
