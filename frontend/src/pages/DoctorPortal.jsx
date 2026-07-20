import { useState, useEffect } from "react";
import { UserPlus, Send, RefreshCw, Activity, Stethoscope, AlertCircle, CheckCircle, XCircle, Lock } from "lucide-react";
import api from "../services/api";

function DoctorPortal({ patients, loggedInDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(loggedInDoctor?.id.toString() || "");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // New Prescription Form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: "",
    medicine_name: "",
    dosage: "",
    frequency: 2,
    duration: 7,
    refill_threshold: 5,
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [dashboardNewPassword, setDashboardNewPassword] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState("");

  useEffect(() => {
    fetchDoctors();
    fetchNotifications();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get("doctors/");
      setDoctors(res.data);
      if (res.data.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("notifications/");
      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleDashboardPasswordReset = async (e) => {
    e.preventDefault();
    if (!dashboardNewPassword) return;

    setResetPasswordLoading(true);
    setPasswordResetMessage("");
    try {
      await api.patch(`doctors/${selectedDoctorId}/`, {
        password: dashboardNewPassword,
      });
      setPasswordResetMessage("Password updated successfully!");
      setDashboardNewPassword("");
      setTimeout(() => {
        setShowResetPasswordForm(false);
        setPasswordResetMessage("");
      }, 3500);
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordResetMessage("Failed to update password. Try again.");
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handlePrescriptionChange = (e) => {
    const value = e.target.type === "number" ? parseInt(e.target.value) || 0 : e.target.value;
    setPrescriptionForm({
      ...prescriptionForm,
      [e.target.name]: value,
    });
  };

  const handleSendPrescription = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!selectedDoctorId) {
      setMessage({ type: "error", text: "Please select or create a doctor first." });
      return;
    }

    if (!prescriptionForm.patientId) {
      setMessage({ type: "error", text: "Please select a target patient." });
      return;
    }

    try {
      const payload = {
        doctor: parseInt(selectedDoctorId),
        patient: parseInt(prescriptionForm.patientId),
        medicine_name: prescriptionForm.medicine_name,
        dosage: prescriptionForm.dosage,
        frequency: prescriptionForm.frequency,
        duration: prescriptionForm.duration,
        refill_threshold: prescriptionForm.refill_threshold,
      };

      await api.post("notifications/", payload);
      setMessage({ type: "success", text: "Prescription sent successfully to the patient!" });
      
      // Reset form
      setPrescriptionForm({
        patientId: "",
        medicine_name: "",
        dosage: "",
        frequency: 2,
        duration: 7,
        refill_threshold: 5,
      });

      // Refresh notifications list
      fetchNotifications();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to send prescription. Check backend logs." });
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? patient.full_name : `Patient #${patientId}`;
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? `Dr. ${doctor.full_name}` : `Doctor #${doctorId}`;
  };

  const activeDoctorNotifications = notifications.filter(
    (n) => n.doctor === parseInt(selectedDoctorId)
  );

  return (
    <div className="page-container" style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "left" }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "28px", margin: "0 0 4px" }}>Doctor Workspace Dashboard</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Physician monitoring console, clinical prescription controls, and compliance tracker.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchNotifications} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Dashboard Data
        </button>
      </div>

      {/* Doctor Metrics Grid */}
      <div className="dashboard-grid">
        {/* Total Doctors */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper metric-primary">
            <Stethoscope size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{doctors.length}</span>
            <span className="metric-label">Registered Physicians</span>
          </div>
        </div>

        {/* Total Prescriptions */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper metric-warning">
            <Send size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">
              {selectedDoctorId ? notifications.filter(n => n.doctor === parseInt(selectedDoctorId)).length : 0}
            </span>
            <span className="metric-label">Sent Prescriptions (Active Dr.)</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper metric-danger">
            <AlertCircle size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">
              {selectedDoctorId ? notifications.filter(n => n.doctor === parseInt(selectedDoctorId) && n.status === "Pending").length : 0}
            </span>
            <span className="metric-label">Pending Action (Active Dr.)</span>
          </div>
        </div>

        {/* Acceptance Rate */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper metric-success">
            <CheckCircle size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">
              {(() => {
                if (!selectedDoctorId) return 0;
                const docNotifications = notifications.filter(n => n.doctor === parseInt(selectedDoctorId));
                const docAccepted = docNotifications.filter(n => n.status === "Accepted").length;
                return docNotifications.length > 0 ? Math.round((docAccepted / docNotifications.length) * 100) : 0;
              })()}%
            </span>
            <span className="metric-label">Prescription Acceptance</span>
          </div>
        </div>
      </div>

      {message.text && (
        <div
          style={{
            background: message.type === "success" ? "var(--success-glow)" : "var(--danger-glow)",
            color: message.type === "success" ? "var(--success)" : "var(--danger)",
            padding: "14px 18px",
            borderRadius: "14px",
            fontSize: "14px",
            border: `1px solid ${
              message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"
            }`,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <Activity size={16} />
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "28px", alignItems: "start" }}>
        
        {/* Left Column: Doctor Selection & Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Doctor Selector */}
          <div className="glass-card">
            <h2 className="section-title">
              <Stethoscope size={20} style={{ color: "var(--primary)" }} />
              Active Physician Profile
            </h2>
            
            <div className="form-group" style={{ marginBottom: "0px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-deep)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                <Stethoscope size={24} style={{ color: "var(--primary)" }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Dr. {loggedInDoctor?.full_name}</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{loggedInDoctor?.specialty}</p>
                </div>
              </div>

              <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-glass)", paddingTop: "16px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: "100%", fontSize: "13px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onClick={() => setShowResetPasswordForm(!showResetPasswordForm)}
                >
                  <Lock size={14} />
                  {showResetPasswordForm ? "Hide Password Settings" : "Change Password"}
                </button>

                {showResetPasswordForm && (
                  <form onSubmit={handleDashboardPasswordReset} style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", display: "block", marginBottom: "4px", fontWeight: 600 }}>New Password</label>
                      <input
                        type="password"
                        required
                        className="form-control"
                        placeholder="Enter new password"
                        value={dashboardNewPassword}
                        onChange={(e) => setDashboardNewPassword(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        style={{ width: "100%", fontSize: "13px", padding: "8px 12px", background: "var(--bg-deep)" }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ fontSize: "13px", padding: "8px", width: "100%" }}
                      disabled={resetPasswordLoading}
                    >
                      {resetPasswordLoading ? "Updating..." : "Save Password"}
                    </button>
                    {passwordResetMessage && (
                      <span style={{ fontSize: "12px", color: passwordResetMessage.includes("success") ? "var(--success)" : "var(--danger)", display: "block", textAlign: "center", marginTop: "4px" }}>
                        {passwordResetMessage}
                      </span>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Prescription Form */}
          <div className="glass-card">
            <h2 className="section-title">
              <Send size={20} style={{ color: "var(--primary)" }} />
              Write Prescription
            </h2>

            <form onSubmit={handleSendPrescription}>
              <div className="form-group">
                <label>Target Patient</label>
                <select
                  name="patientId"
                  required
                  className="form-control"
                  style={{ background: "var(--bg-deep)", border: "1px solid var(--border-glass)" }}
                  value={prescriptionForm.patientId}
                  onChange={handlePrescriptionChange}
                >
                  <option value="" disabled>Select Patient...</option>
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Medicine Name</label>
                <input
                  type="text"
                  name="medicine_name"
                  required
                  placeholder="e.g. Lipitor, Lisinopril"
                  className="form-control"
                  value={prescriptionForm.medicine_name}
                  onChange={handlePrescriptionChange}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="form-group">
                <label>Dosage</label>
                <input
                  type="text"
                  name="dosage"
                  required
                  placeholder="e.g. 10mg, 1 tablet"
                  className="form-control"
                  value={prescriptionForm.dosage}
                  onChange={handlePrescriptionChange}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Frequency (x/day)</label>
                  <input
                    type="number"
                    name="frequency"
                    required
                    min="1"
                    className="form-control"
                    value={prescriptionForm.frequency}
                    onChange={handlePrescriptionChange}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (days)</label>
                  <input
                    type="number"
                    name="duration"
                    required
                    min="1"
                    className="form-control"
                    value={prescriptionForm.duration}
                    onChange={handlePrescriptionChange}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "16px", justifyContent: "center" }}
                disabled={doctors.length === 0}
              >
                Send Prescription Notification
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Sent Prescriptions Logs */}
        <div className="glass-card" style={{ minHeight: "500px" }}>
          <h2 className="section-title">Prescription Delivery Logs</h2>
          
          {activeDoctorNotifications.length === 0 ? (
            <div className="empty-state">
              <Activity className="empty-icon" size={36} />
              <h3>No Prescriptions Logged</h3>
              <p style={{ marginTop: "6px", fontSize: "14px" }}>
                Sent medication reminders will populate here, showing real-time acknowledgment statuses.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-primary)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left" }}>
                    <th style={{ padding: "12px 8px", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase" }}>Physician</th>
                    <th style={{ padding: "12px 8px", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase" }}>Patient</th>
                    <th style={{ padding: "12px 8px", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase" }}>Therapy</th>
                    <th style={{ padding: "12px 8px", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDoctorNotifications.map((notif) => {
                    const isAccepted = notif.status === "Accepted";
                    const isDeclined = notif.status === "Declined";
                    const isPending = notif.status === "Pending";

                    return (
                      <tr key={notif.id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                        <td style={{ padding: "12px 8px", fontSize: "14px" }}>
                          <span style={{ fontWeight: 600 }}>{notif.doctor_name || getDoctorName(notif.doctor)}</span>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)" }}>
                            {notif.doctor_specialty}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px", fontSize: "14px" }}>
                          {notif.patient_name || getPatientName(notif.patient)}
                        </td>
                        <td style={{ padding: "12px 8px", fontSize: "14px" }}>
                          <span style={{ fontWeight: 500 }}>{notif.medicine_name}</span>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)" }}>
                            {notif.dosage} · {notif.frequency}x/day · {notif.duration}d
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span
                            className={`status-badge ${
                              isAccepted ? "status-taken" : isDeclined ? "status-missed" : "status-pending"
                            }`}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {isAccepted && <CheckCircle size={10} />}
                            {isDeclined && <XCircle size={10} />}
                            {isPending && <AlertCircle size={10} />}
                            {notif.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>


    </div>
  );
}

export default DoctorPortal;
