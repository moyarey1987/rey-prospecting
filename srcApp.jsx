import { useState, useEffect } from "react";

const TEMPLATES = {
  en: {
    initial: [
      (n, a) => `Hi ${n}! This is Rey from Hialeah. I just wanted to reach out and let you know I'm available whenever you're ready to sell or make a move with your property${a ? ` at ${a}` : ""}. No pressure at all — just here when you need me! 😊`,
      (n, a) => `Hey ${n}, Rey here! Just a friendly check-in. If you ever decide to list${a ? ` ${a}` : " your property"} or explore your options, I'm just a call or text away. Happy to help whenever the time is right!`,
    ],
    followup30: [
      (n, a) => `Hi ${n}, Rey checking in! Hope all is well. Just a reminder that I'm still available if you're thinking about making any moves with${a ? ` ${a}` : " your property"}. Feel free to reach out anytime! 🏡`,
      (n, a) => `Hey ${n}! The market has been really active lately and I thought of you. If you ever want a quick chat about your options${a ? ` for ${a}` : ""}, I'm here. No commitment needed!`,
    ],
    followup60: [
      (n, a) => `Hi ${n}, it's Rey! I know life gets busy, but I wanted to stay in touch. Whenever you're ready to explore selling${a ? ` ${a}` : " your property"}, I'm here to make the process as smooth as possible. 🙌`,
      (n, a) => `Hey ${n}! Just making sure you know I'm still your go-to person for anything related to${a ? ` ${a}` : " your property"}. Reach out anytime, I'd love to help!`,
    ],
    followup90: [
      (n, a) => `Hi ${n}! This is Rey. Hope everything is going great. I'm still around and would love to be of service when you're ready to make a move${a ? ` with ${a}` : ""}. Don't hesitate to call or text! 😊`,
      (n, a) => `Hey ${n}, Rey here — just a quick note to say I'm still thinking of you and your property${a ? ` at ${a}` : ""}. Whenever the timing feels right, I'm ready to get to work for you!`,
    ],
  },
  es: {
    initial: [
      (n, a) => `¡Hola ${n}! Te escribe Rey de Hialeah. Quería comunicarme para que sepas que estoy disponible cuando estés listo/a para vender o tomar alguna decisión con tu propiedad${a ? ` en ${a}` : ""}. Sin ningún compromiso — ¡aquí estaré cuando lo necesites! 😊`,
      (n, a) => `¡Hola ${n}, habla Rey! Solo un saludo amistoso. Si en algún momento decides poner en venta${a ? ` ${a}` : " tu propiedad"} o explorar tus opciones, estoy a una llamada o mensaje de distancia. ¡Con gusto te ayudo!`,
    ],
    followup30: [
      (n, a) => `¡Hola ${n}, te escribe Rey! Espero que todo esté muy bien. Solo un recordatorio de que sigo disponible si estás pensando en hacer algún movimiento con${a ? ` ${a}` : " tu propiedad"}. ¡No dudes en comunicarte! 🏡`,
      (n, a) => `¡Hola ${n}! El mercado ha estado muy activo y pensé en ti. Si quieres platicar sobre tus opciones${a ? ` para ${a}` : ""}, aquí estoy. ¡Sin compromiso!`,
    ],
    followup60: [
      (n, a) => `¡Hola ${n}, soy Rey! Sé que la vida se pone ocupada, pero quería mantener el contacto. Cuando estés listo/a para explorar la venta${a ? ` de ${a}` : " de tu propiedad"}, aquí estoy para hacer el proceso lo más fácil posible. 🙌`,
      (n, a) => `¡Hola ${n}! Solo quiero que sepas que sigo siendo tu persona de confianza para todo lo relacionado con${a ? ` ${a}` : " tu propiedad"}. ¡Contáctame cuando quieras!`,
    ],
    followup90: [
      (n, a) => `¡Hola ${n}! Te escribe Rey. Espero que todo marche de maravilla. Sigo aquí y con mucho gusto te ayudaría cuando decidas dar el paso${a ? ` con ${a}` : ""}. ¡No dudes en llamar o escribir! 😊`,
      (n, a) => `¡Hola ${n}, habla Rey! Solo una nota rápida para decirte que sigo pensando en ti y en tu propiedad${a ? ` en ${a}` : ""}. ¡Cuando sea el momento, estoy listo/a para ponerme a trabajar por ti!`,
    ],
  },
};

