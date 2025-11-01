import { useState, useEffect, useMemo } from "react";
import { Target, Calendar as CalendarIcon, BookOpen, LineChart, Settings as SettingsIcon, CheckCircle, XCircle, Clock, PlusCircle } from "lucide-react";
import { Trophy, DollarSign, Home, Play, Users, Heart } from "lucide-react";
import VideoLibraryView from "./components/VideoLibraryView";

// ==============================================================
// Constantes & Helpers
// ==============================================================
const BELTS = [
  "Blanche", "Jaune", "Orange", "Mauve", "Verte", "Verte / Bleue",
  "Bleue", "Bleue / Brune", "Brune", "Brune / Noire",
  "Noire", "Noire 1 Dan", "Noire 2 Dan", "Noire 3 Dan",
];
const beltIndex = (b) => BELTS.indexOf(b);
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

// Règles de passage (modifiable)
const DEFAULT_RULES = {
  "Blanche→Jaune": 30,
  "Jaune→Orange": 40,
  "Orange→Mauve": 50,
  "Mauve→Verte": 60,
  "Verte→Verte / Bleue": 70,
  "Verte / Bleue→Bleue": 80,
  "Bleue→Brune": 100,
  "Brune→Noire": 120,
};

// Cours fixes (exemples adultes)
const DEFAULT_PLANNING = [
  { jour: "Lundi", cours: [
    { nom: "Adultes Bleue et+", heure: "19h00-20h00", type: "Adulte" },
    { nom: "Combat avancé", heure: "20h00-20h30", type: "Adulte" },
  ]},
  { jour: "Mardi", cours: [
    { nom: "Adultes technique", heure: "19h00-20h00", type: "Adulte" },
  ]},
  { jour: "Mercredi", cours: [
    { nom: "Adultes — révisions", heure: "19h00-20h00", type: "Adulte" },
  ]},
  { jour: "Jeudi", cours: [
    { nom: "Karaté Adultes", heure: "19h00-20h00", type: "Adulte" },
    { nom: "Armes 12+", heure: "20h00-20h30", type: "Adulte" },
  ]},
  { jour: "Vendredi", cours: [
    { nom: "Adultes — combat léger", heure: "19h00-20h00", type: "Adulte" },
  ]},
  { jour: "Dimanche", cours: [
    { nom: "Pré-Ados/Adultes 8+", heure: "10h00-11h00", type: "Adulte" },
  ]},
];

// Jours fériés / fermetures (éditable dans Paramètres)
// (Initialisé vide; tu peux en ajouter depuis Paramètres)
// Conserver au format YYYY-MM-DD

// === Base technique (échantillon : structure OK, injection complète à venir) ===
const TECH_DB = {
  Punch: [
    { nom: "Front knuckles visage", min: "Blanche", max: "Jaune", acces: { Enfant: true, Ado: true, Adulte: true } },
    { nom: "Thrust punch", min: "Jaune", max: "Orange", acces: { Enfant: true, Ado: true, Adulte: true } },
  ],
  Kick: [
    { nom: "Front ball kick", min: "Blanche", max: "Jaune", acces: { Enfant: true, Ado: true, Adulte: true } },
    { nom: "Side blade kick", min: "Jaune", max: "Orange", acces: { Enfant: true, Ado: true, Adulte: true } },
  ],
  "Blocking Form": [
    { nom: "Blocking form 1", min: "Blanche", max: "Jaune", acces: { Enfant: true, Ado: true, Adulte: true } },
  ],
  Kata: [
    { nom: "Forme en H", min: "Blanche", max: "Jaune", acces: { Enfant: true, Ado: true, Adulte: true } },
  ],
  "Auto-défense": [
    { nom: "Prise aux poignets", min: "Blanche", max: "Jaune", acces: { Enfant: true, Ado: true, Adulte: true } },
  ],
  Armes: {
    Bâton: [ { nom: "Arm lock", min: "Orange", max: "Mauve", acces: { Enfant: false, Ado: true, Adulte: true } } ],
    Couteau: [ { nom: "Thrust", min: "Verte", max: "Bleue", acces: { Enfant: false, Ado: true, Adulte: true } } ],
    Fusil: [ { nom: "Premier fusil", min: "Bleue", max: "Brune", acces: { Enfant: false, Ado: true, Adulte: true } } ],
  },
};

