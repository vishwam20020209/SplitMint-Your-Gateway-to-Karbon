import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';

const Expenses = () => {
  const [searchParams] = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  const { user } = useAuth();
  
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    groupId: groupIdParam || '',
    participant: '',
    search: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    payer: user?.name || '',
    groupId: groupIdParam || '',
    participants: [],
    splitMode: 'equal',
    customAmounts: [],
    percentages: [],
    category: 'Other'
  });

  useEffect(() => {
    fetchGroups();
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups || []);
      
      // If groupId param exists, set it in form
      if (groupIdParam) {
        const group = response.data.groups.find(g => g._id === groupIdParam);
        if (group) {
          const allParticipants = [user?.name, ...group.participants.map(p => p.name)];
          setFormData(prev => ({
            ...prev,
            groupId: groupIdParam,
            payer: user?.name || '',
            participants: allParticipants
          }));
        }
      }
    } catch (err) {
      console.error('Groups error:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/expenses?${params.toString()}`);
      setExpenses(response.data.expenses || []);
    } catch (err) {
      setError('Failed to load expenses');
      console.error('Expenses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    if (group) {
      const allParticipants = [user?.name, ...group.participants.map(p => p.name)];
      setFormData(prev => ({
        ...prev,
        groupId,
        participants: allParticipants,
        payer: user?.name || allParticipants[0] || '',
        customAmounts: new Array(allParticipants.length).fill(0),
        percentages: new Array(allParticipants.length).fill(100 / allParticipants.length)
      }));
    }
  };

  const handleSplitModeChange = (splitMode) => {
    setFormData(prev => {
      if (splitMode === 'equal') {
        return { ...prev, splitMode };
      } else if (splitMode === 'custom') {
        const equalAmount = prev.amount ? (parseFloat(prev.amount) / prev.participants.length).toFixed(2) : 0;
        return {
          ...prev,
          splitMode,
          customAmounts: new Array(prev.participants.length).fill(equalAmount)
        };
      } else if (splitMode === 'percentage') {
        const equalPercent = (100 / prev.participants.length).toFixed(2);
        return {
          ...prev,
          splitMode,
          percentages: new Array(prev.participants.length).fill(equalPercent)
        };
      }
      return { ...prev, splitMode };
    });
  };

  const handleAmountChange = (amount) => {
    setFormData(prev => {
      const newAmount = amount;
      let updatedData = { ...prev, amount: newAmount };
      
      // Recalculate equal split if amount changes
      if (prev.splitMode === 'equal' && prev.participants.length > 0) {
        const equalAmount = (parseFloat(newAmount) / prev.participants.length).toFixed(2);
        updatedData.customAmounts = new Array(prev.participants.length).fill(equalAmount);
      }
      
      return updatedData;
    });
  };

  const handleCustomAmountChange = (index, value) => {
    setFormData(prev => {
      const newCustomAmounts = [...prev.customAmounts];
      newCustomAmounts[index] = parseFloat(value) || 0;
      return { ...prev, customAmounts: newCustomAmounts };
    });
  };

  const handlePercentageChange = (index, value) => {
    setFormData(prev => {
      const newPercentages = [...prev.percentages];
      newPercentages[index] = parseFloat(value) || 0;
      return { ...prev, percentages: newPercentages };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/expenses', formData);
      setShowModal(false);
      setFormData({
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        payer: user?.name || '',
        groupId: groupIdParam || '',
        participants: [],
        splitMode: 'equal',
        customAmounts: [],
        percentages: [],
        category: 'Other'
      });
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading expenses... ⏳</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">💵 Expenses</h1>
          <p className="page-subtitle">Manage your expenses and splits</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Add Expense
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Filters */}
      <div className="card mb-4">
        <h3 className="font-semibold mb-3">🔍 Filters</h3>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Group</label>
            <select
              className="input"
              value={filters.groupId}
              onChange={(e) => setFilters({ ...filters, groupId: e.target.value })}
            >
              <option value="">All Groups</option>
              {groups.map(group => (
                <option key={group._id} value={group._id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Search Description</label>
            <input
              type="text"
              className="input"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search expenses..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💵</div>
            <p>No expenses found. Add your first expense!</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4">
              Add Expense 💵
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
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
                  Group: <Link to={`/groups/${expense.group?._id}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>
                    {expense.group?.name || 'Unknown'}
                  </Link>
                </p>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Split:</p>
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Expense 💵</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Group *</label>
                <select
                  className="input"
                  value={formData.groupId}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  required
                >
                  <option value="">Select a group</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="e.g., Dinner at restaurant"
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Amount ($) *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Paid By *</label>
                <select
                  className="input"
                  value={formData.payer}
                  onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                  required
                >
                  {formData.participants.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Split Mode *</label>
                <select
                  className="input"
                  value={formData.splitMode}
                  onChange={(e) => handleSplitModeChange(e.target.value)}
                  required
                >
                  <option value="equal">Equal Split</option>
                  <option value="custom">Custom Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              {/* Split Details */}
              {formData.splitMode === 'custom' && formData.participants.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Custom Amounts (must sum to ${formData.amount || '0.00'})</label>
                  {formData.participants.map((participant, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <span style={{ minWidth: '150px', paddingTop: '0.625rem' }}>{participant}:</span>
                      <input
                        type="number"
                        className="input"
                        value={formData.customAmounts[index] || 0}
                        onChange={(e) => handleCustomAmountChange(index, e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              )}

              {formData.splitMode === 'percentage' && formData.participants.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Percentages (must sum to 100%)</label>
                  {formData.participants.map((participant, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <span style={{ minWidth: '150px', paddingTop: '0.625rem' }}>{participant}:</span>
                      <input
                        type="number"
                        className="input"
                        value={formData.percentages[index] || 0}
                        onChange={(e) => handlePercentageChange(index, e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                      />
                      <span style={{ paddingTop: '0.625rem' }}>%</span>
                    </div>
                  ))}
                </div>
              )}

              {formData.splitMode === 'equal' && formData.participants.length > 0 && (
                <div className="form-group">
                  <p className="text-sm text-gray-600">
                    Amount will be split equally among {formData.participants.length} participants:
                    {formData.amount && ` $${(parseFloat(formData.amount) / formData.participants.length).toFixed(2)} each`}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Add Expense 💵
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