const STAGES = {
  initial:    { en: "Initial Contact",    es: "Contacto Inicial",       days: null },
  followup30: { en: "30-Day Follow-up",   es: "Seguimiento 30 días",    days: 30 },
  followup60: { en: "60-Day Follow-up",   es: "Seguimiento 60 días",    days: 60 },
  followup90: { en: "90-Day Follow-up",   es: "Seguimiento 90 días",    days: 90 },
};

const daysSince = (d) => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;

const suggestStage = (lastContact, lastStage) => {
  const d = daysSince(lastContact);
  if (!lastStage || lastStage === "") return "initial";
  if (d >= 90) return "followup90";
  if (d >= 60) return "followup60";
  if (d >= 30) return "followup30";
  return null;
};

const urgencyColor = (prospect) => {
  const d = daysSince(prospect.lastContact);
  if (d === null) return "#c9a96e";
  if (d < 25) return "#4ade80";
  if (d < 55) return "#facc15";
  if (d < 85) return "#fb923c";
  return "#f87171";
};

const EMPTY_FORM = { name: "", address: "", phone: "", email: "", notes: "" };

export default function App() {
  const [prospects, setProspects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);
  const [lang, setLang] = useState("en");
  const [stage, setStage] = useState("initial");
  const [msgText, setMsgText] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [search, setSearch] = useState("");

  // Load from persistent storage
  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get("prospects");
        if (result?.value) setProspects(JSON.parse(result.value));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  const persist = async (data) => {
    setProspects(data);
    try { await window.storage.set("prospects", JSON.stringify(data)); } catch {}
  };

  const addProspect = async () => {
    if (!form.name.trim()) return;
    const p = { ...form, id: Date.now(), lastContact: null, lastStage: "", createdAt: new Date().toISOString() };
    await persist([...prospects, p]);
    setForm(EMPTY_FORM);
    setView("list");
  };

  const deleteProspect = async (id) => {
    await persist(prospects.filter(p => p.id !== id));
    if (selected?.id === id) setView("list");
  };

  const openMessage = (p) => {
    setSelected(p);
    const s = suggestStage(p.lastContact, p.lastStage) || "initial";
    setStage(s);
    setLang("en");
    const t = TEMPLATES["en"][s];
    setMsgText(t[Math.floor(Math.random() * t.length)](p.name, p.address));
    setCopied(false); setSent(false);
    setView("message");
  };

  const regenerate = () => {
    const t = TEMPLATES[lang][stage];
    setMsgText(t[Math.floor(Math.random() * t.length)](selected.name, selected.address));
    setCopied(false);
  };

  useEffect(() => {
    if (selected && view === "message") {
      const t = TEMPLATES[lang][stage];
      setMsgText(t[Math.floor(Math.random() * t.length)](selected.name, selected.address));
      setCopied(false);
    }
  }, [lang, stage]);

  const copyMsg = () => {
    navigator.clipboard.writeText(msgText).then(() => setCopied(true));
  };

  const markSent = async () => {
    const updated = prospects.map(p =>
      p.id === selected.id ? { ...p, lastContact: new Date().toISOString(), lastStage: stage } : p
    );
    await persist(updated);
    setSelected({ ...selected, lastContact: new Date().toISOString(), lastStage: stage });
    setSent(true);
  };

  const sorted = [...prospects]
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.address||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (daysSince(a.lastContact) ?? 999) < (daysSince(b.lastContact) ?? 999) ? 1 : -1);

  const needsAttention = prospects.filter(p => {
    const d = daysSince(p.lastContact);
    return d === null || d >= 28;
  }).length;

  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:"#0a0d14", display:"flex", alignItems:"center", justifyContent:"center", color:"#c9a96e", fontFamily:"Georgia,serif", fontSize:16 }}>
      Loading...
    </div>
  );

  const gold = "#c9a96e";
  const bg = "#0a0d14";
  const card = "#111520";
  const border = "#1e2535";

  return (
    <div style={{ minHeight:"100vh", background:bg, fontFamily:"'Georgia',serif", color:"#e8e0d5", paddingBottom:40 }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(180deg,#131826 0%,#0a0d14 100%)", borderBottom:`1px solid ${border}`, padding:"18px 20px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {view !== "list" && (
              <button onClick={() => setView("list")} style={{ background:"none", border:"none", color:gold, fontSize:20, cursor:"pointer", padding:"0 6px 0 0" }}>←</button>
            )}
            <div>
              <div style={{ fontSize:10, letterSpacing:3, color:gold, textTransform:"uppercase" }}>Rey · Real Estate</div>
              <div style={{ fontSize:17, fontWeight:"bold", color:"#f5f0e8", marginTop:1 }}>
                {view === "list" ? "Prospect Tracker" : view === "add" ? "New Prospect" : "Send Message"}
              </div>
            </div>
          </div>
          {view === "list" && (
            <button onClick={() => setView("add")} style={{ background:`linear-gradient(135deg,${gold},#9a7030)`, border:"none", borderRadius:8, color:bg, padding:"8px 16px", cursor:"pointer", fontWeight:"bold", fontSize:13 }}>
              + Add
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:600, margin:"0 auto", padding:"16px 16px" }}>

        {/* LIST */}
        {view === "list" && (
          <>
            {/* Stats bar */}
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              {[
                { label:"Total", value:prospects.length, color:"#888" },
                { label:"Need Follow-up", value:needsAttention, color:needsAttention>0?"#f87171":"#4ade80" },
              ].map(s => (
                <div key={s.label} style={{ flex:1, background:card, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:22, fontWeight:"bold", color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ position:"relative", marginBottom:14 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or address..."
                style={{ width:"100%", padding:"10px 14px 10px 36px", background:card, border:`1px solid ${border}`, borderRadius:10, color:"#e8e0d5", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#444" }}>🔍</span>
            </div>

            {sorted.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#444" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🏡</div>
                <div style={{ fontSize:15 }}>No prospects yet.</div>
                <div style={{ fontSize:13, marginTop:6 }}>Tap <b style={{color:gold}}>+ Add</b> to get started.</div>
              </div>
            )}

            {sorted.map(p => {
              const d = daysSince(p.lastContact);
              const dot = urgencyColor(p);
              const next = suggestStage(p.lastContact, p.lastStage);
              return (
                <div key={p.id} style={{ background:card, border:`1px solid ${border}`, borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0, boxShadow:`0 0 7px ${dot}` }} />
                        <div style={{ fontWeight:"bold", fontSize:16, color:"#f5f0e8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                      </div>
                      {p.address && <div style={{ fontSize:12, color:"#666", marginBottom:2 }}>📍 {p.address}</div>}
                      {p.phone && <div style={{ fontSize:12, color:"#666" }}>📱 {p.phone}</div>}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                        <span style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background:bg, border:`1px solid ${dot}44`, color:dot }}>
                          {d === null ? "New" : d === 0 ? "Contacted today" : `${d}d ago`}
                        </span>
                        {next && (
                          <span style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background:`${gold}11`, border:`1px solid ${gold}44`, color:gold }}>
                            ⏰ {STAGES[next].en}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                      <button onClick={() => openMessage(p)} style={{ background:`linear-gradient(135deg,${gold},#9a7030)`, border:"none", borderRadius:8, color:bg, padding:"8px 12px", cursor:"pointer", fontWeight:"bold", fontSize:12 }}>
                        ✉️ Message
                      </button>
                      <button onClick={() => deleteProspect(p.id)} style={{ background:"none", border:"1px solid #3a1a1a", borderRadius:8, color:"#aa4444", padding:"6px 10px", cursor:"pointer", fontSize:11 }}>
                        Remove
                      </button>
                    </div>
                  </div>
                  {p.notes && (
                    <div style={{ marginTop:10, fontSize:12, color:"#555", fontStyle:"italic", borderTop:`1px solid ${border}`, paddingTop:8 }}>
                      "{p.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ADD */}
        {view === "add" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { key:"name",    label:"Full Name *",         ph:"John Smith" },
              { key:"address", label:"Property Address",    ph:"123 SW 8th St, Hialeah, FL" },
              { key:"phone",   label:"Phone / WhatsApp",    ph:"+1 (305) 000-0000" },
              { key:"email",   label:"Email",               ph:"john@email.com" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:11, letterSpacing:1.5, color:gold, textTransform:"uppercase", display:"block", marginBottom:6 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} placeholder={f.ph}
                  style={{ width:"100%", padding:"12px 14px", background:card, border:`1px solid ${border}`, borderRadius:10, color:"#e8e0d5", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize:11, letterSpacing:1.5, color:gold, textTransform:"uppercase", display:"block", marginBottom:6 }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Context about this prospect..." rows={3}
                style={{ width:"100%", padding:"12px 14px", background:card, border:`1px solid ${border}`, borderRadius:10, color:"#e8e0d5", fontSize:14, outline:"none", boxSizing:"border-box", resize:"vertical" }} />
            </div>
            <button onClick={addProspect} disabled={!form.name.trim()} style={{
              background: form.name.trim() ? `linear-gradient(135deg,${gold},#9a7030)` : "#1a1a1a",
              border:"none", borderRadius:10, color: form.name.trim() ? bg : "#444",
              padding:"14px", cursor: form.name.trim() ? "pointer" : "default", fontWeight:"bold", fontSize:15, marginTop:4,
            }}>Save Prospect</button>
          </div>
        )}

        {/* MESSAGE */}
        {view === "message" && selected && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Prospect card */}
            <div style={{ background:card, border:`1px solid ${border}`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ fontWeight:"bold", color:"#f5f0e8", fontSize:16 }}>{selected.name}</div>
              {selected.address && <div style={{ fontSize:12, color:"#666", marginTop:2 }}>📍 {selected.address}</div>}
              {selected.phone && <div style={{ fontSize:12, color:"#666" }}>📱 {selected.phone}</div>}
            </div>

            {/* Language */}
            <div>
              <div style={{ fontSize:11, letterSpacing:1.5, color:gold, textTransform:"uppercase", marginBottom:8 }}>Language</div>
              <div style={{ display:"flex", gap:8 }}>
                {[["en","🇺🇸 English"],["es","🇪🇸 Español"]].map(([v,l]) => (
                  <button key={v} onClick={() => setLang(v)} style={{
                    flex:1, padding:"10px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight: lang===v?"bold":"normal",
                    background: lang===v ? `linear-gradient(135deg,${gold},#9a7030)` : card,
                    border: lang===v ? "none" : `1px solid ${border}`,
                    color: lang===v ? bg : "#888",
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Stage */}
            <div>
              <div style={{ fontSize:11, letterSpacing:1.5, color:gold, textTransform:"uppercase", marginBottom:8 }}>Follow-up Stage</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {Object.entries(STAGES).map(([k, s]) => (
                  <button key={k} onClick={() => setStage(k)} style={{
                    padding:"10px 14px", textAlign:"left", borderRadius:8, cursor:"pointer", fontSize:13,
                    background: stage===k ? "#0f1e0f" : card,
                    border: stage===k ? "1px solid #3a6a3a" : `1px solid ${border}`,
                    color: stage===k ? "#6dbf6d" : "#666",
                  }}>
                    {stage===k ? "✓ " : ""}{s[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Message box */}
            <div>
              <div style={{ fontSize:11, letterSpacing:1.5, color:gold, textTransform:"uppercase", marginBottom:8 }}>Message</div>
              <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={6}
                style={{ width:"100%", padding:"14px", background:"#080b12", border:`1px solid ${gold}33`, borderRadius:10, color:"#e8e0d5", fontSize:14, outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.7 }} />
            </div>

            {/* Actions */}
            <button onClick={regenerate} style={{ background:"none", border:`1px solid ${gold}44`, borderRadius:10, color:gold, padding:"12px", cursor:"pointer", fontSize:14 }}>
              🔄 Generate Different Version
            </button>
            <button onClick={copyMsg} style={{
              background: copied ? "#0f1e0f" : `linear-gradient(135deg,${gold},#9a7030)`,
              border: copied ? "1px solid #3a6a3a" : "none",
              borderRadius:10, color: copied ? "#6dbf6d" : bg,
              padding:"14px", cursor:"pointer", fontWeight:"bold", fontSize:15,
            }}>
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Message"}
            </button>
            <button onClick={markSent} style={{
              background: sent ? "#0f1e0f" : card,
              border: sent ? "1px solid #3a6a3a" : `1px solid ${border}`,
              borderRadius:10, color: sent ? "#6dbf6d" : "#888",
              padding:"12px", cursor:"pointer", fontSize:14,
            }}>
              {sent ? "✅ Marked as Sent!" : "✅ Mark as Sent — Reset Follow-up Timer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