// ==============================================================
// Application principale
// ==============================================================
export default function KarateDashboard() {
  const [activeTab, setActiveTab] = useState("Tableau de bord");
  const [profil, setProfil] = useState(() => localStorage.getItem("karate_profil") || "Adulte");
  const [events, setEvents] = useState(() => JSON.parse(localStorage.getItem("karate_events") || "[]"));
  const [rules, setRules] = useState(() => JSON.parse(localStorage.getItem("karate_rules") || JSON.stringify(DEFAULT_RULES)));
  const [planning, setPlanning] = useState(() => JSON.parse(localStorage.getItem("karate_planning") || JSON.stringify(DEFAULT_PLANNING)));
  const [holidays, setHolidays] = useState(() => JSON.parse(localStorage.getItem("karate_holidays") || "[]"));
  const [belts, setBelts] = useState(() => JSON.parse(localStorage.getItem("karate_belts") || "[]"));

  useEffect(() => localStorage.setItem("karate_profil", profil), [profil]);
  useEffect(() => localStorage.setItem("karate_events", JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem("karate_rules", JSON.stringify(rules)), [rules]);
  useEffect(() => localStorage.setItem("karate_planning", JSON.stringify(planning)), [planning]);
  useEffect(() => localStorage.setItem("karate_holidays", JSON.stringify(holidays)), [holidays]);
  useEffect(() => localStorage.setItem("karate_belts", JSON.stringify(belts)), [belts]);

  useEffect(() => localStorage.setItem("karate_profil", profil), [profil]);
  useEffect(() => localStorage.setItem("karate_events", JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem("karate_rules", JSON.stringify(rules)), [rules]);
  useEffect(() => localStorage.setItem("karate_planning", JSON.stringify(planning)), [planning]);

  const menu = [
    { label: "Tableau de bord", icon: <Target /> },
    { label: "Calendrier", icon: <CalendarIcon /> },
    { label: "Base technique", icon: <BookOpen /> },
    { label: "Compétitions", icon: <Trophy /> },
    { label: "Progression", icon: <LineChart /> },
    { label: "Finances", icon: <DollarSign /> },
    { label: "Entraînement maison", icon: <Home /> },
    { label: "Vidéos", icon: <Play /> },
    { label: "Instructeurs", icon: <Users /> },
    { label: "Santé", icon: <Heart /> },
    { label: "Paramètres", icon: <SettingsIcon /> },
  ];
  

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r p-4">
        <h1 className="text-xl font-bold text-red-600 mb-6">🥋 Progression Karaté</h1>
        <nav className="space-y-2">
          {menu.map((m) => (
            <button key={m.label} onClick={() => setActiveTab(m.label)} className={`flex items-center gap-2 w-full p-2 rounded-md ${activeTab === m.label ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100'}`}>
              {m.icon}<span>{m.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "Tableau de bord" && <DashboardView events={events} rules={rules} belts={belts} />}
        {activeTab === "Calendrier" && <CalendarView events={events} setEvents={setEvents} planning={planning} profil={profil} holidays={holidays} />}
        {activeTab === "Base technique" && <BaseTechniqueView profil={profil} />}
        {activeTab === "Vidéos" && <VideoLibraryView />}
        {activeTab === "Progression" && <ProgressionView events={events} rules={rules} belts={belts} setBelts={setBelts} />}
        {activeTab === "Paramètres" && <SettingsView rules={rules} setRules={setRules} planning={planning} setPlanning={setPlanning} profil={profil} setProfil={setProfil} holidays={holidays} setHolidays={setHolidays} />}
      </main>
    </div>
  );
}

// ==============================================================
// Tableau de bord — points depuis la dernière ceinture (événement type 'passage' fait)
// ==============================================================
function lastPassageDate(events) {
  const pass = [...events]
    .filter(e => e.type === 'passage' && e.status === 'fait' && e.date)
    .sort((a,b) => a.date.localeCompare(b.date))
    .pop();
  return pass?.date || null;
}

function DashboardView({ events, rules, belts }) {
  const since = (belts[belts.length-1]?.date) || lastPassageDate(events);
  const done = events.filter(e => e.status === 'fait' && (!since || e.date >= since));
  const groupPts = done.filter(e => e.type === 'groupe').length;
  const privatePts = done.filter(e => e.type === 'privé').length * 4;
  const total = groupPts + privatePts;
  const next = Object.entries(rules).find(([_, n]) => total < n);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tableau de bord</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded p-4"><p className="text-sm text-gray-500">Depuis</p><p className="text-xl font-bold">{since ? fmt(since) : '—'}</p></div>
        <div className="bg-white border rounded p-4"><p className="text-sm text-gray-500">Points groupe</p><p className="text-xl font-bold">{groupPts}</p></div>
        <div className="bg-white border rounded p-4"><p className="text-sm text-gray-500">Points privés (×4)</p><p className="text-xl font-bold">{privatePts}</p></div>
      </div>
      <p>Total points (depuis dernière ceinture) : <b>{total}</b></p>
      {next ? (
        <p>Prochaine étape : {next[0]} — Reste <b>{next[1]-total}</b></p>
      ) : <p>🎉 Toutes les étapes franchies !</p>}
    </div>
  );
}

// ==============================================================
// Calendrier — ajout d’événements + pré-remplissage récurrent (jours fériés exclus)
// ==============================================================
function CalendarView({ events, setEvents, planning, profil, holidays }) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', type: 'privé' });

  const start = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const end = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 0), [month]);
  const days = useMemo(() => Array.from({ length: end.getDate() }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)), [end, month]);

  const preRemplirMois = () => {
    const nouvelles = [];
    days.forEach((d) => {
      const dateStr = d.toISOString().split('T')[0];
      if (holidays.includes(dateStr)) return;
      const jourNom = d.toLocaleDateString('fr-CA', { weekday: 'long' }).toLowerCase();
      const jourPlanning = planning.find((p) => p.jour.toLowerCase() === jourNom);
      if (jourPlanning) {
        jourPlanning.cours.forEach((c) => {
          if (c.type !== profil) return; // respecte le profil
          // éviter doublons exacts
          const exists = events.some(ev => ev.date === dateStr && ev.title === c.nom && ev.time === c.heure && ev.type === 'groupe');
          if (!exists) nouvelles.push({ date: dateStr, title: c.nom, time: c.heure, status: 'planifié', type: 'groupe' });
        });
      }
    });
    if (nouvelles.length) setEvents(prev => [...prev, ...nouvelles]);
  };

  const addEvent = () => {
    if (!newEvent.date || !newEvent.title) return;
    setEvents(prev => [...prev, { ...newEvent, status: 'planifié' }]);
    setNewEvent({ title: '', date: '', time: '', type: 'privé' });
    setShowAdd(false);
  };

  const setStatus = (index, status) => setEvents(prev => prev.map((e, i) => i === index ? { ...e, status } : e));

  const changeMonth = (delta) => {
    const nm = new Date(month);
    nm.setMonth(month.getMonth() + delta);
    setMonth(nm);
  };

  const eventsForDate = (d) => {
    const ds = d.toISOString().split('T')[0];
    return events.map((e, i) => ({ ...e, __i: i })).filter(e => e.date === ds);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2">
        <button onClick={() => changeMonth(-1)} className="px-2 py-1 border rounded">◀️</button>
        <h2 className="text-2xl font-bold flex-1 text-center">{month.toLocaleString('fr-CA', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => changeMonth(1)} className="px-2 py-1 border rounded">▶️</button>
        <button onClick={preRemplirMois} className="bg-red-600 text-white px-3 py-1 rounded">Pré-remplir</button>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded"><PlusCircle className="w-4 h-4" /> Ajouter</button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <div key={i} className="h-24 border rounded p-1 text-xs flex flex-col">
            <div className="font-bold text-center">{d.getDate()}</div>
            <div className="text-[10px] text-gray-700 text-center mb-1">{d.toLocaleDateString('fr-CA', { weekday: 'short' })}</div>
            <div className="flex flex-wrap justify-center gap-1">
              {eventsForDate(d).map((e) => (
                <button key={e.__i} onClick={() => setSelected(e)} title={`${e.title} · ${e.time||''}`}>
                  {e.status === 'fait' && <CheckCircle className="text-green-500 w-4 h-4" />}
                  {e.status === 'planifié' && <Clock className="text-yellow-500 w-4 h-4" />}
                  {e.status === 'non fait' && <XCircle className="text-orange-500 w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-lg font-bold mb-2">{selected.title}</h3>
            <p>Date : {fmt(selected.date)}</p>
            <p>Heure : {selected.time || '—'}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setStatus(selected.__i, 'fait'); setSelected(null); }} className="bg-green-500 text-white px-3 py-1 rounded">Fait</button>
              <button onClick={() => { setStatus(selected.__i, 'non fait'); setSelected(null); }} className="bg-orange-500 text-white px-3 py-1 rounded">Non fait</button>
              <button onClick={() => setSelected(null)} className="ml-auto text-gray-600">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-lg font-bold mb-2">Ajouter un événement</h3>
            <input type="text" placeholder="Nom de l'événement" className="border p-1 w-full mb-2" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
            <input type="date" className="border p-1 w-full mb-2" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
            <input type="text" placeholder="Heure (ex: 18h-19h)" className="border p-1 w-full mb-2" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
            <select className="border p-1 w-full mb-3" value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
              <option value="privé">Cours privé</option>
              <option value="maison">Entraînement maison</option>
              <option value="competition">Compétition</option>
              <option value="passage">Passage de ceinture</option>
              <option value="seminaire">Séminaire</option>
              <option value="groupe">Cours de groupe (manuel)</option>
            </select>
            <div className="flex gap-2">
              <button onClick={addEvent} className="bg-green-600 text-white px-3 py-1 rounded">Ajouter</button>
              <button onClick={() => setShowAdd(false)} className="ml-auto text-gray-600">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================
// Base technique — filtre par profil + ceinture jusqu'au niveau sélectionné
// ==============================================================
function BaseTechniqueView({ profil }) {
  const [beltFilter, setBeltFilter] = useState("Toutes");
  const data = useMemo(() => {
    const res = {};
    const ok = (t) => (t.acces?.[profil] ?? true) && (beltFilter === 'Toutes' || beltIndex(t.max) <= beltIndex(beltFilter));
    Object.entries(TECH_DB).forEach(([cat, arr]) => {
      if (cat === 'Armes') {
        Object.entries(arr).forEach(([sub, items]) => {
          const list = items.filter(ok);
          if (list.length) (res[`${cat} · ${sub}`] ||= []).push(...list);
        });
      } else {
        const list = arr.filter(ok);
        if (list.length) res[cat] = list;
      }
    });
    return res;
  }, [beltFilter, profil]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Base technique — {profil}</h2>
      <div className="bg-white border rounded p-3 mb-4 flex items-center gap-3">
        <span className="text-sm">Jusqu’à la ceinture :</span>
        <select className="border rounded p-2" value={beltFilter} onChange={(e)=>setBeltFilter(e.target.value)}>
          {['Toutes', ...BELTS].map(b=> <option key={b}>{b}</option>)}
        </select>
      </div>

      {Object.keys(data).length===0 && <p className="text-gray-500">Aucune technique pour ces filtres.</p>}

      {Object.entries(data).map(([cat, list]) => (
        <div key={cat} className="mb-6">
          <h3 className="font-semibold mb-2">{cat}</h3>
          <ul className="list-disc ml-6">
            {list.map(t => <li key={t.nom}>{t.nom} <span className="text-xs text-gray-500">({t.min} → {t.max})</span></li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ==============================================================
// 🎥 Bibliothèque vidéo
// ==============================================================


// ==============================================================
// Progression — points depuis dernière ceinture (via événements 'passage')
// ==============================================================
function ProgressionView({ events, rules, belts, setBelts }) {
  const [form, setForm] = useState({ couleur: 'Blanche', date: '', feeling: '', invite: false });
  const since = (belts[belts.length-1]?.date) || lastPassageDate(events);
  const done = events.filter(e => e.status === 'fait' && (!since || e.date >= since));
  const groupPts = done.filter(e => e.type === 'groupe').length;
  const privatePts = done.filter(e => e.type === 'privé').length * 4;
  const total = groupPts + privatePts;
  const next = Object.entries(rules).find(([_, n]) => total < n);

  const addPass = () => {
    if (!form.date || !form.couleur) return;
    setBelts(prev => [...prev, { ...form }]);
    setForm({ ...form, date: '', feeling: '', invite: false });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Progression des ceintures</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Ceinture actuelle</h3>
          <p><b>{belts[belts.length-1]?.couleur || 'Blanche'}</b> {since && <span className="text-sm text-gray-500">(depuis {fmt(since)})</span>}</p>
          <p className="mt-2 text-sm">Points groupe : <b>{groupPts}</b> · Privés (×4) : <b>{privatePts}</b></p>
          <p>Total : <b>{total}</b> {next ? <>/ {next[1]} (reste <b>{next[1]-total}</b>)</> : null}</p>
          <div className="mt-3 flex items-center gap-2">
            <input type="checkbox" checked={form.invite} onChange={(e) => setForm({ ...form, invite: e.target.checked })} />
            <span className="text-sm">Invitation reçue ?</span>
            {form.invite && <input type="date" className="border rounded p-1 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />}
          </div>
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Ajouter un passage</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            <select className="border rounded p-2" value={form.couleur} onChange={(e)=>setForm({...form, couleur:e.target.value})}>
              {BELTS.map((b)=> <option key={b}>{b}</option>)}
            </select>
            <input className="border rounded p-2" type="date" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})} />
            <input className="border rounded p-2 sm:col-span-3" placeholder="Feeling / commentaire" value={form.feeling} onChange={(e)=>setForm({...form, feeling:e.target.value})} />
          </div>
          <button onClick={addPass} className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Ajouter</button>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Historique</h3>
        {belts.length===0 && <p className="text-gray-500">Aucun passage enregistré.</p>}
        {belts.map((b, i)=> (
          <div key={i} className="py-2 border-b">
            <p><b>{b.couleur}</b> — {fmt(b.date)} {b.invite && <span className="text-green-600 text-sm">(invitation reçue)</span>}</p>
            {b.feeling && <p className="text-sm text-gray-600 italic">{b.feeling}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==============================================================
// Paramètres — profil, règles, planning avec bouton Ajouter
// ==============================================================
function SettingsView({ rules, setRules, planning, setPlanning, profil, setProfil }) {
  const updateRule = (key, val) => setRules({ ...rules, [key]: parseInt(val, 10) || 0 });

  const addCourse = (i) => {
    const copy = [...planning];
    copy[i].cours.push({ nom: "Nouveau cours", heure: "", type: profil });
    setPlanning(copy);
  };

  const updateCourse = (i, j, field, value) => {
    const copy = [...planning];
    copy[i].cours[j] = { ...copy[i].cours[j], [field]: value };
    setPlanning(copy);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-red-600">⚙️ Paramètres</h2>

      <div className="bg-white border rounded p-4 mb-6">
        <h3 className="font-semibold mb-3">Profil</h3>
        <select value={profil} onChange={(e) => setProfil(e.target.value)} className="border rounded p-2">
          <option value="Enfant">Enfant</option>
          <option value="Ado">Ado</option>
          <option value="Adulte">Adulte</option>
        </select>
      </div>

      <div className="bg-white border rounded p-4 mb-6">
        <h3 className="font-semibold mb-3">Règles de passage entre ceintures</h3>
        {Object.entries(rules).map(([transition, count]) => (
          <div key={transition} className="flex items-center gap-2 mb-2">
            <label className="w-48">{transition.replace('→', ' → ')}</label>
            <input type="number" value={count} onChange={(e) => updateRule(transition, e.target.value)} className="border rounded p-1 w-24" />
            <span>cours</span>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Planning fixe hebdomadaire ({profil})</h3>
        {planning.map((p, i) => (
          <div key={i} className="mb-3">
            <h4 className="font-semibold text-red-600 mb-1 flex justify-between items-center">
              {p.jour}
              <button onClick={() => addCourse(i)} className="text-green-600 flex items-center gap-1 text-sm"><PlusCircle className="w-4 h-4" /> Ajouter</button>
            </h4>
            {p.cours.map((c, j) => (
              c.type === profil ? (
                <div key={`${i}-${j}`} className="flex items-center gap-2 mb-1">
                  <input className="border rounded p-1 flex-1" value={c.nom} onChange={(e) => updateCourse(i, j, 'nom', e.target.value)} />
                  <input className="border rounded p-1 w-28" value={c.heure} onChange={(e) => updateCourse(i, j, 'heure', e.target.value)} />
                  <select className="border rounded p-1" value={c.type} onChange={(e) => updateCourse(i, j, 'type', e.target.value)}>
                    <option value="Enfant">Enfant</option>
                    <option value="Ado">Ado</option>
                    <option value="Adulte">Adulte</option>
                  </select>
                </div>
              ) : null
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
