const express = require('express');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Helper function to round amounts
const roundAmount = (amount) => {
  return Math.round(amount * 100) / 100;
};

// Get balance summary for a group or all groups
router.get('/', async (req, res) => {
  try {
    const { groupId } = req.query;
    
    // Get user's groups
    let groups;
    if (groupId) {
      const group = await Group.findOne({ _id: groupId, owner: req.user._id });
      if (!group) {
        return res.status(404).json({ message: 'Group not found! 🔍' });
      }
      groups = [group];
    } else {
      groups = await Group.find({ owner: req.user._id });
    }

    const balanceSummary = {};

    // Process each group
    for (const group of groups) {
      const expenses = await Expense.find({ group: group._id });
      
      // Initialize balances for all participants
      const participants = group.participants.map(p => p.name);
      const allParticipants = [...participants];
      
      // Add owner if not already included (they're always part of expenses)
      const ownerName = req.user.name;
      if (!allParticipants.includes(ownerName)) {
        allParticipants.push(ownerName);
      }

      // Initialize balance map
      const balances = {};
      allParticipants.forEach(p => {
        balances[p] = 0; // Positive = owes to others, Negative = owed by others
      });

      // Calculate balances from expenses
      expenses.forEach(expense => {
        const payer = expense.payer;
        
        // Payer paid, so they're owed money (negative balance)
        if (balances[payer] === undefined) {
          balances[payer] = 0;
        }
        
        // Distribute expense among participants
        expense.splitDetails.forEach(split => {
          const participant = split.participantName;
          
          if (balances[participant] === undefined) {
            balances[participant] = 0;
          }
          
          // If participant is not the payer, they owe money
          if (participant !== payer) {
            balances[participant] += split.amount; // They owe this amount
            balances[payer] -= split.amount; // Payer is owed this amount
          }
        });
      });

      // Round all balances
      Object.keys(balances).forEach(p => {
        balances[p] = roundAmount(balances[p]);
      });

      // Calculate who owes whom
      const debts = [];
      const credits = [];
      
      Object.keys(balances).forEach(person => {
        const balance = balances[person];
        if (balance > 0.01) {
          credits.push({ person, amount: balance }); // Person is owed money
        } else if (balance < -0.01) {
          debts.push({ person, amount: Math.abs(balance) }); // Person owes money
        }
      });

      // Generate settlement suggestions (minimal transactions)
      const settlements = generateSettlementSuggestions(debts, credits);

      balanceSummary[group._id.toString()] = {
        groupName: group.name,
        participants: allParticipants,
        balances, // Net balance per participant
        debts, // People who owe money
        credits, // People who are owed money
        settlements, // Minimal settlement suggestions
        totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0)
      };
    }

    res.json({ balanceSummary });
  } catch (error) {
    console.error('Error calculating balance:', error);
    res.status(500).json({ 
      message: 'Error calculating balance', 
      error: error.message 
    });
  }
});

// Generate minimal settlement suggestions (simplified algorithm)
function generateSettlementSuggestions(debts, credits) {
  const settlements = [];
  
  // Simple approach: match debts with credits
  let debtIndex = 0;
  let creditIndex = 0;
  
  while (debtIndex < debts.length && creditIndex < credits.length) {
    const debt = debts[debtIndex];
    const credit = credits[creditIndex];
    
    const amount = Math.min(debt.amount, credit.amount);
    
    if (amount > 0.01) {
      settlements.push({
        from: debt.person,
        to: credit.person,
        amount: roundAmount(amount)
      });
    }
    
    debt.amount = roundAmount(debt.amount - amount);
    credit.amount = roundAmount(credit.amount - amount);
    
    if (debt.amount < 0.01) debtIndex++;
    if (credit.amount < 0.01) creditIndex++;
  }
  
  return settlements;
}

// Get detailed balance breakdown for a specific participant
router.get('/participant/:participantName', async (req, res) => {
  try {
    const { participantName } = req.params;
    const { groupId } = req.query;

    let groups;
    if (groupId) {
      const group = await Group.findOne({ _id: groupId, owner: req.user._id });
      if (!group) {
        return res.status(404).json({ message: 'Group not found! 🔍' });
      }
      groups = [group];
    } else {
      groups = await Group.find({ owner: req.user._id });
    }

    const participantBalances = [];

    for (const group of groups) {
      const expenses = await Expense.find({ group: group._id });
      
      let netBalance = 0;
      const owesTo = {}; // Who this participant owes
      const owedBy = {}; // Who owes this participant
      
      expenses.forEach(expense => {
        const payer = expense.payer;
        const participant = participantName;
        
        expense.splitDetails.forEach(split => {
          if (split.participantName === participant) {
            if (payer !== participant) {
              // Participant owes the payer
              if (!owesTo[payer]) owesTo[payer] = 0;
              owesTo[payer] += split.amount;
              netBalance += split.amount;
            } else {
              // Participant paid, others owe them
              expense.splitDetails.forEach(otherSplit => {
                if (otherSplit.participantName !== participant) {
                  if (!owedBy[otherSplit.participantName]) owedBy[otherSplit.participantName] = 0;
                  owedBy[otherSplit.participantName] += otherSplit.amount;
                  netBalance -= otherSplit.amount;
                }
              });
            }
          }
        });
      });

      // Round all amounts
      Object.keys(owesTo).forEach(p => {
        owesTo[p] = roundAmount(owesTo[p]);
      });
      Object.keys(owedBy).forEach(p => {
        owedBy[p] = roundAmount(owedBy[p]);
      });
      netBalance = roundAmount(netBalance);

      participantBalances.push({
        groupName: group.name,
        groupId: group._id,
        netBalance,
        owesTo,
        owedBy
      });
    }

    res.json({ participantBalances });
  } catch (error) {
    console.error('Error fetching participant balance:', error);
    res.status(500).json({ 
      message: 'Error fetching participant balance', 
      error: error.message 
    });
  }
});

module.exports = router;
