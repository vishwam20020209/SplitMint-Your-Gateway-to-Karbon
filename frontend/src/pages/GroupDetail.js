import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch group
      const groupResponse = await api.get(`/groups/${id}`);
      setGroup(groupResponse.data.group);
      
      // Fetch expenses for this group
      const expensesResponse = await api.get(`/expenses?groupId=${id}`);
      setExpenses(expensesResponse.data.expenses || []);
      
      // Fetch balance summary
      const balanceResponse = await api.get(`/balance?groupId=${id}`);
      const balanceData = balanceResponse.data.balanceSummary;
      setBalanceSummary(balanceData[id] || null);
      
    } catch (err) {
      setError('Failed to load group details');
      console.error('Group detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense? 🗑️')) {
      return;
    }

    try {
      await api.delete(`/expenses/${expenseId}`);
      fetchGroupDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading group details... ⏳</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="page-container">
        <div className="error">Group not found! 🔍</div>
      </div>
    );
  }

  const allParticipants = [user?.name, ...group.participants.map(p => p.name)];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-center mb-2">
          <h1 className="page-title">{group.name} 👥</h1>
          <Link to="/groups" className="btn btn-outline">
            ← Back to Groups
          </Link>
        </div>
        <p className="page-subtitle">
          Total Expenses: ${balanceSummary?.totalExpenses?.toFixed(2) || '0.00'}
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Balance Summary */}
      {balanceSummary && (
        <div className="card mb-4">
          <h2 className="text-xl font-bold mb-4">💼 Balance Summary</h2>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Net Balances:</h3>
            {Object.entries(balanceSummary.balances || {}).map(([person, balance]) => (
              <div key={person} className="flex justify-between items-center mb-2">
                <span>{person}</span>
                <span className={balance >= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {balance >= 0 ? `Owes $${balance.toFixed(2)}` : `Owed $${Math.abs(balance).toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>

          {balanceSummary.settlements && balanceSummary.settlements.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Settlement Suggestions 💡:</h3>
              {balanceSummary.settlements.map((settlement, idx) => (
                <div key={idx} className="text-sm text-gray-700 mb-1">
                  <span className="font-semibold">{settlement.from}</span> should pay{' '}
                  <span className="font-semibold">${settlement.amount.toFixed(2)}</span> to{' '}
                  <span className="font-semibold">{settlement.to}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expenses List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📋 Expenses</h2>
          <Link to={`/expenses?groupId=${id}`} className="btn btn-primary">
            + Add Expense
          </Link>
        </div>

        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💵</div>
            <p>No expenses yet. Add your first expense!</p>
            <Link to={`/expenses?groupId=${id}`} className="btn btn-primary mt-4">
              Add Expense 💵
            </Link>
          </div>
        ) : (
          <div>
            {expenses.map(expense => (
              <div
                key={expense._id}
                className="flex justify-between items-start"
                style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}
              >
                <div style={{ flex: 1 }}>
                  <p className="font-semibold text-lg">{expense.description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Paid by <span className="font-semibold">{expense.payer}</span> • {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Split mode: <span className="badge badge-info">{expense.splitMode}</span>
                  </p>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Split details:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {expense.splitDetails.map((split, idx) => (
                        <span key={idx} className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                          {split.participantName}: ${split.amount.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-2xl" style={{ color: '#3B82F6' }}>
                    ${expense.amount.toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleDeleteExpense(expense._id)}
                    className="btn btn-danger mt-2"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
