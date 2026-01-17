import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
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
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="user-profile">
            <div className="user-info">
              {user.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="user-avatar"
                />
              )}
              <div className="user-details">
                <span className="user-name">{user.user_metadata?.full_name || user.email || 'User'}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
            <button onClick={handleSignOut} className="logout-button">
              Sign Out
            </button>
          </div>
        ) : (
          <a href="/login" className="nav-item">
            <span className="nav-icon">👤</span>
            <span className="nav-text">Login</span>
          </a>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
