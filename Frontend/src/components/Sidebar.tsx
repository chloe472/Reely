import { useNavigate } from 'react-router-dom';
import { authAPI, getUser } from '../services/api';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">Reely</h1>
      </div>
      
      <nav className="sidebar-nav">
        <a href="/" className="nav-item active">
          <span className="nav-text">Dashboard</span>
        </a>
        <a href="/history" className="nav-item">
          <span className="nav-text">History</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <>
            <div className="user-info">
              <span className="nav-icon">👤</span>
              <span className="user-name">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <div className="user-info" style={{ opacity: 0.7 }}>
              <span className="nav-icon">👤</span>
              <span className="user-name">Guest User (Testing)</span>
            </div>
            <a href="/login" className="nav-item" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
              <span className="nav-text">Login to save data</span>
            </a>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
