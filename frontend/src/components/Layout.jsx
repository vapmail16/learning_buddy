import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export function Layout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-brand">Learning Buddy</Link>
        <nav className="layout-nav">
          {token ? (
            <>
              <Link to="/">Courses</Link>
              <span className="layout-user">{user?.email}</span>
              <button type="button" onClick={handleLogout} className="layout-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
