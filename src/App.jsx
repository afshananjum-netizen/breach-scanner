
import { useState } from "react";

const BREACH_WEIGHTS = {
  "Passwords": 40, "Plaintext passwords": 40,
  "Password hints": 25, "Security questions and answers": 20,
  "Credit cards": 30, "Bank account numbers": 30,
  "Social security numbers": 35, "Phone numbers": 10,
  "Physical addresses": 10, "Email addresses": 5,
  "Usernames": 5, "IP addresses": 5,
  "Dates of birth": 8, "Government issued IDs": 30,
};

function getScoreAndGrade(breaches) {
  if (!breaches || breaches.length === 0) return { score: 100, grade: "A" };
  let deduction = 0;
  breaches.forEach(b => b.DataClasses.forEach(dc => {
    if (BREACH_WEIGHTS[dc]) deduction += BREACH_WEIGHTS[dc];
  }));
  const score = Math.max(0, 100 - deduction);
  let grade = "A";
  if (score < 20) grade = "F";
  else if (score < 40) grade = "D";
  else if (score < 60) grade = "C";
  else if (score < 80) grade = "B";
  return { score, grade };
}

function gradeColor(grade) {
  return { A: "#00e5a0", B: "#7ed957", C: "#f5c518", D: "#ff8c42", F: "#ff3c5f" }[grade] || "#fff";
}

function CircularGauge({ score, grade }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = gradeColor(grade);
  return (
    <div style={{ position: "relative", width: 210, height: 210, margin: "0 auto" }}>
      <svg width="210" height="210" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="105" cy="105" r={r} fill="none" stroke="#1a2236" strokeWidth="18" />
        <circle cx="105" cy="105" r={r} fill="none" stroke={color} strokeWidth="18"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,2,.6,1)", filter: `drop-shadow(0 0 10px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 42, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#8899bb", marginTop: 2 }}>RISK SCORE</div>
        <div style={{ marginTop: 6, display: "inline-block", background: color + "22", border: `1.5px solid ${color}`, borderRadius: 6, padding: "2px 14px", fontFamily: "'Orbitron', monospace", fontSize: 22, color, fontWeight: 700, letterSpacing: 2, boxShadow: `0 0 12px ${color}55` }}>{grade}</div>
      </div>
    </div>
  );
}

