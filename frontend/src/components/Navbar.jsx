import { Heart, Activity, Calendar, Stethoscope, Plus, LogOut, User } from "lucide-react";

function Navbar({
  role,
  user,
  onLogout,
  activeTab,
  setActiveTab,
}) {
  return (
    <header className="app-header" style={{ gap: "16px", flexWrap: "wrap", borderBottom: "1px solid var(--border-glass)" }}>
      <div className="brand-section">
        <div className="brand-logo">
          <Heart className="heart-icon" fill="currentColor" size={28} />
          <span>MedKeep</span>
        </div>
      </div>

      {role === "patient" ? (
        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <Activity size={18} />
            Patient Dashboard
          </button>
          <button
            className={`tab-btn ${activeTab === "medicines" ? "active" : ""}`}
            onClick={() => setActiveTab("medicines")}
          >
            <Heart size={18} />
            My Medications
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <Calendar size={18} />
            Adherence Logs
          </button>
        </nav>
      ) : (
        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === "doctor-portal" ? "active" : ""}`}
            onClick={() => setActiveTab("doctor-portal")}
          >
            <Stethoscope size={18} />
            Doctor Dashboard
          </button>
        </nav>
      )}

      <div className="patient-control" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {role === "patient" ? (
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <User size={16} style={{ color: "var(--primary)" }} />
            {user?.full_name}
          </span>
        ) : (
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--primary)", background: "var(--primary-glow)", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Stethoscope size={16} />
            Dr. {user?.full_name}
          </span>
        )}
        <button
          onClick={onLogout}
          className="btn btn-outline"
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px" }}
          title="Sign Out"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
