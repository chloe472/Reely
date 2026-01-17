import './Sidebar.css';

function Sidebar() {
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
        <a href="/profile" className="nav-item">
          <span className="nav-icon">👤</span>
          <span className="nav-text">Login/User Profile</span>
        </a>
      </div>
    </aside>
  );
}

export default Sidebar;
