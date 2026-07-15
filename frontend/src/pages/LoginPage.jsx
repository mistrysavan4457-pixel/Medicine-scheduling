import { useState, useEffect } from "react";
import { Heart, User, Stethoscope, Plus, ArrowRight, Activity, Lock } from "lucide-react";
import api from "../services/api";

function LoginPage({ onLogin, defaultRole }) {
  const [selectedRole, setSelectedRole] = useState(defaultRole || "patient");
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // Registration states
  const [showRegForm, setShowRegForm] = useState(false);
  const [patientForm, setPatientForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [doctorForm, setDoctorForm] = useState({
    full_name: "",
    specialty: "",
    email: "",
    password: "",
  });

  // Forgot Password states
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Sync selectedRole when defaultRole changes on logout
  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    }
  }, [defaultRole]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patRes, docRes] = await Promise.all([
        api.get("patients/"),
        api.get("doctors/"),
      ]);
      setPatients(patRes.data);
      setDoctors(docRes.data);

      // Pre-select first item if available
      if (selectedRole === "patient" && patRes.data.length > 0) {
        setSelectedId(patRes.data[0].id.toString());
      } else if (selectedRole === "doctor" && docRes.data.length > 0) {
        setSelectedId(docRes.data[0].id.toString());
      } else {
        setSelectedId("");
      }
    } catch (err) {
      console.error("Error loading profiles:", err);
      setError("Failed to load profiles. Please verify the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Keep selection in sync when role toggles
  useEffect(() => {
    if (selectedRole === "patient" && patients.length > 0) {
      setSelectedId(patients[0].id.toString());
    } else if (selectedRole === "doctor" && doctors.length > 0) {
      setSelectedId(doctors[0].id.toString());
    } else {
      setSelectedId("");
    }
    setShowRegForm(false);
    setShowForgotForm(false);
    setError("");
    setSuccessMessage("");
    setPassword("");
  }, [selectedRole, patients, doctors]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedId) {
      setError("Please select a profile to log in.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const idNum = parseInt(selectedId);
    if (selectedRole === "patient") {
      const user = patients.find((p) => p.id === idNum);
      if (user) {
        if (user.password === password) {
          onLogin("patient", user);
        } else {
          setError("Incorrect password. Please try again.");
        }
      }
    } else {
      const user = doctors.find((d) => d.id === idNum);
      if (user) {
        if (user.password === password) {
          onLogin("doctor", user);
        } else {
          setError("Incorrect password. Please try again.");
        }
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedId) {
      setError("No profile selected.");
      return;
    }

    const idNum = parseInt(selectedId);
    const profile = selectedRole === "patient"
      ? patients.find((p) => p.id === idNum)
      : doctors.find((d) => d.id === idNum);

    if (!profile) {
      setError("Profile not found.");
      return;
    }

    // Email validation
    if (profile.email.toLowerCase() !== resetEmail.trim().toLowerCase()) {
      setError("The email address does not match this profile.");
      return;
    }

    // Call API to patch the password in backend database
    try {
      const url = selectedRole === "patient" ? `patients/${idNum}/` : `doctors/${idNum}/`;
      const res = await api.patch(url, { password: newPassword });

      if (selectedRole === "patient") {
        setPatients((prev) => prev.map((p) => p.id === idNum ? res.data : p));
      } else {
        setDoctors((prev) => prev.map((d) => d.id === idNum ? res.data : d));
      }

      setSuccessMessage("Password reset successfully! You can now log in.");
      setShowForgotForm(false);
      setPassword("");
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Failed to reset password in backend database. Please try again.");
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("patients/", patientForm);
      const newPatient = res.data;
      setPatients((prev) => [...prev, newPatient]);
      onLogin("patient", newPatient);
    } catch (err) {
      console.error(err);
      setError("Failed to register patient profile. Verify unique email.");
    }
  };

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("doctors/", doctorForm);
      const newDoctor = res.data;
      setDoctors((prev) => [...prev, newDoctor]);
      onLogin("doctor", newDoctor);
    } catch (err) {
      console.error(err);
      setError("Failed to register doctor profile. Verify unique email.");
    }
  };

  return (
    <div style={{ maxWidth: "520px", margin: "40px auto", padding: "0 20px" }}>
      {/* App Logo */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div
          className="brand-logo"
          style={{ justifyContent: "center", display: "inline-flex", fontSize: "36px" }}
        >
          <Heart className="heart-icon" fill="currentColor" size={36} style={{ marginRight: "8px" }} />
          <span>MedKeep</span>
        </div>
        <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "15px" }}>
          Your smart medication schedule and adherence partner
        </p>
      </div>

      <div className="glass-card" style={{ padding: "32px", borderRadius: "20px" }}>
        {/* Role Selector Tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-deep)",
            padding: "5px",
            borderRadius: "14px",
            border: "1px solid var(--border-glass)",
            marginBottom: "28px",
          }}
        >
          <button
            type="button"
            className={`tab-btn ${selectedRole === "patient" ? "active" : ""}`}
            style={{
              flex: 1,
              padding: "12px 8px",
              borderRadius: "10px",
              justifyContent: "center",
              border: "none",
            }}
            onClick={() => setSelectedRole("patient")}
            disabled={showForgotForm}
          >
            <User size={16} />
            Patient Portal
          </button>
          <button
            type="button"
            className={`tab-btn ${selectedRole === "doctor" ? "active" : ""}`}
            style={{
              flex: 1,
              padding: "12px 8px",
              borderRadius: "10px",
              justifyContent: "center",
              border: "none",
            }}
            onClick={() => setSelectedRole("doctor")}
            disabled={showForgotForm}
          >
            <Stethoscope size={16} />
            Doctor Portal
          </button>
        </div>

        {error && (
          <div
            style={{
              color: "var(--danger)",
              background: "var(--danger-glow)",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              marginBottom: "20px",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Activity size={16} />
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              color: "var(--success)",
              background: "var(--success-glow)",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              marginBottom: "20px",
              border: "1px solid rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Activity size={16} style={{ color: "var(--success)" }} />
            {successMessage}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--text-secondary)" }}>Loading profiles...</p>
          </div>
        ) : showForgotForm ? (
          /* Forgot Password / Reset Password Form */
          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={18} style={{ color: "var(--primary)" }} />
              Reset Password
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Confirm identity for: <strong>{
                selectedRole === "patient"
                  ? patients.find((p) => p.id === parseInt(selectedId))?.full_name
                  : doctors.find((d) => d.id === parseInt(selectedId))?.full_name
              }</strong>
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Registered Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Enter registered email"
                  className="form-control"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label>New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowForgotForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                  Submit Reset
                </button>
              </div>
            </form>
          </div>
        ) : !showRegForm ? (
          /* Profile Selector Login Form */
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                Select Your Profile
              </label>
              {selectedRole === "patient" ? (
                patients.length > 0 ? (
                  <select
                    className="form-control"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    No patient profiles registered yet.
                  </p>
                )
              ) : doctors.length > 0 ? (
                <select
                  className="form-control"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  style={{ width: "100%" }}
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.full_name} ({d.specialty})
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  No doctor profiles registered yet.
                </p>
              )}
            </div>

            {/* Password input */}
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", paddingLeft: "42px" }}
                  disabled={selectedRole === "patient" ? patients.length === 0 : doctors.length === 0}
                />
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", display: "block" }}>
                Tip: Default password is <code>123</code>
              </span>
            </div>

            {/* Forgot Password Link Button */}
            <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "24px" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ border: "none", background: "none", color: "var(--primary)", padding: 0, fontSize: "13px", height: "auto" }}
                onClick={() => {
                  setShowForgotForm(true);
                  setError("");
                  setSuccessMessage("");
                  setResetEmail("");
                  setNewPassword("");
                }}
                disabled={selectedRole === "patient" ? patients.length === 0 : doctors.length === 0}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
              disabled={selectedRole === "patient" ? patients.length === 0 : doctors.length === 0}
            >
              Enter Dashboard
              <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: "100%" }}
                onClick={() => setShowRegForm(true)}
              >
                <Plus size={16} style={{ marginRight: "4px" }} />
                Create New Profile
              </button>
            </div>
          </form>
        ) : (
          /* Profile Registration Form */
          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "16px", fontWeight: "600" }}>
              Create {selectedRole === "patient" ? "Patient" : "Doctor"} Profile
            </h3>

            {selectedRole === "patient" ? (
              <form onSubmit={handleRegisterPatient}>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    className="form-control"
                    value={patientForm.full_name}
                    onChange={(e) => setPatientForm({ ...patientForm, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    className="form-control"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1 555-0199"
                    className="form-control"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "24px" }}>
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Set account password"
                    className="form-control"
                    value={patientForm.password}
                    onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setShowRegForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                    Register & Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterDoctor}>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Physician Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Walker"
                    className="form-control"
                    value={doctorForm.full_name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Medical Specialty</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology"
                    className="form-control"
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Doctor Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. dr.walker@hospital.com"
                    className="form-control"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "24px" }}>
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Set account password"
                    className="form-control"
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setShowRegForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                    Register & Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
