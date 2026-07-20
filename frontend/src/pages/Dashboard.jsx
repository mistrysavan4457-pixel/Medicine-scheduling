import { useEffect, useState } from "react";
import {
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Check,
  RefreshCw,
  BellRing,
  Stethoscope,
  Lock
} from "lucide-react";
import api from "../services/api";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard({ selectedPatientId, refreshTrigger }) {
  const [medicines, setMedicines] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [pendingNotifs, setPendingNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores ID of schedule being updated
  const [notifActionLoading, setNotifActionLoading] = useState(null); // stores ID of notification being updated

  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [dashboardNewPassword, setDashboardNewPassword] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedPatientId, refreshTrigger]);

  const fetchData = async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    try {
      const [medRes, schedRes, notifRes] = await Promise.all([
        api.get("medicines/"),
        api.get("schedules/"),
        api.get("notifications/"),
      ]);

      const patientMeds = medRes.data.filter(
        (m) => m.patient === parseInt(selectedPatientId)
      );
      setMedicines(patientMeds);

      const medIds = patientMeds.map((m) => m.id);
      const patientSchedules = schedRes.data.filter((s) =>
        medIds.includes(s.medicine)
      );
      setSchedules(patientSchedules);

      const patientNotifs = notifRes.data.filter(
        (n) => n.patient === parseInt(selectedPatientId) && n.status === "Pending"
      );
      setPendingNotifs(patientNotifs);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptNotification = async (notifId) => {
    setNotifActionLoading(notifId);
    try {
      await api.patch(`notifications/${notifId}/`, { status: "Accepted" });
      await fetchData();
    } catch (err) {
      console.error("Error accepting notification:", err);
      alert("Failed to accept prescription. Please try again.");
    } finally {
      setNotifActionLoading(null);
    }
  };

  const handleDeclineNotification = async (notifId) => {
    setNotifActionLoading(notifId);
    try {
      await api.patch(`notifications/${notifId}/`, { status: "Declined" });
      await fetchData();
    } catch (err) {
      console.error("Error declining notification:", err);
      alert("Failed to decline prescription. Please try again.");
    } finally {
      setNotifActionLoading(null);
    }
  };

  const handleDashboardPasswordReset = async (e) => {
    e.preventDefault();
    if (!dashboardNewPassword) return;

    setResetPasswordLoading(true);
    setPasswordResetMessage("");
    try {
      await api.patch(`patients/${selectedPatientId}/`, {
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

  const markAsTaken = async (scheduleId) => {
    setActionLoading(scheduleId);
    try {
      await api.patch(`schedules/${scheduleId}/`, {
        status: "Taken"
      });
      // Refresh local data
      await fetchData();
    } catch (err) {
      console.error("Error marking schedule as taken:", err);
      alert("Failed to record dose. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const getMedicineName = (medId) => {
    const med = medicines.find((m) => m.id === medId);
    return med ? med.medicine_name : "Unknown Medicine";
  };

  const getMedicineDosage = (medId) => {
    const med = medicines.find((m) => m.id === medId);
    return med ? med.dosage : "";
  };

  // Metrics calculation
  const totalMeds = medicines.length;
  const totalSchedules = schedules.length;
  const takenSchedules = schedules.filter((s) => s.status === "Taken").length;
  const pendingSchedules = schedules.filter((s) => s.status === "Pending").length;
  const missedSchedules = schedules.filter((s) => s.status === "Missed").length;
  
  const adherenceRate = totalSchedules > 0 
    ? Math.round((takenSchedules / totalSchedules) * 100) 
    : 0;

  // Chart data configuration
  const chartData = {
    labels: ['Taken', 'Pending', 'Missed'],
    datasets: [
      {
        data: [takenSchedules, pendingSchedules, missedSchedules],
        backgroundColor: [
          'hsl(150, 85%, 45%)',   // Green for Taken
          'hsl(250, 95%, 70%)',   // Purple/Primary for Pending
          'hsl(0, 90%, 60%)'      // Red for Missed
        ],
        borderColor: [
          'rgba(16, 185, 129, 0.2)',
          'rgba(99, 102, 241, 0.2)',
          'rgba(239, 68, 68, 0.2)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Get computed theme values for Chart.js
  const isDark = getComputedStyle(document.documentElement).getPropertyValue('--bg-deep').trim() !== '#f1f5f9';
  const labelColor = isDark ? '#f3f4f6' : '#334155';
  const tooltipBg = isDark ? '#131926' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const tooltipTextColor = isDark ? '#f3f4f6' : '#334155';
  const tooltipTitleColor = isDark ? '#ffffff' : '#0f172a';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: labelColor,
          font: {
            family: 'Outfit',
            size: 11,
          },
          boxWidth: 12,
          padding: 8,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTitleColor,
        bodyColor: tooltipTextColor,
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Outfit', size: 11 },
        borderColor: tooltipBorder,
        borderWidth: 1,
      },
    },
    cutout: '70%',
  };

  // Refill count calculation
  const refillCount = medicines.filter((medicine) => {
    const medPending = schedules.filter(
      (s) => s.medicine === medicine.id && s.status === "Pending"
    ).length;
    return medPending <= medicine.refill_threshold;
  }).length;

  // Schedule filtering (Today's schedules)
  const getTodaySchedules = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayItems = schedules.filter((s) => {
      const sDate = new Date(s.reminder_time);
      return sDate >= today && sDate < tomorrow;
    });

    // Sort by reminder time
    todayItems.sort((a, b) => new Date(a.reminder_time) - new Date(b.reminder_time));
    return todayItems;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const todaySchedules = getTodaySchedules();

  if (loading && totalMeds === 0) {
    return (
      <div className="empty-state">
        <RefreshCw className="empty-icon animate-spin" size={32} />
        <p>Loading dashboard analytics...</p>
      </div>
    );
  }

  if (!selectedPatientId) {
    return (
      <div className="empty-state glass-card">
        <Activity className="empty-icon" size={40} />
        <h3>No Patient Selected</h3>
        <p style={{ marginTop: "8px" }}>
          Please select or register a patient profile from the header to initialize the analytics dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ textAlign: "left" }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "28px", margin: "0 0 4px" }}>Patient Dashboard Overview</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Real-time adherence score, medication stock levels, and daily dose checklist.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}>
          <RefreshCw size={14} />
          Refresh Dashboard
        </button>
      </div>

      {/* Interactive Prescription Notification Center */}
      {pendingNotifs && pendingNotifs.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.16)",
              borderRadius: "20px",
              padding: "20px 24px",
              boxShadow: "0 10px 30px rgba(99, 102, 241, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  boxShadow: "0 0 10px var(--primary)",
                  animation: "softPulse 2s infinite"
                }}
              />
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Patient Notification Center ({pendingNotifs.length} New Action Required)
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingNotifs.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderRadius: "16px",
                    backgroundColor: "rgba(99, 102, 241, 0.03)",
                    borderLeft: "6px solid var(--primary)",
                    border: "1px solid rgba(99, 102, 241, 0.1)",
                    borderLeftWidth: "6px",
                    flexWrap: "wrap",
                    gap: "16px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1", minWidth: "280px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "var(--primary-glow)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                      }}
                    >
                      <BellRing size={20} className="animate-bounce" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 4px", color: "var(--text-primary)" }}>
                        New Prescription from Dr. {notif.doctor_name}
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                        Medication: <strong style={{ color: "var(--text-primary)" }}>{notif.medicine_name} {notif.dosage}</strong> · Frequency: <strong style={{ color: "var(--text-primary)" }}>{notif.frequency}x/day</strong> for <strong style={{ color: "var(--text-primary)" }}>{notif.duration} days</strong>
                      </p>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                        Physician Specialty: {notif.doctor_specialty}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      className="btn btn-success"
                      onClick={() => handleAcceptNotification(notif.id)}
                      disabled={notifActionLoading !== null}
                      style={{ padding: "10px 18px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)" }}
                    >
                      {notifActionLoading === notif.id ? (
                        "Accepting..."
                      ) : (
                        <>
                          <Check size={14} />
                          Accept & Schedule
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline btn-discontinue"
                      onClick={() => handleDeclineNotification(notif.id)}
                      disabled={notifActionLoading !== null}
                      style={{ border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--text-secondary)", padding: "10px 18px" }}
                    >
                      {notifActionLoading === notif.id ? "Declining..." : "Decline"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="dashboard-grid">
        {/* Adherence Rate */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper metric-success">
            <CheckCircle size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{adherenceRate}%</span>
            <span className="metric-label">Adherence Score</span>
          </div>
        </div>

        {/* Active Meds */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper metric-primary">
            <Heart size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{totalMeds}</span>
            <span className="metric-label">Active Therapies</span>
          </div>
        </div>

        {/* Refills Alert */}
        <div className="glass-card metric-card">
          <div className={`metric-icon-wrapper ${refillCount > 0 ? "metric-danger" : "metric-warning"}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{refillCount}</span>
            <span className="metric-label">Refill Alerts</span>
          </div>
        </div>

        {/* Total Reminders */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper metric-warning">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{pendingSchedules}</span>
            <span className="metric-label">Upcoming Doses</span>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="dashboard-sections">
        {/* Daily Checklist */}
        <div className="glass-card">
          <h2 className="section-title">
            <BellRing size={20} style={{ color: "var(--primary)" }} />
            Today's Checklist Timeline
          </h2>
          
          {todaySchedules.length === 0 ? (
            <div className="empty-state">
              <CheckCircle className="empty-icon" size={36} style={{ color: "var(--success)" }} />
              <h3>All Clear for Today!</h3>
              <p style={{ marginTop: "6px", fontSize: "14px" }}>
                There are no reminders scheduled for today. New schedules will appear as you add medications.
              </p>
            </div>
          ) : (
            <div className="schedule-list">
              {todaySchedules.map((item) => {
                const isTaken = item.status === "Taken";
                const isMissed = item.status === "Missed";
                const isPending = item.status === "Pending";

                return (
                  <div
                    key={item.id}
                    className={`schedule-item ${
                      isTaken ? "taken" : isMissed ? "missed" : "pending"
                    }`}
                  >
                    <div className="schedule-med-info">
                      <div className="schedule-time-badge">
                        {formatTime(item.reminder_time)}
                      </div>
                      <div className="schedule-med-details">
                        <h3>{getMedicineName(item.medicine)}</h3>
                        <p>{getMedicineDosage(item.medicine)}</p>
                      </div>
                    </div>

                    <div className="schedule-actions">
                      {isTaken ? (
                        <span className="status-badge status-taken">Taken</span>
                      ) : isMissed ? (
                        <span className="status-badge status-missed">Missed</span>
                      ) : (
                        <>
                          <span className="status-badge status-pending">Pending</span>
                          <button
                            className="btn btn-success"
                            onClick={() => markAsTaken(item.id)}
                            disabled={actionLoading === item.id}
                          >
                            {actionLoading === item.id ? (
                              "..."
                            ) : (
                              <>
                                <Check size={14} />
                                Take
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Sidebar & Account Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Quick Tips / Info Sidebar */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "18px", margin: 0 }}>Therapy Compliance</h2>
            
            {totalSchedules > 0 ? (
              <div style={{ height: "180px", margin: "10px 0", position: "relative" }}>
                <Doughnut data={chartData} options={chartOptions} />
                <div
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)" }}>{adherenceRate}%</div>
                  <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Adherence</div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: "140px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed var(--border-glass)",
                  borderRadius: "12px",
                  margin: "10px 0",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  padding: "20px",
                  textAlign: "center"
                }}
              >
                No compliance data available. Prescribe medications from a doctor to generate daily schedules.
              </div>
            )}

            <div style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)" }}>
              <p style={{ marginBottom: "12px" }}>
                Adherence refers to how closely patients follow their prescribed therapy plan.
              </p>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <h4 style={{ color: "var(--text-primary)", fontWeight: 600 }}>💡 Compliance Tip</h4>
                <p style={{ fontSize: "13px" }}>
                  Keep your adherence score above <strong>90%</strong> to maximize treatment efficacy and prevent refills from running out unexpectedly.
                </p>
              </div>
              
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginTop: "12px"
                }}
              >
                <h4 style={{ color: "var(--text-primary)", fontWeight: 600 }}>🚀 Automation</h4>
                <p style={{ fontSize: "13px" }}>
                  Checking off a pending reminder updates compliance data immediately and schedules log records without requiring manual double entries.
                </p>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="glass-card">
            <h2 style={{ fontSize: "18px", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={18} style={{ color: "var(--primary)" }} />
              Account Security
            </h2>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: "100%", fontSize: "13px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              onClick={() => setShowResetPasswordForm(!showResetPasswordForm)}
            >
              <Lock size={14} />
              {showResetPasswordForm ? "Hide Settings" : "Change Password"}
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
                    style={{ width: "100%", fontSize: "13px", padding: "8px 12px", background: "var(--bg-deep)", border: "1px solid var(--border-glass)" }}
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
    </div>
  );
}

export default Dashboard;
