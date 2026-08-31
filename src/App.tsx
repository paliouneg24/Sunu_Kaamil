if (!window.storage) {
  (window as any).storage = {
    get: async (key: string) => {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    set: async (key: string, value: string) => {
      localStorage.setItem(key, value);
    }
  };
}
import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ---------- Données de référence ---------- */

const SOURATES = [
  "Al-Fatiha","Al-Baqarah","Aal-Imran","An-Nisa","Al-Ma'idah","Al-An'am","Al-A'raf","Al-Anfal",
  "At-Tawbah","Yunus","Hud","Yusuf","Ar-Ra'd","Ibrahim","Al-Hijr","An-Nahl","Al-Isra","Al-Kahf",
  "Maryam","Ta-Ha","Al-Anbiya","Al-Hajj","Al-Mu'minun","An-Nur","Al-Furqan","Ash-Shu'ara",
  "An-Naml","Al-Qasas","Al-Ankabut","Ar-Rum","Luqman","As-Sajdah","Al-Ahzab","Saba","Fatir",
  "Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir","Fussilat","Ash-Shura","Az-Zukhruf","Ad-Dukhan",
  "Al-Jathiyah","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf","Adh-Dhariyat","At-Tur",
  "An-Najm","Al-Qamar","Ar-Rahman","Al-Waqi'ah","Al-Hadid","Al-Mujadilah","Al-Hashr",
  "Al-Mumtahanah","As-Saff","Al-Jumu'ah","Al-Munafiqun","At-Taghabun","At-Talaq","At-Tahrim",
  "Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij","Nuh","Al-Jinn","Al-Muzzammil","Al-Muddaththir",
  "Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba","An-Nazi'at","Abasa","At-Takwir","Al-Infitar",
  "Al-Mutaffifin","Al-Inshiqaq","Al-Buruj","At-Tariq","Al-A'la","Al-Ghashiyah","Al-Fajr",
  "Al-Balad","Ash-Shams","Al-Layl","Ad-Duha","Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr",
  "Al-Bayyinah","Az-Zalzalah","Al-Adiyat","Al-Qari'ah","At-Takathur","Al-Asr","Al-Humazah",
  "Al-Fil","Quraysh","Al-Ma'un","Al-Kawthar","Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas",
  "Al-Falaq","An-Nas"
];

const JUZ_STARTS = [
  [1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],
  [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
  [29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1],
];

function juzRange(n: number) {
  const [sStart, vStart] = JUZ_STARTS[n - 1];
  const isLast = n === 30;
  const [sEnd, vEndExcl] = isLast ? [114, null] : JUZ_STARTS[n];
  const startTxt = `${sStart}: ${SOURATES[sStart - 1]}, verset ${vStart}`;
  const endTxt = isLast
    ? `${114}: ${SOURATES[113]}, fin`
    : `${sEnd}: ${SOURATES[sEnd - 1]}, verset ${vEndExcl && vEndExcl - 1 >= 1 ? vEndExcl - 1 : 1}`;
  return `${startTxt} ➔ ${endTxt}`;
}

const VERSE_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,
  227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,
  96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,
  19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6,
];

const HIZB_MID_STARTS = [
  [2,75],[2,203],[3,15],[3,171],[4,88],[5,27],[6,36],[7,1],[7,171],[9,34],
  [10,26],[11,84],[13,19],[16,51],[17,99],[20,1],[22,1],[24,21],[26,111],[28,51],
  [31,22],[34,24],[37,145],[40,41],[43,24],[48,18],[55,1],[62,1],[72,1],[87,1],
];

const HIZB_STARTS = (() => {
  const out: [number, number][] = [];
  for (let j = 0; j < 30; j++) { out.push(JUZ_STARTS[j]); out.push(HIZB_MID_STARTS[j]); }
  return out;
})();

function hizbRange(n: number) {
  const [sStart, vStart] = HIZB_STARTS[n - 1];
  const isLast = n === 60;
  const [sEnd, vEndExcl] = isLast ? [114, null] : HIZB_STARTS[n];
  const startTxt = `${sStart}: ${SOURATES[sStart - 1]}, verset ${vStart}`;
  const endTxt = isLast
    ? `${114}: ${SOURATES[113]}, fin`
    : `${sEnd}: ${SOURATES[sEnd - 1]}, verset ${vEndExcl && vEndExcl - 1 >= 1 ? vEndExcl - 1 : 1}`;
  return `${startTxt} ➔ ${endTxt}`;
}

function globalVerseIndex(s: number, v: number) {
  let idx = 0;
  for (let i = 0; i < s - 1; i++) idx += VERSE_COUNTS[i];
  return idx + v;
}
function fromGlobalVerseIndex(idx: number): [number, number] {
  let s = 1, rem = idx;
  while (rem > VERSE_COUNTS[s - 1]) { rem -= VERSE_COUNTS[s - 1]; s++; }
  return [s, rem];
}

const NIFS_STARTS = (() => {
  const out: [number, number][] = [];
  for (let h = 0; h < 60; h++) {
    const [s1, v1] = HIZB_STARTS[h];
    const isLastHizb = h === 59;
    const endExcl = isLastHizb
      ? globalVerseIndex(114, VERSE_COUNTS[113]) + 1
      : globalVerseIndex(HIZB_STARTS[h + 1][0], HIZB_STARTS[h + 1][1]);
    const startIdx = globalVerseIndex(s1, v1);
    const midIdx = startIdx + Math.round((endExcl - startIdx) / 2);
    out.push([s1, v1]);
    out.push(fromGlobalVerseIndex(midIdx));
  }
  return out;
})();

function nifsRange(n: number) {
  const [sStart, vStart] = NIFS_STARTS[n - 1];
  const isLast = n === 120;
  const [sEnd, vEndExcl] = isLast ? [114, null] : NIFS_STARTS[n];
  const startTxt = `${sStart}: ${SOURATES[sStart - 1]}, verset ${vStart}`;
  const endTxt = isLast
    ? `${114}: ${SOURATES[113]}, fin`
    : `${sEnd}: ${SOURATES[sEnd - 1]}, verset ${vEndExcl && vEndExcl - 1 >= 1 ? vEndExcl - 1 : 1}`;
  return `${startTxt} ➔ ${endTxt}`;
}

const TYPES: Record<string, { label: string; total: number; unit: string }> = {
  juz:     { label: "Juz",    total: 30,   unit: "Juz" },
  hizb:    { label: "Hizb",   total: 60,   unit: "Hizb" },
  nifs:    { label: "Nifs",   total: 120,  unit: "Nifs" },
  sourate: { label: "Sourates", total: 114, unit: "Sourate" },
};

function unitLabel(type: string, n: number) {
  if (type === "sourate") return `${TYPES.sourate.unit} ${n}`;
  return `${TYPES[type].unit} ${n}`;
}

function unitSubLabel(type: string, n: number) {
  if (type === "sourate") return SOURATES[n - 1];
  return null;
}

function autoRepere(type: string, n: number) {
  if (type === "juz") return juzRange(n);
  if (type === "hizb") return hizbRange(n);
  if (type === "nifs") return nifsRange(n);
  return `Sourate ${n} — ${SOURATES[n - 1]}`;
}

function slugify(str: string) {
  return (
    str
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "kamil"
  );
}

function genToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const STATUS = { FREE: "libre", RESERVED: "reserve", DONE: "termine" };

/* ---------- Composants ---------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="k-field">
      <span className="k-field-label">{label}</span>
      {children}
      {hint && <span className="k-field-hint">{hint}</span>}
    </label>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 38, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="k-ring">
      <svg viewBox="0 0 90 90" width="90" height="90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#E7E2CE" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={r} fill="none" stroke="#0A3A2A" strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 45 45)" style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="k-ring-text">
        <strong>{pct}%</strong>
        <span>Complété</span>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === STATUS.DONE) return <span className="k-icon k-icon-done">🟢</span>;
  if (status === STATUS.RESERVED) return <span className="k-icon k-icon-wait">⏳</span>;
  return <span className="k-icon k-icon-free">⚪</span>;
}

/* ---------- App principale ---------- */

export default function SunuKamilApp() {
  const [view, setView] = useState("home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", type: "juz", dateFin: "", heureFin: "" });

  const [carnet, setCarnet] = useState<any>(null);
  const [joinError, setJoinError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [adminLinkCopied, setAdminLinkCopied] = useState(false);

  const [reserveTarget, setReserveTarget] = useState<any>(null);
  const [reserveName, setReserveName] = useState("");
  const [reservePhone, setReservePhone] = useState("");

  const [confirmAction, setConfirmAction] = useState<any>(null); 
  const [confirmPhone, setConfirmPhone] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathSlug = window.location.pathname.split("/").filter(Boolean).pop();
    const code = params.get("k") || pathSlug || "";
    const adminToken = params.get("a") || "";
    if (code) {
      setView("join");
      handleJoin(code, adminToken);
    }
  }, []);

  const hasSharedStorage = typeof window !== "undefined" && !!(window as any).storage;

  const loadCarnet = useCallback(async (code: string) => {
    try {
      if (hasSharedStorage) {
        const res = await (window as any).storage.get(`sunukamil:${code}`);
        return res ? JSON.parse(res.value) : null;
      }
      const raw = window.localStorage.getItem(`sunukamil:${code}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [hasSharedStorage]);

  const saveCarnet = useCallback(async (c: any) => {
    try {
      if (hasSharedStorage) {
        await (window as any).storage.set(`sunukamil:${c.code}`, JSON.stringify(c));
      } else {
        window.localStorage.setItem(`sunukamil:${c.code}`, JSON.stringify(c));
      }
    } catch (e: any) {
      setError("Erreur d'enregistrement : " + (e?.message || "stockage indisponible."));
      throw e;
    }
  }, [hasSharedStorage]);

  const findUniqueSlug = useCallback(async (base: string) => {
    let slug = base, n = 2;
    while (await loadCarnet(slug)) { slug = `${base}-${n}`; n++; }
    return slug;
  }, [loadCarnet]);

  async function handleCreate() {
    setError("");
    if (!form.title.trim()) { setError("Merci d'indiquer un titre pour le Kamil."); return; }
    if (!form.dateFin || !form.heureFin) { setError("Merci d'indiquer la date et l'heure limite."); return; }
    setBusy(true);
    try {
      const total = TYPES[form.type].total;
      const code = await findUniqueSlug(slugify(form.title.trim()));
      const adminToken = genToken();
      const dateFin = new Date(`${form.dateFin}T${form.heureFin}:00`).getTime();
      const newCarnet = {
        code, title: form.title.trim(), type: form.type, adminToken,
        dateFin, locked: false, createdAt: Date.now(),
        units: Array.from({ length: total }, (_, i) => ({
          number: i + 1, status: STATUS.FREE, name: null, phone: null,
          repere: autoRepere(form.type, i + 1),
        })),
      };
      await saveCarnet(newCarnet);
      setCarnet(newCarnet);
      setIsAdmin(true);
      setView("kamil");
    } catch (e: any) {
      setError(e?.message || "Une erreur est survenue pendant la création du Kamil.");
    } finally { setBusy(false); }
  }

  async function handleJoin(codeArg: string, adminTokenArg: string) {
    const code = (codeArg || "").trim().toLowerCase();
    if (!code) { setJoinError("Lien invalide : aucun Kamil trouvé à cette adresse."); return; }
    setJoinError(""); setBusy(true);
    try {
      const c = await loadCarnet(code);
      if (!c) { setJoinError("Aucun Kamil ne correspond à ce lien."); return; }
      setCarnet(c);
      setIsAdmin(Boolean(adminTokenArg) && adminTokenArg === c.adminToken);
      setView("kamil");
    } finally { setBusy(false); }
  }

  function copyShareLink() {
    if (!carnet) return;
    const url = `${window.location.origin}/${carnet.code}`;
    navigator.clipboard?.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function copyAdminLink() {
    if (!carnet) return;
    const url = `${window.location.origin}/${carnet.code}?a=${carnet.adminToken}`;
    navigator.clipboard?.writeText(url);
    setAdminLinkCopied(true);
    setTimeout(() => setAdminLinkCopied(false), 2000);
  }

  async function refreshCarnet() {
    if (!carnet) return;
    const fresh = await loadCarnet(carnet.code);
    if (fresh) setCarnet(fresh);
  }

  function openReserve(n: number) {
    if (carnet?.locked) return;
    setReserveTarget(n); setReserveName(""); setReservePhone(""); setError("");
  }

  async function confirmReserve() {
    if (!reserveName.trim()) { setError("Le nom et prénom sont obligatoires."); return; }
    const phoneDigits = reservePhone.replace(/\D/g, "");
    if (!/^[0-9+\s-]+$/.test(reservePhone) || phoneDigits.length < 7) {
      setError("Le numéro de téléphone doit être composé uniquement de chiffres (ex. 77 123 45 67)."); return;
    }
    setBusy(true);
    try {
      const fresh = (await loadCarnet(carnet.code)) || carnet;
      const unit = fresh.units[reserveTarget - 1];
      if (unit.status !== STATUS.FREE) {
        setError("Cette unité vient d'être prise par quelqu'un d'autre.");
        setCarnet(fresh); setReserveTarget(null); return;
      }
      const updated = { ...fresh, units: fresh.units.map((u: any) =>
        u.number === reserveTarget
          ? { ...u, status: STATUS.RESERVED, name: reserveName.trim(), phone: reservePhone.trim() }
          : u
      )};
      await saveCarnet(updated);
      setCarnet(updated); setReserveTarget(null); setError("");
    } finally { setBusy(false); }
  }

  function openConfirm(unitNum: number, kind: string) {
    setConfirmAction({ unitNum, kind }); setConfirmPhone(""); setError("");
  }

  async function validateConfirm() {
    const { unitNum, kind } = confirmAction;
    const unit = carnet.units[unitNum - 1];
    if (confirmPhone.trim() !== (unit.phone || "").trim()) {
      setError("Le numéro de téléphone ne correspond pas à celui de la réservation."); return;
    }
    setBusy(true);
    try {
      const fresh = (await loadCarnet(carnet.code)) || carnet;
      const updated = { ...fresh, units: fresh.units.map((u: any) => {
        if (u.number !== unitNum) return u;
        if (kind === "read") return { ...u, status: STATUS.DONE };
        return { ...u, status: STATUS.FREE, name: null, phone: null };
      })};
      await saveCarnet(updated);
      setCarnet(updated); setConfirmAction(null); setError("");
    } finally { setBusy(false); }
  }

  async function adminReset(n: number) {
    setBusy(true);
    try {
      const fresh = (await loadCarnet(carnet.code)) || carnet;
      const updated = { ...fresh, units: fresh.units.map((u: any) =>
        u.number === n ? { ...u, status: STATUS.FREE, name: null, phone: null } : u
      )};
      await saveCarnet(updated); setCarnet(updated);
    } finally { setBusy(false); }
  }

  async function adminMarkDone(n: number) {
    setBusy(true);
    try {
      const fresh = (await loadCarnet(carnet.code)) || carnet;
      const updated = { ...fresh, units: fresh.units.map((u: any) =>
        u.number === n ? { ...u, status: STATUS.DONE } : u
      )};
      await saveCarnet(updated); setCarnet(updated);
    } finally { setBusy(false); }
  }

  async function toggleLock() {
    setBusy(true);
    try {
      const fresh = (await loadCarnet(carnet.code)) || carnet;
      const updated = { ...fresh, locked: !fresh.locked };
      await saveCarnet(updated); setCarnet(updated);
    } finally { setBusy(false); }
  }

  const stats = useMemo(() => {
    if (!carnet) return { free: 0, reserved: 0, done: 0, pct: 0 };
    const free = carnet.units.filter((u: any) => u.status === STATUS.FREE).length;
    const reserved = carnet.units.filter((u: any) => u.status === STATUS.RESERVED).length;
    const done = carnet.units.filter((u: any) => u.status === STATUS.DONE).length;
    const pct = Math.round((done / carnet.units.length) * 100);
    return { free, reserved, done, pct };
  }, [carnet]);

  return (
    <div className="k-app">
      <style>{CSS}</style>

      {view === "home" && (
        <div className="k-home">
          <div className="k-basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <h1>Sunu Kamil</h1>
          <p className="k-home-sub">Organiser la lecture collective du Coran (Kamil)</p>
          <div className="k-home-actions">
            <button className="k-btn k-btn-primary" onClick={() => { setView("create"); setStep(1); setError(""); }}>
              Créer un Kamil
            </button>
          </div>
        </div>
      )}

      {view === "join" && (
        <div className="k-card k-narrow">
          {busy && <p className="k-muted">Ouverture du Kamil…</p>}
          {!busy && joinError && (
            <>
              <p className="k-error">{joinError}</p>
              <button className="k-btn k-btn-primary k-full" onClick={() => { setView("home"); setJoinError(""); }}>
                Retour à l'accueil
              </button>
            </>
          )}
        </div>
      )}

      {view === "create" && (
        <div className="k-card k-narrow">
          <button className="k-back" onClick={() => setView("home")}>← Retour</button>
          <div className="k-steps">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`k-step-dot ${step === s ? "active" : ""} ${step > s ? "done" : ""}`}>{s}</div>
            ))}
          </div>

          {step === 1 && (
            <>
              <h2>Titre du Kamil</h2>
              <Field label="Titre" hint='Ex. "Kamil Gamou", "Kamil Magal"'>
                <input className="k-input" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex. Kamil Gamou" />
              </Field>
              {error && <p className="k-error">{error}</p>}
              <button className="k-btn k-btn-primary k-full" onClick={() => {
                if (!form.title.trim()) { setError("Merci d'indiquer un titre."); return; }
                setError(""); setStep(2);
              }}>Continuer</button>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Découpage</h2>
              <div className="k-type-grid">
                {Object.entries(TYPES).map(([key, t]) => (
                  <button key={key} className={`k-type-card ${form.type === key ? "active" : ""}`}
                    onClick={() => setForm({ ...form, type: key })}>
                    <span className="k-type-num">{t.total}</span>
                    <span className="k-type-label">{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="k-row-btns">
                <button className="k-btn k-btn-ghost" onClick={() => setStep(1)}>Retour</button>
                <button className="k-btn k-btn-primary" onClick={() => setStep(3)}>Continuer</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Date limite</h2>
              <Field label="Date de fin">
                <input className="k-input" type="date" value={form.dateFin}
                  onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
              </Field>
              <Field label="Heure">
                <input className="k-input" type="time" value={form.heureFin}
                  onChange={(e) => setForm({ ...form, heureFin: e.target.value })} />
              </Field>
              {error && <p className="k-error">{error}</p>}
              <div className="k-row-btns">
                <button className="k-btn k-btn-ghost" onClick={() => setStep(2)}>Retour</button>
                <button className="k-btn k-btn-primary" disabled={busy} onClick={handleCreate}>
                  {busy ? "Création…" : "Créer mon Kamil"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {view === "kamil" && carnet && (
        <div className="k-kamil">
          <div className="k-kamil-header">
            <button className="k-back" onClick={() => { setView("home"); setCarnet(null); setIsAdmin(false); }}>← Accueil</button>
            <div className="k-kamil-title">
              <h2>{carnet.title}</h2>
              <div className="k-badges">
                <span className="k-badge">{TYPES[carnet.type].label} · {TYPES[carnet.type].total}</span>
                <span className={`k-badge ${carnet.locked ? "k-badge-locked" : "k-badge-open"}`}>
                  {carnet.locked ? "🔒 Verrouillé" : "🔓 Ouvert"}
                </span>
                {carnet.dateFin && (
                  <span className="k-badge">⏰ Limite : {new Date(carnet.dateFin).toLocaleDateString("fr-FR")} à {new Date(carnet.dateFin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                )}
              </div>
            </div>
            <ProgressRing pct={stats.pct} />
          </div>

          <div className="k-stats-row">
            <div className="k-stat"><span className="k-stat-icon">⚪</span><div><strong>{stats.free}</strong><span>À prendre</span></div></div>
            <div className="k-stat"><span className="k-stat-icon">🟡</span><div><strong>{stats.reserved}</strong><span>En cours de lecture</span></div></div>
            <div className="k-stat"><span className="k-stat-icon">🟢</span><div><strong>{stats.done}</strong><span>Terminé</span></div></div>
          </div>

          <div className="k-toolbar">
            <button className="k-btn k-btn-small" onClick={refreshCarnet}>Actualiser</button>
            {isAdmin && (
              <button className="k-btn k-btn-small k-btn-ghost" onClick={copyShareLink}>
                {linkCopied ? "Lien copié ✓" : "Copier le lien"}
              </button>
            )}
            {isAdmin && (
              <button className="k-btn k-btn-small k-btn-ghost" onClick={copyAdminLink}>
                {adminLinkCopied ? "Lien admin copié ✓" : "Copier mon lien admin"}
              </button>
            )}
            {isAdmin && (
              <button className={`k-btn k-btn-small ${carnet.locked ? "" : "k-btn-danger"}`} disabled={busy} onClick={toggleLock}>
                {carnet.locked ? "Déverrouiller le Kamil" : "Verrouiller le Kamil"}
              </button>
            )}
          </div>

          {error && <p className="k-error">{error}</p>}

          <div className="k-grid">
            {carnet.units.map((u: any) => (
              <div key={u.number} className={`k-unit k-status-${u.status}`}>
                <div className="k-unit-left">
                  <StatusIcon status={u.status} />
                </div>
                <div className="k-unit-body">
                  <div className="k-unit-top">
                    <span className="k-unit-num">{unitLabel(carnet.type, u.number)}</span>
                    {unitSubLabel(carnet.type, u.number) && (
                      <span className="k-unit-arabic">{unitSubLabel(carnet.type, u.number)}</span>
                    )}
                  </div>
                  {u.status !== STATUS.FREE ? (
                    <div className="k-unit-name">{u.name}</div>
                  ) : (
                    <div className="k-unit-empty">À prendre</div>
                  )}
                  {u.repere && <div className="k-unit-repere">{u.repere}</div>}
                  {isAdmin && u.phone && <div className="k-unit-phone">Tél. {u.phone}</div>}
                </div>
                <div className="k-unit-actions">
                  {u.status === STATUS.FREE && !carnet.locked && (
                    <button className="k-mini-btn k-mini-primary" onClick={() => openReserve(u.number)}>Prendre</button>
                  )}

                  {u.status === STATUS.RESERVED && (
                    isAdmin ? (
                      <>
                        <button className="k-mini-btn k-mini-primary" title="Marquer comme lu" onClick={() => adminMarkDone(u.number)}>✓ Lu</button>
                        <button className="k-mini-btn k-mini-danger" title="Libérer l'unité" onClick={() => adminReset(u.number)}>Libérer</button>
                      </>
                    ) : (
                      <>
                        <button className="k-mini-btn k-mini-primary" title="J'ai lu" onClick={() => openConfirm(u.number, "read")}>✓ J'ai lu</button>
                        {!carnet.locked && (
                          <button className="k-mini-btn k-mini-danger" title="Décliner" onClick={() => openConfirm(u.number, "decline")}>Décliner</button>
                        )}
                      </>
                    )
                  )}

                  {u.status === STATUS.DONE && isAdmin && !carnet.locked && (
                    <button className="k-mini-btn k-mini-danger" onClick={() => adminReset(u.number)}>Libérer</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reserveTarget && (
        <div className="k-modal-overlay" onClick={() => setReserveTarget(null)}>
          <div className="k-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Réserver {unitLabel(carnet.type, reserveTarget)}</h3>
            <Field label="Nom & Prénom">
              <input className="k-input" value={reserveName} onChange={(e) => setReserveName(e.target.value)} autoFocus />
            </Field>
            <Field label="Numéro de téléphone" hint="Chiffres uniquement — servira à confirmer que c'est bien toi">
              <input className="k-input" value={reservePhone} inputMode="tel" placeholder="Ex. 77 123 45 67"
                onChange={(e) => setReservePhone(e.target.value.replace(/[^0-9+\s-]/g, ""))} />
            </Field>
            {error && <p className="k-error">{error}</p>}
            <div className="k-row-btns">
              <button className="k-btn k-btn-ghost" onClick={() => setReserveTarget(null)}>Annuler</button>
              <button className="k-btn k-btn-primary" disabled={busy} onClick={confirmReserve}>
                {busy ? "…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="k-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="k-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmAction.kind === "read" ? "Confirmer la lecture" : "Décliner cette unité"}</h3>
            <p className="k-muted">Retape ton numéro de téléphone pour confirmer que c'est bien ta réservation.</p>
            <Field label="Numéro de téléphone">
              <input className="k-input" value={confirmPhone} inputMode="tel" autoFocus
                onChange={(e) => setConfirmPhone(e.target.value.replace(/[^0-9+\s-]/g, ""))} />
            </Field>
            {error && <p className="k-error">{error}</p>}
            <div className="k-row-btns">
              <button className="k-btn k-btn-ghost" onClick={() => setConfirmAction(null)}>Annuler</button>
              <button className="k-btn k-btn-primary" disabled={busy} onClick={validateConfirm}>
                {busy ? "…" : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ---------- Styles ---------- */

const CSS = `
.k-app { min-height: 100vh; background: #F4F6F5; color: #16241E; font-family: 'Inter', sans-serif; padding: 32px 16px 80px; }
.k-app h1, .k-app h2, .k-app h3 { font-family: 'Amiri', serif; margin: 0 0 4px; color: #0A3A2A; }
.k-muted { color: #6B7268; font-size: 14px; }
.k-error { color: #A23B2E; font-size: 14px; background: #FBEBE7; padding: 8px 12px; border-radius: 6px; }

.k-home { max-width: 460px; margin: 50px auto; text-align: center; }
.k-basmala { font-size: 26px; color: #C5A059; margin-bottom: 10px; direction: rtl; }
.k-home h1 { font-size: 40px; }
.k-home-sub { color: #6B7268; margin: 6px 0 30px; font-size: 16px; }
.k-home-actions { display: flex; flex-direction: column; gap: 12px; }

.k-btn { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; }
.k-btn:active { transform: scale(.98); }
.k-btn:disabled { opacity: .5; cursor: default; }
.k-btn-primary { background: #0A3A2A; color: #fff; }
.k-btn-primary:hover:not(:disabled) { background: #072B1F; }
.k-btn-ghost { background: transparent; color: #0A3A2A; border: 1px solid #CBD3CD; }
.k-btn-danger { background: #A23B2E; color: #fff; }
.k-btn-small { padding: 8px 14px; font-size: 13px; }
.k-full { width: 100%; }
.k-back { background: none; border: none; color: #6B7268; cursor: pointer; font-size: 14px; padding: 0 0 12px; text-align: left; }

.k-card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #E1E6E2; border-radius: 14px; padding: 28px; }
.k-narrow { max-width: 420px; }

.k-field { display: block; margin-bottom: 18px; }
.k-field-label { display: block; font-size: 13px; font-weight: 600; color: #33402F; margin-bottom: 6px; }
.k-field-hint { display: block; font-size: 12px; color: #8A8F7E; margin-top: 4px; }
.k-input { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid #D3D8CB; border-radius: 8px; font-size: 15px; font-family: inherit; background: #FBFCFA; }
.k-input:focus { outline: 2px solid #0A3A2A; outline-offset: 1px; }

.k-steps { display: flex; gap: 8px; margin-bottom: 20px; }
.k-step-dot { width: 28px; height: 28px; border-radius: 50%; background: #E7E9E2; color: #8A8F7E; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
.k-step-dot.active { background: #0A3A2A; color: #fff; }
.k-step-dot.done { background: #C5A059; color: #fff; }

.k-row-btns { display: flex; justify-content: space-between; gap: 12px; margin-top: 8px; }
.k-row-btns .k-btn { flex: 1; }

.k-type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
.k-type-card { border: 1px solid #D3D8CB; background: #FBFCFA; border-radius: 10px; padding: 14px 8px; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
.k-type-card.active { border-color: #C5A059; background: #FBF6E9; }
.k-type-num { font-family: 'Amiri', serif; font-size: 24px; font-weight: 700; color: #0A3A2A; }
.k-type-label { font-size: 13px; font-weight: 600; color: #33402F; }

.k-kamil { max-width: 760px; margin: 0 auto; }
.k-kamil-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; background: #fff; border: 1px solid #E1E6E2; border-radius: 14px; padding: 24px; margin-bottom: 16px; }
.k-kamil-title { flex: 1; min-width: 240px; }
.k-kamil-title h2 { font-size: 28px; }
.k-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.k-badge { font-size: 12px; background: #F0F4F1; color: #2A483E; padding: 4px 10px; border-radius: 20px; font-weight: 500; }
.k-badge-locked { background: #FBEBE7; color: #A23B2E; }
.k-badge-open { background: #EAF3EC; color: #1B5E3B; }

.k-ring { position: relative; width: 90px; height: 90px; flex-shrink: 0; }
.k-ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; color: #6B7268; }
.k-ring-text strong { font-size: 18px; color: #0A3A2A; font-family: 'Amiri', serif; }

.k-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.k-stat { background: #fff; border: 1px solid #E1E6E2; border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
.k-stat-icon { font-size: 18px; }
.k-stat div { display: flex; flex-direction: column; }
.k-stat strong { font-size: 18px; color: #0A3A2A; font-family: 'Amiri', serif; }
.k-stat span { font-size: 12px; color: #6B7268; }

.k-toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }

.k-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
.k-unit { background: #fff; border: 1px solid #E1E6E2; border-radius: 10px; padding: 14px; display: flex; align-items: center; gap: 12px; }
.k-unit-left { font-size: 20px; }
.k-unit-body { flex: 1; min-width: 0; }
.k-unit-top { display: flex; align-items: center; gap: 8px; }
.k-unit-num { font-weight: 600; font-size: 15px; color: #0A3A2A; }
.k-unit-arabic { font-family: 'Amiri', serif; font-size: 16px; color: #C5A059; }
.k-unit-name { font-size: 14px; font-weight: 500; color: #16241E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.k-unit-empty { font-size: 13px; color: #8A8F7E; }
.k-unit-repere { font-size: 12px; color: #6B7268; margin-top: 2px; }
.k-unit-phone { font-size: 11px; color: #8A8F7E; margin-top: 2px; }
.k-unit-actions { display: flex; gap: 6px; }

.k-mini-btn { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 6px; border: none; cursor: pointer; white-space: nowrap; }
.k-mini-primary { background: #EAF3EC; color: #1B5E3B; }
.k-mini-primary:hover { background: #D6E8DB; }
.k-mini-danger { background: #FBEBE7; color: #A23B2E; }
.k-mini-danger:hover { background: #F7D7D2; }

.k-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 100; }
.k-modal { background: #fff; border-radius: 14px; padding: 24px; max-width: 400px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
.k-modal h3 { margin-bottom: 12px; }
`;
