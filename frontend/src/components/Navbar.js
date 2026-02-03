import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          💰 SplitMint
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard" className="navbar-link">
            📊 Dashboard
          </Link>
          <Link to="/groups" className="navbar-link">
            👥 Groups
          </Link>
          <Link to="/expenses" className="navbar-link">
            💵 Expenses
          </Link>
          <span className="navbar-link" style={{ color: '#6B7280' }}>
            {user?.name}
          </span>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
