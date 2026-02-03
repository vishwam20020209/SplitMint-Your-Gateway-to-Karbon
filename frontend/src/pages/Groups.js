import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    participants: [{ name: '', color: '#3B82F6' }]
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      setGroups(response.data.groups || []);
    } catch (err) {
      setError('Failed to load groups');
      console.error('Groups error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = () => {
    if (formData.participants.length >= 3) {
      alert('Maximum 3 participants allowed (plus you)! 👥');
      return;
    }
    setFormData({
      ...formData,
      participants: [...formData.participants, { name: '', color: '#3B82F6' }]
    });
  };

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...formData.participants];
    updatedParticipants[index][field] = value;
    setFormData({
      ...formData,
      participants: updatedParticipants
    });
  };

  const handleRemoveParticipant = (index) => {
    const updatedParticipants = formData.participants.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      participants: updatedParticipants
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty participants
    const validParticipants = formData.participants.filter(p => p.name.trim() !== '');

    try {
      const response = await api.post('/groups', {
        name: formData.name,
        participants: validParticipants
      });

      if (response.data) {
        setShowModal(false);
        setFormData({
          name: '',
          participants: [{ name: '', color: '#3B82F6' }]
        });
        fetchGroups();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This will also delete all expenses in this group! 🗑️')) {
      return;
    }

    try {
      await api.delete(`/groups/${groupId}`);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading groups... ⏳</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">👥 Groups</h1>
          <p className="page-subtitle">Manage your expense groups</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Create Group
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {groups.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No groups yet. Create your first group to start splitting expenses!</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4">
              Create Group 🎉
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {groups.map(group => (
            <div key={group._id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{group.name}</h3>
                <button
                  onClick={() => handleDelete(group._id)}
                  className="btn btn-outline"
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                >
                  🗑️
                </button>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Participants:</p>
                <div className="flex flex-wrap gap-2">
                  {group.participants.map((participant, idx) => (
                    <span
                      key={idx}
                      className="badge badge-info"
                      style={{ backgroundColor: participant.color + '20', color: participant.color }}
                    >
                      {participant.name}
                    </span>
                  ))}
                </div>
              </div>

              <Link to={`/groups/${group._id}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}>
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Group 👥</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Group Name 📝</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Roommates, Trip to NYC"
                />
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Participants 👤</label>
                  {formData.participants.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      + Add
                    </button>
                  )}
                </div>

                {formData.participants.map((participant, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="input"
                      value={participant.name}
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      placeholder="Participant name"
                    />
                    <input
                      type="color"
                      value={participant.color}
                      onChange={(e) => handleParticipantChange(index, 'color', e.target.value)}
                      style={{ width: '60px', cursor: 'pointer' }}
                    />
                    {formData.participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(index)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem' }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <p className="text-sm text-gray-600">
                  Maximum 3 participants (you are automatically included)
                </p>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Group 🎉
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

export default Groups;
