import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { configureStore, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { TransferOwnership, PermitRenewal } from "./TransferAndPermit";

// ══════════════════════════════════════════════════════════════
// API SERVICE
// ══════════════════════════════════════════════════════════════
const API = axios.create({ baseURL: "http://127.0.0.1:5000/api" });

// Attach token to every request

// ══════════════════════════════════════════════════════════════
// REDUX STORE
// ══════════════════════════════════════════════════════════════
const authSlice = createSlice({
  name: "auth",
  initialState: { token: null, nationalId: null, name: "Citizen", role: null, citizenId: null, isAuthenticated: false },
  reducers: {
    setAuth: (state, { payload }) => {
      state.token = payload.token;
      state.nationalId = payload.nationalId;
      state.name = payload.name || "Citizen";
      state.role = payload.role || "CITIZEN";
      state.citizenId = payload.citizenId;
      state.isAuthenticated = true;
      window.__dvrsToken = payload.token;
    },
    logout: (state) => {
      Object.assign(state, { token: null, nationalId: null, name: null, role: null, citizenId: null, isAuthenticated: false });
      window.__dvrsToken = null;
    },
  },
});

const regSlice = createSlice({
  name: "reg",
  initialState: {
    step: 1, category: null, vehicleDetails: {}, draftId: null,
    clearances: { cid: "PENDING", interpol: "PENDING", lra: "PENDING" },
    status: null, registrationId: null, registrationNumber: null,
  },
  reducers: {
    setStep:           (s, { payload }) => { s.step = payload; },
    setCategory:       (s, { payload }) => { s.category = payload; },
    setVehicleDetails: (s, { payload }) => { s.vehicleDetails = { ...s.vehicleDetails, ...payload }; },
    setClearance:      (s, { payload }) => { s.clearances[payload.type] = payload.status; },
    setStatus:         (s, { payload }) => { s.status = payload; },
    setRegistrationId: (s, { payload }) => { s.registrationId = payload; },
    setResult:         (s, { payload }) => { s.registrationNumber = payload; s.status = "APPROVED"; },
    resetForm:         (s) => { Object.assign(s, { step: 1, category: null, vehicleDetails: {}, draftId: null, clearances: { cid: "PENDING", interpol: "PENDING", lra: "PENDING" }, status: null, registrationId: null, registrationNumber: null }); },
  },
});

const store = configureStore({ reducer: { auth: authSlice.reducer, reg: regSlice.reducer } });

API.interceptors.request.use(cfg => {
  cfg.headers = cfg.headers || {};
  const alreadyHasAuth = cfg.headers.Authorization || cfg.headers.authorization;
  const token = window.__dvrsToken || store.getState()?.auth?.token;

  if (!alreadyHasAuth && token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  return cfg;
});
const { setAuth, logout } = authSlice.actions;
const { setStep, setCategory, setVehicleDetails, setClearance, setStatus, setRegistrationId, setResult, resetForm, loadDraft } = regSlice.actions;

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════
const G = {
  navy: "#0A1628", navyMid: "#112244", teal: "#0D9488", tealLt: "#14B8A6",
  mint: "#CCFBF1", white: "#FFFFFF", offWhite: "#F0F4F8",
  gray: "#64748B", grayDk: "#334155", red: "#EF4444", amber: "#F59E0B", green: "#22C55E",
};

const S = {
  page:        { minHeight: "100vh", background: G.offWhite, fontFamily: "'Segoe UI', sans-serif" },
  darkPage:    { minHeight: "100vh", background: G.navy, fontFamily: "'Segoe UI', sans-serif" },
  navbar:      { background: G.navy, padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, borderBottom: `3px solid ${G.teal}` },
  container:   { maxWidth: 1100, margin: "0 auto", padding: "2rem" },
  card:        { background: G.white, borderRadius: 12, padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "1.5rem" },
  darkCard:    { background: G.navyMid, borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" },
  h1:          { color: G.navy, fontWeight: 700, fontSize: 26, marginBottom: 8 },
  h2:          { color: G.navy, fontWeight: 600, fontSize: 20, marginBottom: 12 },
  label:       { display: "block", color: G.grayDk, fontSize: 13, fontWeight: 600, marginBottom: 6 },
  input:       { width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" },
  select:      { width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, background: G.white, boxSizing: "border-box" },
  btnPrimary:  { background: G.teal, color: G.white, border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  btnSecondary:{ background: "transparent", color: G.teal, border: `2px solid ${G.teal}`, padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnDanger:   { background: G.red, color: G.white, border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  badge:       (c) => ({ background: c + "20", color: c, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }),
  chip:        (bg) => ({ background: bg, color: G.white, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }),
  row:         { display: "flex", gap: 16, flexWrap: "wrap" },
  col:         { flex: 1, minWidth: 200 },
};

// ══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════
function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { name, role, isAuthenticated } = useSelector(s => s.auth);
  return (
    <nav style={S.navbar}>
      <div style={{ color: G.white, fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>🚗</span>
        <div>
          <div>Digital Vehicle Registry</div>
          <div style={{ fontSize: 11, color: G.gray, fontWeight: 400 }}>Kingdom of Lesotho</div>
        </div>
      </div>
      {isAuthenticated && (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: G.mint, fontSize: 13 }}>👤 {name}</span>
          <span style={S.chip(G.teal)}>{role}</span>
          {role === "OFFICER" && <button style={{ background: "transparent", border: `1px solid ${G.teal}`, color: G.teal, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }} onClick={() => navigate("/officer")}>Officer Dashboard</button>}
          {role === "CITIZEN" && <button style={{ background: "transparent", border: `1px solid ${G.teal}`, color: G.teal, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }} onClick={() => navigate("/dashboard")}>My Dashboard</button>}
          <button style={{ background: "transparent", border: `1px solid ${G.red}`, color: G.red, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }} onClick={() => { dispatch(logout()); navigate("/login"); }}>Logout</button>
        </div>
      )}
    </nav>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function Spinner({ text = "Loading..." }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, color: G.gray, fontSize: 14 }}><span>⏳</span>{text}</div>;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1 — LOGIN
// ══════════════════════════════════════════════════════════════
function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, role } = useSelector(s => s.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate(role === "OFFICER" ? "/officer" : "/dashboard");
  }, [isAuthenticated]);

  const handleMosipLogin = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/auth/mosip/login");
      const data = await res.json();
      if (data.success) window.location.href = data.authUrl;
      else { setError("Could not connect to MOSIP. Is the backend running?"); setLoading(false); }
    } catch { setError("Backend not reachable at 127.0.0.1:5000. Please start the Node.js server."); setLoading(false); }
  };

  const handleOfficerLogin = () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYXRpb25hbElkIjoiT0ZGSUNFUjAwMSIsIm5hbWUiOiJPZmZpY2VyIE1va29lbmEiLCJyb2xlIjoiT0ZGSUNFUiIsImNpdGl6ZW5JZCI6bnVsbCwiaWF0IjoxNzc3NDQyMzc2LCJleHAiOjE3Nzc0NzExNzZ9.EvGjqYrsT98K7-5yoUdMlfJcQf-0LvuMdXhGeEd6LiM";
    window.__dvrsToken = token;
    store.dispatch(setAuth({ token, nationalId: "OFFICER001", name: "Officer Mokoena", role: "OFFICER", citizenId: null }));
    navigate("/officer");
  };

  return (
    <div style={{ ...S.darkPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", width: "100%", maxWidth: 900, minHeight: "80vh", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ flex: 1, background: `linear-gradient(135deg, ${G.teal}, #065f46)`, padding: "3rem 2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 48 }}>🚗</div>
            <h1 style={{ color: G.white, fontSize: 24, fontWeight: 700, marginTop: 16 }}>Digital Vehicle Registry System</h1>
            <p style={{ color: G.mint, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>Secure, interoperable vehicle registration powered by Digital Public Infrastructure</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[{ icon: "🪪", label: "MOSIP Identity", desc: "Verified national ID authentication" }, { icon: "🔗", label: "X-Road Exchange", desc: "Secure inter-agency data sharing" }, { icon: "🏛", label: "SOP Compliant", desc: "Traffic Dept. official procedures" }].map(item => (
              <div key={item.label} style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div><div style={{ color: G.white, fontSize: 13, fontWeight: 600 }}>{item.label}</div><div style={{ color: G.mint, fontSize: 12 }}>{item.desc}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["DPG Certified", "MOSIP v1.7", "X-Road 7.8", "Lesotho Gov"].map(t => (
              <span key={t} style={{ background: "rgba(255,255,255,0.15)", color: G.white, padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, background: G.white, padding: "3rem 2rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 40 }}>🏛</div>
            <h2 style={{ color: G.navy, fontSize: 22, fontWeight: 700, marginTop: 8 }}>Sign In</h2>
            <p style={{ color: G.gray, fontSize: 14 }}>Ministry of Public Works & Transport</p>
          </div>
          {error && <div style={{ background: "#FEF2F2", border: `1px solid ${G.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: G.red, fontSize: 13 }}>⚠️ {error}</div>}
          <button onClick={handleMosipLogin} disabled={loading} style={{ ...S.btnPrimary, width: "100%", justifyContent: "center", marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Connecting to MOSIP..." : "🪪 Login with National ID (MOSIP)"}
          </button>
          <div style={{ textAlign: "center", color: G.gray, fontSize: 12, margin: "12px 0" }}>— or —</div>
          <button onClick={handleOfficerLogin} style={{ ...S.btnSecondary, width: "100%" }}>👮 Officer / Admin Login (Demo)</button>
          <div style={{ marginTop: 24, padding: 16, background: G.offWhite, borderRadius: 8 }}>
            <p style={{ color: G.gray, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              <strong>Test credentials:</strong><br />National ID: <code>1234567890</code><br />OTP: <code>111111</code>
            </p>
          </div>
          <p style={{ color: G.gray, fontSize: 11, textAlign: "center", marginTop: 20 }}>🔒 Authentication secured by MOSIP eSignet.</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// AUTH SUCCESS
// ══════════════════════════════════════════════════════════════
function AuthSuccess() {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    const token = params.get("token");
    const nationalId = params.get("nationalId");
    const error = params.get("error");
    if (error) { navigate(`/login?error=${error}`); return; }
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        window.__dvrsToken = token;
        dispatch(setAuth({ token, nationalId: nationalId || payload.nationalId, name: payload.name || "Citizen", role: payload.role || "CITIZEN", citizenId: payload.citizenId }));
        navigate("/dashboard");
      } catch { dispatch(setAuth({ token, nationalId, name: "Citizen", role: "CITIZEN" })); navigate("/dashboard"); }
    } else navigate("/login");
  }, []);
  return <div style={{ ...S.darkPage, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: G.white, textAlign: "center" }}><div style={{ fontSize: 48 }}>⏳</div><p style={{ marginTop: 16, color: G.mint }}>Verifying MOSIP identity...</p></div></div>;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2 — CITIZEN DASHBOARD (with real API data)
// ══════════════════════════════════════════════════════════════
function CitizenDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { name, nationalId } = useSelector(s => s.auth);
  const [registrations, setRegistrations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("registrations");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regRes, draftRes, vehRes] = await Promise.all([
          API.get("/registrations"),
          API.get("/registrations/draft"),
          API.get("/vehicles/my"),
        ]);
        setRegistrations(regRes.data.registrations || []);
        setDraft(draftRes.data.draft || null);
        setVehicles(vehRes.data.vehicles || []);
      } catch (e) { console.error(e.message); }
      setLoading(false);
    };
    if (window.__dvrsToken || store.getState().auth.token) fetchData();
  }, []);

  const handleResumeDraft = () => {
    if (!draft) return;
    dispatch(loadDraft({ step: draft.step, draftId: draft.draftId, formData: draft.formData }));
    navigate("/register");
  };

  const handleDiscardDraft = async () => {
    if (!draft) return;
    if (!window.confirm("Discard this incomplete registration?")) return;
    try { await API.delete("/registrations/draft/" + draft.draftId); setDraft(null); } catch (e) {}
  };

  const statusColor = { PENDING: G.amber, AWAITING_REVIEW: G.teal, APPROVED: G.green, REJECTED: G.red, CLEARANCE_FAILED: G.red };

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.container}>

        {draft && (
          <div style={{ background: "#FFF8E1", border: "2px solid #FFC107", borderRadius: 12, padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#856404", fontSize: 15 }}>📝 You have an incomplete registration</div>
              <div style={{ color: "#856404", fontSize: 13, marginTop: 4 }}>
                Step {draft.step} of 5 — last saved {new Date(draft.savedAt).toLocaleString()}
                {draft.formData?.category && <span style={{ background: "#FFC107", color: "#000", padding: "2px 8px", borderRadius: 10, marginLeft: 8, fontSize: 11 }}>{draft.formData.category}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleResumeDraft} style={{ ...S.btnPrimary, background: "#FFC107", color: "#000", border: "none" }}>▶ Continue Registration</button>
              <button onClick={handleDiscardDraft} style={{ ...S.btnDanger, padding: "8px 14px", fontSize: 12 }}>🗑 Discard</button>
            </div>
          </div>
        )}

        <div style={{ background: `linear-gradient(135deg, ${G.navy}, ${G.navyMid})`, borderRadius: 12, padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ color: G.white, margin: 0, fontSize: 22 }}>Welcome, {name} 👋</h1>
            <p style={{ color: G.mint, margin: "4px 0 0", fontSize: 13 }}>
              National ID: <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4 }}>{nationalId?.substring(0, 16)}...</code>
              <span style={{ ...S.chip(G.teal), marginLeft: 8 }}>✅ MOSIP Verified</span>
            </p>
          </div>
          <button onClick={() => navigate("/register")} style={S.btnPrimary}>+ Register New Vehicle</button>
        </div>

        <div style={S.row}>
          {[
            { icon: "🚗", label: "Total Registrations", value: registrations.length, color: G.teal },
            { icon: "✅", label: "Approved",             value: registrations.filter(r => r.status === "APPROVED").length, color: G.green },
            { icon: "⏳", label: "Pending",               value: registrations.filter(r => ["PENDING","AWAITING_REVIEW"].includes(r.status)).length, color: G.amber },
            { icon: "❌", label: "Rejected",              value: registrations.filter(r => r.status === "REJECTED").length, color: G.red },
          ].map(stat => (
            <div key={stat.label} style={{ ...S.card, flex: 1, minWidth: 180, textAlign: "center", borderTop: `4px solid ${stat.color}` }}>
              <div style={{ fontSize: 28 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ color: G.gray, fontSize: 13 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setActiveTab("registrations")} style={{ padding: "6px 14px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, background: activeTab==="registrations" ? G.navy : "#F1F5F9", color: activeTab==="registrations" ? G.white : G.gray }}>Registrations</button>
              <button onClick={() => setActiveTab("vehicles")} style={{ padding: "6px 14px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, background: activeTab==="vehicles" ? G.navy : "#F1F5F9", color: activeTab==="vehicles" ? G.white : G.gray }}>My Vehicles ({vehicles.length})</button>
            </div>
            <button onClick={() => navigate("/register")} style={S.btnPrimary}>+ Register Vehicle</button>
          </div>
          {activeTab === "registrations" && (loading ? <Spinner /> : registrations.filter(r => r.status !== "DRAFT").length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: G.gray }}>
              <div style={{ fontSize: 48 }}>🚗</div>
              <p>No registrations yet.</p>
              <button onClick={() => navigate("/register")} style={S.btnPrimary}>Register your first vehicle</button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: G.navy }}>
                  {["Registration No.", "Vehicle", "Category", "Fee", "Status", "Date", "Action"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", color: G.white, fontSize: 13, textAlign: "left", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.filter(r => r.status !== "DRAFT").map((r, i) => (
                  <tr key={r.registration_id} style={{ background: i % 2 === 0 ? "#F8FAFC" : G.white }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: G.navy }}>{r.registration_number || "Pending"}</td>
                    <td style={{ padding: "12px 14px", color: G.grayDk }}>{r.model || r.manufacturer || r.vin || "—"}</td>
                    <td style={{ padding: "12px 14px" }}><span style={S.chip(G.teal)}>{r.registration_category}</span></td>
                    <td style={{ padding: "12px 14px", color: G.teal, fontWeight: 600 }}>M {r.fee_amount}</td>
                    <td style={{ padding: "12px 14px" }}><span style={S.badge(statusColor[r.status] || G.gray)}>{r.status?.replace(/_/g, " ")}</span></td>
                    <td style={{ padding: "12px 14px", color: G.gray, fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {r.status === "PENDING" && (
                        <button onClick={() => navigate("/register/resume/" + r.registration_id)}
                          style={{ ...S.btnPrimary, padding: "4px 10px", fontSize: 11, background: G.amber, border: "none" }}>
                          ▶ Resume
                        </button>
                      )}
                      {r.status === "REJECTED" && <span style={{ color: G.red, fontSize: 11 }}>❌ Rejected</span>}
                      {r.status === "APPROVED" && <span style={{ color: G.green, fontSize: 11, fontWeight: 700 }}>✅ {r.registration_number}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          {activeTab === "vehicles" && (vehicles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: G.gray }}>
              <div style={{ fontSize: 48 }}>🚗</div>
              <p>No approved vehicles yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {vehicles.map(v => (
                <div key={v.vehicle_id} style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, background: G.white, borderTop: "4px solid " + (v.reg_status === "APPROVED" ? G.green : G.amber) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 32 }}>🚗</div>
                    <span style={S.badge(v.reg_status === "APPROVED" ? G.green : G.amber)}>{v.reg_status}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: G.navy, margin: "8px 0 4px" }}>{v.model}</div>
                  <div style={{ fontSize: 12, color: G.gray, marginBottom: 8 }}>{v.manufacture_year} • {v.color} • {v.vehicle_type}</div>
                  <div style={{ fontSize: 11, color: G.gray, fontFamily: "monospace", marginBottom: 4 }}>VIN: {v.vin}</div>
                  {v.registration_number && <div style={{ fontWeight: 700, color: G.teal, fontSize: 14, marginTop: 8 }}>📋 {v.registration_number}</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => navigate("/transfer")} style={{ ...S.btnSecondary, flex: 1, padding: "6px 8px", fontSize: 11 }}>🔄 Transfer</button>
                    <button onClick={() => navigate("/permits")} style={{ ...S.btnPrimary, flex: 1, padding: "6px 8px", fontSize: 11 }}>📋 Permit</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>Quick Actions</h2>
          <div style={S.row}>
            {[
              { icon: "🚗", label: "Register New Vehicle", desc: "Submit a new vehicle registration", action: () => navigate("/register") },
              { icon: "🔄", label: "Transfer Ownership",   desc: "Transfer your vehicle to a new owner", action: () => {} },
              { icon: "📋", label: "Apply for Permit",      desc: "Apply for A, B, C, D, E or F permit", action: () => {} },
              { icon: "📞", label: "Contact Traffic Dept.", desc: "Get help from the transport office", action: () => {} },
            ].map(a => (
              <div key={a.label} onClick={a.action} style={{ ...S.card, flex: 1, minWidth: 200, cursor: "pointer", borderLeft: `4px solid ${G.teal}`, marginBottom: 0 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontWeight: 600, color: G.navy, fontSize: 14 }}>{a.label}</div>
                <div style={{ color: G.gray, fontSize: 12, marginTop: 4 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3 — VEHICLE REGISTRATION (wired to real API)
// ══════════════════════════════════════════════════════════════
function VehicleRegistration() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { step, category, vehicleDetails, clearances, status, registrationId, registrationNumber, draftId } = useSelector(s => s.reg);
  const { name, nationalId } = useSelector(s => s.auth);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    { id: "LOCAL",    label: "Lesotho Vehicle",      icon: "🇱🇸", desc: "Already registered in Lesotho", fee: "M150–M360" },
    { id: "SA",       label: "South African Vehicle", icon: "🇿🇦", desc: "From South Africa",            fee: "By weight" },
    { id: "SADC",     label: "SADC Country Vehicle",  icon: "🌍",  desc: "From another SADC country",    fee: "By weight" },
    { id: "IMPORTED", label: "Imported Vehicle",      icon: "🚢",  desc: "Imported from outside SADC",   fee: "M150–M360" },
  ];

  const sopDocs = {
    LOCAL:    ["Registration Certificate (Blue Card)", "NCO-SA Form (Change of Ownership)", "Interpol/CID Clearance", "RSL-VAT & Customs Clearance", "Roadworthiness Certificate", "Invoice / Letter of Sale", "Certified Seller ID"],
    SA:       ["Registration or Deregistration Certificate", "NCO-LS Form", "Letter of Agreement of Sale", "Customs Clearance", "Interpol & CID Clearance", "LRA VAT Clearance", "Roadworthy Certificate"],
    SADC:     ["Manufacturing Certificate (Original)", "NCO Form", "Customs Clearance CE11", "VAT Receipt", "SARPCCO Clearance", "CID & Interpol Clearance", "Roadworthiness Certificate"],
    IMPORTED: ["Export Certificate", "Bill of Lading (Certified)", "Bill of Entry (Certified)", "Customs Letter", "Interpol & CID Clearance", "RSL VAT & Customs Duty Clearance", "Invoice / Letterhead"],
  };

  const calcFee = (w) => {
    w = parseInt(w) || 0;
    if (w <= 1500) return "M 150.00"; if (w <= 3500) return "M 250.00";
    if (w <= 6500) return "M 350.00"; if (w <= 9500) return "M 400.00";
    if (w <= 11000) return "M 310.00"; return "M 360.00";
  };

  // Poll clearance status from backend
  const pollClearances = useCallback((regId) => {
    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/registrations/${regId}`);
        const reg = res.data.registration;
        const cls = reg.clearances || [];

        for (const cl of cls) {
          if (cl.status === "CLEAR") {
            dispatch(setClearance({ type: cl.type.toLowerCase(), status: "CLEAR" }));
          }
        }

        if (reg.status === "AWAITING_REVIEW") {
          dispatch(setStatus("AWAITING_REVIEW"));
          dispatch(setStep(5));
          clearInterval(interval);
        }
      } catch (e) { console.error("Poll error:", e.message); }
    }, 2000);

    setTimeout(() => clearInterval(interval), 30000);
  }, [dispatch]);

  const handleSubmitStep3 = async () => {
    setLoading(true); setError(null);
    try {
      dispatch(setVehicleDetails(form));
      const res = await API.post("/registrations", { vehicleDetails: { ...vehicleDetails, ...form }, category });
      const { registrationId: regId } = res.data;
      dispatch(setRegistrationId(regId));
      dispatch(setStatus("RUNNING_CLEARANCES"));
      dispatch(setStep(4));
      pollClearances(regId);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerApprove = async () => {
    setLoading(true);
    try {
      const res = await API.patch(`/registrations/${registrationId}/approve`);
      dispatch(setResult(res.data.registrationNumber));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const ClearanceBadge = ({ type, label }) => {
    const st = clearances[type];
    const cfg = { PENDING: { color: G.amber, icon: "⏳", text: "Requesting via X-Road..." }, CLEAR: { color: G.green, icon: "✅", text: "Clearance Received" }, FLAGGED: { color: G.red, icon: "🚨", text: "Flagged" } }[st] || { color: G.gray, icon: "⏳", text: "Pending" };
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: cfg.color + "10", border: `1px solid ${cfg.color}40`, borderRadius: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{cfg.icon}</span>
          <div><div style={{ fontWeight: 600, fontSize: 14, color: G.grayDk }}>{label}</div><div style={{ fontSize: 12, color: G.gray }}>X-Road → {type.toUpperCase()} Security Server → TEST/GOV/MOT001</div></div>
        </div>
        <span style={S.badge(cfg.color)}>{cfg.text}</span>
      </div>
    );
  };

  const steps = ["Category", "Vehicle Details", "Documents", "X-Road Clearances", "Review & Approve"];

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.container}>
        <div style={{ marginBottom: "1.5rem" }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: G.teal, cursor: "pointer", fontSize: 14, marginBottom: 8 }}>← Back to Dashboard</button>
          <h1 style={S.h1}>Vehicle Registration</h1>
          <p style={{ color: G.gray, fontSize: 14 }}>Ministry of Public Works & Transport — Department of Traffic & Transport</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", marginBottom: "2rem" }}>
          {steps.map((s, i) => {
            const num = i + 1; const active = step === num; const done = step > num;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: done ? G.green : active ? G.teal : "#CBD5E1", color: G.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>{done ? "✓" : num}</div>
                  <div style={{ fontSize: 11, color: active ? G.teal : done ? G.green : G.gray, fontWeight: active ? 700 : 400, marginTop: 4, textAlign: "center" }}>{s}</div>
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 3, background: done ? G.green : "#E2E8F0", marginBottom: 18 }} />}
              </div>
            );
          })}
        </div>

        {error && <div style={{ background: "#FEF2F2", border: `1px solid ${G.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: G.red, fontSize: 13 }}>⚠️ {error}</div>}

        {/* Step 1 */}
        {step === 1 && (
          <div style={S.card}>
            <h2 style={S.h2}>Select Registration Category</h2>
            <p style={{ color: G.gray, fontSize: 14, marginBottom: 20 }}>Choose the category that matches your vehicle's origin per Traffic Department SOPs.</p>
            <div style={S.row}>
              {categories.map(cat => (
                <div key={cat.id} onClick={() => { dispatch(setCategory(cat.id)); dispatch(setStep(2)); }}
                  style={{ ...S.card, flex: 1, minWidth: 200, cursor: "pointer", border: `2px solid ${G.teal}`, marginBottom: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ fontWeight: 700, color: G.navy, fontSize: 15 }}>{cat.label}</div>
                  <div style={{ color: G.gray, fontSize: 12, margin: "6px 0" }}>{cat.desc}</div>
                  <span style={S.badge(G.teal)}>Fee: {cat.fee}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={S.card}>
            <h2 style={S.h2}>Vehicle Details</h2>
            <div style={{ background: G.mint, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#065f46" }}>
              🪪 Registering as: <strong>{name}</strong> — National ID verified by MOSIP ✅
            </div>
            <div style={S.row}>
              {[
                { key: "vin",          label: "VIN Number *",       placeholder: "e.g. 1HGBH41JXMN109186" },
                { key: "engineNumber", label: "Engine Number *",     placeholder: "e.g. B20B4-1234567" },
                { key: "chassis",      label: "Chassis Number",      placeholder: "e.g. JF1BS9KT5DG123456" },
                { key: "make",         label: "Make & Model *",      placeholder: "e.g. Toyota Corolla" },
                { key: "year",         label: "Manufacture Year *",  placeholder: "e.g. 2020" },
                { key: "color",        label: "Colour *",            placeholder: "e.g. White" },
              ].map(f => (
                <div key={f.key} style={S.col}>
                  <label style={S.label}>{f.label}</label>
                  <input style={S.input} placeholder={f.placeholder} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ ...S.row, marginTop: 16 }}>
              <div style={S.col}>
                <label style={S.label}>Vehicle Type *</label>
                <select style={S.select} value={form.vehicleType || ""} onChange={e => setForm(p => ({ ...p, vehicleType: e.target.value }))}>
                  <option value="">Select type...</option>
                  {["Sedan","SUV","Truck","Bus","Motorcycle","Van","Minibus"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.col}>
                <label style={S.label}>Tare Weight (kg) *</label>
                <input style={S.input} type="number" placeholder="e.g. 1250" value={form.weight || ""} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
                {form.weight && <div style={{ marginTop: 6, fontSize: 13, color: G.teal, fontWeight: 600 }}>Calculated fee: {calcFee(form.weight)}</div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => dispatch(setStep(1))} style={S.btnSecondary}>← Back</button>
              <button onClick={() => { dispatch(setVehicleDetails(form)); dispatch(setStep(3)); }} style={S.btnPrimary}>Continue to Documents →</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && category && (
          <div style={S.card}>
            <h2 style={S.h2}>Required Documents</h2>
            <p style={{ color: G.gray, fontSize: 14, marginBottom: 20 }}>Required for <strong>{categories.find(c => c.id === category)?.label}</strong> registration per Traffic Department SOPs (07/05/2024).</p>
            {sopDocs[category]?.map((doc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 8, background: "#F8FAFC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <span style={{ fontSize: 14, color: G.grayDk }}>{doc}</span>
                </div>
                <span style={S.badge(G.green)}>✓ Uploaded</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={() => dispatch(setStep(2))} style={S.btnSecondary}>← Back</button>
              <button onClick={handleSubmitStep3} disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
                {loading ? "⏳ Submitting..." : "Submit & Request X-Road Clearances →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div style={S.card}>
            <h2 style={S.h2}>X-Road Clearance Requests</h2>
            <p style={{ color: G.gray, fontSize: 14, marginBottom: 20 }}>Verifying with government agencies via X-Road Security Server (TEST/GOV/MOT001/VehicleRegistry).</p>
            <div style={{ background: G.navy, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: G.mint }}>
              🔗 X-Road Member: <strong>TEST:GOV:MOT001:VehicleRegistry</strong> — sending encrypted requests...
            </div>
            <ClearanceBadge type="cid"      label="Criminal Investigation Department (CID)" />
            <ClearanceBadge type="interpol" label="Interpol / SARPCCO Stolen Vehicle Check" />
            <ClearanceBadge type="lra"      label="Lesotho Revenue Authority — Tax Compliance" />
            {Object.values(clearances).every(c => c === "CLEAR") && (
              <div style={{ background: G.green + "15", border: `1px solid ${G.green}`, borderRadius: 8, padding: "12px 16px", marginTop: 16, color: G.green, fontWeight: 600 }}>
                ✅ All clearances passed. Routing to Transport Officer for approval...
              </div>
            )}
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div>
            {status !== "APPROVED" ? (
              <div style={S.card}>
                <h2 style={S.h2}>Awaiting Officer Approval</h2>
                <div style={{ background: G.amber + "15", border: `1px solid ${G.amber}`, borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
                  <strong style={{ color: G.amber }}>⏳ Application Under Review</strong>
                  <p style={{ color: G.grayDk, fontSize: 13, margin: "4px 0 0" }}>Your application has been sent to the Transport Officer dashboard. All clearances passed.</p>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, color: G.navy, marginBottom: 8 }}>Application Summary</div>
                  {[
                    { label: "Applicant",   value: name },
                    { label: "National ID", value: nationalId?.substring(0,16) + "..." },
                    { label: "Category",    value: categories.find(c => c.id === category)?.label },
                    { label: "Vehicle",     value: `${vehicleDetails.make || "—"} (${vehicleDetails.vin || "—"})` },
                    { label: "CID",         value: "✅ CLEAR (X-Road)" },
                    { label: "Interpol",    value: "✅ CLEAR (X-Road)" },
                    { label: "LRA Tax",     value: "✅ CLEAR (X-Road)" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E2E8F0", fontSize: 13 }}>
                      <span style={{ color: G.gray }}>{r.label}</span>
                      <span style={{ color: G.grayDk, fontWeight: 500 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: G.navy + "08", border: `1px solid ${G.navy}20`, borderRadius: 8, padding: 16 }}>
                  <p style={{ fontSize: 13, color: G.gray, marginBottom: 12 }}>⚡ Demo: Simulate officer approval</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleOfficerApprove} disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
                      {loading ? "⏳ Processing..." : "✅ Approve Registration (Officer)"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ fontSize: 64 }}>🎉</div>
                <h2 style={{ color: G.green, fontSize: 24, marginTop: 16 }}>Registration Approved!</h2>
                <p style={{ color: G.gray }}>Your vehicle has been successfully registered in the Digital Vehicle Registry System.</p>
                <div style={{ background: G.navy, borderRadius: 12, padding: "1.5rem", margin: "1.5rem auto", maxWidth: 400 }}>
                  <div style={{ color: G.mint, fontSize: 12, marginBottom: 4 }}>REGISTRATION NUMBER</div>
                  <div style={{ color: G.white, fontSize: 32, fontWeight: 700, letterSpacing: 4 }}>{registrationNumber}</div>
                  <div style={{ color: G.gray, fontSize: 12, marginTop: 8 }}>Kingdom of Lesotho — Ministry of Transport</div>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
                  <button style={S.btnPrimary}>📄 Download Certificate</button>
                  <button onClick={() => { dispatch(resetForm()); navigate("/dashboard"); }} style={S.btnSecondary}>← Back to Dashboard</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4 — OFFICER DASHBOARD (with real API data)
// ══════════════════════════════════════════════════════════════
function OfficerDashboard() {
  const [activeTab, setActiveTab] = useState("registrations");
  const [applications, setApplications] = useState([]);
  const [permits, setPermits] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // Force officer dashboard to use demo officer token for backend API calls
    window.__dvrsToken = "demo-officer-token";

    try {
      const regRes = await API.get("/registrations", {
        headers: { Authorization: "Bearer demo-officer-token" }
      });
      console.log("Officer registrations loaded:", regRes.data);
      setApplications(regRes.data.registrations || []);
    } catch (e) {
      console.error("Registrations:", e.response?.data || e.message);
      setApplications([]);
    }

    try {
      const pRes = await API.get("/permits/pending", {
        headers: { Authorization: "Bearer demo-officer-token" }
      });
      console.log("Officer permits loaded:", pRes.data);
      setPermits(pRes.data.permits || []);
    } catch (e) {
      console.error("Permits:", e.response?.data || e.message);
      setPermits([]);
    }

    try {
      const tRes = await API.get("/transfers/pending", {
        headers: { Authorization: "Bearer demo-officer-token" }
      });
      console.log("Officer transfers loaded:", tRes.data);
      setTransfers(tRes.data.transfers || []);
    } catch (e) {
      console.error("Transfers:", e.response?.data || e.message);
      setTransfers([]);
    }

    try {
      const logRes = await API.get("/audit-logs", {
        headers: { Authorization: "Bearer demo-officer-token" }
      });
      console.log("Officer logs loaded:", logRes.data);
      setLogs(logRes.data.logs || []);
    } catch (e) {
      console.error("Audit logs:", e.response?.data || e.message);
      setLogs([]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const approve = async (id) => {
    try { await API.patch("/registrations/" + id + "/approve"); fetchData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const reject = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try { await API.patch("/registrations/" + id + "/reject", { reason }); fetchData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const approvePermit = async (id) => {
    try { await API.patch("/permits/" + id + "/approve"); fetchData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const rejectPermit = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try { await API.patch("/permits/" + id + "/reject", { reason }); fetchData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const approveTransfer = async (id) => {
    try { await API.patch("/transfers/" + id + "/approve"); fetchData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const rejectTransfer = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try { await API.patch("/transfers/" + id + "/reject", { reason }); fetchData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };

  const statusColor = { PENDING: G.amber, AWAITING_REVIEW: G.teal, APPROVED: G.green, REJECTED: G.red, CLEARANCE_FAILED: G.red, PENDING_APPROVAL: G.amber, ACTIVE: G.green };

  const Tab = ({ id, label, count }) => (
    <button onClick={() => setActiveTab(id)} style={{
      padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
      background: activeTab === id ? G.teal : "transparent",
      color: activeTab === id ? G.white : G.gray,
      borderBottom: activeTab === id ? "3px solid " + G.teal : "3px solid transparent",
    }}>
      {label}
      {count > 0 && <span style={{ background: G.red, color: G.white, borderRadius: 20, padding: "2px 8px", fontSize: 11, marginLeft: 6 }}>{count}</span>}
    </button>
  );

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.container}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={S.h1}>Officer Dashboard</h1>
          <p style={{ color: G.gray, fontSize: 14 }}>Department of Traffic & Transport — Application Review</p>
        </div>

        <div style={S.row}>
          {[
            { label: "Awaiting Review",    value: applications.filter(a => a.status === "AWAITING_REVIEW").length, color: G.amber, icon: "⏳" },
            { label: "Pending Permits",    value: permits.length,                                                   color: G.teal,  icon: "📋" },
            { label: "Pending Transfers",  value: transfers.length,                                                 color: G.navy,  icon: "🔄" },
            { label: "Approved Today",     value: applications.filter(a => a.status === "APPROVED").length,         color: G.green, icon: "✅" },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, flex: 1, textAlign: "center", borderTop: "4px solid " + s.color }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: G.gray, fontSize: 13 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", padding: "0 1rem", background: G.white }}>
            <Tab id="registrations" label="🚗 Registrations" count={applications.filter(a => a.status === "AWAITING_REVIEW").length} />
            <Tab id="permits"       label="📋 Permits"       count={permits.length} />
            <Tab id="transfers"     label="🔄 Transfers"     count={transfers.length} />
            <Tab id="logs"          label="📊 Audit Log"     count={0} />
            <button onClick={fetchData} style={{ marginLeft: "auto", padding: "10px 16px", background: "transparent", border: "none", color: G.teal, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>🔄 Refresh</button>
          </div>

          <div style={{ padding: "1.5rem" }}>

            {activeTab === "registrations" && (
              loading ? <Spinner /> : applications.length === 0 ? (
                <p style={{ color: G.gray, textAlign: "center", padding: "2rem" }}>No applications yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G.navy }}>
                      {["App ID", "Applicant", "Vehicle", "Category", "Clearances", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", color: G.white, fontSize: 12, textAlign: "left", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applications.filter(a => a.status !== "DRAFT").map((a, i) => {
                      const cls = Array.isArray(a.clearances) ? a.clearances.filter(c => c.type) : [];
                      const allClear = cls.length === 3 && cls.every(c => c.status === "CLEAR");
                      return (
                        <tr key={a.registration_id} style={{ background: i % 2 === 0 ? "#F8FAFC" : G.white }}>
                          <td style={{ padding: "10px 12px", fontSize: 11, color: G.gray, fontFamily: "monospace" }}>{a.registration_id?.substring(0,8)}...</td>
                          <td style={{ padding: "10px 12px", fontSize: 13 }}>{a.owner_name || "—"}</td>
                          <td style={{ padding: "10px 12px", color: G.gray, fontSize: 13 }}>{a.model || a.vin || "—"}</td>
                          <td style={{ padding: "10px 12px" }}><span style={S.chip(G.teal)}>{a.registration_category}</span></td>
                          <td style={{ padding: "10px 12px" }}><span style={S.badge(allClear ? G.green : G.amber)}>{allClear ? "✅ All Clear" : cls.filter(c => c.status === "CLEAR").length + "/3"}</span></td>
                          <td style={{ padding: "10px 12px" }}><span style={S.badge(statusColor[a.status] || G.gray)}>{a.status?.replace(/_/g," ")}</span></td>
                          <td style={{ padding: "10px 12px" }}>
                            {a.status === "AWAITING_REVIEW" && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => approve(a.registration_id)} style={{ ...S.btnPrimary, padding: "4px 10px", fontSize: 11 }}>✅ Approve</button>
                                <button onClick={() => reject(a.registration_id)}  style={{ ...S.btnDanger,   padding: "4px 10px", fontSize: 11 }}>❌ Reject</button>
                              </div>
                            )}
                            {a.registration_number && <span style={{ fontWeight: 700, color: G.navy, fontSize: 12 }}>{a.registration_number}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "permits" && (
              permits.length === 0 ? (
                <p style={{ color: G.gray, textAlign: "center", padding: "2rem" }}>No pending permit applications.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G.navy }}>
                      {["Owner", "National ID", "Vehicle", "Permit Type", "Description", "Fee", "Issue Date", "Expiry", "Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", color: G.white, fontSize: 12, textAlign: "left", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permits.map((p, i) => (
                      <tr key={p.permit_id} style={{ background: i % 2 === 0 ? "#F8FAFC" : G.white }}>
                        <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{p.owner_name || "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 11, color: G.gray, fontFamily: "monospace" }}>{p.owner_national_id}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: G.gray }}>{p.model || p.vin || "—"} {p.manufacture_year}</td>
                        <td style={{ padding: "10px 12px" }}><span style={{ ...S.chip(G.teal), fontSize: 16, fontWeight: 700 }}>{p.permit_type}</span></td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: G.gray }}>{{ A:"Private Vehicle", B:"Light Commercial", C:"Heavy Commercial", D:"Extra Heavy", E:"Public Service", F:"Special Purpose" }[p.permit_type]}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: G.teal }}>M {p.fee_amount}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12 }}>{p.issue_date}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12 }}>{p.expiry_date}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => approvePermit(p.permit_id)} style={{ ...S.btnPrimary, padding: "4px 10px", fontSize: 11 }}>✅ Approve</button>
                            <button onClick={() => rejectPermit(p.permit_id)}  style={{ ...S.btnDanger,   padding: "4px 10px", fontSize: 11 }}>❌ Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "transfers" && (
              transfers.length === 0 ? (
                <p style={{ color: G.gray, textAlign: "center", padding: "2rem" }}>No pending ownership transfers.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G.navy }}>
                      {["Vehicle", "Reg Number", "Transfer Type", "Current Owner", "New Owner", "Requested", "Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", color: G.white, fontSize: 12, textAlign: "left", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t, i) => (
                      <tr key={t.ownership_id} style={{ background: i % 2 === 0 ? "#F8FAFC" : G.white }}>
                        <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{t.model || "—"} {t.manufacture_year}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: G.teal, fontWeight: 600 }}>{t.registration_number || "—"}</td>
                        <td style={{ padding: "10px 12px" }}><span style={S.chip(G.navy)}>{t.transfer_type}</span></td>
                        <td style={{ padding: "10px 12px", fontSize: 13 }}>{t.current_owner_name || "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: G.navy }}>{t.new_owner_name || "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: G.gray }}>{new Date(t.requested_at).toLocaleDateString()}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => approveTransfer(t.ownership_id)} style={{ ...S.btnPrimary, padding: "4px 10px", fontSize: 11 }}>✅ Approve</button>
                            <button onClick={() => rejectTransfer(t.ownership_id)}  style={{ ...S.btnDanger,   padding: "4px 10px", fontSize: 11 }}>❌ Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "logs" && (
              <div style={{ fontFamily: "monospace", fontSize: 12, color: G.grayDk }}>
                {logs.slice(0,30).map((log, i) => (
                  <div key={log.log_id} style={{ padding: "8px 12px", background: i % 2 === 0 ? "#F8FAFC" : G.white, borderRadius: 4, marginBottom: 2, display: "flex", gap: 16 }}>
                    <span style={{ color: G.gray, minWidth: 80 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span style={{ color: G.teal, fontWeight: 700, minWidth: 220 }}>{log.action}</span>
                    <span style={{ color: G.grayDk }}>{log.actor_id?.substring(0,20)}</span>
                    <span style={{ color: G.gray }}>{log.actor_role}</span>
                  </div>
                ))}
                {logs.length === 0 && <p style={{ color: G.gray }}>No audit log entries yet.</p>}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function EditRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reg, setReg] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const calcFee = (w) => {
    w = parseInt(w) || 0;
    if (w <= 1500) return 150; if (w <= 3500) return 250;
    if (w <= 6500) return 350; if (w <= 9500) return 400;
    if (w <= 11000) return 310; return 360;
  };

  useEffect(() => {
    API.get("/registrations/" + id + "/edit")
      .then(res => {
        const r = res.data.registration;
        setReg(r);
        setForm({ vin: r.vin||"", engineNumber: r.engine_number||"", chassis: r.chassis_number||"", vehicleType: r.vehicle_type||"", make: r.model||"", year: r.manufacture_year||"", weight: r.tare_weight_kg||"", color: r.color||"" });
        setLoading(false);
      })
      .catch(e => { setError(e.response?.data?.error || e.message); setLoading(false); });
  }, [id]);

  const handleSubmit = async () => {
    setSaving(true); setError(null);
    try {
      await API.patch("/registrations/" + id + "/edit", { vehicleDetails: form, category: reg.registration_category });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch(e) { setError(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={S.page}><Navbar /><div style={S.container}><Spinner text="Loading..." /></div></div>;

  if (success) return (
    <div style={S.page}><Navbar />
      <div style={S.container}>
        <div style={{ ...S.card, textAlign:"center" }}>
          <div style={{ fontSize:48 }}>✅</div>
          <h2 style={{ color:G.green }}>Registration Updated!</h2>
          <p style={{ color:G.gray }}>X-Road clearances restarted. Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );

  const fields = [
    ["vin",          "VIN Number",      "e.g. SA999888777666555"],
    ["engineNumber", "Engine Number",   "e.g. 4Y1234567"],
    ["chassis",      "Chassis Number",  "e.g. CH1234567890"],
    ["vehicleType",  "Vehicle Type",    "e.g. Sedan, SUV, Truck"],
    ["make",         "Make & Model",    "e.g. Toyota Corolla"],
    ["year",         "Year",            "e.g. 2020"],
    ["weight",       "Tare Weight (kg)","e.g. 1200"],
    ["color",        "Colour",          "e.g. Silver"],
  ];

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.container}>
        <div style={{ marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => navigate("/dashboard")} style={{ ...S.btnSecondary, padding:"6px 14px" }}>Back</button>
          <div>
            <h1 style={S.h1}>Edit Pending Registration</h1>
            <p style={{ color:G.gray, fontSize:13, margin:0 }}>Category: <strong>{reg?.registration_category}</strong> — Fix details and resubmit</p>
          </div>
        </div>
        <div style={S.card}>
          <div style={{ background:"#FFF8E1", border:"1px solid #FFC107", borderRadius:8, padding:"12px 16px", marginBottom:20 }}>
            <strong style={{ color:"#856404" }}>Edit Pending Registration</strong>
            <p style={{ color:"#856404", fontSize:13, margin:"4px 0 0" }}>Update any incorrect details below. Clicking Save will restart X-Road clearances automatically.</p>
          </div>
          {error && <div style={{ background:"#FEE2E2", border:"1px solid #F87171", borderRadius:8, padding:12, marginBottom:16, color:G.red }}>{error}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {fields.map(([key, label, ph]) => (
              <div key={key}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:G.navy, marginBottom:6 }}>{label}</label>
                <input value={form[key]||""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph} style={{ width:"100%", padding:"10px 12px", border:"1px solid #D1D5DB", borderRadius:6, fontSize:14, boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
          {form.weight && (
            <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:8, padding:12, marginTop:16 }}>
              <strong style={{ color:G.navy }}>Calculated Fee: M {calcFee(form.weight)}.00</strong>
              <span style={{ color:G.gray, fontSize:12, marginLeft:8 }}>based on {form.weight}kg tare weight</span>
            </div>
          )}
          <div style={{ display:"flex", gap:12, marginTop:24, justifyContent:"flex-end" }}>
            <button onClick={() => navigate("/dashboard")} style={S.btnSecondary} disabled={saving}>Cancel</button>
            <button onClick={handleSubmit} style={{ ...S.btnPrimary, opacity:saving?0.7:1 }} disabled={saving}>
              {saving ? "Saving & Retrying Clearances..." : "Save & Resubmit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/"             element={<Navigate to="/login" replace />} />
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/dashboard"    element={<ProtectedRoute allowedRoles={["CITIZEN"]}><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/register"     element={<ProtectedRoute allowedRoles={["CITIZEN"]}><VehicleRegistration /></ProtectedRoute>} />
          <Route path="/register/resume/:id" element={<ProtectedRoute allowedRoles={["CITIZEN"]}><EditRegistration /></ProtectedRoute>} />
          <Route path="/transfer"     element={<ProtectedRoute allowedRoles={["CITIZEN"]}><TransferOwnership /></ProtectedRoute>} />
          <Route path="/permits"      element={<ProtectedRoute allowedRoles={["CITIZEN"]}><PermitRenewal /></ProtectedRoute>} />
          <Route path="/officer"      element={<ProtectedRoute allowedRoles={["OFFICER"]}><OfficerDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