function BreachCard({ breach }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#0d1526", border: "1px solid #1e2d4a", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔓</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", color: "#e0e8ff", fontSize: 14 }}>{breach.Name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#8899bb" }}>{new Date(breach.BreachDate).getFullYear()}</span>
          <span style={{ color: "#8899bb" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 16px 12px", borderTop: "1px solid #1e2d4a" }}>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {breach.DataClasses.map((dc) => {
              const isHigh = BREACH_WEIGHTS[dc] >= 25;
              return (
                <span key={dc} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, padding: "3px 10px", borderRadius: 20, background: isHigh ? "#ff3c5f22" : "#1a2a3a", border: `1px solid ${isHigh ? "#ff3c5f" : "#2a3d5a"}`, color: isHigh ? "#ff7a96" : "#7a9cc4" }}>{dc}</span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AIAdvicePanel({ breaches }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getAdvice() {
    setLoading(true);
    setAdvice(null);
    const breachSummary = breaches.map(b =>
      `${b.Name} (${b.BreachDate.slice(0, 4)}): leaked ${b.DataClasses.join(", ")}`
    ).join("\n");
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a cybersecurity expert. The user's email was found in these breaches:\n\n${breachSummary}\n\nGive EXACTLY 3 steps to fix their digital footprint. Format:\n\nSTEP X: [TITLE]\n[2-3 sentence explanation]\n\nBe specific to their leaks. No intro text.`
              }]
            }]
          })
        }
      );
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate advice.";
      setAdvice(text);
    } catch {
      setAdvice("Failed to load. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 24 }}>
      {!advice && !loading && (
        <button onClick={getAdvice} style={{ width: "100%", padding: 14, borderRadius: 10, background: "linear-gradient(135deg, #00e5a022, #0066ff22)", border: "1.5px solid #00e5a0", color: "#00e5a0", fontSize: 14, fontFamily: "'Share Tech Mono', monospace", cursor: "pointer", letterSpacing: 1, boxShadow: "0 0 20px #00e5a022" }}>
          ⚡ GENERATE AI SECURITY CHEAT SHEET
        </button>
      )}
      {loading && (
        <div style={{ textAlign: "center", padding: 24, color: "#00e5a0", fontSize: 13, fontFamily: "'Share Tech Mono', monospace" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
          Analyzing your breach data...
        </div>
      )}
      {advice && (
        <div style={{ background: "#080f1e", border: "1px solid #00e5a044", borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#00e5a0", letterSpacing: 3, marginBottom: 14 }}>⚡ YOUR SECURITY CHEAT SHEET</div>
          {advice.split(/\n\n/).filter(Boolean).map((block, i) => {
            const lines = block.split("\n");
            const title = lines[0];
            const body = lines.slice(1).join(" ");
            return (
              <div key={i} style={{ marginBottom: 16, padding: "12px 14px", background: "#0d1a2e", borderRadius: 8, borderLeft: "3px solid #00e5a0" }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", color: "#00e5a0", fontSize: 12, marginBottom: 5, fontWeight: 700 }}>{title}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", color: "#7a9cc4", fontSize: 12, lineHeight: 1.6 }}>{body}</div>
              </div>
            );
          })}
          <button onClick={() => setAdvice(null)} style={{ background: "none", border: "none", color: "#8899bb", fontSize: 11, cursor: "pointer", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>↺ REGENERATE</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function scan() {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    let breaches = [];

    try {
      const response = await fetch(
        `https://breach-scanner-backend.onrender.com/api/scan?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      console.log("Server response:", data);

      if (data.breached && data.breaches) {
        breaches = data.breaches;
      }

    } catch (err) {
      console.log("Error:", err);
      breaches = [];
    }

    const { score, grade } = getScoreAndGrade(breaches);
    setResult({ breaches, score, grade });
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .scan-input:focus { outline: none; border-color: #00e5a0 !important; box-shadow: 0 0 0 3px #00e5a022 !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 20%, #0a1628 0%, #060d1a 60%)", fontFamily: "'Share Tech Mono', monospace", color: "#e0e8ff", padding: "40px 20px" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(#0f2040 1px, transparent 1px), linear-gradient(90deg, #0f2040 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.3 }} />

        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative", zIndex: 1 }}>

          <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeUp 0.6s ease" }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 6, color: "#00e5a0", marginBottom: 12, textShadow: "0 0 20px #00e5a0" }}>◈ CYBERSEC TOOLKIT ◈</div>
            <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg, #e0e8ff 30%, #00e5a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2, marginBottom: 10 }}>EMAIL BREACH<br />SCANNER</h1>
            <p style={{ color: "#8899bb", fontSize: 12, letterSpacing: 1 }}>SCAN → SCORE → FIX YOUR DIGITAL FOOTPRINT</p>
          </div>

          <div style={{ background: "#0a1322", borderRadius: 14, border: "1px solid #1e2d4a", padding: 24, boxShadow: "0 0 40px #00000066", marginBottom: 24 }}>
            <div style={{ marginBottom: 6, fontSize: 11, color: "#8899bb", letterSpacing: 2 }}>TARGET EMAIL</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input className="scan-input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && scan()} placeholder="user@example.com"
                style={{ flex: 1, background: "#060d1a", border: "1.5px solid #1e2d4a", borderRadius: 8, padding: "12px 14px", fontFamily: "'Share Tech Mono', monospace", fontSize: 14, color: "#e0e8ff" }} />
              <button onClick={scan} disabled={loading} style={{ padding: "12px 22px", borderRadius: 8, background: loading ? "#1a2236" : "linear-gradient(135deg, #00c87a, #0066ff)", border: "none", color: "#fff", fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 1, whiteSpace: "nowrap", boxShadow: loading ? "none" : "0 0 20px #00e5a044" }}>
                {loading ? "SCANNING..." : "SCAN ▶"}
              </button>
            </div>
            {error && <div style={{ marginTop: 10, color: "#ff3c5f", fontSize: 12 }}>⚠ {error}</div>}
            <div style={{ marginTop: 10, fontSize: 10, color: "#4a5a7a", letterSpacing: 1 }}>💡 Enter any email to scan for real breaches</div>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 60, height: 60, border: "3px solid #1a2236", borderTop: "3px solid #00e5a0", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ color: "#00e5a0", fontSize: 12, letterSpacing: 2 }}>SCANNING BREACH DATABASES...</div>
            </div>
          )}

          {result && (
            <div style={{ animation: "fadeUp 0.5s ease" }}>
              <div style={{ background: "#0a1322", borderRadius: 14, border: `1px solid ${gradeColor(result.grade)}44`, padding: 28, textAlign: "center", marginBottom: 16, boxShadow: `0 0 40px ${gradeColor(result.grade)}11` }}>
                <CircularGauge score={result.score} grade={result.grade} />
                <div style={{ marginTop: 16, color: "#8899bb", fontSize: 12 }}>
                  {result.breaches.length === 0
                    ? <span style={{ color: "#00e5a0" }}>✓ No breaches found!</span>
                    : <span>Found in <span style={{ color: "#ff7a96", fontWeight: 700 }}>{result.breaches.length} breaches</span></span>}
                </div>
              </div>

              {result.breaches.length > 0 && (
                <div style={{ background: "#0a1322", borderRadius: 14, border: "1px solid #1e2d4a", padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#8899bb", marginBottom: 14 }}>BREACH DETAILS</div>
                  {result.breaches.map((b, i) => <BreachCard key={i} breach={b} />)}
                </div>
              )}

              {result.breaches.length > 0 && (
                <div style={{ background: "#0a1322", borderRadius: 14, border: "1px solid #1e2d4a", padding: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#8899bb", marginBottom: 4 }}>AI SECURITY ADVISOR</div>
                  <AIAdvicePanel breaches={result.breaches} />
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 32, fontSize: 10, color: "#2a3a54", letterSpacing: 1 }}>
            POWERED BY XPOSEDORNOT + GEMINI AI · FOR EDUCATIONAL USE
          </div>

        </div>
      </div>
    </>
  );
}