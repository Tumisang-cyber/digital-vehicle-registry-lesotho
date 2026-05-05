// ══════════════════════════════════════════════════════════════
// TRANSFER OWNERSHIP PAGE
// Add this to your App.js routes
// ══════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

const API = axios.create({ baseURL: "http://127.0.0.1:5000/api" });
API.interceptors.request.use(cfg => {
  const token = window.__dvrsToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const G = {
  navy: "#0A1628", teal: "#0D9488", mint: "#CCFBF1", white: "#FFFFFF",
  offWhite: "#F0F4F8", gray: "#64748B", grayDk: "#334155",
  red: "#EF4444", amber: "#F59E0B", green: "#22C55E",
};

const S = {
  page:       { minHeight: "100vh", background: G.offWhite, fontFamily: "'Segoe UI', sans-serif" },
  container:  { maxWidth: 800, margin: "0 auto", padding: "2rem" },
  card:       { background: G.white, borderRadius: 12, padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "1.5rem" },
  h1:         { color: G.navy, fontWeight: 700, fontSize: 26, marginBottom: 8 },
  h2:         { color: G.navy, fontWeight: 600, fontSize: 20, marginBottom: 12 },
  label:      { display: "block", color: G.grayDk, fontSize: 13, fontWeight: 600, marginBottom: 6 },
  input:      { width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" },
  select:     { width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, background: G.white, boxSizing: "border-box" },
  btnPrimary: { background: G.teal, color: G.white, border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  btnSecondary:{ background: "transparent", color: G.teal, border: `2px solid ${G.teal}`, padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  badge:      (c) => ({ background: c + "20", color: c, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }),
  row:        { display: "flex", gap: 16, flexWrap: "wrap" },
  col:        { flex: 1, minWidth: 200 },
};

// ══════════════════════════════════════════════════════════════
// OWNERSHIP TRANSFER PAGE
// ══════════════════════════════════════════════════════════════
export function TransferOwnership() {
  const navigate = useNavigate();
  const { name, nationalId } = useSelector(s => s.auth);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newOwnerNationalId, setNewOwnerNationalId] = useState("");
  const [transferType, setTransferType] = useState("PURCHASE");
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    API.get("/vehicles/my").then(r => {
      setVehicles(r.data.vehicles || []);
      setLoadingVehicles(false);
    }).catch(() => setLoadingVehicles(false));
  }, []);

  const handleTransfer = async () => {
    if (!selectedVehicle) return setError("Please select a vehicle.");
    if (!newOwnerNationalId) return setError("Please enter the new owner's National ID.");
    if (newOwnerNationalId === nationalId) return setError("You cannot transfer a vehicle to yourself.");

    setLoading(true); setError(null);
    try {
      const res = await API.post("/transfers", {
        vehicleId: selectedVehicle.vehicle_id,
        newOwnerNationalId,
        transferType,
      });
      setSuccess(res.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const TRANSFER_FEE = { PURCHASE: "M 200.00", INHERITANCE: "M 50.00", GIFT: "M 100.00" };

  return (
    <div style={S.page}>
      {/* Navbar */}
      <nav style={{ background: G.navy, padding: "0 2rem", display: "flex", alignItems: "center", height: 60, borderBottom: `3px solid ${G.teal}` }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <div><div>Digital Vehicle Registry</div><div style={{ fontSize: 11, color: G.gray, fontWeight: 400 }}>Kingdom of Lesotho</div></div>
        </div>
      </nav>

      <div style={S.container}>
        <div style={{ marginBottom: "1.5rem" }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: G.teal, cursor: "pointer", fontSize: 14, marginBottom: 8 }}>← Back to Dashboard</button>
          <h1 style={S.h1}>🔄 Transfer Vehicle Ownership</h1>
          <p style={{ color: G.gray, fontSize: 14 }}>Transfer ownership of your registered vehicle to another citizen.</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: 0, marginBottom: "2rem" }}>
          {["Select Vehicle", "New Owner Details", "Confirm Transfer"].map((s, i) => {
            const num = i + 1; const active = step === num; const done = step > num;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: done ? G.green : active ? G.teal : "#CBD5E1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{done ? "✓" : num}</div>
                  <div style={{ fontSize: 11, color: active ? G.teal : done ? G.green : G.gray, fontWeight: active ? 700 : 400, marginTop: 4, textAlign: "center" }}>{s}</div>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 3, background: done ? G.green : "#E2E8F0", marginBottom: 18 }} />}
              </div>
            );
          })}
        </div>

        {error && <div style={{ background: "#FEF2F2", border: `1px solid ${G.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: G.red, fontSize: 13 }}>⚠️ {error}</div>}

        {/* Step 1 - Select Vehicle */}
        {step === 1 && (
          <div style={S.card}>
            <h2 style={S.h2}>Select Vehicle to Transfer</h2>
            {loadingVehicles ? <p style={{ color: G.gray }}>⏳ Loading your vehicles...</p> :
             vehicles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: G.gray }}>
                <div style={{ fontSize: 48 }}>🚗</div>
                <p>You have no registered vehicles to transfer.</p>
                <button onClick={() => navigate("/register")} style={S.btnPrimary}>Register a Vehicle First</button>
              </div>
            ) : (
              <div>
                {vehicles.map(v => (
                  <div key={v.vehicle_id} onClick={() => setSelectedVehicle(v)}
                    style={{ padding: "1rem", border: `2px solid ${selectedVehicle?.vehicle_id === v.vehicle_id ? G.teal : "#E2E8F0"}`, borderRadius: 8, marginBottom: 8, cursor: "pointer", background: selectedVehicle?.vehicle_id === v.vehicle_id ? G.mint : G.white }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: G.navy, fontSize: 16 }}>🚗 {v.model || v.manufacturer}</div>
                        <div style={{ color: G.gray, fontSize: 13 }}>VIN: {v.vin} | Year: {v.manufacture_year} | Colour: {v.color}</div>
                        <div style={{ color: G.gray, fontSize: 13 }}>Registration: <strong style={{ color: G.teal }}>{v.registration_number || "Pending"}</strong></div>
                      </div>
                      <span style={S.badge(v.reg_status === "APPROVED" ? G.green : G.amber)}>{v.reg_status || "PENDING"}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => { if (!selectedVehicle) { setError("Please select a vehicle."); return; } setError(null); setStep(2); }} style={S.btnPrimary}>
                    Continue →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 - New Owner Details */}
        {step === 2 && selectedVehicle && (
          <div style={S.card}>
            <h2 style={S.h2}>New Owner Details</h2>

            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: G.navy, marginBottom: 4 }}>Transferring:</div>
              <div style={{ color: G.grayDk, fontSize: 14 }}>🚗 {selectedVehicle.model} — {selectedVehicle.registration_number}</div>
              <div style={{ color: G.gray, fontSize: 13 }}>VIN: {selectedVehicle.vin}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>New Owner National ID *</label>
              <input style={S.input} placeholder="Enter new owner's National ID (e.g. 9876543210)"
                value={newOwnerNationalId} onChange={e => setNewOwnerNationalId(e.target.value)} />
              <p style={{ color: G.gray, fontSize: 12, marginTop: 4 }}>The new owner must have logged into DVRS at least once to be in the system.</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Transfer Type *</label>
              <select style={S.select} value={transferType} onChange={e => setTransferType(e.target.value)}>
                <option value="PURCHASE">Purchase / Sale</option>
                <option value="INHERITANCE">Inheritance</option>
                <option value="GIFT">Gift</option>
              </select>
            </div>

            <div style={{ background: G.mint, borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: "#065f46", marginBottom: 4 }}>Transfer Fee</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: G.teal }}>{TRANSFER_FEE[transferType]}</div>
              <div style={{ color: "#065f46", fontSize: 12 }}>Payable at Traffic Department office</div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(1)} style={S.btnSecondary}>← Back</button>
              <button onClick={() => { if (!newOwnerNationalId) { setError("Enter new owner National ID."); return; } setError(null); setStep(3); }} style={S.btnPrimary}>Review Transfer →</button>
            </div>
          </div>
        )}

        {/* Step 3 - Confirm or Success */}
        {step === 3 && !success && (
          <div style={S.card}>
            <h2 style={S.h2}>Confirm Transfer</h2>
            <div style={{ background: "#FFF7ED", border: `1px solid ${G.amber}`, borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
              <strong style={{ color: G.amber }}>⚠️ Warning</strong>
              <p style={{ color: G.grayDk, fontSize: 13, margin: "4px 0 0" }}>This action is permanent. Once confirmed, you will no longer be the owner of this vehicle.</p>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 16, marginBottom: 20 }}>
              {[
                { label: "Vehicle", value: `${selectedVehicle?.model} (${selectedVehicle?.registration_number})` },
                { label: "Current Owner", value: name },
                { label: "New Owner National ID", value: newOwnerNationalId },
                { label: "Transfer Type", value: transferType },
                { label: "Transfer Fee", value: TRANSFER_FEE[transferType] },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #E2E8F0", fontSize: 14 }}>
                  <span style={{ color: G.gray }}>{r.label}</span>
                  <span style={{ color: G.grayDk, fontWeight: 500 }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(2)} style={S.btnSecondary}>← Back</button>
              <button onClick={handleTransfer} disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
                {loading ? "⏳ Processing..." : "✅ Confirm Transfer"}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ ...S.card, textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: 64 }}>🎉</div>
            <h2 style={{ color: G.green, fontSize: 24, marginTop: 16 }}>Transfer Successful!</h2>
            <p style={{ color: G.gray }}>{success.message}</p>
            <div style={{ background: G.navy, borderRadius: 12, padding: "1.5rem", margin: "1.5rem auto", maxWidth: 400 }}>
              <div style={{ color: G.mint, fontSize: 12, marginBottom: 4 }}>TRANSFERRED TO</div>
              <div style={{ color: G.white, fontSize: 20, fontWeight: 700 }}>{success.newOwner}</div>
              <div style={{ color: G.gray, fontSize: 12, marginTop: 4 }}>National ID: {newOwnerNationalId}</div>
            </div>
            <button onClick={() => navigate("/dashboard")} style={S.btnPrimary}>← Back to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PERMIT RENEWAL PAGE
// ══════════════════════════════════════════════════════════════
export function PermitRenewal() {
  const navigate = useNavigate();
  const { name } = useSelector(s => s.auth);
  const [vehicles, setVehicles] = useState([]);
  const [existingPermits, setExistingPermits] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [permitType, setPermitType] = useState("A");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const PERMIT_INFO = {
    A: { label: "Type A — Private Motor Vehicle",         fee: "M 150.00", desc: "For private use only, not for hire" },
    B: { label: "Type B — Light Commercial (up to 3.5t)", fee: "M 200.00", desc: "Light delivery vehicles and minibuses" },
    C: { label: "Type C — Heavy Commercial (3.5t–16t)",   fee: "M 250.00", desc: "Medium trucks and heavy transport" },
    D: { label: "Type D — Extra Heavy (over 16t)",        fee: "M 300.00", desc: "Heavy duty trucks and haulage" },
    E: { label: "Type E — Public Service (Taxi/Bus)",     fee: "M 350.00", desc: "Vehicles for hire carrying passengers" },
    F: { label: "Type F — Special Purpose",               fee: "M 400.00", desc: "Ambulance, fire engine, tow truck etc." },
  };

  useEffect(() => {
    Promise.all([
      API.get("/vehicles/my"),
      API.get("/permits"),
    ]).then(([vRes, pRes]) => {
      setVehicles(vRes.data.vehicles || []);
      setExistingPermits(pRes.data.permits || []);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  const getExistingPermit = (vehicleId, type) => {
    return existingPermits.find(p => p.vehicle_id === vehicleId && p.permit_type === type && p.status === "ACTIVE");
  };

  const isExpiringSoon = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 30;
  };

  const handleApply = async () => {
    if (!selectedVehicle) return setError("Please select a vehicle.");
    setLoading(true); setError(null);
    try {
      const res = await API.post("/permits", {
        vehicleId: selectedVehicle.vehicle_id,
        permitType,
      });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <nav style={{ background: G.navy, padding: "0 2rem", display: "flex", alignItems: "center", height: 60, borderBottom: `3px solid ${G.teal}` }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <div><div>Digital Vehicle Registry</div><div style={{ fontSize: 11, color: G.gray, fontWeight: 400 }}>Kingdom of Lesotho</div></div>
        </div>
      </nav>

      <div style={S.container}>
        <div style={{ marginBottom: "1.5rem" }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: G.teal, cursor: "pointer", fontSize: 14, marginBottom: 8 }}>← Back to Dashboard</button>
          <h1 style={S.h1}>📋 Apply for / Renew Permit</h1>
          <p style={{ color: G.gray, fontSize: 14 }}>Apply for a new permit or renew an existing one. Valid for 1 year from issue date.</p>
        </div>

        {error && <div style={{ background: "#FEF2F2", border: `1px solid ${G.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: G.red, fontSize: 13 }}>⚠️ {error}</div>}

        {!success ? (
          <div style={S.row}>
            {/* Left — Vehicle Selection */}
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={S.card}>
                <h2 style={S.h2}>1. Select Vehicle</h2>
                {loadingData ? <p style={{ color: G.gray }}>⏳ Loading...</p> :
                 vehicles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1rem", color: G.gray }}>
                    <p>No registered vehicles found.</p>
                    <button onClick={() => navigate("/register")} style={S.btnPrimary}>Register Vehicle First</button>
                  </div>
                ) : vehicles.map(v => (
                  <div key={v.vehicle_id} onClick={() => setSelectedVehicle(v)}
                    style={{ padding: "12px", border: `2px solid ${selectedVehicle?.vehicle_id === v.vehicle_id ? G.teal : "#E2E8F0"}`, borderRadius: 8, marginBottom: 8, cursor: "pointer", background: selectedVehicle?.vehicle_id === v.vehicle_id ? G.mint : G.white }}>
                    <div style={{ fontWeight: 700, color: G.navy }}>{v.model}</div>
                    <div style={{ color: G.gray, fontSize: 12 }}>{v.registration_number} | {v.vin}</div>
                    {/* Show existing permits for this vehicle */}
                    {existingPermits.filter(p => p.vehicle_id === v.vehicle_id && p.status === "ACTIVE").map(p => (
                      <div key={p.permit_id} style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={S.badge(isExpiringSoon(p.expiry_date) ? G.amber : G.green)}>
                          Permit {p.permit_type} — expires {new Date(p.expiry_date).toLocaleDateString()}
                          {isExpiringSoon(p.expiry_date) && " ⚠️ Expiring Soon"}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Permit Type Selection */}
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={S.card}>
                <h2 style={S.h2}>2. Select Permit Type</h2>
                {Object.entries(PERMIT_INFO).map(([type, info]) => {
                  const existing = selectedVehicle ? getExistingPermit(selectedVehicle.vehicle_id, type) : null;
                  return (
                    <div key={type} onClick={() => setPermitType(type)}
                      style={{ padding: "12px", border: `2px solid ${permitType === type ? G.teal : "#E2E8F0"}`, borderRadius: 8, marginBottom: 8, cursor: "pointer", background: permitType === type ? G.mint : G.white }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: G.navy, fontSize: 14 }}>{info.label}</div>
                          <div style={{ color: G.gray, fontSize: 12, marginTop: 2 }}>{info.desc}</div>
                          {existing && <span style={{ ...S.badge(isExpiringSoon(existing.expiry_date) ? G.amber : G.green), fontSize: 11, marginTop: 4, display: "inline-block" }}>Active — expires {new Date(existing.expiry_date).toLocaleDateString()}</span>}
                        </div>
                        <span style={{ fontWeight: 700, color: G.teal, fontSize: 16, whiteSpace: "nowrap" }}>{info.fee}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary & Apply */}
              <div style={S.card}>
                <h2 style={S.h2}>3. Summary</h2>
                <div style={{ fontSize: 14, color: G.grayDk }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E2E8F0" }}>
                    <span style={{ color: G.gray }}>Vehicle</span>
                    <span style={{ fontWeight: 500 }}>{selectedVehicle?.model || "Not selected"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E2E8F0" }}>
                    <span style={{ color: G.gray }}>Permit Type</span>
                    <span style={{ fontWeight: 500 }}>Type {permitType}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E2E8F0" }}>
                    <span style={{ color: G.gray }}>Fee</span>
                    <span style={{ fontWeight: 700, color: G.teal, fontSize: 18 }}>{PERMIT_INFO[permitType].fee}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ color: G.gray }}>Valid For</span>
                    <span style={{ fontWeight: 500 }}>1 Year from today</span>
                  </div>
                </div>
                <button onClick={handleApply} disabled={loading || !selectedVehicle}
                  style={{ ...S.btnPrimary, width: "100%", marginTop: 16, opacity: (loading || !selectedVehicle) ? 0.7 : 1 }}>
                  {loading ? "⏳ Processing..." : "✅ Apply for Permit"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...S.card, textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: 64 }}>✅</div>
            <h2 style={{ color: G.green, fontSize: 24, marginTop: 16 }}>Permit Issued Successfully!</h2>
            <p style={{ color: G.gray }}>{success.description}</p>
            <div style={{ background: G.navy, borderRadius: 12, padding: "1.5rem", margin: "1.5rem auto", maxWidth: 400 }}>
              <div style={{ color: G.mint, fontSize: 12, marginBottom: 4 }}>PERMIT TYPE</div>
              <div style={{ color: G.white, fontSize: 48, fontWeight: 700 }}>{success.permitType}</div>
              <div style={{ color: G.mint, fontSize: 14, marginTop: 8 }}>{success.description}</div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
                <div><div style={{ color: G.gray, fontSize: 11 }}>ISSUE DATE</div><div style={{ color: G.white, fontWeight: 600 }}>{success.issueDate}</div></div>
                <div><div style={{ color: G.gray, fontSize: 11 }}>EXPIRY DATE</div><div style={{ color: G.white, fontWeight: 600 }}>{success.expiryDate}</div></div>
                <div><div style={{ color: G.gray, fontSize: 11 }}>FEE PAID</div><div style={{ color: G.teal, fontWeight: 700 }}>M {success.fee}</div></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={{ ...S.btnPrimary }}>📄 Download Permit</button>
              <button onClick={() => navigate("/dashboard")} style={{ background: "transparent", color: G.teal, border: `2px solid ${G.teal}`, padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
