const express = require('express');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all groups for the authenticated user
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({ owner: req.user._id })
      .sort({ updatedAt: -1 });
    
    res.json({
      groups: groups || []
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ 
      message: 'Error fetching groups', 
      error: error.message 
    });
  }
});

// Get single group by ID with expense summary
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found! 🔍' 
      });
    }

    // Calculate totals from expenses
    const expenses = await Expense.find({ group: group._id });
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      group,
      totalSpent: totalSpent || 0,
      expenseCount: expenses.length
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ 
      message: 'Error fetching group', 
      error: error.message 
    });
  }
});

// Create new group
router.post('/', async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name) {
      return res.status(400).json({ 
        message: 'Group name is required! 📝' 
      });
    }

    // Validate participant count - max 3 participants
    if (participants && participants.length > 3) {
      return res.status(400).json({ 
        message: 'Maximum 3 participants allowed (plus the owner)! 👥' 
      });
    }

    // Create group with owner
    const group = new Group({
      name: name.trim(),
      owner: req.user._id,
      participants: participants || []
    });

    await group.save();

    res.status(201).json({
      message: 'Group created successfully! 🎉',
      group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ 
      message: 'Error creating group', 
      error: error.message 
    });
  }
});

// Update group (name and participants)
router.put('/:id', async (req, res) => {
  try {
    const { name, participants } = req.body;
    
    const group = await Group.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found! 🔍' 
      });
    }

    // Validate participant count
    if (participants && participants.length > 3) {
      return res.status(400).json({ 
        message: 'Maximum 3 participants allowed! 👥' 
      });
    }

    // Update fields if provided
    if (name) group.name = name.trim();
    if (participants !== undefined) group.participants = participants;

    await group.save();

    res.json({
      message: 'Group updated successfully! ✏️',
      group
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ 
      message: 'Error updating group', 
      error: error.message 
    });
  }
});

// Delete group with cascade handling for expenses
router.delete('/:id', async (req, res) => {
  try {
    const group = await Group.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found! 🔍' 
      });
    }

    // Cascade delete: remove all expenses in this group
    await Expense.deleteMany({ group: group._id });

    // Delete the group
    await Group.deleteOne({ _id: group._id });

    res.json({
      message: 'Group deleted successfully (including all expenses)! 🗑️'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ 
      message: 'Error deleting group', 
      error: error.message 
    });
  }
});

module.exports = router;
