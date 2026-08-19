import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" />
        Codex Clinical
      </div>

      <nav className="nav">
        <NavLink to="/projects" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
          المشاريع
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
          البروفايل
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <strong>
              {user.username} {isAdmin && <span className="admin-badge">أدمن</span>}
            </strong>
            متصل دلوقتي
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
