import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import MedicineForm from "./components/MedicineForm";
import MedicineList from "./components/MedicineList";
import ReminderHistory from "./components/ReminderHistory";
import DoctorPortal from "./pages/DoctorPortal";
import LoginPage from "./pages/LoginPage";
import api from "./services/api";

function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [lastRole, setLastRole] = useState("patient");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [seenNotificationIds, setSeenNotificationIds] = useState(new Set());
  const [activeToast, setActiveToast] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Ask for browser notification permission
  useEffect(() => {
    if (role === "patient" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [role]);

  // When patient selection changes, clear toast and initialize seen notification IDs
  useEffect(() => {
    if (!selectedPatientId) return;
    setActiveToast(null);

    const initializeSeenNotifications = async () => {
      try {
        const response = await api.get("notifications/");
        const patientNotifs = response.data.filter(
          (n) => n.patient === parseInt(selectedPatientId)
        );
        const ids = new Set(patientNotifs.map((n) => n.id));
        setSeenNotificationIds(ids);
      } catch (err) {
        console.error("Error initializing seen notifications:", err);
      }
    };

    initializeSeenNotifications();
  }, [selectedPatientId]);

  // Polling for new notifications
  useEffect(() => {
    if (role !== "patient" || !selectedPatientId) return;

    const playChime = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (e) {
        console.error("Audio error:", e);
      }
    };

    const pollNotifications = async () => {
      try {
        const response = await api.get("notifications/");
        const pendingNotifs = response.data.filter(
          (n) => n.patient === parseInt(selectedPatientId) && n.status === "Pending"
        );

        let foundNew = false;
        let newNotifToToast = null;

        setSeenNotificationIds((prevSeen) => {
          const updatedSeen = new Set(prevSeen);
          for (const notif of pendingNotifs) {
            if (!updatedSeen.has(notif.id)) {
              updatedSeen.add(notif.id);
              foundNew = true;
              newNotifToToast = notif;
            }
          }
          return updatedSeen;
        });

        if (foundNew && newNotifToToast) {
          // Play notification chime
          playChime();

          // Show floating phone toast
          setActiveToast(newNotifToToast);

          // Auto-hide toast after 8 seconds
          setTimeout(() => {
            setActiveToast((curr) => (curr && curr.id === newNotifToToast.id ? null : curr));
          }, 8000);

          // Native web notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`New Prescription from Dr. ${newNotifToToast.doctor_name}`, {
              body: `Medication: ${newNotifToToast.medicine_name} ${newNotifToToast.dosage}. Please accept on your MedKeep dashboard.`,
            });
          }

          // Trigger dashboard reload
          setRefreshTrigger((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Error polling notifications:", err);
      }
    };

    // Poll immediately, then every 5 seconds
    pollNotifications();
    const intervalId = setInterval(pollNotifications, 5000);

    return () => clearInterval(intervalId);
  }, [role, selectedPatientId]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (selectId = null) => {
    setLoading(true);
    try {
      const response = await api.get("patients/");
      const data = response.data;
      setPatients(data);
      
      if (data.length > 0) {
        if (selectId) {
          setSelectedPatientId(selectId);
        } else if (!selectedPatientId) {
          setSelectedPatientId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching patients list:", err);
    } finally {
      setLoading(false);
    }
  }; 

  const handleLogin = (selectedRole, loggedInUser) => {
    setRole(selectedRole);
    setUser(loggedInUser);
    setLastRole(selectedRole);
    if (selectedRole === "patient") {
      setSelectedPatientId(loggedInUser.id);
      setActiveTab("dashboard");
    } else {
      setActiveTab("doctor-portal");
    }
  };

  const handleLogout = () => {
    setLastRole(role);
    setRole(null);
    setUser(null);
    setSelectedPatientId(null);
    setActiveTab("dashboard");
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard selectedPatientId={selectedPatientId} refreshTrigger={refreshTrigger} />;
      case "medicines":
        return <MedicineList selectedPatientId={selectedPatientId} />;
      case "add":
        return (
          <MedicineForm
            selectedPatientId={selectedPatientId}
            onMedicineAdded={() => setActiveTab("dashboard")}
          />
        );
      case "history":
        return <ReminderHistory selectedPatientId={selectedPatientId} />;
      case "doctor-portal":
        return <DoctorPortal patients={patients} loggedInDoctor={user} />;
      default:
        return <Dashboard selectedPatientId={selectedPatientId} refreshTrigger={refreshTrigger} />;
    }
  };

  if (!role || !user) {
    return <LoginPage onLogin={handleLogin} defaultRole={lastRole} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {activeToast && (
        <div
          className="phone-notification-toast"
          onClick={() => {
            setActiveTab("dashboard");
            setActiveToast(null);
          }}
        >
          <div className="phone-notification-header">
            <div className="phone-notification-app">
              <span className="phone-notification-dot"></span>
              MESSAGE (SMS)
            </div>
            <span className="phone-notification-time">Just now</span>
          </div>
          <div className="phone-notification-body">
            <strong>Dr. {activeToast.doctor_name}</strong>
            <p>
              New prescription sent to your phone ({activeToast.patient_phone || "SMS"}):{" "}
              <strong>{activeToast.medicine_name} {activeToast.dosage}</strong> ({activeToast.frequency}x/day for {activeToast.duration}d). Tap to accept on your dashboard.
            </p>
          </div>
        </div>
      )}
      <Navbar
        role={role}
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main style={{ flex: 1, padding: "20px 0" }}>
        {renderActiveContent()}
      </main>
    </div>
  );
}

export default App;