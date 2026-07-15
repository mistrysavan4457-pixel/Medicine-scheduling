import { useState, useEffect } from "react";
import { Sparkles, Save, Info } from "lucide-react";
import api from "../services/api";

function MedicineForm({ selectedPatientId, onMedicineAdded }) {
  const [formData, setFormData] = useState({
    medicine_name: "",
    dosage: "",
    frequency: 2,
    duration: 7,
    refill_threshold: 5,
  });

  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const value = e.target.type === "number" ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleAiExtract = async () => {
    if (!aiText.trim()) {
      setMessage({ type: "error", text: "Please enter some prescription text first." });
      return;
    }

    setAiLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await api.post("extract-medication/", { text: aiText });
      const data = response.data;
      setFormData({
        medicine_name: data.medicine_name || "",
        dosage: data.dosage || "",
        frequency: data.frequency || 2,
        duration: data.duration || 7,
        refill_threshold: 5,
      });
      setMessage({
        type: "success",
        text: "✨ Prescriptions extracted! Review and submit the form details below.",
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to extract prescription. Please fill manually." });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {  
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!selectedPatientId) {
      setMessage({ type: "error", text: "Please select a patient in the navigation bar first." });
      return;
    }

    try {
      const payload = {
        patient: parseInt(selectedPatientId),
        ...formData,
      };

      await api.post("medicines/", payload);
      setMessage({ type: "success", text: "💊 Medication and schedules added successfully!" });
      
      // Reset form
      setFormData({
        medicine_name: "",
        dosage: "",
        frequency: 2,
        duration: 7,
        refill_threshold: 5,
      });
      setAiText("");
      if (onMedicineAdded) onMedicineAdded();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to save medication. Check backend connection." });
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "left" }}>
        <h1 style={{ fontSize: "28px", margin: "0 0 8px" }}>Schedule a New Medication</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Register a patient's medication details to automatically generate future reminders and logs.
        </p>
      </div>

      {message.text && (
        <div
          style={{
            background: message.type === "success" ? "var(--success-glow)" : "var(--danger-glow)",
            color: message.type === "success" ? "var(--success)" : "var(--danger)",
            padding: "14px 18px",
            borderRadius: "14px",
            fontSize: "14px",
            textAlign: "left",
                        border: `1px solid ${
              message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"
            }`,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Info size={16} />
          {message.text}
        </div>
      )}

      {/* AI Assistant Card */}
      <div className="glass-card ai-copilot-card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "18px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} style={{ color: "var(--primary)" }} />
            AI Prescription Extractor
          </h2>
          <span className="ai-pill-badge">Copilot</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
          Paste a prescription photo instruction or handwritten note, e.g. "Take 100mg Aspirin twice a day for 10 days" and let MedKeep configure it for you.
        </p>
        <div className="form-group" style={{ marginBottom: "12px" }}>
          <textarea
            className="form-control"
            placeholder="Paste instructions here..."
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAiExtract}
          disabled={aiLoading}
        >
          {aiLoading ? "Extracting..." : "Extract with AI"}
        </button>
      </div>

      {/* Main Form */}
      <div className="glass-card" style={{ textAlign: "left" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Medication Information</h2>
        
        {!selectedPatientId && (
          <div
            style={{
              padding: "16px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "12px",
              color: "var(--warning)",
              fontSize: "14px",
              marginBottom: "20px"
            }}
          >
            ⚠️ <strong>Notice:</strong> Please select a patient profile in the top-right corner of the navigation bar before saving.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Medicine Name</label>
              <input
                type="text"
                name="medicine_name"
                required
                className="form-control"
                placeholder="e.g. Paracetamol"
                value={formData.medicine_name}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
              />
            </div>

            <div className="form-group">
              <label>Dosage</label>
              <input
                type="text"
                name="dosage"
                required
                className="form-control"
                placeholder="e.g. 500mg or 1 pill"
                value={formData.dosage}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Frequency (Times / Day)</label>
              <input
                type="number"
                name="frequency"
                required
                min="1"
                max="24"
                className="form-control"
                value={formData.frequency}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
              />
            </div>

            <div className="form-group">
              <label>Duration (Days)</label>
              <input
                type="number"
                name="duration"
                required
                min="1"
                className="form-control"
                value={formData.duration}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
              />
            </div>

            <div className="form-group">
              <label>Refill Warning Threshold</label>
              <input
                type="number"
                name="refill_threshold"
                required
                min="1"
                className="form-control"
                value={formData.refill_threshold}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: "24px" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedPatientId}
              style={{ paddingLeft: "24px", paddingRight: "24px" }}
            >
              <Save size={16} />
              Save Medicine Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicineForm;