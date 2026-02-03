const express = require('express');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Helper function to round to 2 decimal places - for consistent rounding
const roundAmount = (amount) => {
  return Math.round(amount * 100) / 100;
};

// Helper function to calculate split details based on mode
const calculateSplitDetails = (amount, participants, splitMode, customAmounts = null, percentages = null) => {
  const splitDetails = [];
  
  if (splitMode === 'equal') {
    // Equal split: divide amount equally among all participants
    const perPerson = roundAmount(amount / participants.length);
    let totalAllocated = 0;
    
    participants.forEach((participant, index) => {
      if (index === participants.length - 1) {
        // Last person gets the remainder to ensure total adds up
        splitDetails.push({
          participantName: participant,
          amount: roundAmount(amount - totalAllocated)
        });
      } else {
        splitDetails.push({
          participantName: participant,
          amount: perPerson
        });
        totalAllocated += perPerson;
      }
    });
  } else if (splitMode === 'custom') {
    // Custom amount split: use provided amounts
    if (!customAmounts || customAmounts.length !== participants.length) {
      throw new Error('Custom amounts must be provided for all participants');
    }
    
    const totalCustom = customAmounts.reduce((sum, amt) => sum + amt, 0);
    if (Math.abs(totalCustom - amount) > 0.01) {
      throw new Error('Custom amounts must sum to the total expense amount');
    }
    
    participants.forEach((participant, index) => {
      splitDetails.push({
        participantName: participant,
        amount: roundAmount(customAmounts[index])
      });
    });
  } else if (splitMode === 'percentage') {
    // Percentage split: calculate amounts based on percentages
    if (!percentages || percentages.length !== participants.length) {
      throw new Error('Percentages must be provided for all participants');
    }
    
    const totalPercentage = percentages.reduce((sum, pct) => sum + pct, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Percentages must sum to 100');
    }
    
    let totalAllocated = 0;
    participants.forEach((participant, index) => {
      if (index === participants.length - 1) {
        // Last person gets the remainder to ensure total adds up
        splitDetails.push({
          participantName: participant,
          amount: roundAmount(amount - totalAllocated),
          percentage: percentages[index]
        });
      } else {
        const calculatedAmount = roundAmount((amount * percentages[index]) / 100);
        splitDetails.push({
          participantName: participant,
          amount: calculatedAmount,
          percentage: percentages[index]
        });
        totalAllocated += calculatedAmount;
      }
    });
  }
  
  return splitDetails;
};

// Get all expenses (with filters)
router.get('/', async (req, res) => {
  try {
    const { groupId, participant, startDate, endDate, minAmount, maxAmount, search } = req.query;
    
    // Get all groups owned by user to filter expenses
    const userGroups = await Group.find({ owner: req.user._id });
    const groupIds = userGroups.map(g => g._id);
    
    // Build query
    let query = { group: { $in: groupIds } };
    
    if (groupId) {
      // Verify group belongs to user
      const group = await Group.findOne({ _id: groupId, owner: req.user._id });
      if (!group) {
        return res.status(404).json({ message: 'Group not found! 🔍' });
      }
      query.group = groupId;
    }
    
    // Filter by participant
    if (participant) {
      query.participants = participant;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Filter by amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }
    
    // Search by description
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }
    
    const expenses = await Expense.find(query)
      .populate('group', 'name')
      .sort({ date: -1, createdAt: -1 });
    
    res.json({
      expenses: expenses || []
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ 
      message: 'Error fetching expenses', 
      error: error.message 
    });
  }
});

// Get single expense by ID
router.get('/:id', async (req, res) => {
  try {
    // Verify expense belongs to user's group
    const expense = await Expense.findById(req.params.id).populate('group', 'name owner');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found! 🔍' });
    }
    
    // Check if user owns the group
    if (expense.group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied! 🚫' });
    }
    
    res.json({ expense });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ 
      message: 'Error fetching expense', 
      error: error.message 
    });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { 
      amount, 
      description, 
      date, 
      payer, 
      groupId, 
      participants, 
      splitMode, 
      customAmounts, 
      percentages,
      category 
    } = req.body;

    // Validate required fields
    if (!amount || !description || !payer || !groupId || !participants || !splitMode) {
      return res.status(400).json({ 
        message: 'Missing required fields! Please provide: amount, description, payer, groupId, participants, and splitMode 📝' 
      });
    }

    // Verify group belongs to user
    const group = await Group.findOne({ _id: groupId, owner: req.user._id });
    if (!group) {
      return res.status(404).json({ message: 'Group not found! 🔍' });
    }

    // Validate participants
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ 
        message: 'At least one participant is required! 👥' 
      });
    }

    // Calculate split details
    let splitDetails;
    try {
      splitDetails = calculateSplitDetails(
        parseFloat(amount), 
        participants, 
        splitMode, 
        customAmounts, 
        percentages
      );
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Create expense
    const expense = new Expense({
      amount: parseFloat(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      payer,
      group: groupId,
      participants,
      splitMode,
      splitDetails,
      category: category || 'Other'
    });

    await expense.save();

    res.status(201).json({
      message: 'Expense added successfully! 🎉',
      expense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ 
      message: 'Error creating expense', 
      error: error.message 
    });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('group', 'owner');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found! 🔍' });
    }
    
    // Check if user owns the group
    if (expense.group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied! 🚫' });
    }

    const { 
      amount, 
      description, 
      date, 
      payer, 
      participants, 
      splitMode, 
      customAmounts, 
      percentages,
      category 
    } = req.body;

    // Update fields if provided
    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (description !== undefined) expense.description = description.trim();
    if (date !== undefined) expense.date = new Date(date);
    if (payer !== undefined) expense.payer = payer;
    if (participants !== undefined) expense.participants = participants;
    if (splitMode !== undefined) expense.splitMode = splitMode;
    if (category !== undefined) expense.category = category;

    // Recalculate split details if relevant fields changed
    if (amount !== undefined || participants !== undefined || splitMode !== undefined || 
        customAmounts !== undefined || percentages !== undefined) {
      try {
        expense.splitDetails = calculateSplitDetails(
          expense.amount, 
          expense.participants, 
          expense.splitMode, 
          customAmounts, 
          percentages
        );
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    await expense.save();

    res.json({
      message: 'Expense updated successfully! ✏️',
      expense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ 
      message: 'Error updating expense', 
      error: error.message 
    });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('group', 'owner');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found! 🔍' });
    }
    
    // Check if user owns the group
    if (expense.group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied! 🚫' });
    }

    await Expense.deleteOne({ _id: expense._id });

    res.json({
      message: 'Expense deleted successfully! 🗑️'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ 
      message: 'Error deleting expense', 
      error: error.message 
    });
  }
});

module.exports = router;
