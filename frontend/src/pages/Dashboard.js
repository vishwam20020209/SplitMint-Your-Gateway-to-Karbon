import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    totalSpent: 0,
    totalOwed: 0,
    totalOwedToMe: 0
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch expenses
      const expensesResponse = await api.get('/expenses');
      const expenses = expensesResponse.data.expenses || [];
      
      // Fetch balance summary
      const balanceResponse = await api.get('/balance');
      const balances = balanceResponse.data.balanceSummary || {};
      
      // Calculate summary
      let totalSpent = 0;
      let totalOwed = 0;
      let totalOwedToMe = 0;
      
      expenses.forEach(expense => {
        totalSpent += expense.amount;
      });
      
      // Calculate what user owes and is owed
      Object.values(balances).forEach(groupBalance => {
        const userBalance = groupBalance.balances[user?.name] || 0;
        if (userBalance > 0) {
          totalOwed += userBalance;
        } else if (userBalance < 0) {
          totalOwedToMe += Math.abs(userBalance);
        }
      });
      
      setSummary({
        totalSpent: totalSpent.toFixed(2),
        totalOwed: totalOwed.toFixed(2),
        totalOwedToMe: totalOwedToMe.toFixed(2)
      });
      
      // Get recent expenses (last 5)
      setRecentExpenses(expenses.slice(0, 5));
      
      // Set balance summary
      setBalanceSummary(balances);
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading dashboard... ⏳</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name}! 👋</h1>
        <p className="page-subtitle">Here's your expense overview</p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💸</span>
            <h3 className="text-lg font-semibold">Total Spent</h3>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#3B82F6' }}>
            ${summary.totalSpent}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📤</span>
            <h3 className="text-lg font-semibold">You Owe</h3>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#EF4444' }}>
            ${summary.totalOwed}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📥</span>
            <h3 className="text-lg font-semibold">Owed to You</h3>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#10B981' }}>
            ${summary.totalOwedToMe}
          </p>
        </div>
      </div>

      {/* Balance Summary */}
      {Object.keys(balanceSummary).length > 0 && (
        <div className="card mb-4">
          <h2 className="text-xl font-bold mb-4">💼 Balance Summary by Group</h2>
          {Object.entries(balanceSummary).map(([groupId, groupBalance]) => (
            <div key={groupId} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <h3 className="font-semibold mb-2" style={{ color: '#3B82F6' }}>
                {groupBalance.groupName}
              </h3>
              
              {groupBalance.settlements && groupBalance.settlements.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p className="text-sm font-semibold mb-1">Settlement Suggestions 💡:</p>
                  {groupBalance.settlements.map((settlement, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      {settlement.from} → {settlement.to}: ${settlement.amount.toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-2">
                <p className="text-sm">
                  Your balance: <span className={groupBalance.balances[user?.name] >= 0 ? 'text-red-600' : 'text-green-600'}>
                    ${Math.abs(groupBalance.balances[user?.name] || 0).toFixed(2)} 
                    {groupBalance.balances[user?.name] >= 0 ? ' (you owe)' : ' (owed to you)'}
                  </span>
                </p>
              </div>
              
              <Link 
                to={`/groups/${groupId}`} 
                className="text-sm text-blue-600" 
                style={{ textDecoration: 'none' }}
              >
                View details →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Recent Expenses */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📋 Recent Expenses</h2>
          <Link to="/expenses" className="text-blue-600 text-sm" style={{ textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>No expenses yet. Start by creating a group and adding expenses!</p>
            <Link to="/groups" className="btn btn-primary mt-4">
              Create Group 👥
            </Link>
          </div>
        ) : (
          <div>
            {recentExpenses.map(expense => (
              <div 
                key={expense._id} 
                className="flex justify-between items-center"
                style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}
              >
                <div>
                  <p className="font-semibold">{expense.description}</p>
                  <p className="text-sm text-gray-600">
                    Paid by {expense.payer} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{expense.group?.name || 'Group'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
