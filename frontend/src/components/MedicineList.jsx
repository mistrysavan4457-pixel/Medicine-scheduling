import { useEffect, useState } from "react";
import { Pill, ShieldCheck, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import api from "../services/api";

function MedicineList({ selectedPatientId }) {
  const [medicines, setMedicines] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedPatientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medRes, schedRes] = await Promise.all([
        api.get("medicines/"),
        api.get("schedules/"),
      ]);

      // Filter medicines for selected patient
      const patientMeds = medRes.data.filter(
        (m) => m.patient === parseInt(selectedPatientId)
      );
      setMedicines(patientMeds);
      setSchedules(schedRes.data);
    } catch (err) {
      console.error("Error fetching medications:", err);
    } finally {
      setLoading(false);
    }
  };

  const discontinueTherapy = async (medicineId) => {
    if (!window.confirm("Are you sure you want to discontinue this medication therapy? This will delete the medicine and all associated schedules/adherence history.")) {
      return;
    }
    try {
      await api.delete(`medicines/${medicineId}/`);
      await fetchData();
    } catch (err) {
      console.error("Error discontinuing therapy:", err);
      alert("Failed to discontinue therapy. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <RefreshCw className="empty-icon animate-spin" size={32} />
        <p>Loading medications...</p>
      </div>
    );
  }

  if (!selectedPatientId) {
    return (
      <div className="empty-state glass-card">
        <Pill className="empty-icon" size={40} />
        <h3>No Patient Selected</h3>
        <p style={{ marginTop: "8px" }}>
          Please select a patient profile from the header to view their active medications.
        </p>
      </div>
    );
  }

  if (medicines.length === 0) {
    return (
      <div className="empty-state glass-card">
        <Pill className="empty-icon" size={40} />
        <h3>No Medications Found</h3>
        <p style={{ marginTop: "8px" }}>
          This patient has no active medications. Please wait for a doctor's prescription.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "28px", margin: "0 0 8px" }}>Active Medications</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            List of all current therapies, dosage guidelines, and refill conditions.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="medicine-grid">
        {medicines.map((medicine) => {
          // Filter schedules for this medicine
          const medSchedules = schedules.filter((s) => s.medicine === medicine.id);
          const totalDoses = medSchedules.length;
          const pendingDoses = medSchedules.filter((s) => s.status === "Pending").length;
          const takenDoses = medSchedules.filter((s) => s.status === "Taken").length;
          
          const needsRefill = pendingDoses <= medicine.refill_threshold;

          return (
            <div key={medicine.id} className="glass-card med-card" style={{ textAlign: "left" }}>
              <div className="med-header">
                <div className="med-title">
                  <h3>{medicine.medicine_name}</h3>
                  <p>{medicine.dosage}</p>
                </div>
                <div className="med-badge">
                  <Pill size={16} style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: "4px" }} />
                  {medicine.dosage}
                </div>
              </div>

              <div className="med-details-grid">
                <div className="med-detail-item">
                  <span className="med-detail-label">Frequency</span>
                  <span className="med-detail-value">{medicine.frequency}x daily</span>
                </div>
                <div className="med-detail-item">
                  <span className="med-detail-label">Duration</span>
                  <span className="med-detail-value">{medicine.duration} days</span>
                </div>
                <div className="med-detail-item">
                  <span className="med-detail-label">Total Doses</span>
                  <span className="med-detail-value">{totalDoses} slots</span>
                </div>
                <div className="med-detail-item">
                  <span className="med-detail-label">Taken Doses</span>
                  <span className="med-detail-value" style={{ color: "var(--success)" }}>
                    {takenDoses} taken
                  </span>
                </div>
              </div>

              {needsRefill ? (
                <div className="refill-alert">
                  <AlertTriangle size={16} />
                  <span>
                    Refill needed (Only {pendingDoses} doses left, threshold is {medicine.refill_threshold})
                  </span>
                </div>
              ) : (
                <div className="refill-ok">
                  <ShieldCheck size={16} />
                  <span>Stock OK ({pendingDoses} remaining doses)</span>
                </div>
              )}

              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-glass)", paddingTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-outline btn-discontinue"
                  style={{ color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)", fontSize: "13px", padding: "6px 12px" }}
                  onClick={() => discontinueTherapy(medicine.id)}
                >
                  <Trash2 size={13} />
                  Discontinue Therapy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MedicineList;